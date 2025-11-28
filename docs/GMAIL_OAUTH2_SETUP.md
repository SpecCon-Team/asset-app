# Gmail OAuth2 Setup Guide

This guide will help you set up Gmail OAuth2 for sending emails, which is more reliable than App Passwords on cloud platforms like Render.

## Why OAuth2?

- ✅ Works better on cloud platforms (no connection timeout issues)
- ✅ More secure than App Passwords
- ✅ No need for 2-Step Verification App Passwords
- ✅ Better for production environments

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it (e.g., "AssetTrack Email")
4. Click "Create"

## Step 2: Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and press **Enable**

## Step 3: Create OAuth2 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (or Internal if you have Google Workspace)
   - App name: **AssetTrack Email**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Add or Remove Scopes**
     - Search for: `https://www.googleapis.com/auth/gmail.send`
     - Check it and click **Update**
     - Click **Save and Continue**
   - Test users: Add your Gmail address
   - Click **Save and Continue**
   - Click **Back to Dashboard**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **AssetTrack Email Client**
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
   - Click **Create**
   - **IMPORTANT**: Copy the **Client ID** and **Client Secret** (you'll need these!)

## Step 4: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In the left panel, find **"Gmail API v1"**
6. Expand it and check: `https://www.googleapis.com/auth/gmail.send`
7. Click **Authorize APIs**
8. Sign in with your Gmail account (`jojoopiwe@gmail.com`)
9. Click **Allow** to grant permissions
10. Click **Exchange authorization code for tokens**
11. **Copy the Refresh Token** (you'll need this!)

## Step 5: Configure Render Environment Variables

Go to Render → Your Backend → Environment and add:

```
EMAIL_USER = jojoopiwe@gmail.com
GMAIL_CLIENT_ID = your-client-id-here
GMAIL_CLIENT_SECRET = your-client-secret-here
GMAIL_REFRESH_TOKEN = your-refresh-token-here
```

**Note**: You can remove `EMAIL_PASSWORD`, `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SECURE` if using OAuth2.

## Step 6: Test

1. Save the environment variables
2. Wait for backend to redeploy (2-3 minutes)
3. Check logs - you should see: `✅ Gmail OAuth2 configured: jojoopiwe@gmail.com`
4. Try registering a new account or resending OTP
5. Check your email!

## Troubleshooting

### Issue: "Invalid grant" error
- **Solution**: Refresh token may have expired. Generate a new one from OAuth Playground.

### Issue: "Access denied"
- **Solution**: Make sure you added your email as a test user in OAuth consent screen.

### Issue: Still getting connection timeout
- **Solution**: Make sure all 3 OAuth2 variables are set correctly. Check logs for OAuth2 configuration message.

## Security Notes

- ⚠️ Never commit OAuth credentials to Git
- ⚠️ Keep Client Secret and Refresh Token secure
- ⚠️ Regenerate tokens if compromised
- ✅ OAuth2 is more secure than App Passwords

## Fallback

If OAuth2 variables are not set, the system will fall back to App Password authentication automatically.

