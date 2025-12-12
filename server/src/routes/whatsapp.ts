import express, { Request, Response } from 'express';
import { whatsappService } from '../lib/whatsapp';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

interface WhatsAppTicketData {
  ticketNumber: string;
  title: string;
  priority: string;
  assignedTo?: string;
}

interface WhatsAppAssetData {
  assetCode: string;
  assetName: string;
  assignedTo: string;
}

const router = express.Router();

/**
 * Get WhatsApp configuration status
 * GET /api/whatsapp/status
 */
router.get('/status', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  try {
    const isConfigured = whatsappService.isConfigured();

    res.json({
      configured: isConfigured,
      message: isConfigured
        ? 'WhatsApp Business API is configured'
        : 'WhatsApp Business API is not configured',
    });
  } catch (error: any) {
    console.error('Error checking WhatsApp status:', error);
    res.status(500).json({ error: 'Failed to check WhatsApp status' });
  }
});

/**
 * Test WhatsApp connection
 * POST /api/whatsapp/test
 * Body: { phoneNumber: string }
 */
router.post('/test', authenticate, requireRole('ADMIN'), async (req: Request<{}, {}, { phoneNumber: string }>, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate phone number format (should be numbers only, can include +)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        error: 'Invalid phone number format. Use international format (e.g., +27712919486)'
      });
    }

    const result = await whatsappService.testConnection(phoneNumber);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test message sent successfully',
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test message',
      });
    }
  } catch (error: any) {
    console.error('Error testing WhatsApp connection:', error);
    res.status(500).json({
      error: 'Failed to test WhatsApp connection',
      details: error.message
    });
  }
});

/**
 * Send a custom WhatsApp message
 * POST /api/whatsapp/send
 * Body: { phoneNumber: string, message: string }
 */
router.post('/send', authenticate, requireRole('ADMIN'), async (req: Request<{}, {}, { phoneNumber: string; message: string }>, res: Response) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'Phone number and message are required'
      });
    }

    const result = await whatsappService.sendTextMessage({
      to: phoneNumber,
      message,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send message',
      });
    }
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      error: 'Failed to send WhatsApp message',
      details: error.message
    });
  }
});

/**
 * Send ticket notification via WhatsApp
 * POST /api/whatsapp/notify/ticket
 * Body: { phoneNumber: string, ticketData: object }
 */
router.post('/notify/ticket', authenticate, async (req: Request<{}, {}, { phoneNumber: string; ticketData: WhatsAppTicketData }>, res: Response) => {
  try {
    const { phoneNumber, ticketData } = req.body;

    if (!phoneNumber || !ticketData) {
      return res.status(400).json({
        error: 'Phone number and ticket data are required'
      });
    }

    const result = await whatsappService.sendTicketNotification(
      phoneNumber,
      ticketData
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Ticket notification sent successfully',
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send ticket notification',
      });
    }
  } catch (error: any) {
    console.error('Error sending ticket notification:', error);
    res.status(500).json({
      error: 'Failed to send ticket notification',
      details: error.message
    });
  }
});

/**
 * Send asset notification via WhatsApp
 * POST /api/whatsapp/notify/asset
 * Body: { phoneNumber: string, assetData: object }
 */
router.post('/notify/asset', authenticate, async (req: Request<{}, {}, { phoneNumber: string; assetData: WhatsAppAssetData }>, res: Response) => {
  try {
    const { phoneNumber, assetData } = req.body;

    if (!phoneNumber || !assetData) {
      return res.status(400).json({
        error: 'Phone number and asset data are required'
      });
    }

    const result = await whatsappService.sendAssetNotification(
      phoneNumber,
      assetData
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Asset notification sent successfully',
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send asset notification',
      });
    }
  } catch (error: any) {
    console.error('Error sending asset notification:', error);
    res.status(500).json({
      error: 'Failed to send asset notification',
      details: error.message
    });
  }
});

/**
 * Meta WhatsApp Webhook Verification (GET)
 * Meta calls this endpoint to verify your webhook
 * GET /api/whatsapp/webhook
 */
