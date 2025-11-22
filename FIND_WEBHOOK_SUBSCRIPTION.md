# Where to Find "Subscribe to messages" in Meta Developer Console

## Visual Guide

### Location 1: WhatsApp → Configuration (Most Common)

```
┌────────────────────────────────────────────────────────────────┐
│ Meta for Developers                                    [Apps ▼]│
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Sidebar]                    [Main Content Area]              │
│  ┌──────────┐                                                  │
│  │ Dashboard│                Configuration                     │
│  │ Settings │                ──────────────                    │
│  │          │                                                  │
│  │ WhatsApp │ ◄── Click     Webhook                    [Edit] │
│  │ ├─Getting│                ──────                            │
│  │ │ Started│                Callback URL: [empty]             │
│  │ ├─API    │                Verify token: [empty]             │
│  │ │ Setup  │                                                  │
│  │ ├─Config │ ◄── You are    [Verify and Save]                │
│  │ │ -ura-  │     here                                         │
│  │ │ tion   │                ─────────────────────            │
│  │ ├─Phone  │                                                  │
│  │ │ Numbers│                Webhook fields                    │
│  │ └─Message│                ──────────────                    │
│  │  Template│                                                  │
│  │          │                ☐ account_alerts                  │
│  │ Products │                ☐ account_update                  │
│  │ Messenger│                ☐ messages              [Subscribe]│
│  │ Settings │                ☐ message_template_status_update  │
│  │          │                ☐ phone_number_name_update        │
│  └──────────┘                ☐ phone_number_quality_update     │
│                               ☐ security                        │
│                               ☐ template_category_update        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Steps:**
1. Click **WhatsApp** in left sidebar
2. Click **Configuration** (under WhatsApp)
3. Scroll down to **Webhook fields** section
4. Find the row that says **messages**
5. Click the **[Subscribe]** button

---

### Location 2: WhatsApp → API Setup (Alternative)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  WhatsApp > API Setup                                          │
│  ───────────────────                                           │
│                                                                 │
│  Step 1: Select phone number                                   │
│  [Dropdown: Select a phone number]                             │
│                                                                 │
│  Step 2: Send messages with the API                            │
│  ... (code examples) ...                                       │
│                                                                 │
│  Step 3: Configure webhooks                                    │
│  ───────────────────────────                                   │
│                                                                 │
│  Webhook endpoint:                                             │
│  ┌────────────────────────────────────────────┐               │
│  │ https://your-url/webhook                   │ [Edit]        │
│  └────────────────────────────────────────────┘               │
│                                                                 │
│  Verify token: ****************                [Edit]          │
│                                                                 │
│  Webhook fields:                                               │
│  Select the events you want to receive webhooks for            │
│                                                                 │
│  ☐ account_alerts                                              │
│  ☐ account_update                                              │
│  ☐ messages                              [Subscribe] ◄── Click this!│
│  ☐ message_template_status_update                              │
│  ☐ phone_number_name_update                                    │
│  ☐ phone_number_quality_update                                 │
│  ☐ security                                                    │
│  ☐ template_category_update                                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Steps:**
1. Click **WhatsApp** in left sidebar
2. Click **API Setup** (under WhatsApp)
3. Scroll down to **Step 3: Configure webhooks**
4. Find **Webhook fields** section
5. Click **[Subscribe]** next to **messages**

---

## What Each Field Means

| Field | What it does |
|-------|-------------|
| **messages** ✅ | Incoming messages from users (REQUIRED for your bot) |
| account_alerts | Account security and quality alerts |
| account_update | Business account information changes |
| message_template_status_update | Template approval status changes |
| phone_number_name_update | Display name changes |
| phone_number_quality_update | Phone number quality rating changes |
| security | Security events |
| template_category_update | Template category changes |

**You ONLY need to subscribe to "messages"** for your chatbot to work!

---

## After Subscribing

Once you click **[Subscribe]**, you'll see:

```
☑ messages                              [Unsubscribe]
  └─ Subscribed on: Nov 17, 2025 10:30 AM
```

The checkbox will be checked (☑) and the button changes to **[Unsubscribe]**.

---

## If You Can't Find It

### Reason 1: Webhook Not Verified Yet
The "Webhook fields" section **only appears AFTER** you verify your webhook URL.

**Solution:**
1. First, start ngrok: `~/bin/ngrok http 4000`
2. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
3. In Meta Console, add webhook:
   - URL: `https://abc123.ngrok.io/api/whatsapp/webhook`
   - Token: `asset_app_webhook_verify_2024`
4. Click **Verify and Save**
5. THEN the subscription fields will appear

### Reason 2: Wrong Page
Make sure you're on:
- **WhatsApp → Configuration** (most common)
- OR **WhatsApp → API Setup** (alternative location)

NOT on:
- Dashboard
- Settings
- Getting Started

### Reason 3: Collapsed Section
Look for expandable sections marked with ▶ or ▼ arrows. Click them to expand.

---

## Testing Your Subscription

After subscribing, test it:

1. Send "test" to your WhatsApp Business number
2. Check your server logs (where `npm run dev` is running)
3. You should see:
```
📩 Received webhook: {...}
📱 Message from: +1234567890, type: text
```

If you see these logs, **your webhook subscription is working!** ✅

---

## Quick Action Checklist

- [ ] ngrok is running: `~/bin/ngrok http 4000`
- [ ] Server is running: `npm run dev` (in server folder)
- [ ] Webhook URL configured in Meta (with `/api/whatsapp/webhook`)
- [ ] Webhook verified successfully (green checkmark)
- [ ] "messages" field is subscribed (checkbox checked)
- [ ] Access token updated (not expired)
- [ ] Test message sent

Once all checked, send "My laptop is broken" to test!
