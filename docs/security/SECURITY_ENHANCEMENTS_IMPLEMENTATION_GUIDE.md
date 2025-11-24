# 🔒 Security Enhancements Implementation Guide

This guide walks you through implementing all the security enhancements added to your application.

---

## 📋 Table of Contents

1. [Database Migrations](#1-database-migrations)
2. [Environment Variables](#2-environment-variables)
3. [JWT Refresh Tokens](#3-jwt-refresh-tokens)
4. [Webhook Security](#4-webhook-security)
5. [File Upload Security](#5-file-upload-security)
6. [Session Management](#6-session-management)
7. [Enhanced Rate Limiting](#7-enhanced-rate-limiting)
8. [CSP Headers](#8-csp-headers)
9. [Testing](#9-testing)
10. [Monitoring](#10-monitoring)

---

## 1. Database Migrations

### Step 1: Run Prisma Migrations

```bash
cd server
npx prisma migrate dev --name security_enhancements
npx prisma generate
```

This will create the new tables:
- `RefreshToken` - For JWT refresh token management
- `UserSession` - For session tracking across devices
- `WebhookLog` - For webhook audit trail
- `SecurityEvent` - For security event logging

### Step 2: Verify Migration

```bash
npx prisma studio
```

Check that all new tables exist.

---

## 2. Environment Variables

### Step 1: Add New Environment Variables

Add these to your `server/.env`:

```bash
# Webhook Security (REQUIRED)
WHATSAPP_APP_SECRET="your_app_secret_from_meta_dashboard"
WOOALERTS_WEBHOOK_SECRET="your_wooalerts_secret"

# Session Security
SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

# CSRF Protection
CSRF_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
```

### Step 2: Get WhatsApp App Secret

1. Go to https://developers.facebook.com
2. Select your app
3. Go to Settings → Basic
4. Copy your "App Secret"
5. Add to `.env` as `WHATSAPP_APP_SECRET`

---

## 3. JWT Refresh Tokens

### Implementation

The refresh token system is ready to use. Update your auth routes:

#### Update `server/src/routes/auth.ts`

```typescript
import { generateTokenPair, validateRefreshToken, revokeRefreshToken } from '../lib/tokenService';

// In your login route, replace:
// const token = jwt.sign(...)
// res.json({ token, user })

// With:
const tokens = await generateTokenPair(
  user.id,
  user.role,
  user.email,
  req.ip,
  req.headers['user-agent']
);

res.json({
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  expiresIn: tokens.expiresIn,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
});
```

#### Add Refresh Token Endpoint

```typescript
// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const validation = await validateRefreshToken(refreshToken);

    if (!validation.valid) {
      return res.status(401).json({ message: validation.error });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: validation.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token pair
    const tokens = await generateTokenPair(
      user.id,
      user.role,
      user.email,
      req.ip,
      req.headers['user-agent']
    );

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    res.json(tokens);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// POST /api/auth/logout - Revoke tokens
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// POST /api/auth/logout-all - Logout all devices
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    const count = await revokeAllUserTokens(req.user!.id);
    res.json({ message: `Logged out from ${count} device(s)` });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Failed to logout all devices' });
  }
});
```

---

## 4. Webhook Security

### WhatsApp Webhook

Update `server/src/index.ts` or `server/src/routes/whatsapp.ts`:

```typescript
import { verifyWhatsAppSignature, logWebhook } from './lib/webhookSecurity';

app.post('/api/whatsapp/webhook', express.json(), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify signature
  const verification = verifyWhatsAppSignature(rawBody, signature);

  // Log webhook
  await logWebhook(
    'whatsapp',
    'incoming_message',
    req.body,
    signature,
    verification.valid,
    verification.error
  );

  if (!verification.valid) {
    console.error('Invalid webhook signature:', verification.error);
    return res.sendStatus(403);
  }

  // Process webhook...
  try {
    // Your existing webhook processing code
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
});
```

### WooAlerts Webhook

Similar implementation for WooAlerts:

```typescript
import { verifyWooAlertsSignature, logWebhook } from './lib/webhookSecurity';

app.post('/api/wooalerts-webhook', express.json(), async (req, res) => {
  const signature = req.headers['x-wooalerts-signature'] as string; // Adjust header name
  const rawBody = JSON.stringify(req.body);

  const verification = verifyWooAlertsSignature(rawBody, signature);

  await logWebhook(
    'wooalerts',
    'order_notification',
    req.body,
    signature,
    verification.valid,
    verification.error
  );

  if (!verification.valid) {
    return res.sendStatus(403);
  }

  // Process webhook...
  res.sendStatus(200);
});
```

---

## 5. File Upload Security

### Update `server/src/routes/attachments.ts`

```typescript
import {
  sanitizeFilename,
  generateSecureFilename,
  validateUploadedFile,
  uploadRateLimiter,
  calculateFileHash,
  validateExtensionMimeMatch
} from '../lib/fileUploadSecurity';

// Add rate limiter to upload route
router.post(
  '/:ticketId',
  authenticate,
  uploadRateLimiter, // Add this
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate extension matches MIME type
      if (!validateExtensionMimeMatch(req.file.originalname, req.file.mimetype)) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'File type mismatch' });
      }

      // Read file buffer for validation
      const buffer = await fs.readFile(req.file.path);

      // Comprehensive validation
      const validation = await validateUploadedFile(
        buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (!validation.valid) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'File validation failed',
          details: validation.errors
        });
      }

      // Calculate file hash for deduplication
      const fileHash = calculateFileHash(buffer);

      // Generate secure filename
      const secureFilename = generateSecureFilename(req.file.originalname);

      // Rename file to secure name
      const newPath = path.join(path.dirname(req.file.path), secureFilename);
      await fs.rename(req.file.path, newPath);

      // Create attachment record with hash
      const attachment = await prisma.attachment.create({
        data: {
          filename: secureFilename,
          originalName: sanitizeFilename(req.file.originalname),
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/tickets/${secureFilename}`,
          ticketId,
          uploadedBy: user.id
          // Add fileHash field to schema if you want deduplication
        }
      });

      res.json(attachment);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ error: 'Failed to upload attachment' });
    }
  }
);
```

---

## 6. Session Management

### Add Session Tracking Routes

Create `server/src/routes/sessions.ts`:

```typescript
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getUserSessions,
  terminateSession,
  terminateOtherSessions,
  terminateAllSessions
} from '../lib/sessionManagement';

const router = Router();

// GET /api/sessions - Get user's active sessions
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const sessions = await getUserSessions(req.user!.id);
    res.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// DELETE /api/sessions/:id - Terminate specific session
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await terminateSession(req.params.id);
    res.json({ message: 'Session terminated' });
  } catch (error) {
    console.error('Failed to terminate session:', error);
    res.status(500).json({ message: 'Failed to terminate session' });
  }
});