router.get('/webhook', (req: Request, res: Response) => {
  try {
    console.log('Raw query:', req.query);
    console.log('Full URL:', req.url);

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook verification request:', { mode, token: token ? '***' : undefined });

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (!verifyToken) {
      console.error('❌ WHATSAPP_VERIFY_TOKEN not configured');
      return res.sendStatus(500);
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed - invalid token');
      return res.sendStatus(403);
    }
  } catch (error: any) {
    console.error('Error in webhook verification:', error);
    res.sendStatus(500);
  }
});

/**
 * Meta WhatsApp Webhook Handler (POST)
 * Receives incoming WhatsApp messages from Meta
 * POST /api/whatsapp/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
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
            for (const message of value.messages) {
              console.log(`📱 Message from: ${message.from}, type: ${message.type}`);
              await processIncomingWhatsAppMessage(message, value);
            }
          } else {
            console.log('ℹ️  No messages to process (might be status update)');
          }

          // Mark messages as read (optional)
          if (value.messages && value.messages.length > 0) {
            const messageId = value.messages[0].id;
            // You can mark as read here if needed
            console.log(`✅ Processed message: ${messageId}`);
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

/**
 * Store conversation state for users
 */
const conversationState = new Map<string, {
  step: string;
  data: any;
  lastActivity: Date;
}>();

/**
 * Store processed message IDs to prevent duplicate processing
 * Meta may send the same webhook multiple times
 */
const processedMessageIds = new Set<string>();

/**
 * Clean up old conversation states (older than 30 minutes)
 * and old processed message IDs (older than 1 hour)
 */
setInterval(() => {
  const now = new Date();
  for (const [phone, state] of conversationState.entries()) {
    const minutes = (now.getTime() - state.lastActivity.getTime()) / 1000 / 60;
    if (minutes > 30) {
      conversationState.delete(phone);
    }
  }

  // Clear processed message IDs after 1 hour (Meta's retry window)
  if (processedMessageIds.size > 100) {
    console.log(`🧹 Clearing ${processedMessageIds.size} processed message IDs`);
    processedMessageIds.clear();
  }
}, 5 * 60 * 1000); // Check every 5 minutes

/**
 * Process incoming WhatsApp message with interactive menu
 */
