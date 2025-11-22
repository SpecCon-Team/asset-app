import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Webhook Security Module
 * Handles signature verification and logging for external webhooks
 */

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verify Meta WhatsApp webhook signature
 * Documentation: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export function verifyWhatsAppSignature(
  payload: string,
  signature: string | undefined
): WebhookVerificationResult {
  if (!signature) {
    return { valid: false, error: 'No signature provided' };
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error('WHATSAPP_APP_SECRET not configured');
    return { valid: false, error: 'Webhook secret not configured' };
  }

  try {
    // Meta sends signature as: sha256=<hash>
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
      return { valid: false, error: 'Invalid signature format' };
    }

    const receivedHash = signatureParts[1];

    // Calculate expected signature
    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const valid = crypto.timingSafeEqual(
      Buffer.from(receivedHash),
      Buffer.from(expectedHash)
    );

    if (!valid) {
      console.warn('WhatsApp webhook signature verification failed');
      return { valid: false, error: 'Signature mismatch' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error verifying WhatsApp signature:', error);
    return { valid: false, error: 'Verification error' };
  }
}

/**
 * Verify WooAlerts webhook signature
 * Note: WooAlerts does not provide webhook signature verification
 * This function returns valid:true as WooAlerts doesn't use HMAC signing
 * Security is handled through API access tokens and endpoint authentication
 */
export function verifyWooAlertsSignature(
  payload: string,
  signature: string | undefined
): WebhookVerificationResult {
  // WooAlerts does not provide webhook signature verification
  // They rely on endpoint security and API tokens instead
  const webhookSecret = process.env.WOOALERTS_WEBHOOK_SECRET;

  // If secret is configured (for future use), verify it
  if (webhookSecret && signature) {
    try {
      const expectedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const valid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedHash)
      );

      if (!valid) {
        console.warn('WooAlerts webhook signature verification failed');
        return { valid: false, error: 'Signature mismatch' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error verifying WooAlerts signature:', error);
      return { valid: false, error: 'Verification error' };
    }
  }

  // No signature verification available - accept webhook
  // Log for security monitoring
  console.log('⚠️  WooAlerts webhook received without signature verification (not supported by WooAlerts)');
  return { valid: true };
}

/**
 * Log webhook receipt for audit trail
 */
export async function logWebhook(
  source: 'whatsapp' | 'wooalerts',
  event: string,
  payload: any,
  signature: string | undefined,
  verified: boolean,
  error?: string
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        source,
        event,
        payload: JSON.stringify(payload),
        signature: signature || null,
        verified,
        processed: false,
        error: error || null
      }
    });
  } catch (err) {
    console.error('Failed to log webhook:', err);
  }
}

/**
 * Mark webhook as processed
 */
export async function markWebhookProcessed(
  webhookLogId: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    await prisma.webhookLog.update({
      where: { id: webhookLogId },
      data: {
        processed: true,
        error: error || null
      }
    });
  } catch (err) {
    console.error('Failed to update webhook log:', err);
  }
}

/**
 * Check for replay attacks by tracking webhook IDs
 */
const recentWebhookIds = new Set<string>();
const WEBHOOK_ID_TTL = 5 * 60 * 1000; // 5 minutes

export function checkWebhookReplay(webhookId: string): boolean {
  if (recentWebhookIds.has(webhookId)) {
    console.warn(`Replay attack detected: webhook ${webhookId} already processed`);
    return true; // Is replay
  }

  recentWebhookIds.add(webhookId);

  // Clean up old IDs periodically
  setTimeout(() => {
    recentWebhookIds.delete(webhookId);
  }, WEBHOOK_ID_TTL);

  return false; // Not replay
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
export function validateWebhookTimestamp(timestamp: number, maxAgeSeconds: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  if (age > maxAgeSeconds) {
    console.warn(`Webhook timestamp too old: ${age} seconds`);
    return false;
  }

  if (age < -60) {
    console.warn(`Webhook timestamp from future: ${age} seconds`);
    return false;
  }

  return true;
}
