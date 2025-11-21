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
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // 100 for dev, 5 for production
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many OTP verification attempts. Please request a new code.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 resends
  message: 'Too many OTP resend requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations
  message: 'Too many registration attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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

        // Send OTP email
        try {
          await sendVerificationOTP(email, otp, existing.name || '');
          if (process.env.NODE_ENV === 'development') {
            console.log(`Verification OTP resent to ${email}: ${otp}`);
          } else {
            console.log(`Verification OTP resent to ${email}`);
          }
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
        }

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

    // Send OTP email
    try {
      await sendVerificationOTP(email, otp, name);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Verification OTP sent to ${email}: ${otp}`);
      } else {
        console.log(`Verification OTP sent to ${email}`);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Delete user if email failed to send
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

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
    try {
      await sendVerificationOTP(email, otp, user.name || '');
      if (process.env.NODE_ENV === 'development') {
        console.log(`New verification OTP sent to ${email}: ${otp}`);
      } else {
        console.log(`New verification OTP sent to ${email}`);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'An error occurred while resending OTP' });
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


