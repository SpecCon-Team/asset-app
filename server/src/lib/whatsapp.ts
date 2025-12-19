import axios from 'axios';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

interface SendMessageParams {
  to: string; // Phone number in format: 27712919486 (without +)
  message: string;
  templateName?: string;
  templateParams?: string[];
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    };

    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`;
  }

  /**
   * Check if WhatsApp is configured
   */
  isConfigured(): boolean {
    return !!(this.config.phoneNumberId && this.config.accessToken);
  }

  /**
   * Format phone number to WhatsApp format (remove + and spaces)
   */
  private formatPhoneNumber(phone: string): string {
    return phone.replace(/[\s+()-]/g, '');
  }

  /**
   * Send a text message
   */
  async sendTextMessage(params: SendMessageParams): Promise<any> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp is not configured. Skipping message send.');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(params.to);

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: params.message,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('WhatsApp message sent successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code || error.code;
      
      console.error('Failed to send WhatsApp message:', {
        message: errorMessage,
        code: errorCode,
        status: error.response?.status,
        fullError: error.response?.data || error.message
      });
      
      // Provide more helpful error messages
      let userFriendlyError = errorMessage;
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        userFriendlyError = 'Request timeout: WhatsApp API did not respond in time';
      } else if (error.response?.status === 401) {
        userFriendlyError = 'Authentication failed: Invalid access token';
      } else if (error.response?.status === 403) {
        userFriendlyError = 'Permission denied: Check API permissions';
      } else if (error.response?.status === 404) {
        userFriendlyError = 'Phone number ID not found: Verify WHATSAPP_PHONE_NUMBER_ID';
      } else if (error.response?.status === 429) {
        userFriendlyError = 'Rate limit exceeded: Too many requests';
      }
      
      return {
        success: false,
        error: userFriendlyError,
        errorCode: errorCode,
        status: error.response?.status
      };
    }
  }

  /**
   * Send a template message (for approved templates)
   */
  async sendTemplateMessage(params: SendMessageParams): Promise<any> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp is not configured. Skipping message send.');
      return { success: false, error: 'WhatsApp not configured' };
    }

    if (!params.templateName) {
      throw new Error('Template name is required for template messages');
    }

    try {
      const formattedPhone = this.formatPhoneNumber(params.to);

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: params.templateName,
          language: {
            code: 'en_US',
          },
          components: params.templateParams
            ? [
                {
                  type: 'body',
                  parameters: params.templateParams.map((param) => ({
                    type: 'text',
                    text: param,
                  })),
                },
              ]
            : [],
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('WhatsApp template message sent successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code || error.code;
      
      console.error('Failed to send WhatsApp template message:', {
        message: errorMessage,
        code: errorCode,
        status: error.response?.status,
        fullError: error.response?.data || error.message
      });
      
      // Provide more helpful error messages
      let userFriendlyError = errorMessage;
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        userFriendlyError = 'Request timeout: WhatsApp API did not respond in time';
      } else if (error.response?.status === 401) {
        userFriendlyError = 'Authentication failed: Invalid access token';
      } else if (error.response?.status === 403) {
        userFriendlyError = 'Permission denied: Check API permissions';
      } else if (error.response?.status === 404) {
        userFriendlyError = 'Phone number ID not found: Verify WHATSAPP_PHONE_NUMBER_ID';
      } else if (error.response?.status === 429) {
        userFriendlyError = 'Rate limit exceeded: Too many requests';
      }
      
      return {
        success: false,
        error: userFriendlyError,
        errorCode: errorCode,
        status: error.response?.status
      };
    }
  }

  /**
   * Send ticket notification
   */
  async sendTicketNotification(phoneNumber: string, ticketData: {
    ticketNumber: string;
    title: string;
    priority: string;
    assignedTo?: string;
  }): Promise<any> {
    const message = `
🎫 *New Ticket Assigned*

Ticket #${ticketData.ticketNumber}
Title: ${ticketData.title}
Priority: ${ticketData.priority.toUpperCase()}
${ticketData.assignedTo ? `Assigned to: ${ticketData.assignedTo}` : ''}

Please check your dashboard for more details.
    `.trim();

    return this.sendTextMessage({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Send asset assignment notification
   */
  async sendAssetNotification(phoneNumber: string, assetData: {
    assetCode: string;
    assetName: string;
    assignedTo: string;
  }): Promise<any> {
    const message = `
📦 *Asset Assigned*

Asset Code: ${assetData.assetCode}
Asset Name: ${assetData.assetName}
Assigned to: ${assetData.assignedTo}

Please check your dashboard for more details.
    `.trim();

    return this.sendTextMessage({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Send password reset notification
   */
  async sendPasswordResetNotification(phoneNumber: string, userName: string): Promise<any> {
    const message = `
🔐 *Password Reset Request*

Hi ${userName},

A password reset was requested for your account. If this was you, please check your email for the reset link.

If you didn't request this, please ignore this message.
    `.trim();

    return this.sendTextMessage({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Test WhatsApp connection by sending a test message
   */
  async testConnection(phoneNumber: string): Promise<any> {
    const message = `
✅ *WhatsApp Connection Test*

This is a test message from your Asset Management System.

If you receive this message, your WhatsApp Business API is configured correctly!
    `.trim();

    return this.sendTextMessage({
      to: phoneNumber,
      message,
    });
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
