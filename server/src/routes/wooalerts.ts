import express from 'express';
import { prisma } from '../lib/prisma';
import { whatsappService } from '../lib/whatsapp';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * WooAlerts Webhook Endpoint
 * POST /api/wooalerts-webhook
 *
 * Receives WhatsApp messages from WooAlerts and creates tickets
 *
 * Expected payload format from WooAlerts:
 * {
 *   "name": "John Doe",
 *   "phone": "+27712919486",
 *   "email": "john@example.com",
 *   "ticket": "My laptop is not working properly"
 * }
 */
router.post('/wooalerts-webhook', async (req, res) => {
  try {
    console.log('📩 Received WooAlerts webhook:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Support two formats: Direct format and WooAlerts format
    let name, phone, email, ticketDescription;

    if (body.contact && body.message) {
      // WooAlerts format
      console.log('📦 Detected WooAlerts format');
      const contact = body.contact;
      const message = body.message;

      // Skip status updates (sent, delivered, read) - only process new messages
      if (!message.is_new_message || message.status) {
        console.log('ℹ️  Skipping status update or non-new message');
        return res.status(200).json({
          success: true,
          message: 'Status update acknowledged (no ticket created)'
        });
      }

      name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.phone_number;
      phone = contact.phone_number;
      email = contact.email;
      ticketDescription = message.body || message.media?.caption || 'Media message received';

      console.log(`📦 WooAlerts data: name=${name}, phone=${phone}, email=${email}, message=${ticketDescription}`);
    } else {
      // Direct format (for testing)
      console.log('📦 Detected direct format');
      name = body.name;
      phone = body.phone;
      email = body.email;
      ticketDescription = body.ticket;

      console.log(`📦 Direct data: name=${name}, phone=${phone}, email=${email}, ticket=${ticketDescription}`);
    }

    // Validate required fields
    if (!ticketDescription) {
      console.log('❌ No message body found');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: message body'
      });
    }

    // At least phone or email should be provided
    if (!phone && !email) {
      console.log('❌ No phone or email found');
      return res.status(400).json({
        success: false,
        error: 'Either phone or email is required'
      });
    }

    // Find or create user
    let user = null;

    // Try to find user by email first, then by phone
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
    }

    if (!user && phone) {
      // Clean phone number for matching
      const cleanPhone = phone.replace(/[\s+()-]/g, '').slice(-10);
      user = await prisma.user.findFirst({
        where: {
          phone: {
            contains: cleanPhone
          }
        }
      });
    }

    // If user not found, create a new user account
    if (!user) {
      console.log(`Creating new user from WooAlerts webhook`);

      const userName = name || 'WhatsApp User';
      const userEmail = email || `whatsapp_${Date.now()}@temp.local`;

      // Generate a random password hash (user will need to reset to login)
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          name: userName,
          email: userEmail,
          phone: phone || null,
          role: 'USER',
          emailVerified: email ? false : true, // Auto-verify if no email
          password: hashedPassword, // Random hashed password - user needs to reset to login
        }
      });

      console.log(`Created new user: ${user.id} - ${user.email}`);
    }

    // Parse the ticket description to extract title and details
    const ticketData = parseTicketDescription(ticketDescription);

    // Generate unique ticket number
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, '0')}`;

    // Create ticket
    const newTicket = await prisma.ticket.create({
      data: {
        number: ticketNumber,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: 'open',
        createdById: user.id,
      }
    });

    console.log(`✅ Created ticket ${newTicket.number} from WooAlerts webhook`);

    // Send confirmation via WhatsApp if phone number is provided
    if (phone) {
      try {
        await whatsappService.sendTextMessage({
          to: phone,
          message: `✅ *Ticket Created Successfully!*

Ticket #${newTicket.number}
Title: ${newTicket.title}
Priority: ${newTicket.priority}
Status: ${newTicket.status}

We've received your request and will get back to you soon.

You can track your ticket at: ${process.env.CLIENT_URL || 'https://yourdomain.com'}/tickets/${newTicket.id}`
        });
        console.log(`Sent confirmation to ${phone}`);
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp confirmation:', whatsappError);
        // Don't fail the whole request if WhatsApp message fails
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Ticket created successfully',
      data: {
        ticketNumber: newTicket.number,
        ticketId: newTicket.id,
        title: newTicket.title,
        status: newTicket.status,
        priority: newTicket.priority,
        createdAt: newTicket.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error processing WooAlerts webhook:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Parse ticket description to extract title, description, and priority
 * Supports multiple formats:
 * 1. Simple text: "My laptop is broken"
 * 2. Structured: "Title: Laptop issue\nDescription: Screen not working\nPriority: high"
 */
function parseTicketDescription(description: string): {
  title: string;
  description: string;
  priority: string;
} {
  const lines = description.trim().split('\n');
  let title = '';
  let desc = '';
  let priority = 'medium';

  // Check for structured format
  const titleMatch = description.match(/title:\s*(.+)/i);
  const descMatch = description.match(/description:\s*(.+)/i);
  const priorityMatch = description.match(/priority:\s*(low|medium|high|critical)/i);

  if (titleMatch || descMatch) {
    // Structured format
    title = titleMatch ? titleMatch[1].trim() : 'Support Request';
    desc = descMatch ? descMatch[1].trim() : description;
    priority = priorityMatch ? priorityMatch[1].toLowerCase() : 'medium';
  } else {
    // Simple format - use first line as title, or truncate if single line
    if (lines.length > 1) {
      title = lines[0].substring(0, 100);
      desc = lines.slice(1).join('\n').trim() || lines[0];
    } else {
      // Single line - use first 50 chars as title
      title = description.substring(0, 50);
      desc = description;
    }
  }

  // Ensure we have a title
  if (!title || title.trim() === '') {
    title = 'Support Request via WhatsApp';
  }

  return {
    title: title.trim(),
    description: desc.trim() || description,
    priority: priority.toLowerCase()
  };
}

/**
 * Test endpoint to verify webhook is accessible
 * GET /api/wooalerts-webhook/test
 */
router.get('/wooalerts-webhook/test', (req, res) => {
  res.json({
    success: true,
    message: 'WooAlerts webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    endpoint: '/api/wooalerts-webhook'
  });
});

export default router;
