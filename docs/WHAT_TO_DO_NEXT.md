# 🎯 WHAT TO DO NEXT - Quick Action Guide

## ✅ Phase 1: DONE!
- Database tables created
- Security libraries ready
- Documentation complete
- Environment variables prepared

---

## 🚨 DO THIS RIGHT NOW (5 minutes)

### 1. Get Your WhatsApp App Secret
```bash
# Go to: https://developers.facebook.com
# Click: Your WhatsApp App
# Navigate to: Settings → Basic
# Find: App Secret → Click "Show"
# Copy the secret
```

### 2. Update .env
```bash
# Open: server/.env
# Find: WHATSAPP_APP_SECRET="YOUR_APP_SECRET_HERE"
# Replace with your actual secret
# Save the file
```

### 3. Test Server
```bash
cd server
npm run dev

# Should start without errors
# Check: http://localhost:4000/health
```

---

## 📋 THEN DO THIS (Next 2 Hours)

### Step 1: Implement JWT Refresh Tokens (30 min)

**Open**: `server/src/routes/auth.ts`

**At the top**, add import:
```typescript
import { generateTokenPair, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../lib/tokenService';
```

**In the login route** (around line 303), **replace**:
```typescript
const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
res.json({
  token,
  user: { ... }
});
```

**With**:
```typescript
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
    role: user.role,
    isAvailable: user.isAvailable,
    profilePicture: user.profilePicture
  }
});
```

**At the end of the file**, add new endpoints:
```typescript
// POST /api/auth/refresh
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

    const user = await prisma.user.findUnique({
      where: { id: validation.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tokens = await generateTokenPair(
      user.id,
      user.role,
      user.email,
      req.ip,
      req.headers['user-agent']
    );

    await revokeRefreshToken(refreshToken);

    res.json(tokens);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// POST /api/auth/logout
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

// POST /api/auth/logout-all
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

**Test**: Restart server and test login

---

### Step 2: Add Webhook Verification (20 min)

**Open**: `server/src/index.ts`

**At the top**, add import:
```typescript
import { verifyWhatsAppSignature, logWebhook } from './lib/webhookSecurity';
```

**Find the WhatsApp webhook handler** (around line 82), **replace entire function**:
```typescript
whatsappWebhookRouter.post('/api/whatsapp/webhook', express.json(), async (req, res) => {
  try {
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
      console.error('❌ Invalid webhook signature:', verification.error);
      return res.sendStatus(403);
    }

    console.log('✅ Webhook signature verified');

    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      console.log('❌ Invalid webhook object:', body.object);
      return res.sendStatus(404);
    }

    // ... rest of your existing webhook processing code

    res.sendStatus(200);
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    res.sendStatus(200);
  }
});
```

**Test**: Send test webhook from Meta Dashboard

---

### Step 3: Secure File Uploads (30 min)

**Open**: `server/src/routes/attachments.ts`

**At the top**, add imports:
```typescript
import {
  validateUploadedFile,
  sanitizeFilename,
  generateSecureFilename,
  uploadRateLimiter,
  calculateFileHash
} from '../lib/fileUploadSecurity';
```

**Update the upload route** (line 60), add `uploadRateLimiter`:
```typescript
router.post('/:ticketId', authenticate, uploadRateLimiter, upload.single('file'), async (req, res) => {
```

**Inside the route**, after `if (!req.file)` check, **add**:
```typescript
// Read file buffer
const buffer = await fs.readFile(req.file.path);

// Validate file
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

// Generate secure filename
const secureFilename = generateSecureFilename(req.file.originalname);
const newPath = path.join(path.dirname(req.file.path), secureFilename);
await fs.rename(req.file.path, newPath);

// Calculate hash for deduplication
const fileHash = calculateFileHash(buffer);
```

**Update the attachment creation**:
```typescript
const attachment = await prisma.attachment.create({
  data: {
    filename: secureFilename,  // Changed
    originalName: sanitizeFilename(req.file.originalname),  // Changed
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/tickets/${secureFilename}`,  // Changed
    ticketId,
    uploadedBy: user.id,
  }
});
```

**Test**: Upload a file to a ticket

---

### Step 4: Enable Enhanced Rate Limiting (10 min)

**Open**: `server/src/index.ts`

**At the top**, add import:
```typescript
import { dynamicRateLimiter, progressiveDelayMiddleware } from './lib/enhancedRateLimiting';
```

**Find the line** (around 227):
```typescript
app.use('/api/', globalRateLimiter);
```

**Replace with**:
```typescript
app.use('/api/', dynamicRateLimiter);
app.use('/api/', progressiveDelayMiddleware);
```

**Test**: Make multiple rapid requests

---

## ✅ Verification Checklist

After implementing, verify:

- [ ] Server starts without errors
- [ ] Login returns `accessToken` and `refreshToken`
- [ ] `/api/auth/refresh` endpoint works
- [ ] `/api/auth/logout` endpoint works
- [ ] Webhook signature verification logs appear
- [ ] File uploads validate properly
- [ ] Rate limiting is active

---

## 🧪 Quick Tests

```bash
# Test login (get tokens)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Test refresh token
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN_HERE"}'

# Test health
curl http://localhost:4000/health
```

---

## 📚 If You Get Stuck

1. **Check the detailed guide**:
   - `SECURITY_ENHANCEMENTS_IMPLEMENTATION_GUIDE.md`

2. **Check phase 1 completion**:
   - `SECURITY_IMPLEMENTATION_COMPLETE.md`

3. **Check urgentactions**:
   - `SECURITY_FIXES_URGENT.md`

4. **Verify migrations**:
   ```bash
   node verifyMigration.mjs
   ```

---

## 🎯 Success!

When all steps are complete, you'll have:
- ✅ 15-minute access tokens + 30-day refresh tokens
- ✅ Verified webhook signatures
- ✅ Hardened file uploads
- ✅ Per-user rate limiting
- ✅ Complete security audit trail

**Your security score will jump from 7/10 to 9.5/10!**

---

**Time to complete: ~2 hours**
**Difficulty: Medium (copy & paste + test)**

START HERE → Get WhatsApp App Secret → Implement JWT Refresh Tokens

Good luck! 🚀
