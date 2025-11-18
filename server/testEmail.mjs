import 'dotenv/config';
import { createTransport } from 'nodemailer';

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  console.log('📋 Current Configuration:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('  EMAIL_USER:', process.env.EMAIL_USER);
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ EMAIL_USER or EMAIL_PASSWORD not configured in .env file');
    process.exit(1);
  }

  try {
    // Create transporter
    const transporter = createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Asset Management System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email - Password Reset Feature',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify that your email configuration is working correctly.</p>
        <p>If you're reading this, the email service is configured properly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📫 Email sent to:', process.env.EMAIL_USER);
    console.log('\n✨ Email configuration is working! You can now use the password reset feature.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('\n💡 Common solutions:');
    console.error('   1. Make sure you\'re using a Gmail App Password, not your regular password');
    console.error('   2. Visit: https://myaccount.google.com/apppasswords to create one');
    console.error('   3. Make sure 2-Step Verification is enabled on your Google account');
    console.error('   4. Check if "Less secure app access" is disabled (you should use App Passwords)');
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testEmail();
