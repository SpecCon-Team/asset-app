# 🔧 WhatsApp Webhook Setup for Render Deployment

## 🚨 Why Your Bot Isn't Responding

When you send "Hi" to your WhatsApp Business number:
1. ✅ Your phone sends message to Meta's servers
2. ❌ Meta doesn't know where to send the webhook (not configured or wrong URL)
3. ❌ Your server never receives the message
4. ❌ Bot can't respond

---

## ✅ Step-by-Step: Configure Webhook for Render

### Step 1: Verify Environment Variables in Render

1. Go to your **Render Dashboard**: https://dashboard.render.com
2. Click on your **`assettrack-api`** service
3. Go to **Environment** tab
4. **Verify these variables are set:**
   - `WHATSAPP_PHONE_NUMBER_ID` = Your Phone Number ID (e.g., `852483691285659`)
   - `WHATSAPP_ACCESS_TOKEN` = Your Meta Access Token
   - `WHATSAPP_VERIFY_TOKEN` = `asset_app_webhook_verify_2024` (or your custom token)
   - `WHATSAPP_API_VERSION` = `v21.0` (already set)

**⚠️ If any are missing, add them now and redeploy!**

---

### Step 2: Configure Webhook in Meta Dashboard

1. **Go to Meta Developers Console:**
   - Visit: https://developers.facebook.com/apps
   - Log in with your Facebook account
   - Click on your **WhatsApp Business app**

2. **Navigate to Configuration:**
   - In the left sidebar, click: **WhatsApp** → **Configuration**
   - Scroll down to the **"Webhooks"** section

3. **Edit Webhook:**
   - Click the **"Edit"** button next to Webhook
   - Enter these values:

   **Callback URL:**
   ```
   https://assettrack-api.onrender.com/api/whatsapp/webhook
   ```

   **Verify Token:**
   ```
   asset_app_webhook_verify_2024
   ```
   *(Must match the `WHATSAPP_VERIFY_TOKEN` in Render)*

   - Click **"Verify and Save"**

4. **✅ Verification should succeed!**
   - You should see a green checkmark
   - If it fails, check:
     - Render service is running
     - URL is exactly as shown (no trailing slash)
     - Verify token matches Render environment variable

---

### Step 3: Subscribe to Messages Field (CRITICAL!)

**This is the most common issue!**

1. **On the same Configuration page**, scroll down to **"Webhook fields"**
2. You'll see a list of fields:
   ```
   ☐ account_alerts
   ☐ account_update
   ☐ messages                    [Subscribe]
   ☐ message_template_status_update
   ☐ phone_number_name_update
   ☐ phone_number_quality_update
   ```

3. **Click the [Subscribe] button next to "messages"**

4. It should change to:
   ```
   ☑ messages                    [Unsubscribe]
   ```

**⚠️ Without this, Meta won't send message webhooks to your server!**

---

### Step 4: Test the Webhook

1. **Send a test message:**
   - Open WhatsApp on your phone
   - Send "Hi" to your WhatsApp Business number

2. **Check Render Logs:**
   - Go to Render Dashboard → `assettrack-api` → **Logs** tab
   - You should see:
     ```
     📩 Received webhook: {...}
     📱 Message from: 27712919486, type: text
     Message content: "Hi"
     ✅ Processing message...
     ```

3. **Expected Response:**
   - You should receive a welcome menu from the bot
   - If not, check the logs for errors

---

## 🔍 Troubleshooting

### Issue: Webhook Verification Fails

**Possible causes:**
1. Render service is not running
2. URL is incorrect (check for typos)
3. Verify token doesn't match

**Solution:**
- Check Render service status
- Verify the URL is exactly: `https://assettrack-api.onrender.com/api/whatsapp/webhook`
- Ensure `WHATSAPP_VERIFY_TOKEN` in Render matches the token in Meta dashboard

### Issue: Messages Not Being Received

**Check these:**
1. ✅ Webhook is verified (green checkmark in Meta)
2. ✅ "messages" field is subscribed (checkbox checked)
3. ✅ Environment variables are set in Render
4. ✅ Render service is running and healthy

**Solution:**
- Re-verify webhook in Meta dashboard
- Double-check "messages" subscription
- Check Render logs for incoming webhook requests

### Issue: Bot Receives Messages But Doesn't Respond

**Check Render Logs for:**
- Error messages when processing
- WhatsApp API errors (authentication, rate limits)
- Database connection issues

**Common fixes:**
- Verify `WHATSAPP_ACCESS_TOKEN` is valid and not expired
- Check `WHATSAPP_PHONE_NUMBER_ID` is correct
- Ensure database is accessible

---

## 📋 Quick Checklist

Before testing, verify:

- [ ] Environment variables set in Render:
  - [ ] `WHATSAPP_PHONE_NUMBER_ID`
  - [ ] `WHATSAPP_ACCESS_TOKEN`
  - [ ] `WHATSAPP_VERIFY_TOKEN`
  - [ ] `WHATSAPP_API_VERSION`
- [ ] Webhook URL in Meta: `https://assettrack-api.onrender.com/api/whatsapp/webhook`
- [ ] Verify token matches in both Meta and Render
- [ ] Webhook shows "Verified" status in Meta
- [ ] "messages" field is subscribed in Meta
- [ ] Render service is running and healthy

---

## 🎯 Next Steps

Once configured:
1. Send "Hi" to your WhatsApp Business number
2. You should receive the welcome menu
3. Test creating a ticket via WhatsApp
4. Check Render logs to monitor webhook activity

---

## 📞 Need Help?

If still not working:
1. Check Render logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure webhook is verified and "messages" is subscribed
4. Test webhook endpoint manually: `curl https://assettrack-api.onrender.com/api/whatsapp/webhook`

