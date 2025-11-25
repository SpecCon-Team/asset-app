# Render Deployment - Step by Step Guide

## ✅ Step 1: Create Database (2 minutes)

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - Name: `assettrack-db`
   - Database: `assettrack`
   - User: `assettrack_user`
   - Region: (choose closest)
   - Plan: **Free**
4. Click **"Create Database"**
5. Wait for database to be ready
6. **COPY the "Internal Database URL"** - you'll need this!
   - Example: `postgresql://assettrack_user:password@host/assettrack`

---

## ✅ Step 2: Create Backend Service (5 minutes)

1. Click **"New +"** → **"Web Service"**
2. Select repository: `SpecCon-Team/asset-app`
3. Fill in:

   **Basic Settings:**
   ```
   Name: assettrack-api
   Region: (same as database)
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   ```

   **Build Settings:**
   ```
   Build Command: cd server && npm install && npx prisma generate && npm run build
   Start Command: cd server && npm start
   ```

   **Plan:**
   ```
   Free
   ```

4. Click **"Advanced"** to add environment variables:

   ```
   NODE_ENV = production
   PORT = 4000
   DATABASE_URL = (paste Internal Database URL from Step 1)
   JWT_SECRET = (generate random: use any long random string)
   JWT_REFRESH_SECRET = (generate random: use another long random string)
   CLIENT_URL = https://assettrack-client.onrender.com
   ```

   **To generate secrets, run this in your terminal:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment

---

## ✅ Step 3: Create Frontend Service (5 minutes)

1. Click **"New +"** → **"Static Site"**
2. Select repository: `SpecCon-Team/asset-app`
3. Fill in:

   **Basic Settings:**
   ```
   Name: assettrack-client
   Branch: main
   Root Directory: (leave empty)
   ```

   **Build Settings:**
   ```
   Build Command: cd client && npm install && npm run build
   Publish Directory: client/dist
   ```

4. Click **"Create Static Site"**
5. Wait 5-10 minutes for deployment

---

## ✅ Step 4: Update Backend Environment (2 minutes)

After frontend is deployed:

1. **Copy your frontend URL** (e.g., `https://assettrack-client.onrender.com`)
2. Go to **Backend Service** (`assettrack-api`)
3. Click **"Environment"** tab
4. Update **`CLIENT_URL`** with your actual frontend URL
5. Click **"Save Changes"**
6. Backend will auto-redeploy (2-3 minutes)

---

## ✅ Step 5: Seed Database (Optional but Recommended)

To add default admin user and sample data:

### Option A: Using Render Shell

1. Go to your **backend service** (`assettrack-api`)
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd server
   npm run seed
   ```

### Option B: Using Local Connection

1. Go to your database on Render
2. Copy **"External Database URL"**
3. In your local terminal:
   ```bash
   cd server
   DATABASE_URL="paste-external-url-here" npm run seed
   ```

---

## 🎉 Step 6: Test Your App!

1. **Get URLs** from Render dashboard:
   - Frontend: `https://assettrack-client.onrender.com`
   - Backend: `https://assettrack-api.onrender.com`

2. **Open frontend URL** in browser

3. **Test backend health**:
   - Go to: `https://assettrack-api.onrender.com/health`
   - Should see: `{"status":"healthy",...}`

4. **Login** with default credentials:
   ```
   Email: admin@example.com
   Password: admin123
   ```

5. **First load will be slow** (30-50 seconds) - this is normal!

---

## 📋 Quick Checklist

- [ ] Database created and running
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] `CLIENT_URL` updated in backend
- [ ] Database seeded with default data
- [ ] Health check returns "healthy"
- [ ] Can login to frontend
- [ ] App is working! 🎉

---

## 🆘 Troubleshooting

### Backend Build Failed

**Check logs for errors:**
- Click on backend service
- Go to "Logs" tab
- Look for error messages

**Common fixes:**
```bash
# If Prisma error, make sure build command has:
npx prisma generate
```

### Frontend Not Connecting to Backend

1. Check `CLIENT_URL` in backend environment
2. Check browser console for CORS errors
3. Make sure both services are deployed
4. Update `.env.production` in client folder with correct API URL

### Database Connection Failed

1. Make sure `DATABASE_URL` is the **Internal Database URL**
2. Check if database is running (green status)
3. Wait 2-3 minutes for connection pool to initialize

### App is Slow / Not Loading

1. **First load is always slow** (free tier sleeps after 15 min)
2. Wait 30-50 seconds for app to wake up
3. Subsequent loads will be faster
4. To keep it awake, use UptimeRobot (see below)

---

## 💡 Keep Your App Awake (Optional)

Free tier apps sleep after 15 minutes of inactivity. To keep it awake:

1. Go to: https://uptimerobot.com (free)
2. Sign up
3. Add **"New Monitor"**:
   - Type: HTTP(s)
   - URL: `https://assettrack-api.onrender.com/health`
   - Monitoring Interval: 5 minutes
4. Save

Your app will stay awake during the day!

---

## 🔐 Important: Change Default Passwords!

After first login, **immediately change** the default admin password:

1. Login as admin
2. Go to Profile → Change Password
3. Use a strong password

---

## 📊 Your URLs

After deployment, save these:

```
Frontend: https://assettrack-client.onrender.com
Backend: https://assettrack-api.onrender.com
Health Check: https://assettrack-api.onrender.com/health
Database: (internal only, accessible from backend)
```

---

## 🚀 Redeploying Updates

When you push code changes to GitHub:

1. **Automatic (if enabled)**:
   - Services auto-deploy on git push

2. **Manual**:
   - Go to service dashboard
   - Click "Manual Deploy" → "Deploy latest commit"

---

## 💰 Cost

- **Database**: Free (1GB storage)
- **Backend**: Free (750 hours/month)
- **Frontend**: Free (100GB bandwidth)
- **Total**: $0/month 🎉

**Limitations**:
- Apps sleep after 15 min inactivity
- Backend wakes in 30-50 seconds
- Perfect for portfolio/learning projects!

---

## 📞 Need Help?

If you get stuck:
1. Check Render logs (in service dashboard)
2. Check browser console (F12)
3. Review this guide
4. Ask for help!

---

**Good luck! 🚀**
