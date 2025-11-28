import { createTransport, createTestAccount, getTestMessageUrl } from 'nodemailer';
import { google } from 'googleapis';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import sgMail from '@sendgrid/mail';

// Check if SendGrid is configured
const isSendGridConfigured = process.env.SENDGRID_API_KEY && 
                             process.env.SENDGRID_FROM_EMAIL;

// Check if Mailgun is configured
const isMailgunConfigured = process.env.MAILGUN_API_KEY && 
                            process.env.MAILGUN_DOMAIN &&
                            process.env.MAILGUN_FROM_EMAIL;

// Email configuration
const createTransporter = async () => {
  // Priority order: SendGrid > Mailgun > OAuth2 > App Password > Test Account
  // SendGrid and Mailgun use HTTP API (better for cloud platforms like Render)

  // Check if email is configured
  const isOAuth2Configured = process.env.GMAIL_CLIENT_ID && 
                              process.env.GMAIL_CLIENT_SECRET && 
                              process.env.GMAIL_REFRESH_TOKEN;
  const isAppPasswordConfigured = process.env.EMAIL_USER && 
                                   process.env.EMAIL_USER !== 'your-email@gmail.com' &&
                                   process.env.EMAIL_PASSWORD;
  const isEmailConfigured = isSendGridConfigured || isMailgunConfigured || isOAuth2Configured || isAppPasswordConfigured;

  // In production, require email configuration
  if (process.env.NODE_ENV === 'production' && !isEmailConfigured) {
    console.error('❌ EMAIL NOT CONFIGURED IN PRODUCTION!');
    console.error('⚠️  Email service is required for production. Please configure:');
    console.error('   Option 1 - SendGrid (Recommended for cloud platforms):');
    console.error('     - SENDGRID_API_KEY (your SendGrid API key)');
    console.error('     - SENDGRID_FROM_EMAIL (sender email, e.g., noreply@yourdomain.com)');
    console.error('   Option 2 - Mailgun:');
    console.error('     - MAILGUN_API_KEY (your Mailgun API key)');
    console.error('     - MAILGUN_DOMAIN (your Mailgun domain)');
    console.error('     - MAILGUN_FROM_EMAIL (sender email, e.g., noreply@yourdomain.com)');
    console.error('   Option 3 - Gmail OAuth2:');
    console.error('     - EMAIL_USER (your sending email address)');
    console.error('     - GMAIL_CLIENT_ID');
    console.error('     - GMAIL_CLIENT_SECRET');
    console.error('     - GMAIL_REFRESH_TOKEN');
    console.error('   Option 4 - Gmail App Password:');
    console.error('     - EMAIL_USER (your sending email address)');
    console.error('     - EMAIL_PASSWORD (your email password or app password)');
    console.error('     - EMAIL_HOST (optional, defaults to smtp.gmail.com)');
    console.error('     - EMAIL_PORT (optional, defaults to 587)');
    console.error('     - EMAIL_SECURE (optional, defaults to false)');
    throw new Error('Email service not configured in production. Please set SendGrid, Mailgun, OAuth2, or App Password environment variables.');
  }

  // If email credentials are not configured (development only), create a test account
  if (!isEmailConfigured) {
    console.log('⚠️  Email not configured. Creating test email account (development only)...');
    const testAccount = await createTestAccount();

    console.log('✉️  Test Email Account Created:');
    console.log('   📧 Email: ' + testAccount.user);
    console.log('   🔑 Password: ' + testAccount.pass);
    console.log('   🌐 Preview emails at: https://ethereal.email');
    console.log('   ⚠️  To use real email, configure EMAIL_USER and EMAIL_PASSWORD in .env');

    return createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Log which method will be used
  if (isSendGridConfigured) {
    console.log('🔍 Email service: SendGrid (HTTP API)');
    console.log(`✅ SendGrid configured`);
    console.log(`📧 From email: ${process.env.SENDGRID_FROM_EMAIL}`);
    // Initialize SendGrid
    const apiKey = process.env.SENDGRID_API_KEY!;
    if (apiKey) {
      // Log first 10 and last 4 characters for verification (security: don't log full key)
      const maskedKey = apiKey.length > 14 
        ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`
        : '***';
      console.log(`🔑 API Key: ${maskedKey} (length: ${apiKey.length})`);
      sgMail.setApiKey(apiKey);
      console.log('✅ SendGrid API key initialized');
    } else {
      console.error('❌ SENDGRID_API_KEY is empty!');
    }
    // Return null for SendGrid - we'll handle it differently in send functions
    return null;
  }

  if (isMailgunConfigured) {
    console.log('🔍 Email service: Mailgun (HTTP API)');
    console.log(`✅ Mailgun configured: ${process.env.MAILGUN_DOMAIN}`);
    console.log(`📧 From email: ${process.env.MAILGUN_FROM_EMAIL}`);
    // Return null for Mailgun - we'll handle it differently in send functions
    return null;
  }

  // Check if OAuth2 is configured
  const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                     process.env.GMAIL_CLIENT_SECRET && 
                     process.env.GMAIL_REFRESH_TOKEN;

  // Log which method will be used
  if (useOAuth2) {
    console.log('🔍 Email auth method: OAuth2 (Gmail)');
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('🔍 Email auth method: App Password (SMTP)');
  } else {
    console.log('🔍 Email auth method: Test Account (Ethereal)');
  }

  if (useOAuth2) {
    console.log(`🔐 Using Gmail OAuth2 authentication`);
    
    try {
      // Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground' // Redirect URL (not used for refresh token)
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });

      // Get access token
      const accessTokenResponse = await oauth2Client.getAccessToken();
      const accessToken = accessTokenResponse.token;

      if (!accessToken) {
        throw new Error('Failed to get OAuth2 access token');
      }

      const emailConfig = {
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken,
        },
        // Connection timeout settings
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
      };

      console.log(`✅ Gmail OAuth2 configured: ${process.env.EMAIL_USER}`);
      return createTransport(emailConfig);
    } catch (oauthError: any) {
      console.error('❌ OAuth2 setup failed:', oauthError.message);
      throw new Error(`OAuth2 authentication failed: ${oauthError.message}`);
    }
  }

  // Fallback to App Password authentication
  // Use port 587 with STARTTLS (more reliable on cloud platforms like Render)
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const useSecure = process.env.EMAIL_SECURE === 'true';
  
  console.log(`🔍 Email configuration check:`);
  console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '587 (default)'}`);
  console.log(`   EMAIL_SECURE: ${process.env.EMAIL_SECURE || 'false (default)'}`);
  console.log(`   Using port: ${port}, secure: ${useSecure}`);
  
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: useSecure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Connection timeout settings for Render/cloud environments
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 60000, // 60 seconds
    socketTimeout: 60000, // 60 seconds
    // Retry configuration
    pool: false, // Disable pooling for better compatibility
    maxConnections: 1,
    maxMessages: 1,
    // Additional options for cloud environments
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates if needed
      minVersion: 'TLSv1.2', // Use modern TLS
    },
    // Enable debug for troubleshooting (set EMAIL_DEBUG=true to enable)
    debug: process.env.EMAIL_DEBUG === 'true',
    logger: process.env.EMAIL_DEBUG === 'true',
    // For port 587, require STARTTLS
    requireTLS: port === 587,
  };

  console.log(`✅ Email service configured: ${process.env.EMAIL_USER} via ${emailConfig.host}:${emailConfig.port}`);
  console.log(`📧 Connection timeout: ${emailConfig.connectionTimeout}ms`);
  console.log(`📧 Secure (SSL/TLS): ${emailConfig.secure}`);
  if (process.env.EMAIL_PASSWORD) {
    const passLength = process.env.EMAIL_PASSWORD.length;
    console.log(`📧 Password length: ${passLength} characters (should be 16 for App Password)`);
  }
  
  return createTransport(emailConfig);
};

