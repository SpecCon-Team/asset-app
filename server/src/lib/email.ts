import { createTransport, createTestAccount, getTestMessageUrl } from 'nodemailer';

// Email configuration
const createTransporter = async () => {
  // For development, use a test account or Gmail
  // For production, use your actual email service

  // If email credentials are not configured, create a test account
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log('⚠️  Email not configured. Creating test email account...');
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

  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  return createTransport(emailConfig);
};

export const sendPasswordResetEmail = async (to: string, resetToken: string, userName: string) => {
  try {
    const transporter = await createTransporter();

    // Create reset link with proper base path and hash router
    // Production: https://speccon-team.github.io/asset-app/#/reset-password/{token}
    // Local: http://localhost:5173/asset-app/#/reset-password/{token}
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const basePath = '/asset-app';
    const resetLink = `${clientUrl}${basePath}/#/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset Request',
      html: `
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
    `,
    text: `
      Hi ${userName || 'there'},

      We received a request to reset your password for your Asset Management System account.

      Click the link below to reset your password:
      ${resetLink}

      This link will expire in 1 hour.

      If you didn't request this password reset, please ignore this email or contact support if you have concerns.

      Best regards,
      Asset Management Team
    `,
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
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Email - OTP Code',
      html: `
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
    `,
      text: `
      Hi ${userName || 'there'},

      Thank you for registering with Asset Management System!

      Your verification OTP code is: ${otp}

      This code will expire in 10 minutes.

      If you didn't create an account with us, please ignore this email.

      Best regards,
      Asset Management Team
    `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification OTP sent to ${to}`);

    // If using test account, show preview URL
    if (getTestMessageUrl(info)) {
      console.log('📧 Preview email: ' + getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending verification OTP:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordChangedEmail = async (to: string, userName: string) => {
  const transporter = await createTransporter();

  const mailOptions = {
    from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Changed Successfully',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password changed email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending password changed email:', error);
    // Don't throw error here, as password was already changed
    return false;
  }
};
