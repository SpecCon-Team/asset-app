# SendGrid Email Setup Guide

SendGrid is a reliable email API service that works great on cloud platforms like Render. It uses HTTP APIs instead of SMTP, which avoids connection timeout issues.

## Why SendGrid?

- ✅ **No SMTP connection issues** - Uses HTTP API (works on Render free tier)
- ✅ **Free tier**: 100 emails/day (3,000 emails/month)
- ✅ **Reliable delivery** - Better than SMTP for cloud platforms
- ✅ **Easy setup** - Just API key and from email

## Step 1: Get Your SendGrid API Key

1. Log in to your [SendGrid account](https://app.sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "AssetTrack Server")
5. Select **Full Access** or **Restricted Access** (with Mail Send permission)
6. Click **Create & View**
7. **Copy the API key immediately** (you won't be able to see it again!)

## Step 2: Verify Sender Email (Important!)

SendGrid requires you to verify the sender email address:

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the form:
   - **From Email**: `noreply@yourdomain.com` (or any email you control)
   - **From Name**: `AssetTrack` (or your app name)
   - **Reply To**: Same as From Email
   - **Company Address**: Your address
4. Click **Create**
5. **Check your email** and click the verification link
6. Once verified, you can use this email as the sender

**Note**: For testing, you can use your own email address (the one you used to sign up for SendGrid).

## Step 3: Configure in Render

Go to **Render** → **Your Backend** → **Environment** and add:

```
SENDGRID_API_KEY = SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL = AssetTrack <noreply@yourdomain.com>
```

**Replace with your values:**
- `SENDGRID_API_KEY`: Your API key from Step 1 (starts with `SG.`)
- `SENDGRID_FROM_EMAIL`: Your verified sender email from Step 2

### Example:
```
SENDGRID_API_KEY = SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SENDGRID_FROM_EMAIL = AssetTrack <noreply@yourdomain.com>
```

**Or for testing with your personal email:**
```
SENDGRID_API_KEY = SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SENDGRID_FROM_EMAIL = AssetTrack <your-email@gmail.com>
```

## Step 4: Remove Old Email Variables (Optional)

If you were using Gmail SMTP or Mailgun, you can remove these (SendGrid takes priority):
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM_EMAIL`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

**Note**: You can keep them as backup - SendGrid will be used if configured.

## Step 5: Test

1. Save environment variables in Render
2. Wait for backend to redeploy (2-3 minutes)
3. Check logs - you should see: `✅ SendGrid configured`
4. Test endpoint: `https://assettrack-api.onrender.com/api/auth/test-email`
5. Try registering a new account
6. Check your email inbox!

## Troubleshooting

### "SendGrid send failed: Forbidden"
- Check that `SENDGRID_API_KEY` is correct
- Make sure API key has **Mail Send** permission
- Verify the API key hasn't been revoked

### "SendGrid send failed: The from address does not match a verified Sender Identity"
- You must verify the sender email in SendGrid
- Go to **Settings** → **Sender Authentication** → **Verify a Single Sender**
- Make sure `SENDGRID_FROM_EMAIL` matches the verified email
- Check your email and click the verification link

### "SendGrid send failed: Invalid email address"
- Check that `SENDGRID_FROM_EMAIL` format is correct: `Name <email@domain.com>`
- Or use just the email: `email@domain.com`
- Make sure the email is verified in SendGrid

### Emails going to spam
- Verify your domain in SendGrid (not just single sender)
- Go to **Settings** → **Sender Authentication** → **Authenticate Your Domain**
- Add DNS records to your domain
- This improves deliverability

### Still not working?
- Check Render logs for detailed error messages
- Verify both environment variables are set correctly
- Make sure sender email is verified in SendGrid dashboard
- Test with SendGrid's API directly using curl or Postman

## SendGrid Free Tier Limits

- **100 emails/day**
- **3,000 emails/month**
- **Rate limit**: 100 emails/day

For higher limits, upgrade to a paid plan.

## Priority Order

The application checks email services in this order:
1. **SendGrid** (if `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` are set)
2. **Mailgun** (if `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MAILGUN_FROM_EMAIL` are set)
3. **Gmail OAuth2** (if OAuth2 credentials are set)
4. **Gmail SMTP** (if `EMAIL_USER` and `EMAIL_PASSWORD` are set)
5. **Test Account** (development only)

## Next Steps

Once SendGrid is working:
1. ✅ OTP emails will be sent via SendGrid
2. ✅ Password reset emails will be sent via SendGrid
3. ✅ All email notifications will use SendGrid

The application automatically detects SendGrid configuration and uses it instead of SMTP!

