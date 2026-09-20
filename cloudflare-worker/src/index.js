/**
 * Candy Capture Photography - WhatsApp Business API Worker
 * Securely sends WhatsApp messages via Meta's API
 */

const ALLOWED_ORIGINS = [
  'https://billing.candycapturephotography.in',
  'http://localhost:5173',
  'http://localhost:3000',
];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function handleOptions(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

async function sendTextMessage(env, to, message) {
  const url = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { preview_url: false, body: message },
    }),
  });
  return response.json();
}

function buildInvoiceMessage(invoice, studio) {
  const balance = Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0);
  const eventDate = invoice.eventDate
    ? new Date(invoice.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'To be confirmed';

  const lines = [
    `Hello ${invoice.customerName}! 👋`,
    ``,
    `Thank you for choosing *${studio.name || 'Candy Capture Photography'}*! 📸`,
    `Your booking is confirmed! ✨`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*INVOICE DETAILS*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📄 Invoice: *${invoice.invoiceNumber}*`,
    `🎉 Event: ${invoice.eventType || 'Photography'}`,
    `📅 Date: ${eventDate}`,
    `📍 Venue: ${invoice.location || 'To be confirmed'}`,
    `📦 Package: ${invoice.packageName || 'Custom Package'}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*PAYMENT SUMMARY*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `💰 Total Amount: *${formatCurrency(invoice.totalAmount)}*`,
    `✅ Advance Paid: ${formatCurrency(invoice.paidAmount || 0)}`,
    `📌 Balance Due: *${formatCurrency(balance)}*`,
    ``,
  ];

  if (balance <= 0) {
    lines.push(`✨ *FULLY PAID - Thank you!* ✨`);
  } else {
    lines.push(`💳 Please pay the balance before the event date.`);
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Looking forward to capturing your special moments! 💕`,
    ``,
    `Best Regards,`,
    `*${studio.signature || studio.name || 'Candy Capture Photography'}*`,
  );

  if (studio.mobile) lines.push(`📞 ${studio.mobile}`);
  if (studio.instagram) lines.push(`📱 ${studio.instagram}`);
  if (studio.website) lines.push(`🌐 ${studio.website}`);

  return lines.join('\n');
}

function buildPaymentReminderMessage(invoice, studio) {
  const balance = Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0);
  const eventDate = invoice.eventDate
    ? new Date(invoice.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'your event';

  return [
    `Hello ${invoice.customerName}! 👋`,
    ``,
    `This is a friendly reminder about your pending payment for *${studio.name || 'Candy Capture Photography'}*.`,
    ``,
    `📄 Invoice: *${invoice.invoiceNumber}*`,
    `🎉 Event: ${invoice.eventType || 'Photography'} on ${eventDate}`,
    ``,
    `💰 Total: ${formatCurrency(invoice.totalAmount)}`,
    `✅ Paid: ${formatCurrency(invoice.paidAmount || 0)}`,
    `📌 *Balance Due: ${formatCurrency(balance)}*`,
    ``,
    `Please complete the payment at your earliest convenience.`,
    ``,
    `Thank you! 🙏`,
    `*${studio.signature || studio.name}*`,
    studio.mobile ? `📞 ${studio.mobile}` : '',
  ].filter(l => l).join('\n');
}

function buildBookingConfirmationMessage(invoice, studio) {
  const eventDate = invoice.eventDate
    ? new Date(invoice.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : 'To be confirmed';

  return [
    `🎉 *BOOKING CONFIRMED!* 🎉`,
    ``,
    `Hello ${invoice.customerName}!`,
    ``,
    `We're thrilled to confirm your booking with *${studio.name || 'Candy Capture Photography'}*! 📸`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*EVENT DETAILS*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎊 Event: ${invoice.eventType || 'Photography'}`,
    `📅 Date: *${eventDate}*`,
    `📍 Venue: ${invoice.location || 'To be confirmed'}`,
    `📦 Package: ${invoice.packageName || 'Custom Package'}`,
    ``,
    `We can't wait to capture your beautiful moments! 💕`,
    ``,
    `If you have any questions, feel free to reach out.`,
    ``,
    `Best Regards,`,
    `*${studio.signature || studio.name}*`,
    studio.mobile ? `📞 ${studio.mobile}` : '',
  ].filter(l => l).join('\n');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'Candy Capture WhatsApp API',
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (url.pathname === '/api/send-invoice' && request.method === 'POST') {
      try {
        const { invoice, studio, type = 'invoice' } = await request.json();
        
        if (!invoice || !invoice.customerMobile) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing invoice or customer mobile number' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          });
        }

        let phone = (invoice.customerMobile || '').replace(/\D/g, '');
        if (!phone.startsWith('91')) {
          phone = '91' + phone;
        }

        let message;
        switch (type) {
          case 'reminder':
            message = buildPaymentReminderMessage(invoice, studio || {});
            break;
          case 'confirmation':
            message = buildBookingConfirmationMessage(invoice, studio || {});
            break;
          case 'invoice':
          default:
            message = buildInvoiceMessage(invoice, studio || {});
            break;
        }

        const result = await sendTextMessage(env, phone, message);

        if (result.error) {
          console.error('WhatsApp API Error:', result.error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: result.error.message || 'Failed to send message',
            details: result.error
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          messageId: result.messages?.[0]?.id,
          message: 'Invoice sent successfully via WhatsApp!'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });

      } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message || 'Internal server error' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }
    }

    if (url.pathname === '/api/send-message' && request.method === 'POST') {
      try {
        const { phone, message } = await request.json();
        
        if (!phone || !message) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing phone number or message' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          });
        }

        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('91')) {
          formattedPhone = '91' + formattedPhone;
        }

        const result = await sendTextMessage(env, formattedPhone, message);

        if (result.error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: result.error.message || 'Failed to send message' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          messageId: result.messages?.[0]?.id 
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });

      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
