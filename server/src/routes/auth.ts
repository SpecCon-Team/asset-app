import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import zxcvbn from 'zxcvbn';
import { prisma } from '../lib/prisma';
import { sendPasswordResetEmail, sendPasswordChangedEmail, sendVerificationOTP } from '../lib/email';
import { logSecurityEvent, trackFailedLogins, resetFailedLogins } from '../middleware/security';

// Password strength validator
function validatePasswordStrength(password: string, userInputs: string[] = []): { valid: boolean; message?: string; score: number } {
  const result = zxcvbn(password, userInputs);

  if (result.score < 2) {
    return {
      valid: false,
      message: `Weak password. ${result.feedback.warning || 'Try adding more variety of characters.'}`,
      score: result.score
    };
  }

  return { valid: true, score: result.score };
}

const router = Router();

// Rate limiters for different endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 15, // 100 for dev, 15 for production (increased from 5)
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many OTP verification attempts. Please request a new code.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 resends
  message: 'Too many OTP resend requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations
  message: 'Too many registration attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Login accepts existing passwords
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters long'),
  name: z.string().min(1, 'Name is required'),
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { email, password, name } = parsed.data;

    // Check password strength
    const passwordCheck = validatePasswordStrength(password, [email, name]);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // If user exists but not verified, resend OTP
      if (!existing.emailVerified) {
        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            verificationOTP: otp,
            verificationExpiry: otpExpiry
          }
        });

        // Send OTP email asynchronously (don't block the response)
        const emailPromise = sendVerificationOTP(email, otp, existing.name || '').catch((emailError) => {
          console.error('Failed to send verification email:', emailError);
          return false;
        });

        // Set a timeout for email sending (10 seconds max)
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            console.warn(`Email sending timeout for ${email}`);
            resolve(false);
          }, 10000);
        });

        // Try to send email, but don't wait more than 10 seconds
        Promise.race([emailPromise, timeoutPromise]).then((emailSent) => {
          if (emailSent && process.env.NODE_ENV === 'development') {
            console.log(`Verification OTP resent to ${email}: ${otp}`);
          } else if (emailSent) {
            console.log(`Verification OTP resent to ${email}`);
          } else {
            console.warn(`Email sending failed or timed out for ${email}. OTP: ${otp}`);
          }
        });

        // Respond immediately without waiting for email
        return res.json({
          id: existing.id,
          email: existing.email,
          name: existing.name,
          role: existing.role,
          emailVerified: existing.emailVerified,
          message: 'Account exists but not verified. New verification code sent to your email.'
        });
      }

      return res.status(409).json({ message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const defaultRole = 'USER';

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with OTP (emailVerified = false by default)
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role: defaultRole,
        verificationOTP: otp,
        verificationExpiry: otpExpiry
      }
    });

    // Send OTP email asynchronously (don't block the response)
    // Use Promise.race with timeout to prevent hanging
    const emailPromise = sendVerificationOTP(email, otp, name).catch((emailError) => {
      console.error('Failed to send verification email:', emailError);
      // Log error but don't block registration
      return false;
    });

    // Set a timeout for email sending (10 seconds max)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`Email sending timeout for ${email}`);
        resolve(false);
      }, 10000); // 10 second timeout
    });

    // Try to send email, but don't wait more than 10 seconds
    Promise.race([emailPromise, timeoutPromise]).then((emailSent) => {
      if (emailSent && process.env.NODE_ENV === 'development') {
        console.log(`✅ Verification OTP sent to ${email}: ${otp}`);
      } else if (emailSent) {
        console.log(`✅ Verification OTP sent to ${email}`);
      } else {
        // Always log OTP when email fails - important for debugging
        console.error(`❌ Email sending failed or timed out for ${email}`);
        console.error(`📧 OTP Code for ${email}: ${otp}`);
        console.error(`⚠️  User can verify with this OTP code if email service is not configured`);
        // In production, you might want to log this to a monitoring service
      }
    });

    // Respond immediately without waiting for email
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      message: 'Registration successful. Please check your email for verification code.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const parsed = credsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        emailVerified: false,
        email: user.email
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      // Track failed login for monitoring
      trackFailedLogins(email, req.ip || 'unknown');

      // Increment failed login attempts
      const newAttempts = user.loginAttempts + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock the account
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION)
          }
        });

        // Log security event
        logSecurityEvent({
          userId: user.id,
          email: user.email,
          action: 'ACCOUNT_LOCKED',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'warning',
          details: { attempts: newAttempts }
        });

        return res.status(423).json({
          message: 'Account locked due to too many failed login attempts. Try again in 15 minutes.'
        });
      }

      // Update failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: newAttempts }
      });

      // Log failed login
      logSecurityEvent({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: { attemptsRemaining: MAX_ATTEMPTS - newAttempts }
      });

      return res.status(401).json({
        message: `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Don't issue token yet, require 2FA verification
      return res.json({
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Please enter your 2FA code'
      });
    }

    // Reset failed login tracking
    resetFailedLogins(email, req.ip || 'unknown');

    // Log successful login
    logSecurityEvent({
      userId: user.id,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAvailable: user.isAvailable,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

// POST /api/auth/verify-2fa-login - Verify 2FA and complete login
router.post('/verify-2fa-login', loginLimiter, async (req, res) => {
  try {
    const { userId, token: twoFactorToken } = req.body;

    if (!userId || !twoFactorToken) {
      return res.status(400).json({ message: 'User ID and 2FA token are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Verify the 2FA token using the /2fa/verify endpoint logic
    const response = await fetch(`http://localhost:${process.env.PORT || 4000}/api/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token: twoFactorToken })
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(400).json({ message: data.message || 'Invalid 2FA code' });
    }

    // Reset failed login tracking
    resetFailedLogins(user.email, req.ip || 'unknown');

    // Log successful 2FA login
    logSecurityEvent({
      userId: user.id,
      email: user.email,
      action: 'LOGIN_2FA_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    // Issue JWT token
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAvailable: user.isAvailable,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('2FA login error:', error);
    res.status(500).json({ message: 'An error occurred during 2FA verification' });
  }
});

