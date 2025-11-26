# 🚀 AssetTrack Pro - Frontend Deployment to Render

## 📋 Prerequisites
- ✅ Backend deployed to Render: `https://assettrack-api.onrender.com`
- ✅ GitHub repository: `SpecCon-Team/asset-app`
- ✅ Render account (you already have one!)

---

## Why Render for Frontend?

✅ **Free tier** supports private organization repos  
✅ **Everything in one place** (backend + frontend)  
✅ **Automatic deploys** on git push  
✅ **Free SSL** and custom domains  
✅ **Simpler management** - one dashboard for everything

---

## Step 1: Create New Static Site

### 1.1 Navigate to Render Dashboard
1. Go to **https://dashboard.render.com**
2. Click **"New +"** button (top right)
3. Select **"Static Site"**

---

## Step 2: Connect Repository

### 2.1 Select Your Repository
1. Find **`SpecCon-Team/asset-app`** in the list
2. Click **"Connect"**

> If you don't see it, click "Configure account" to grant Render access

---

## Step 3: Configure Build Settings

Fill in these settings **exactly**:

| Setting | Value |
|---------|-------|
| **Name** | `assettrack-client` (or any name you prefer) |
| **Branch** | `main` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `client/dist` |

### Important Notes:
- ⚠️ **Root Directory**: Must be `client` (tells Render where your frontend code is)
- ⚠️ **Publish Directory**: Must be `client/dist` (where Vite builds to)

---

## Step 4: Environment Variables

Click **"Advanced"** and add these environment variables:

**Key**: `VITE_API_BASE_URL`  
**Value**: `https://assettrack-api.onrender.com/api`

**Key**: `VITE_API_URL`  
**Value**: `https://assettrack-api.onrender.com`

> These tell your frontend where to find the backend API


---

## Step 5: Create Static Site

1. Review all settings
2. Click **"Create Static Site"**
3. Wait 3-5 minutes for first deployment

### Expected Build Output:
```
==> Cloning from https://github.com/SpecCon-Team/asset-app
==> Running build command 'npm install && npm run build'
==> Build successful 🎉
==> Your site is live at: https://assettrack-client.onrender.com
```

---

## Step 6: Update Backend CORS

After frontend is deployed, update your backend to allow requests from the frontend:

1. Go to Render Dashboard
2. Select your backend service (**`assettrack-api`**)
3. Go to **"Environment"** tab
4. Add/Update this variable:
   - **Key**: `CLIENT_URL`
   - **Value**: `https://assettrack-client.onrender.com` (use your actual URL)
5. Click **"Save Changes"**
6. Backend will automatically redeploy (takes ~2 minutes)

---

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Frontend loads at your Render URL
- [ ] Can navigate to login page
- [ ] No console errors (press F12 to check)
- [ ] API calls work (check Network tab in browser DevTools)
- [ ] No CORS errors
- [ ] Images and assets load correctly

---

## 🔧 Troubleshooting

### Issue: Build fails with "Cannot find module"
**Solution**: Check that `Root Directory` is set to `client`

### Issue: 404 on page refresh
**Solution**: Render automatically handles this for React apps - should work by default

### Issue: API calls failing (CORS errors)
**Solution**: 
1. Verify `VITE_API_URL` is set correctly
2. Verify `CLIENT_URL` is set on backend
3. Check both services have redeployed

### Issue: Blank page
**Solution**: 
1. Check browser console for errors (F12)
2. Verify `Publish Directory` is `client/dist`
3. Check build logs for errors

---

## 📊 Final Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (Render Static)            │
│  https://assettrack-client.onrender.com    │
│  - React + Vite                              │
│  - Served from global CDN                    │
└─────────────────┬───────────────────────────┘
                  │ API Calls
                  ↓
┌─────────────────────────────────────────────┐
│         Backend (Render Web Service)        │
│  https://assettrack-api.onrender.com       │
│  - Node.js + Express                         │
│  - REST API                                  │
└─────────────────┬───────────────────────────┘
                  │ Database Queries
                  ↓
┌─────────────────────────────────────────────┐
│         Database (Neon PostgreSQL)          │
│  PostgreSQL Cloud Database                   │
└─────────────────────────────────────────────┘
```

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Frontend**: Live on Render Static Site
- ✅ **Backend**: Live on Render Web Service
- ✅ **Database**: Connected to Neon
- ✅ **Everything managed** in one Render dashboard

Your AssetTrack Pro app is now **fully deployed**! 🚀

---

## 📝 Quick Reference

### Your Deployed URLs:
- **Frontend**: `https://assettrack-client.onrender.com` (or your custom name)
- **Backend**: `https://assettrack-api.onrender.com`
- **Database**: Neon PostgreSQL (connected automatically)

### To Redeploy:
Just push to GitHub `main` branch - Render auto-deploys both frontend and backend!

---

## 🔗 Custom Domain (Optional)

To add a custom domain:
1. Go to your Static Site settings
2. Click **"Custom Domains"**
3. Add your domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate to provision (~5 minutes)