export async function processIncomingWhatsAppMessage(message: any, value: any) {
  try {
    const from = message.from; // Sender's phone number
    const messageId = message.id; // Unique message ID from Meta
    const messageType = message.type;

    console.log(`\n📱 Processing message from: ${from}`);
    console.log(`Message ID: ${messageId}`);
    console.log(`Message type: ${messageType}`);

    // Check if we've already processed this message
    if (processedMessageIds.has(messageId)) {
      console.log(`⚠️  Duplicate message detected (ID: ${messageId}), skipping...`);
      return; // Skip duplicate processing
    }

    // Mark message as processed
    processedMessageIds.add(messageId);
    console.log(`✅ Message ID ${messageId} marked as processed`);

    // Only process text messages for now
    if (messageType !== 'text') {
      console.log(`⚠️ Ignoring non-text message type: ${messageType}`);
      await whatsappService.sendTextMessage({
        to: from,
        message: 'Sorry, I can only process text messages at this time. Please send your request as text.',
      });
      return;
    }

    const messageText = message.text?.body || '';
    console.log(`Message content: "${messageText}"`);

    // Extract WhatsApp profile name from contacts
    const whatsappName = value.contacts?.[0]?.profile?.name || null;
    console.log(`📱 WhatsApp profile name: ${whatsappName}`);

    // Find or create user
    let user = await findOrCreateUser(from, whatsappName);
    console.log(`✅ User: ${user.email} (${user.name})`);

    // Get or initialize conversation state
    let state = conversationState.get(from);

    // Check if user wants to start over
    const normalizedMessage = messageText.toLowerCase().trim();
    if (['menu', 'start', 'restart', 'help'].includes(normalizedMessage)) {
      conversationState.delete(from);
      state = undefined;
    }

    // Handle conversation flow
    if (!state) {
      // New conversation - show main menu
      await sendMainMenu(from, user.name);
      conversationState.set(from, {
        step: 'main_menu',
        data: {},
        lastActivity: new Date()
      });
    } else {
      // Continue existing conversation
      await handleConversationStep(from, messageText, state, user);
    }

  } catch (error: any) {
    console.error('❌ Error processing message:', error);

    // Try to send error message to user
    try {
      const from = message.from;
      await whatsappService.sendTextMessage({
        to: from,
        message: '❌ Sorry, we encountered an error processing your request. Please type *MENU* to start over or contact our support team.',
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

/**
 * Find existing user or create a new one automatically
 */
async function findOrCreateUser(phoneNumber: string, whatsappProfileName?: string | null) {
  // Clean phone number
  const cleanPhone = phoneNumber.replace(/[\s+()-]/g, '');

  // Try to find existing user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: phoneNumber },
        { phone: cleanPhone },
        { phone: { contains: cleanPhone.slice(-10) } }
      ]
    },
  });

  if (!user) {
    console.log(`📝 Creating new WhatsApp user for phone: ${phoneNumber}`);

    // Extract first name from WhatsApp profile name
    let firstName = 'User';
    if (whatsappProfileName) {
      // Get the first word/name from the profile name
      firstName = whatsappProfileName.split(' ')[0];
    }

    // Create new user automatically - marked as WhatsApp user
    const timestamp = Date.now();
    user = await prisma.user.create({
      data: {
        email: `whatsapp_${timestamp}@temp.local`,
        password: Math.random().toString(36).substring(7), // Random password
        name: whatsappProfileName || `WhatsApp User ${cleanPhone.slice(-4)}`,
        phone: phoneNumber,
        role: 'USER',
        isWhatsAppUser: true, // Mark as WhatsApp user
        whatsAppNotifications: true, // Enable WhatsApp notifications by default
      },
    });

    console.log(`✅ Created new WhatsApp user: ${user.email} (${user.name})`);
  } else if (whatsappProfileName && user.isWhatsAppUser) {
    // Update existing WhatsApp user's name if we have a profile name
    // and it's different from what we have stored
    if (user.name !== whatsappProfileName) {
      console.log(`📝 Updating WhatsApp user name from "${user.name}" to "${whatsappProfileName}"`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: whatsappProfileName },
      });
      console.log(`✅ Updated user name to: ${user.name}`);
    }
  }

  return user;
}

/**
 * Send main menu to user
 */
async function sendMainMenu(phoneNumber: string, userName: string) {
  // Extract first name only (first word before space)
  const firstName = userName ? userName.split(' ')[0] : 'User';

  const menu = `👋 *Welcome ${firstName}!*

How can I help you today?

*Please reply with a number:*

1️⃣ Create a Support Ticket
2️⃣ Check My Tickets Status
3️⃣ General Enquiry
4️⃣ Report an Issue
5️⃣ Contact Support Team
6️⃣ Chat with AI Assistant

Type the number of your choice (1-6)`;

  await whatsappService.sendTextMessage({
    to: phoneNumber,
    message: menu,
  });
}

/**
 * Handle conversation steps based on user response
 */