// POST /api/sessions/terminate-others - Logout other devices
router.post('/terminate-others', authenticate, async (req: AuthRequest, res) => {
  try {
    const sessionToken = req.headers['x-session-token'] as string;
    const count = await terminateOtherSessions(req.user!.id, sessionToken);
    res.json({ message: `Terminated ${count} session(s)` });
  } catch (error) {
    console.error('Failed to terminate sessions:', error);
    res.status(500).json({ message: 'Failed to terminate sessions' });
  }
});

export default router;
```

### Register in `server/src/index.ts`

```typescript
import sessionsRouter from './routes/sessions';

app.use('/api/sessions', sessionsRouter);
```

---

## 7. Enhanced Rate Limiting

### Update `server/src/index.ts`

```typescript
import { dynamicRateLimiter, progressiveDelayMiddleware } from './lib/enhancedRateLimiting';

// Replace global rate limiter with dynamic one
// Remove: app.use('/api/', globalRateLimiter);

// Add:
app.use('/api/', dynamicRateLimiter);
app.use('/api/', progressiveDelayMiddleware);
```

---

## 8. CSP Headers

### Strengthen CSP in `server/src/index.ts`

```typescript
// Update Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'nonce-{RANDOM}'"], // Remove unsafe-inline
      scriptSrc: ["'self'", "'nonce-{RANDOM}'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:5173"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
    reportOnly: false
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 9. Testing

### Test JWT Refresh Tokens

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save refreshToken from response

# Refresh token
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Test Webhook Signature

```bash
# Test WhatsApp webhook with invalid signature
curl -X POST http://localhost:4000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=invalidsignature" \
  -d '{"object":"whatsapp_business_account"}'

# Should return 403
```

### Test File Upload Security

```bash
# Try uploading a file with dangerous extension
# Should be rejected
```

### Test Rate Limiting

```bash
# Run this in a loop to trigger rate limit
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Should get 429 after 5 attempts
```

---

## 10. Monitoring

### View Security Events

```bash
# In Prisma Studio
npx prisma studio

# Navigate to SecurityEvent table
# Check for suspicious activities
```

### View Webhook Logs

```bash
# Check WebhookLog table for all webhook receipts
# Verify signatures are being validated
```

### View Active Sessions

```bash
# Check UserSession table
# Monitor for unusual session patterns
```

---

## 🎯 Next Steps

After implementing all enhancements:

1. ✅ **Rotate all credentials** (see SECURITY_FIXES_URGENT.md)
2. ✅ **Remove .env from git history**
3. ✅ **Test all endpoints**
4. ✅ **Monitor logs for errors**
5. ✅ **Update client-side code** to handle refresh tokens
6. ✅ **Set up automated backups**
7. ✅ **Configure monitoring alerts**

---

## 📱 Client-Side Changes Required

### Implement Token Refresh

```typescript
// client/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Store tokens
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Request interceptor
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        accessToken = response.data.accessToken;
        refreshToken = response.data.refreshToken;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔍 Security Checklist

- [ ] Database migrations run successfully
- [ ] All environment variables configured
- [ ] JWT refresh tokens implemented
- [ ] Webhook signatures verified
- [ ] File uploads secured
- [ ] Session management active
- [ ] Rate limiting enhanced
- [ ] CSP headers strengthened
- [ ] Client-side token refresh implemented
- [ ] All credentials rotated
- [ ] .env removed from git history
- [ ] Security monitoring active
- [ ] Backup system configured
- [ ] Team notified of changes

---

## 📞 Support

If you encounter issues:
1. Check the logs in `server/logs/`
2. Verify environment variables are set
3. Ensure database migrations completed
4. Check Prisma Studio for data

---

**Last Updated**: $(date)
**Version**: 1.0.0
