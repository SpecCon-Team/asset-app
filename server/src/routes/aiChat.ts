import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /ai-chat
 * AI Chat endpoint that provides intelligent responses
 */
router.post('/', authenticate, async (req: Request, res) => {
  const schema = z.object({
    message: z.string().min(1).max(2000),
    history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().nonempty().nonempty()
    })).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  try {
    const { message, history = [] } = parsed.data;
    const user = req.user!;

    // AI Response Logic
    const reply = await generateAIResponse(message, history as Array<{ role: 'user' | 'assistant'; content: string }>, user);

    res.json({ reply });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ message: 'Failed to process chat request' });
  }
});

/**
 * Generate intelligent AI responses based on user input
 */
async function generateAIResponse(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content?: string }>,
  user: any
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Greeting patterns
  if (/(^|\s)(hi|hello|hey|good morning|good afternoon|good evening)($|\s|!|\?)/i.test(lowerMessage)) {
    const greetings = [
      `Hello ${user.name || 'there'}! How can I help you today?`,
      `Hi ${user.name || 'there'}! I'm here to assist you with anything you need.`,
      `Hey ${user.name || 'there'}! What can I do for you today?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Asset-related queries
  if (/asset|equipment|inventory|device|hardware/i.test(lowerMessage)) {
    if (/create|add|new|register/i.test(lowerMessage)) {
      return `To create a new asset:\n\n1. Go to "All Assets" in the sidebar\n2. Click the "Add Asset" button\n3. Fill in the asset details (name, category, serial number, etc.)\n4. Click "Submit"\n\nYou can also assign the asset to a user immediately or leave it unassigned.`;
    }
    if (/view|see|check|find|search/i.test(lowerMessage)) {
      return `To view your assets:\n\n• **My Assets**: View assets assigned to you\n• **All Assets** (Admin): View all assets in the system\n\nYou can search, filter, and export asset data. Click on any asset to see detailed information including maintenance history and associated tickets.`;
    }
    if (/assign|transfer|move/i.test(lowerMessage)) {
      return `To assign or transfer an asset:\n\n1. Go to the asset details page\n2. Click "Edit Asset"\n3. Select the new assignee from the dropdown\n4. Click "Save"\n\nThe user will receive a notification about the asset assignment.`;
    }
    return `I can help you with assets! You can:\n\n• Create and manage assets\n• Assign assets to users\n• Track asset maintenance\n• Generate QR codes for assets\n• Export asset data\n\nWhat would you like to know more about?`;
  }

  // Ticket-related queries
  if (/ticket|issue|problem|support|help request|maintenance/i.test(lowerMessage)) {
    if (/create|new|submit|report/i.test(lowerMessage)) {
      return `To create a new ticket:\n\n1. Click "My Tickets" in the sidebar\n2. Click the "New Ticket" button\n3. Fill in the ticket details:\n   • Title\n   • Description\n   • Priority (Low, Medium, High, Critical)\n   • Category\n   • Related asset (optional)\n4. Click "Submit"\n\nYou'll receive updates via notifications and WhatsApp (if enabled) when the ticket status changes.`;
    }
    if (/status|track|check|view/i.test(lowerMessage)) {
      return `To check ticket status:\n\n• **My Tickets**: View all your submitted tickets\n• **My Tasks** (Technician): View tickets assigned to you\n• **All Tickets** (Admin): View all tickets in the system\n\nTicket statuses:\n• OPEN: Newly created\n• IN_PROGRESS: Being worked on\n• RESOLVED: Issue fixed\n• CLOSED: Completed`;
    }
    if (/priority|urgent|critical/i.test(lowerMessage)) {
      return `Ticket priorities:\n\n• **Critical**: System down, affects many users\n• **High**: Significant impact, needs quick attention\n• **Medium**: Moderate impact, normal timeline\n• **Low**: Minor issue, can wait\n\nCritical and high priority tickets are automatically escalated to administrators.`;
    }
    return `I can help you with tickets! You can:\n\n• Create and track support tickets\n• View ticket status and history\n• Add comments and attachments\n• Get real-time notifications\n• Filter by priority and status\n\nWhat would you like to know?`;
  }

  // Theme and appearance queries (check before user management)
  if (/theme|dark mode|light mode|appearance|color scheme/i.test(lowerMessage)) {
    return `To change your theme:\n\n1. Click on your profile icon (top right)\n2. Look for the theme toggle (moon/sun icon)\n3. Click to switch between light and dark mode\n\nThe theme preference is saved automatically and will be applied across all your sessions.\n\n**Tip**: Dark mode is great for reducing eye strain in low-light environments!`;
  }

  // Profile picture queries (check before general user management)
  if (/profile picture|profile photo|avatar|change picture|update picture/i.test(lowerMessage)) {
    return `To change your profile picture:\n\n1. Click on your profile icon (top right)\n2. Select "Settings" or "Profile"\n3. Click on your current profile picture\n4. Upload a new image\n5. Click "Save Changes"\n\n**Note**: Supported formats are JPG, PNG, and GIF. Maximum file size is 5MB.`;
  }

  // User management queries
  if (/user|account|profile|password|2fa|two factor/i.test(lowerMessage)) {
    if (/password|reset|forgot/i.test(lowerMessage) && !/profile picture|theme/i.test(lowerMessage)) {
      return `To reset your password:\n\n1. Click on your profile icon (top right)\n2. Select "Settings"\n3. Go to "Security" tab\n4. Click "Change Password"\n5. Enter your current and new password\n\nForgot your password? Use the "Forgot Password" link on the login page to reset via email.`;
    }
    if (/2fa|two factor|authentication|security/i.test(lowerMessage)) {
      return `Two-Factor Authentication (2FA) adds extra security:\n\n1. Go to Settings → Security\n2. Enable "Two-Factor Authentication"\n3. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)\n4. Save your backup codes in a safe place!\n\n**Important**: Keep your backup codes safe. If you lose your phone, you'll need them to log in.`;
    }
    if (/profile|edit|update|information/i.test(lowerMessage) && !/profile picture|theme/i.test(lowerMessage)) {
      return `To update your profile:\n\n1. Click your profile icon (top right)\n2. Select "Settings"\n3. Edit your information:\n   • Name\n   • Email\n   • Phone number\n   • Profile picture\n4. Click "Save Changes"\n\nYour changes will be reflected immediately across the system.`;
    }
    return `I can help with user account matters:\n\n• Update profile information\n• Change password\n• Enable/disable 2FA\n• Manage notification preferences\n• View privacy settings\n\nWhat would you like to do?`;
  }

  // Notification queries
  if (/notification|alert|email|whatsapp|message/i.test(lowerMessage)) {
    return `Notifications keep you updated:\n\n• **Bell Icon**: View recent notifications\n• **Email**: Get updates via email\n• **WhatsApp**: Receive notifications on WhatsApp (if enabled)\n\nYou receive notifications for:\n• New ticket assignments\n• Ticket status changes\n• Asset assignments\n• System updates\n\nManage preferences in Settings → Notifications`;
  }

  // Dashboard queries
  if (/dashboard|overview|stats|statistics|metrics/i.test(lowerMessage)) {
    return `Your dashboard shows:\n\n• **Assets**: Total assets and your assignments\n• **Tickets**: Open, in progress, and resolved tickets\n• **Tasks**: Your pending assignments\n• **Activity**: Recent system activity\n\nRole-specific dashboards:\n• **Admin**: Full system overview and analytics\n• **Technician**: Assigned tasks and workload\n• **User**: Your assets and tickets`;
  }

  // Search and navigation (only if not covered by more specific patterns)
  if ((/search|find|navigate|where/i.test(lowerMessage) || (/how to/i.test(lowerMessage) && !/theme|profile picture|password|ticket|asset|2fa/i.test(lowerMessage)))) {
    return `Navigation tips:\n\n• **Global Search** (Ctrl+K): Search across assets, tickets, and users\n• **Sidebar**: Quick access to all features\n• **Breadcrumbs**: Track your location\n• **Keyboard Shortcuts** (?): Speed up your workflow\n\nPopular shortcuts:\n• Ctrl+K: Global search\n• ?: Show all shortcuts\n• N: Create new (context-aware)`;
  }

  // Export and reports
  if (/export|download|report|csv|excel/i.test(lowerMessage)) {
    return `Export data for reports:\n\n• **Assets**: Export asset list with all details\n• **Tickets**: Export ticket data and history\n• **CSV Format**: Open in Excel or Google Sheets\n\nTo export:\n1. Go to the list page (Assets or Tickets)\n2. Click the "Export" button\n3. Choose CSV format\n4. File downloads automatically`;
  }

  // Mobile app queries
  if (/mobile|app|android|ios|phone/i.test(lowerMessage)) {
    return `Mobile app features:\n\n• Access on the go\n• Scan QR codes for quick asset access\n• Receive push notifications\n• Create and update tickets\n• View asset information\n\nDownload from the "Mobile App" section in the sidebar. The app works on both Android and iOS devices.`;
  }

  // QR code queries
  if (/qr|qr code|scan|barcode/i.test(lowerMessage)) {
    return `QR Codes for quick asset access:\n\n• Each asset has a unique QR code\n• Print and attach to physical assets\n• Scan with mobile app for instant info\n• View maintenance history\n• Create tickets directly\n\nGenerate QR codes from the asset details page.`;
  }

  // Troubleshooting
  if (/problem|error|not working|broken|bug|issue|help/i.test(lowerMessage)) {
    return `Common troubleshooting steps:\n\n1. **Refresh the page** (Ctrl+R or Cmd+R)\n2. **Clear browser cache**\n3. **Check your internet connection**\n4. **Try a different browser**\n5. **Log out and log back in**\n\nStill having issues?\n• Create a support ticket with details\n• Contact your administrator\n• Check the Help & Resources section\n\nI'm here to help! Can you describe the specific problem?`;
  }

  // Thanks/appreciation
  if (/(thank|thanks|appreciate|helpful)($|\s|!|\.)/i.test(lowerMessage)) {
    const responses = [
      "You're very welcome! Feel free to ask if you need anything else.",
      "Happy to help! Let me know if you have any other questions.",
      "My pleasure! I'm here anytime you need assistance.",
      "Glad I could help! Don't hesitate to reach out again."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Goodbye
  if (/(bye|goodbye|see you|later|exit|quit)($|\s|!|\.)/i.test(lowerMessage)) {
    const farewells = [
      "Goodbye! Have a great day!",
      "See you later! Feel free to come back anytime.",
      "Take care! I'll be here if you need me.",
      "Bye! Don't hesitate to reach out if you need help."
    ];
    return farewells[Math.floor(Math.random() * farewells.length)];
  }

  // Features and capabilities
  if (/what can you do|features|capabilities|help me with/i.test(lowerMessage)) {
    return `I can help you with:\n\n📦 **Assets**\n• Create, view, and manage assets\n• Assign and transfer assets\n• Generate QR codes\n\n🎫 **Tickets**\n• Create and track support tickets\n• Update status and add comments\n• Manage priorities\n\n👤 **Account**\n• Update profile settings\n• Manage security (password, 2FA)\n• Configure notifications\n\n📊 **Analytics**\n• View dashboard metrics\n• Export reports\n• Track activity\n\n❓ **Support**\n• Answer questions\n• Provide guidance\n• Troubleshoot issues\n\nWhat would you like to explore?`;
  }

  // Admin-specific queries
  if (user.role === 'ADMIN' && /admin|manage user|permission|role/i.test(lowerMessage)) {
    return `Admin capabilities:\n\n• **User Management**: Create, edit, and manage users\n• **Role Assignment**: Set user roles (Admin, Technician, User)\n• **System Configuration**: WhatsApp, notifications, settings\n• **Audit Logs**: Track all system activities\n• **2FA Management**: Help locked-out users\n• **Analytics**: Full system overview and reports\n\nAccess these features from the sidebar under "Management" and "Security & Privacy".`;
  }

  // Default response with suggestions
  return `I'm here to help! I can assist with:\n\n• Asset management\n• Ticket creation and tracking\n• Account settings and security\n• Navigation and features\n• Troubleshooting\n• Reports and exports\n\nCould you please provide more details about what you'd like to know? Or try asking:\n• "How do I create a ticket?"\n• "How do I view my assets?"\n• "How do I enable 2FA?"\n• "What can you do?"`;
}

export default router;
