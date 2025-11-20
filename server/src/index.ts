import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import assetsRouter from './routes/assets';
import ticketsRouter from './routes/tickets';
import commentsRouter from './routes/comments';
import notificationsRouter from './routes/notifications';
import auditLogsRouter from './routes/auditLogs';
import twoFactorRouter from './routes/twoFactor';
import gdprRouter from './routes/gdpr';
import whatsappRouter from './routes/whatsapp';
import wooalertsRouter from './routes/wooalerts';
import aiChatRouter from './routes/aiChat';
import pegRouter from './routes/peg';
import attachmentsRouter from './routes/attachments';
import path from 'path';
import {
  securityLogger,
  validateInput,
  globalRateLimiter,
  requestId,
  enhancedSecurityHeaders,
  responseTimeMonitor,
  preventParameterPollution,
  validateDataIntegrity
} from './middleware/security';

const app = express();

// Trust proxy for services like ngrok, localtunnel, etc.
app.set('trust proxy', true);

// ============================================
// WEBHOOK ENDPOINTS (Before all middleware!)
// These need to bypass security middleware for external services
// ============================================

// WhatsApp Webhook Verification (GET)
app.get('/api/whatsapp/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔔 Webhook verification request:', {
      mode,
      token: token ? '***' : undefined,
      challenge: challenge ? '***' : undefined
    });

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'asset_app_webhook_verify_2024';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed:', {
        expectedToken: verifyToken,
        receivedMode: mode
      });
      return res.sendStatus(403);
    }
  } catch (error: any) {
    console.error('Error in webhook verification:', error);
    return res.sendStatus(500);
  }
});

// WhatsApp Webhook POST handler - registered early before security middleware
// This needs to be here because WhatsApp webhooks need special handling
const whatsappWebhookRouter = express.Router();
whatsappWebhookRouter.post('/api/whatsapp/webhook', express.json(), async (req, res) => {
  try {
    console.log('📩 Received webhook:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Validate webhook payload
    if (body.object !== 'whatsapp_business_account') {
      console.log('❌ Invalid webhook object:', body.object);
      return res.sendStatus(404);
    }

    console.log('✅ Webhook object validated');
    console.log(`📦 Processing ${body.entry?.length || 0} entries...`);

    // Process webhook entries
    for (const entry of body.entry || []) {
      console.log(`📦 Entry ID: ${entry.id}, Changes: ${entry.changes?.length || 0}`);

      for (const change of entry.changes || []) {
        console.log(`📦 Change field: ${change.field}`);

        if (change.field === 'messages') {
          const value = change.value;
          console.log(`📦 Messages in value: ${value.messages?.length || 0}`);
          console.log(`📦 Statuses in value: ${value.statuses?.length || 0}`);

          // Process messages
          if (value.messages && value.messages.length > 0) {
            console.log(`✅ Processing ${value.messages.length} message(s)...`);

            // Import the processing function dynamically
            const { processIncomingWhatsAppMessage } = await import('./routes/whatsapp');

            for (const message of value.messages) {
              console.log(`📱 Message from: ${message.from}, type: ${message.type}`);
              await processIncomingWhatsAppMessage(message, value);
            }
          } else {
            console.log('ℹ️  No messages to process (might be status update)');
          }
        } else {
          console.log(`ℹ️  Skipping field: ${change.field}`);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    console.log('✅ Webhook processing complete, sending 200 response');
    res.sendStatus(200);
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    console.error('❌ Error stack:', error.stack);
    // Still return 200 to prevent Meta from retrying
    res.sendStatus(200);
  }
});

app.use(whatsappWebhookRouter);

// ============================================
// SECURITY MIDDLEWARE STACK (Order matters!)
// ============================================

// 1. Request ID and tracking
app.use(requestId);
app.use(responseTimeMonitor);

// 2. Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. Security logging
app.use(securityLogger);

// 4. Enhanced security headers
app.use(enhancedSecurityHeaders);

// 5. Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
}));

// 6. Cookie parser (required for CSRF)
app.use(cookieParser());

// 7. CORS must be configured before other middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5174',
  'http://localhost:5173', // Vite default port
  'http://localhost:5174'  // Alternative port
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// 8. Response compression
app.use(compression());

// 9. Data sanitization against NoSQL injection
app.use(mongoSanitize());

// 10. Body parser with size limits
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 11. Input validation and sanitization
app.use(validateInput);

// 12. Parameter pollution prevention
app.use(preventParameterPollution);

// 13. Data integrity validation
app.use(validateDataIntegrity);

// 14. Global rate limiting (applies to all routes)
app.use('/api/', globalRateLimiter);

// Enhanced health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbCheck = await prisma.$queryRaw`SELECT NOW()`;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      database: {
        connected: true,
        timestamp: dbCheck
      },
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/2fa', twoFactorRouter);
app.use('/api/gdpr', gdprRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/ai-chat', aiChatRouter);
app.use('/api/peg', pegRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api', wooalertsRouter); // WooAlerts webhook at /api/wooalerts-webhook

app.get('/api', (_req, res) => {
  res.json({ status: 'ok', message: 'API root' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A record with this value already exists'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    error: 'Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${port}/health`);
});