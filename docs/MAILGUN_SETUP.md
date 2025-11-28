# Mailgun Email Setup Guide

Mailgun is a reliable email API service that works great on cloud platforms like Render. It uses HTTP APIs instead of SMTP, which avoids connection timeout issues.

## Why Mailgun?

- ✅ **No SMTP connection issues** - Uses HTTP API (works on Render free tier)
- ✅ **Free tier**: 5,000 emails/month for 3 months, then 1,000 emails/month
- ✅ **Reliable delivery** - Better than SMTP for cloud platforms
- ✅ **Easy setup** - Just API key and domain

## Step 1: Create Mailgun Account

1. Go to [Mailgun Sign Up](https://www.mailgun.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Add and Verify Domain

### Option A: Use Sandbox Domain (Quick Start - Testing Only)

1. Go to **Sending** → **Domains** in Mailgun dashboard
2. You'll see a sandbox domain like: `sandbox1234567890abcdef.mailgun.org`
3. **Note**: Sandbox domains can only send to authorized recipients (you need to add recipient emails in Mailgun dashboard)
4. For production, use Option B (custom domain)

### Option B: Add Your Own Domain (Recommended for Production)

1. Go to **Sending** → **Domains** → **Add New Domain**
2. Enter your domain (e.g., `mg.yourdomain.com` or `mail.yourdomain.com`)
3. Mailgun will provide DNS records to add:
   - **TXT record** for domain verification
   - **MX records** (if using Mailgun for receiving)
   - **CNAME records** for tracking
4. Add these DNS records to your domain registrar
5. Wait for verification (usually 5-10 minutes)
6. Once verified, you can use this domain

## Step 3: Get API Key

1. Go to **Settings** → **API Keys** in Mailgun dashboard
2. Copy your **Private API Key** (starts with `key-`)
3. **Important**: Keep this secret! Never commit it to git.

## Step 4: Configure in Render

Go to **Render** → **Your Backend** → **Environment** and add:

```
MAILGUN_API_KEY = key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN = sandbox1234567890abcdef.mailgun.org
MAILGUN_FROM_EMAIL = AssetTrack <noreply@sandbox1234567890abcdef.mailgun.org>
```

**Replace with your values:**
- `MAILGUN_API_KEY`: Your private API key from Step 3
- `MAILGUN_DOMAIN`: Your verified domain (sandbox or custom)
- `MAILGUN_FROM_EMAIL`: Sender email (must match your domain)

### Example for Sandbox Domain:
```
MAILGUN_API_KEY = key-abc123def456ghi789
MAILGUN_DOMAIN = sandbox1234567890abcdef.mailgun.org
MAILGUN_FROM_EMAIL = AssetTrack <noreply@sandbox1234567890abcdef.mailgun.org>
```

### Example for Custom Domain:
```
MAILGUN_API_KEY = key-abc123def456ghi789
MAILGUN_DOMAIN = mg.yourdomain.com
MAILGUN_FROM_EMAIL = AssetTrack <noreply@mg.yourdomain.com>
```

## Step 5: Remove Old Email Variables (Optional)

If you were using Gmail SMTP, you can remove these (Mailgun takes priority):
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

**Note**: You can keep them as backup - Mailgun will be used if configured.

## Step 6: Test

1. Save environment variables in Render
2. Wait for backend to redeploy (2-3 minutes)
3. Check logs - you should see: `✅ Mailgun configured: your-domain.mailgun.org`
4. Try registering a new account
5. Check your email inbox!

## Troubleshooting

### "Mailgun send failed: Forbidden"
- Check that `MAILGUN_API_KEY` is correct
- Make sure you're using the **Private API Key**, not Public

### "Mailgun send failed: Domain not found"
- Verify `MAILGUN_DOMAIN` matches exactly what's in Mailgun dashboard
- Check that domain is verified in Mailgun

### "Mailgun send failed: 'from' address is not authorized"
- `MAILGUN_FROM_EMAIL` must use your verified domain
- For sandbox: use `noreply@sandbox1234567890abcdef.mailgun.org`
- For custom domain: use `noreply@mg.yourdomain.com`

### Emails not received (Sandbox Domain)
- Sandbox domains can only send to **authorized recipients**
- Go to **Sending** → **Authorized Recipients** in Mailgun dashboard
- Add the email addresses you want to receive emails
- Or use a custom domain (Option B in Step 2)

### Still not working?
- Check Render logs for detailed error messages
- Verify all three environment variables are set correctly
- Make sure domain is verified in Mailgun dashboard
- Test with Mailgun's API directly: `https://api.mailgun.net/v3/YOUR_DOMAIN/messages`

## Mailgun Free Tier Limits

- **First 3 months**: 5,000 emails/month
- **After 3 months**: 1,000 emails/month
- **Rate limit**: 1,000 emails/day

For higher limits, upgrade to a paid plan.

## Next Steps

Once Mailgun is working:
1. ✅ OTP emails will be sent via Mailgun
2. ✅ Password reset emails will be sent via Mailgun
3. ✅ All email notifications will use Mailgun

The application automatically detects Mailgun configuration and uses it instead of SMTP!