// Helper function to send email via SendGrid
const sendViaSendGrid = async (to: string, subject: string, html: string, text: string) => {
  if (!isSendGridConfigured) {
    throw new Error('SendGrid not configured');
  }

  // Ensure API key is set (always set it to be safe)
  const apiKey = process.env.SENDGRID_API_KEY!;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    console.log('🔑 SendGrid API key initialized');
  } else {
    throw new Error('SENDGRID_API_KEY is not set');
  }

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    text,
    html,
  };

  try {
    console.log(`📤 Sending email via SendGrid to: ${to}`);
    console.log(`📧 From: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`📧 Subject: ${subject}`);
    await sgMail.send(msg);
    console.log(`✅ SendGrid email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid error:', error);
    console.error('   Error message:', error.message);
    if (error.response) {
      console.error('   Status code:', error.response.statusCode);
      console.error('   Response body:', JSON.stringify(error.response.body, null, 2));
      console.error('   Response headers:', error.response.headers);
    }
    
    // Provide helpful error messages
    if (error.response?.statusCode === 401) {
      throw new Error(`SendGrid send failed: Unauthorized - Check that SENDGRID_API_KEY is correct and has Mail Send permission`);
    } else if (error.response?.statusCode === 403) {
      throw new Error(`SendGrid send failed: Forbidden - Check that sender email (${process.env.SENDGRID_FROM_EMAIL}) is verified in SendGrid`);
    } else {
      throw new Error(`SendGrid send failed: ${error.message}`);
    }
  }
};