async function handleConversationStep(
  phoneNumber: string,
  message: string,
  state: any,
  user: any
) {
  const choice = message.trim();

  // Update last activity
  state.lastActivity = new Date();

  if (state.step === 'main_menu') {
    switch (choice) {
      case '1':
        // Create ticket flow
        conversationState.set(phoneNumber, {
          step: 'ticket_description',
          data: {},
          lastActivity: new Date()
        });
        await whatsappService.sendTextMessage({
          to: phoneNumber,
          message: `📝 *Create Support Ticket*

Please describe your issue or request in detail.

You can include:
• What's the problem?
• When did it start?
• Any error messages?
• Your AnyDesk ID (for remote support)

_Example: "My computer won't start. AnyDesk ID: 987-654-321"_

Type your message below:`
        });
        break;

      case '2':
        // Check ticket status
        await handleCheckTickets(phoneNumber, user);
        conversationState.delete(phoneNumber);
        break;

      case '3':
        // General enquiry
        conversationState.set(phoneNumber, {
          step: 'enquiry',
          data: {},
          lastActivity: new Date()
        });
        await whatsappService.sendTextMessage({
          to: phoneNumber,
          message: `💬 *General Enquiry*

Please type your question or enquiry below, and our team will get back to you shortly:`
        });
        break;

      case '4':
        // Report issue
        conversationState.set(phoneNumber, {
          step: 'report_issue',
          data: {},
          lastActivity: new Date()
        });
        await whatsappService.sendTextMessage({
          to: phoneNumber,
          message: `⚠️ *Report an Issue*

Please describe the issue you're experiencing:

Include details like:
• What happened?
• What were you trying to do?
• Is it urgent?

Type your response below:`
        });
        break;

      case '5':
        // Contact support
        await whatsappService.sendTextMessage({
          to: phoneNumber,
          message: `📞 *Contact Support Team*

📧 Email: ${process.env.SUPPORT_EMAIL || 'support@example.com'}
📱 Phone: ${process.env.SUPPORT_PHONE || '+27123456789'}
🌐 Web: ${process.env.CLIENT_URL || 'https://yourdomain.com'}

Our support hours:
⏰ Monday - Friday: 8:00 AM - 5:00 PM
⏰ Saturday: 9:00 AM - 1:00 PM

Type *MENU* to return to main menu.`
        });
        conversationState.delete(phoneNumber);
        break;

      case '6':
        // AI Chat
        conversationState.set(phoneNumber, {
          step: 'ai_chat',
          data: { history: [] },
          lastActivity: new Date()
        });
        await whatsappService.sendTextMessage({
          to: phoneNumber,
          message: `🤖 *AI Assistant*

Hello! I'm your AI assistant. I can help you with:

• Asset management questions
• Ticket creation and tracking
• Account settings and security
• Navigation and features
• Troubleshooting
• Reports and exports

What would you like to know? Type your question below, or type *MENU* to go back.`
        });
        break;

      default:
        await whatsappService.sendTextMessage({
          to: phoneNumber,
          message: `❌ Invalid choice. Please reply with a number from 1 to 6.

Type *MENU* to see options again.`
        });
    }
  } else if (state.step === 'ticket_description') {
    // Create ticket with description
    try {
      await createTicketFromMessage(phoneNumber, message, user, 'medium');
      conversationState.delete(phoneNumber);
    } catch (error: any) {
      console.error('❌ Error in ticket_description step:', error);
      throw error;
    }
  } else if (state.step === 'enquiry') {
    // Create enquiry ticket
    try {
      await createTicketFromMessage(phoneNumber, message, user, 'low');
      conversationState.delete(phoneNumber);
    } catch (error: any) {
      console.error('❌ Error in enquiry step:', error);
      throw error;
    }
  } else if (state.step === 'report_issue') {
    // Create high priority ticket for issue
    try {
      await createTicketFromMessage(phoneNumber, message, user, 'high');
      conversationState.delete(phoneNumber);
    } catch (error: any) {
      console.error('❌ Error in report_issue step:', error);
      throw error;
    }
  } else if (state.step === 'ai_chat') {
    // Handle AI chat conversation
    try {
      // Import the AI response function
      const { generateAIResponse } = await import('../routes/aiChat');

      // Get conversation history
      const history = state.data.history || [];

      // Generate AI response
      const aiResponse = await generateAIResponse(message, history, user);

      // Add to conversation history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: aiResponse });

      // Keep only last 10 messages to avoid memory issues
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Update state
      state.data.history = history;
      state.lastActivity = new Date();
      conversationState.set(phoneNumber, state);

      // Send AI response
      await whatsappService.sendTextMessage({
        to: phoneNumber,
        message: `🤖 ${aiResponse}

---
*Type your next question or type MENU to return to main menu*`
      });
    } catch (error: any) {
      console.error('❌ Error in AI chat step:', error);
      await whatsappService.sendTextMessage({
        to: phoneNumber,
        message: `❌ Sorry, I'm having trouble processing your request right now. Please try again later or type *MENU* to return to the main menu.`
      });
    }
  }
}

/**
 * Create a ticket from user message
 */
