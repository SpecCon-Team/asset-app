# How to Subscribe to WhatsApp Webhook Messages

## Step-by-Step Guide with Screenshots Reference

### Step 1: Access Your Meta App
1. Go to: https://developers.facebook.com/apps
2. Click on your WhatsApp Business app
3. In the left sidebar, find **WhatsApp** section

### Step 2: Navigate to Configuration
1. Under **WhatsApp** in the left sidebar, click **Configuration**
2. You'll see the Configuration page with several sections

### Step 3: Configure Webhook

#### A. Set Up Webhook URL
Look for the **Webhook** section (usually near the top):

```
┌─────────────────────────────────────────────────────┐
│ Webhook                                     [Edit]  │
├─────────────────────────────────────────────────────┤
│ Callback URL: https://your-url/api/whatsapp/webhook│
│ Verify Token: asset_app_webhook_verify_2024        │
│                                                      │
│ [Verify and Save]                                   │
└─────────────────────────────────────────────────────┘
```

1. Click **[Edit]** button
2. Enter your **Callback URL**: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
3. Enter **Verify Token**: `asset_app_webhook_verify_2024`
4. Click **Verify and Save**

#### B. Subscribe to Webhook Fields
After the webhook is verified, scroll down to find **Webhook fields** section:

```
┌─────────────────────────────────────────────────────┐
│ Webhook fields                                       │
├─────────────────────────────────────────────────────┤
│ Subscribe to get notified when events occur         │
│                                                      │
│ ☐ account_alerts                                    │
│ ☐ account_update                                    │
│ ☑ messages              [Subscribe] / [Unsubscribe] │
│ ☐ message_template_status_update                    │
│ ☐ phone_number_name_update                          │
│ ☐ phone_number_quality_update                       │
│ ☐ security                                          │
│ ☐ template_category_update                          │
└─────────────────────────────────────────────────────┘
```

1. Find the row that says **messages**
2. Click the **[Subscribe]** button next to it
3. The checkbox (☑) should become checked

### Alternative Location: API Setup Page

If you don't see it in Configuration, try:
1. **WhatsApp → API Setup** (in left sidebar)
2. Scroll down to **Step 5: Configure Webhooks**
3. You'll see a similar interface with webhook fields

### What You Should See

After subscribing to "messages", you should see:
- ☑ messages - **Subscribed** (in green)
- When someone sends a message to your WhatsApp Business number, Meta will POST to your webhook URL

### Visual Reference

Based on your screenshots, the page looks like this:

```
Meta for Developers
├── Dashboard
├── WhatsApp
│   ├── Getting Started
│   ├── API Setup                    ← Try here first
│   ├── Configuration               ← Or here
│   ├── Phone Numbers
│   └── Message Templates
```

### Troubleshooting

**Can't find "Webhook fields"?**
- Make sure you've completed the webhook verification first
- The subscription options only appear AFTER webhook is verified
- Try refreshing the page after verification

**"Subscribe" button is grayed out?**
- Your webhook URL must be verified first
- Make sure ngrok is running and your server is accessible

**Still can't find it?**
- Look for a section called "Webhooks" or "Webhook Subscriptions"
- Sometimes it's in a collapsible section - look for expand arrows (▶)
- Check under both "Configuration" and "API Setup" pages

### Testing Your Subscription

After subscribing:
1. Send a test message to your WhatsApp Business number
2. Check your server logs - you should see:
   ```
   📩 Received webhook: {...}
   📱 Message from: +1234567890, type: text
   ```
3. If you see these logs, your webhook subscription is working!

---

## Quick Commands Reference

```bash
# Start ngrok
ngrok http 4000

# Your webhook URL will be:
https://[random-id].ngrok.io/api/whatsapp/webhook

# Verify token:
asset_app_webhook_verify_2024
```

---

## Need Visual Help?

Your screenshots show you're in the right area. Look for:
1. The section that shows "Message available" or "Status is OFF"
2. Near that, there should be webhook configuration options
3. The "Subscribe" buttons are usually next to each webhook field type
