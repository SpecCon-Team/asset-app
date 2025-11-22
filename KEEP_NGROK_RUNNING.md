# 🚀 How to Keep ngrok Running for WhatsApp

## ✅ Current Status
- **ngrok URL**: https://prouniversity-catheryn-thistly.ngrok-free.dev
- **Status**: Running in background with `nohup`

---

## 📋 Option 1: Background Process (ACTIVE NOW) ✅

**Already done!** ngrok is now running in the background.

### Check if ngrok is running:
```bash
ps aux | grep ngrok | grep -v grep
```

### View ngrok dashboard:
Open in browser: **http://localhost:4040**

### View ngrok logs:
```bash
tail -f /tmp/ngrok.log
```

### Stop ngrok:
```bash
pkill ngrok
```

### Start ngrok in background again:
```bash
nohup ~/bin/ngrok http 4000 > /tmp/ngrok.log 2>&1 &
```

### Get current ngrok URL:
```bash
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1
```

---

## 📋 Option 2: systemd Service (Best for Production)

Create a systemd service to auto-start ngrok on boot.

### 1. Create service file:
```bash
sudo nano /etc/systemd/system/ngrok.service
```

### 2. Add this content:
```ini
[Unit]
Description=ngrok tunnel
After=network.target

[Service]
Type=simple
User=opiwe
WorkingDirectory=/home/opiwe
ExecStart=/home/opiwe/bin/ngrok http 4000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ngrok
sudo systemctl start ngrok
```

### 4. Check status:
```bash
sudo systemctl status ngrok
```

### 5. View logs:
```bash
sudo journalctl -u ngrok -f
```

---

## 📋 Option 3: screen/tmux Session

Use `screen` or `tmux` to keep ngrok running even when you close the terminal.

### Using screen:
```bash
# Install screen if not installed
sudo apt install screen

# Start a new screen session
screen -S ngrok

# Inside screen, run ngrok
~/bin/ngrok http 4000

# Detach from screen: Press Ctrl+A then D

# Reattach to screen later
screen -r ngrok

# List all screen sessions
screen -ls
```

### Using tmux:
```bash
# Install tmux if not installed
sudo apt install tmux

# Start a new tmux session
tmux new -s ngrok

# Inside tmux, run ngrok
~/bin/ngrok http 4000

# Detach from tmux: Press Ctrl+B then D

# Reattach to tmux later
tmux attach -t ngrok

# List all tmux sessions
tmux ls
```

---

## 📋 Option 4: PM2 Process Manager

Use PM2 to manage ngrok as a persistent process.

### 1. Install PM2:
```bash
npm install -g pm2
```

### 2. Create start script:
```bash
nano ~/start-ngrok.sh
```

Add:
```bash
#!/bin/bash
~/bin/ngrok http 4000
```

Make executable:
```bash
chmod +x ~/start-ngrok.sh
```

### 3. Start with PM2:
```bash
pm2 start ~/start-ngrok.sh --name ngrok
pm2 save
pm2 startup
```

### 4. Manage PM2:
```bash
# Check status
pm2 status

# View logs
pm2 logs ngrok

# Restart
pm2 restart ngrok

# Stop
pm2 stop ngrok
```

---

## ⚠️ Important Notes

### 1. ngrok URL Changes
Every time you restart ngrok, the URL changes!

**Current URL**: https://prouniversity-catheryn-thistly.ngrok-free.dev

When URL changes, you must:
1. Get new URL: `curl -s http://localhost:4040/api/tunnels | grep public_url`
2. Update Meta webhook: https://developers.facebook.com/apps
3. Navigate to WhatsApp > Configuration
4. Update webhook URL to: `https://NEW-URL.ngrok-free.dev/api/whatsapp/webhook`
5. Click "Verify and Save"

### 2. ngrok Free Plan Limits
- Session timeout: 8 hours
- URL changes on restart
- 40 connections/minute

### 3. Production Alternative: Custom Domain

For production, instead of ngrok, use:
- **Deploy to cloud**: Heroku, Railway, DigitalOcean, AWS
- **Use your own domain**: example.com/api/whatsapp/webhook
- **No URL changes**: Webhook stays the same
- **No session limits**: Always online

---

## 🔍 Troubleshooting

### ngrok stopped working:
```bash
# Check if ngrok is running
ps aux | grep ngrok

# If not running, restart it
nohup ~/bin/ngrok http 4000 > /tmp/ngrok.log 2>&1 &

# Get new URL
curl -s http://localhost:4040/api/tunnels | grep public_url

# Update Meta webhook with new URL
```

### Check ngrok web interface:
Open: http://localhost:4040

Shows:
- Current public URL
- All incoming requests
- Request/response details
- Great for debugging!

### WhatsApp not receiving messages:
1. Check ngrok is running: `ps aux | grep ngrok`
2. Check server is running: `curl http://localhost:4000/api/whatsapp/webhook`
3. Verify webhook URL in Meta matches ngrok URL
4. Check ngrok dashboard for incoming requests: http://localhost:4040

---

## 📊 Quick Commands Reference

```bash
# Start ngrok in background
nohup ~/bin/ngrok http 4000 > /tmp/ngrok.log 2>&1 &

# Check if running
ps aux | grep ngrok | grep -v grep

# Get current URL
curl -s http://localhost:4040/api/tunnels | grep public_url

# View logs
tail -f /tmp/ngrok.log

# Stop ngrok
pkill ngrok

# View dashboard
# Open in browser: http://localhost:4040
```

---

## 🎯 Recommended Setup

**For Development/Testing** (Current):
- ✅ Run ngrok in background with `nohup`
- ✅ Check URL daily and update Meta if changed
- ✅ Use ngrok dashboard to debug

**For Production**:
- ❌ Don't use ngrok (URLs change)
- ✅ Deploy to cloud platform
- ✅ Use custom domain
- ✅ Set up SSL certificate

---

## 🌐 Production Deployment Options

### Option A: Railway.app (Easiest)
1. Push code to GitHub
2. Connect Railway to GitHub
3. Deploy automatically
4. Get permanent URL: `yourapp.railway.app`
5. Update Meta webhook once

### Option B: Heroku
1. Create Heroku app
2. Push code: `git push heroku main`
3. Get URL: `yourapp.herokuapp.com`
4. Update Meta webhook once

### Option C: DigitalOcean/AWS
1. Create VPS
2. Install Node.js and dependencies
3. Set up domain and SSL
4. Run server with PM2
5. Point domain to server IP

---

**Current Status**: ✅ ngrok running in background
**Current URL**: https://prouniversity-catheryn-thistly.ngrok-free.dev
**Dashboard**: http://localhost:4040

**Next time you restart your computer**, just run:
```bash
nohup ~/bin/ngrok http 4000 > /tmp/ngrok.log 2>&1 &
```

Then get the new URL and update Meta webhook!