// Helper function to send email via Mailgun
const sendViaMailgun = async (to: string, subject: string, html: string, text: string) => {
  if (!isMailgunConfigured) {
    throw new Error('Mailgun not configured');
  }

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY!,
  });

  const messageData = {
    from: process.env.MAILGUN_FROM_EMAIL!,
    to: [to],
    subject,
    html,
    text,
  };

  try {
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, messageData);
    console.log(`✅ Mailgun email sent: ${response.id}`);
    return response;
  } catch (error: any) {
    console.error('❌ Mailgun error:', error);
    throw new Error(`Mailgun send failed: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string, userName: string) => {
  try {
    // Create reset link with proper base path and hash router
    // Default to GitHub Pages if CLIENT_URL is not set or points to wrong domain
    let clientUrl = process.env.CLIENT_URL || 'https://speccon-team.github.io/asset-app';
    
    // If CLIENT_URL points to assettrack-client.onrender.com, use GitHub Pages instead
    if (clientUrl.includes('assettrack-client.onrender.com')) {
      clientUrl = 'https://speccon-team.github.io/asset-app';
      console.log('⚠️  CLIENT_URL points to assettrack-client.onrender.com, using GitHub Pages instead');
    }
    
    // Remove trailing slash if present
    clientUrl = clientUrl.replace(/\/$/, '');
    
    // Only add /asset-app if it's GitHub Pages and not already in the URL
    const isGitHubPages = clientUrl.includes('github.io') || clientUrl.includes('localhost');
    const needsBasePath = isGitHubPages && !clientUrl.endsWith('/asset-app');
    const basePath = needsBasePath ? '/asset-app' : '';
    const resetLink = `${clientUrl}${basePath}/#/reset-password/${resetToken}`;
    
    console.log(`📧 Password reset link: ${resetLink}`);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>

              <p>We received a request to reset your password for your Asset Management System account.</p>

              <p>Click the button below to reset your password:</p>

              <a href="${resetLink}" class="button" style="color: white !important;">Reset Password</a>

              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetLink}</p>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
              </div>

              <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>

              <p>Best regards,<br>Asset Management Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Asset Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName || 'there'},

      We received a request to reset your password for your Asset Management System account.

      Click the link below to reset your password:
      ${resetLink}

      This link will expire in 1 hour.

      If you didn't request this password reset, please ignore this email or contact support if you have concerns.

      Best regards,
      Asset Management Team
    `;

    // Use SendGrid if configured, then Mailgun, otherwise use SMTP
    if (isSendGridConfigured) {
      await sendViaSendGrid(to, 'Password Reset Request', html, text);
      console.log(`✅ Password reset email sent to ${to} via SendGrid`);
      return true;
    }

    if (isMailgunConfigured) {
      await sendViaMailgun(to, 'Password Reset Request', html, text);
      console.log(`✅ Password reset email sent to ${to} via Mailgun`);
      return true;
    }

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset Request',
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);

    // If using test account, show preview URL
    if (getTestMessageUrl(info)) {
      console.log('📧 Preview email: ' + getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendVerificationOTP = async (to: string, otp: string, userName: string) => {
  try {
    console.log(`📧 Attempting to send OTP email to: ${to}`);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>

              <p>Thank you for registering with Asset Management System! To complete your registration, please verify your email address using the OTP code below:</p>

              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">This OTP will expire in 10 minutes. Never share this code with anyone. Our team will never ask for your OTP.</p>
              </div>

              <p>If you didn't create an account with us, please ignore this email.</p>

              <p>Best regards,<br>Asset Management Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Asset Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName || 'there'},

      Thank you for registering with Asset Management System!

      Your verification OTP code is: ${otp}

      This code will expire in 10 minutes.

      If you didn't create an account with us, please ignore this email.

      Best regards,
      Asset Management Team
    `;

    // Use SendGrid if configured, then Mailgun, otherwise use SMTP
    if (isSendGridConfigured) {
      await sendViaSendGrid(to, 'Verify Your Email - OTP Code', html, text);
      console.log(`✅ Verification OTP sent to ${to} via SendGrid`);
      return true;
    }

    if (isMailgunConfigured) {
      await sendViaMailgun(to, 'Verify Your Email - OTP Code', html, text);
      console.log(`✅ Verification OTP sent to ${to} via Mailgun`);
      return true;
    }

    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    console.log(`📧 SMTP: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || '587'}`);
    
    // Verify transporter connection before sending
    const transporter = await createTransporter();
    console.log(`✅ Transporter created successfully`);
    
    // Verify connection (optional but helpful for debugging)
    try {
      await transporter.verify();
      console.log(`✅ SMTP connection verified successfully`);
    } catch (verifyError: any) {
      console.warn(`⚠️  SMTP verification failed (will still attempt to send):`, verifyError.message);
    }

    const mailOptions = {
      from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Email - OTP Code',
      html,
      text,
    };

    console.log(`📤 Sending email...`);
    console.log(`📧 To: ${to}`);
    console.log(`📧 From: ${mailOptions.from}`);
    console.log(`📧 Subject: ${mailOptions.subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification OTP sent to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);
    console.log(`📧 Accepted: ${info.accepted}`);
    console.log(`📧 Rejected: ${info.rejected}`);

    // If using test account, show preview URL
    if (getTestMessageUrl(info)) {
      console.log('📧 Preview email: ' + getTestMessageUrl(info));
    }

    return true;
  } catch (error: any) {
    console.error('❌ Error sending verification OTP:');
    console.error(`   Error Type: ${error.name || 'Unknown'}`);
    console.error(`   Error Message: ${error.message || 'No message'}`);
    console.error(`   Error Code: ${error.code || 'No code'}`);
    console.error(`   Error Command: ${error.command || 'N/A'}`);
    console.error(`   Error Response: ${error.response || 'N/A'}`);
    console.error(`   Error ResponseCode: ${error.responseCode || 'N/A'}`);
    console.error(`   Full Error Stack:`, error.stack);
    console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Gmail-specific error messages
    if (error.code === 'EAUTH') {
      console.error('⚠️  Authentication failed! Check:');
      console.error('   1. EMAIL_USER is correct');
      console.error('   2. EMAIL_PASSWORD is a Gmail App Password (not regular password)');
      console.error('   3. 2-Step Verification is enabled on Gmail account');
      console.error('   4. App Password was generated correctly');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('⚠️  Connection failed! Check:');
      console.error('   1. EMAIL_HOST is correct (smtp.gmail.com)');
      console.error('   2. EMAIL_PORT is correct (587)');
      console.error('   3. Firewall/network allows SMTP connections');
    }
    
    throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`);
  }
};

export const sendPasswordChangedEmail = async (to: string, userName: string) => {
  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>

              <div class="success">
                <strong>✓ Success!</strong>
                <p style="margin: 5px 0 0 0;">Your password has been changed successfully.</p>
              </div>

              <p>If you did not make this change, please contact our support team immediately.</p>

              <p>Best regards,<br>Asset Management Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Asset Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

  const text = `
    Hi ${userName || 'there'},

    Your password has been changed successfully.

    If you did not make this change, please contact our support team immediately.

    Best regards,
    Asset Management Team
  `;

  try {
    // Use SendGrid if configured, then Mailgun, otherwise use SMTP
    if (isSendGridConfigured) {
      await sendViaSendGrid(to, 'Password Changed Successfully', html, text);
      console.log(`✅ Password changed email sent to ${to} via SendGrid`);
      return true;
    }

    if (isMailgunConfigured) {
      await sendViaMailgun(to, 'Password Changed Successfully', html, text);
      console.log(`✅ Password changed email sent to ${to} via Mailgun`);
      return true;
    }

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Changed Successfully',
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password changed email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending password changed email:', error);
    // Don't throw error here, as password was already changed
    return false;
  }
};
