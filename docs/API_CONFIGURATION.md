# API Configuration Guide

## Overview

The application uses a centralized API configuration system that automatically works in both **local development** and **production** environments.

## Configuration File

**Location**: `client/src/lib/apiConfig.ts`

### Functions

- **`getApiBaseUrl()`**: Returns the API base URL with `/api` suffix
  - Example: `http://localhost:4000/api` (local) or `https://api.example.com/api` (production)

- **`getApiUrl()`**: Returns the base API URL without `/api` suffix
  - Example: `http://localhost:4000` (local) or `https://api.example.com` (production)

- **`isProduction()`**: Checks if running in production environment

## Environment Variables

### Local Development (Default)

If no environment variables are set, the app defaults to:
- **API Base URL**: `http://localhost:4000/api`
- **API URL**: `http://localhost:4000`

### Production Configuration

Set these environment variables in your production environment:

#### Option 1: Using VITE_API_BASE_URL (Recommended)
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
```

#### Option 2: Using VITE_API_URL
```bash
VITE_API_URL=https://your-api-domain.com
```
The `/api` suffix will be automatically appended.

## Priority Order

The configuration uses the following priority:

1. **VITE_API_BASE_URL** (if set, used as-is)
2. **VITE_API_URL + '/api'** (if VITE_API_URL is set)
3. **http://localhost:4000/api** (fallback for local development)

## Usage Examples

### In Components

```typescript
import { getApiBaseUrl } from '@/lib/apiConfig';

// Fetch data
const response = await fetch(`${getApiBaseUrl()}/users`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### With Axios

```typescript
import { getApiBaseUrl } from '@/lib/apiConfig';
import axios from 'axios';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});
```

### For File Downloads

```typescript
import { getApiBaseUrl } from '@/lib/apiConfig';

window.open(`${getApiBaseUrl()}/documents/${id}/download`, '_blank');
```

## Files Using Centralized Config

All API calls throughout the application now use the centralized configuration:

- ✅ `client/src/lib/api.ts` - Main axios instance
- ✅ `client/src/features/assets/lib/apiClient.ts` - Asset API client
- ✅ `client/src/features/notifications/store.ts` - Notifications store
- ✅ `client/src/features/workflows/**` - All workflow components
- ✅ `client/src/features/auth/SignUpPage.tsx` - Registration
- ✅ `client/src/features/tickets/components/CommentSection.tsx` - Comments
- ✅ `client/src/lib/pushNotifications.ts` - Push notifications
- ✅ `client/src/features/whatsapp/WhatsAppSetup.tsx` - WhatsApp integration
- ✅ `client/src/features/documents/DocumentDetailPage.tsx` - Document downloads
- ✅ `client/src/features/analytics/AdvancedAnalyticsPage.tsx` - Analytics exports

## Deployment Setup

### Render.com

In your Render static site environment variables:

```
VITE_API_BASE_URL=https://assettrack-api.onrender.com/api
```

Or:

```
VITE_API_URL=https://assettrack-api.onrender.com
```

### Vercel / Netlify

Set the same environment variables in your deployment platform's dashboard.

### Local Development

No configuration needed! The app automatically uses `http://localhost:4000/api` when no environment variables are set.

## Testing

### Test Local Development
1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npm run dev`
3. App should connect to `http://localhost:4000/api`

### Test Production Build
1. Set environment variable: `VITE_API_BASE_URL=https://your-api.com/api`
2. Build: `cd client && npm run build`
3. The built app will use the production API URL

## Troubleshooting

### Issue: API calls going to wrong URL

**Solution**: Check that environment variables are set correctly:
```bash
# Check current values
echo $VITE_API_BASE_URL
echo $VITE_API_URL
```

### Issue: CORS errors in production

**Solution**: Ensure your backend CORS configuration allows your frontend domain:
```typescript
// server/src/index.ts
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';
app.use(cors({ origin: CLIENT_URL }));
```

### Issue: Environment variables not working

**Solution**: 
1. Environment variables must start with `VITE_` to be accessible in Vite
2. Restart dev server after changing environment variables
3. Rebuild production bundle after changing environment variables

## Benefits

✅ **Single source of truth** for API configuration  
✅ **Automatic environment detection** (local vs production)  
✅ **Easy deployment** - just set environment variables  
✅ **No code changes** needed when switching environments  
✅ **Type-safe** with TypeScript  
✅ **Consistent** across all API calls  

