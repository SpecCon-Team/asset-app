# 🚀 AssetTrack Pro - Vercel Frontend Deployment Guide

## 📋 Prerequisites
- ✅ Backend deployed to Render: `https://assettrack-api.onrender.com`
- ✅ GitHub repository: `SpecCon-Team/asset-app`
- ⏳ Vercel account (we'll create this)

---

## Step 1: Create Vercel Account

### 1.1 Sign Up
1. Go to **https://vercel.com/signup**
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. ✅ Account created!

### 1.2 Why GitHub?
- Automatic deployments on git push
- Easy repository access
- No separate credentials needed

---

## Step 2: Import Your Project

### 2.1 Add New Project
1. Click **"Add New Project"** button
2. You'll see your GitHub repositories listed
3. Find **`SpecCon-Team/asset-app`**
4. Click **"Import"**

### 2.2 Configure Import Settings
Since this is a **monorepo**, you need to specify the root directory:

**Root Directory**: `client`
- Click "Edit" next to Root Directory
- Enter: `client`
- Click "Continue"

---

## Step 3: Configure Build Settings

Vercel should auto-detect most settings, but verify these:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> ✅ Vercel auto-detects these for Vite projects

---

## Step 4: Environment Variables

### 4.1 Add API URL
Click **"Environment Variables"** section and add:

**Key**: `VITE_API_URL`  
**Value**: `https://assettrack-api.onrender.com`

> ⚠️ **Important**: Vite requires env vars to start with `VITE_`

### 4.2 Other Optional Variables
If your app needs other environment variables, add them here.

---

## Step 5: Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. ✅ Your app will be live!

### Expected Output:
```
Building...
  ✓ Build completed
  ✓ Deploying to production
  ✓ Deployment ready

Your site is live at: https://your-app-name.vercel.app
```

---

## Step 6: Post-Deployment Configuration

### 6.1 Update Backend CORS
Once you have your Vercel URL, update the backend's `CLIENT_URL` environment variable on Render:

1. Go to Render Dashboard
2. Select your backend service (`assettrack-api`)
3. Go to **Environment** tab
4. Add/Update: `CLIENT_URL` = `https://your-app-name.vercel.app`
5. Save (service will redeploy)

### 6.2 Custom Domain (Optional)
To add a custom domain:
1. Go to your Vercel project settings
2. Click **"Domains"**
3. Add your domain
4. Follow DNS configuration instructions

---

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Can access login page
- [ ] API calls work (check browser console)
- [ ] No CORS errors
- [ ] Assets load correctly
- [ ] Environment variables are correct

---

## 🔧 Troubleshooting

### Issue: API calls failing (CORS errors)
**Solution**: Make sure `CLIENT_URL` is set on Render backend

### Issue: Build fails
**Solution**: Check build logs for errors, verify `package.json` scripts

### Issue: Environment variables not working
**Solution**: Ensure they start with `VITE_` and redeploy

### Issue: 404 on routes
**Solution**: Vercel handles React routing automatically for Vite apps

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Vercel)               │
│  https://your-app.vercel.app           │
│  - React + Vite                         │
│  - Static files served globally         │
└─────────────┬───────────────────────────┘
              │ API Calls
              ↓
┌─────────────────────────────────────────┐
│      Backend (Render)                   │
│  https://assettrack-api.onrender.com   │
│  - Node.js + Express                    │
│  - REST API                             │
└─────────────┬───────────────────────────┘
              │ Database Queries
              ↓
┌─────────────────────────────────────────┐
│      Database (Neon)                    │
│  PostgreSQL Cloud Database              │
└─────────────────────────────────────────┘
```

---

## 🎉 Success!

Once deployed:
- **Frontend**: Live on Vercel
- **Backend**: Live on Render  
- **Database**: Connected to Neon

Your AssetTrack Pro app is now fully deployed! 🚀
