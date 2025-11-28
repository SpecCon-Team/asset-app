# Simple Email Setup - App Password Method

If OAuth2 is too complex, use **Gmail App Password** instead. It's simpler and works well for production.

## Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", find **2-Step Verification**
3. Click it and follow the steps to enable it
4. You'll need your phone to verify

## Step 2: Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", find **App passwords** (appears after enabling 2-Step Verification)
3. Click **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter name: **AssetTrack Server**
7. Click **Generate**
8. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
9. Remove spaces: `abcdefghijklmnop`

## Step 3: Add to Render

Go to Render → Your Backend → Environment and add/update:

```
EMAIL_USER = jojoopiwe@gmail.com
EMAIL_PASSWORD = abcdefghijklmnop  (your 16-character app password, no spaces)
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
```

**Remove these if you have them:**
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

## Step 4: Test

1. Save environment variables
2. Wait for backend to redeploy (2-3 minutes)
3. Check logs - you should see: `✅ Email service configured: jojoopiwe@gmail.com via smtp.gmail.com:587`
4. Try registering a new account
5. Check your email!

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using the **App Password** (16 characters), not your regular Gmail password
- Make sure 2-Step Verification is enabled
- Remove spaces from the app password

### Connection timeout
- The code already has timeout settings configured
- If it still times out, try port 465 with `EMAIL_SECURE = true`

### Still not working?
- Check Render logs for detailed error messages
- Make sure `EMAIL_USER` matches the Gmail account where you generated the App Password