async function createTicketFromMessage(
  phoneNumber: string,
  message: string,
  user: any,
  priority: string
) {
  try {
    // Parse message to extract ticket information
    const ticketData = parseTicketMessage(message);

    // Generate unique ticket number
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, '0')}`;

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        number: ticketNumber,
        title: ticketData.title,
        description: ticketData.description,
        priority: priority,
        status: 'open',
        createdById: user.id,
      },
    });

    console.log(`✅ Created ticket: ${ticket.number}`);

    // Create notifications for admins and technicians
    const adminsAndTechs = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'TECHNICIAN'],
        },
      },
    });

    console.log(`Found ${adminsAndTechs.length} admins/techs to notify`);

    for (const adminOrTech of adminsAndTechs) {
      try {
        await prisma.notification.create({
          data: {
            userId: adminOrTech.id,
            type: 'ticket_status',
            title: 'New ticket created',
            message: `${user.name || 'WhatsApp User'} created a new ticket: "${ticket.title}"`,
            ticketId: ticket.id,
            senderId: user.id,
          },
        });
        console.log(`✅ Notification created for ${adminOrTech.email}`);
      } catch (err) {
        console.error(`❌ Failed to create notification for ${adminOrTech.email}:`, err);
      }
    }

    console.log(`✅ Created ${adminsAndTechs.length} notifications`);

    // Send confirmation to user
    await whatsappService.sendTextMessage({
      to: phoneNumber,
      message: `✅ *Ticket Created Successfully!*

📋 Ticket #${ticket.number}
📌 Title: ${ticket.title}
⚡ Priority: ${priority.toUpperCase()}
📊 Status: OPEN

We've received your request and our team will get back to you soon!

🔗 Track online: ${process.env.CLIENT_URL || 'https://yourdomain.com'}/tickets

Type *MENU* to return to main menu.
Thank you! 🙏`,
    });

  } catch (error: any) {
    console.error('❌ Error creating ticket:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Check user's tickets
 */
async function handleCheckTickets(phoneNumber: string, user: any) {
  const tickets = await prisma.ticket.findMany({
    where: {
      createdById: user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  if (tickets.length === 0) {
    await whatsappService.sendTextMessage({
      to: phoneNumber,
      message: `📋 *Your Tickets*

You don't have any tickets yet.

Type *MENU* to create a new ticket or get help.`
    });
    return;
  }

  let ticketList = `📋 *Your Recent Tickets*\n\n`;

  for (const ticket of tickets) {
    const statusEmoji = ticket.status === 'open' ? '🟢' :
                       ticket.status === 'in_progress' ? '🟡' :
                       ticket.status === 'resolved' ? '✅' : '🔴';

    ticketList += `${statusEmoji} *${ticket.number}*\n`;
    ticketList += `   ${ticket.title}\n`;
    ticketList += `   Status: ${ticket.status.toUpperCase()}\n`;
    ticketList += `   Priority: ${ticket.priority.toUpperCase()}\n\n`;
  }

  ticketList += `\n🔗 View all tickets: ${process.env.CLIENT_URL || 'https://yourdomain.com'}/tickets\n\n`;
  ticketList += `Type *MENU* to return to main menu.`;

  await whatsappService.sendTextMessage({
    to: phoneNumber,
    message: ticketList,
  });
}

/**
 * Parse incoming message to extract ticket information
 */
function parseTicketMessage(message: string): {
  title: string;
  description: string;
  priority: string;
} {
  const lines = message.trim().split('\n');
  let title = '';
  let description = '';
  let priority = 'medium';

  // Check for structured format
  const titleMatch = message.match(/title:\s*(.+)/i);
  const descMatch = message.match(/description:\s*(.+)/i);
  const priorityMatch = message.match(/priority:\s*(low|medium|high|critical)/i);

  if (titleMatch || descMatch) {
    // Structured format
    title = titleMatch ? titleMatch[1].trim() : 'Support Request';
    description = descMatch ? descMatch[1].trim() : message;
    priority = priorityMatch ? priorityMatch[1].toLowerCase() : 'medium';
  } else {
    // Simple format
    if (lines.length > 1) {
      title = lines[0].substring(0, 100);
      description = lines.slice(1).join('\n').trim() || lines[0];
    } else {
      title = message.substring(0, 50);
      description = message;
    }
  }

  return {
    title: title || 'Support Request via WhatsApp',
    description: description || message,
    priority: priority.toLowerCase(),
  };
}

export default router;
