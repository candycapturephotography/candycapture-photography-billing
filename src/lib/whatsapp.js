/**
 * WhatsApp Business API Client
 * Sends messages via Cloudflare Worker backend
 */

const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'https://candycapture-whatsapp-api.your-subdomain.workers.dev';

/**
 * Send invoice via WhatsApp
 * @param {Object} invoice - Invoice data
 * @param {Object} studio - Studio settings
 * @param {string} type - Message type: 'invoice' | 'reminder' | 'confirmation'
 */
export async function sendInvoiceWhatsApp(invoice, studio, type = 'invoice') {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/api/send-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice, studio, type }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to WhatsApp service',
    };
  }
}

/**
 * Send custom message via WhatsApp
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 */
export async function sendWhatsAppMessage(phone, message) {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, message }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to WhatsApp service',
    };
  }
}

/**
 * Check if WhatsApp API is configured
 */
export function isWhatsAppConfigured() {
  return !!import.meta.env.VITE_WHATSAPP_API_URL;
}

export default {
  sendInvoiceWhatsApp,
  sendWhatsAppMessage,
  isWhatsAppConfigured,
};
