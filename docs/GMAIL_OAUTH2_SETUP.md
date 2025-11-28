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

### Important: Revoke Previous Access First

If you've already authorized before, you need to revoke access first:

1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "OAuth 2.0 Playground" or "AssetTrack Email"
3. Click **Remove Access** or **Revoke**
4. This ensures you get a fresh refresh token

### Get the Refresh Token

**Option A: Using OAuth Playground (if refresh token appears)**

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. **Clear any existing tokens** (click "Clear" or refresh the page)
3. Click the **gear icon (⚙️)** in top right
4. Check **"Use your own OAuth credentials"**
5. Enter your **Client ID** and **Client Secret**
6. **IMPORTANT**: Check **"Force approval prompt"** (this forces Google to show consent screen)
7. Click **Close** (gear settings)
8. In the left panel, find **"Gmail API v1"** (scroll down, it's alphabetically listed)
9. Expand it and check: `https://www.googleapis.com/auth/gmail.send`
10. Click **Authorize APIs** (blue button at bottom of left panel)
11. Sign in with your Gmail account (`jojoopiwe@gmail.com`)
12. If you see "Google hasn't verified this app" warning, click **Continue**
13. Click **Allow** to grant permissions
14. You'll be redirected back to Playground
15. **Step 2** will now appear - Click **"Exchange authorization code for tokens"** (blue button)
16. **Check the left panel Step 2** - Look for a "Refresh token" input field (it might be auto-filled even if not in JSON)
17. **Also check the right panel** - Look for `refresh_token` in the JSON response
18. **Copy the Refresh Token** - It starts with `1//0g` or similar

**Option B: Manual Authorization URL (if Option A doesn't work)**

If the refresh token still doesn't appear, use this manual method:

1. **Construct this URL** (replace `YOUR_CLIENT_ID` with your actual Client ID):
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://developers.google.com/oauthplayground&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent
   ```

2. **For your Client ID**, use:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=757767304664-5tjsch4302keem9b42un4vjbg17h3er6.apps.googleusercontent.com&redirect_uri=https://developers.google.com/oauthplayground&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent
   ```

3. **Copy and paste this URL** into your browser address bar
4. Sign in with `jojoopiwe@gmail.com`
5. Click **Allow**
6. You'll be redirected to OAuth Playground with a `code` in the URL
7. In OAuth Playground:
   - Make sure your Client ID and Secret are set (gear icon)
   - Go to **Step 2** in the left panel
   - Click **"Exchange authorization code for tokens"**
   - The refresh token should now appear!

**Option C: Check Google Cloud Console (if you already have a refresh token)**

If you've authorized before, the refresh token might already exist:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Check if there's a way to view existing tokens (this varies by project)

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