// POST /api/auth/verify-otp - Verify OTP code
router.post('/verify-otp', otpVerifyLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Check if OTP matches and is not expired
    if (user.verificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (!user.verificationExpiry || user.verificationExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationOTP: null,
        verificationExpiry: null
      }
    });

    // Generate login token
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAvailable: user.isAvailable,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'An error occurred during verification' });
  }
});

// POST /api/auth/resend-otp - Resend OTP code
router.post('/resend-otp', otpResendLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationOTP: otp,
        verificationExpiry: otpExpiry
      }
    });

    // Send new OTP email
    let emailSent = false;
    try {
      await sendVerificationOTP(email, otp, user.name || '');
      emailSent = true;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ New verification OTP sent to ${email}: ${otp}`);
      } else {
        console.log(`✅ New verification OTP sent to ${email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      console.error(`📧 OTP Code for ${email}: ${otp}`);
      console.error(`⚠️  User can verify with this OTP code if email service is not configured`);
      emailSent = false;
    }

    // If email failed, return OTP in response for debugging (development only)
    if (!emailSent) {
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          message: 'New OTP generated. Email sending failed.',
          debug: { otp },
          note: 'Check server logs or use /api/auth/debug-otp/:email endpoint'
        });
      } else {
        return res.json({ 
          message: 'New OTP generated. Email sending failed - check server logs for OTP code.',
          note: 'OTP is logged in server console. Use /api/auth/debug-otp/:email endpoint if enabled.'
        });
      }
    }

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'An error occurred while resending OTP' });
  }
});

// GET /api/auth/test-email - Test email configuration (development only)
router.get('/test-email', async (req, res) => {
  // Only allow in development or with special debug flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_OTP) {
    return res.status(403).json({ message: 'Debug endpoint disabled in production' });
  }

  try {
    const testEmail = process.env.EMAIL_USER || 'test@example.com';
    const testOTP = '123456';
    
    console.log('🧪 Testing email configuration...');
    await sendVerificationOTP(testEmail, testOTP, 'Test User');
    
    res.json({ 
      message: 'Test email sent successfully!',
      to: testEmail,
      note: 'Check your inbox and server logs for details'
    });
  } catch (error: any) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      message: 'Test email failed',
      error: error.message,
      note: 'Check server logs for detailed error information'
    });
  }
});

// GET /api/auth/debug-otp/:email - Debug endpoint to get current OTP (development only)
router.get('/debug-otp/:email', async (req, res) => {
  // Only allow in development or with special debug flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_OTP) {
    return res.status(403).json({ message: 'Debug endpoint disabled in production' });
  }

  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { 
        email: true, 
        emailVerified: true, 
        verificationOTP: true, 
        verificationExpiry: true 
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email already verified', emailVerified: true });
    }

    if (!user.verificationOTP) {
      return res.json({ message: 'No OTP found. Please request a new one.' });
    }

    const isExpired = user.verificationExpiry && user.verificationExpiry < new Date();
    
    res.json({
      email: user.email,
      otp: user.verificationOTP,
      expiresAt: user.verificationExpiry,
      isExpired,
      message: isExpired ? 'OTP has expired. Please request a new one.' : 'Current OTP code'
    });
  } catch (error) {
    console.error('Debug OTP error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Check if user exists - if not, return error
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address. Please check your email or sign up.'
      });
    }

    // User exists - generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store hashed token in database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: resetTokenExpiry,
      },
    });

    // Send email with reset link
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name || '');
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

// POST /api/auth/reset-password/:token - Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 12) {
      return res.status(400).json({ message: 'Password must be at least 12 characters long' });
    }

    // Check password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and check expiry
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    // Send confirmation email (don't fail if this fails)
    try {
      await sendPasswordChangedEmail(user.email, user.name || '');
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError);
    }

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

export default router;


