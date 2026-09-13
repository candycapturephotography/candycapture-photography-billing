/**
 * WhatsApp Utility Functions
 * Send invoice details via WhatsApp (similar to myBillBook)
 */

const formatCurrency = (amount) => {
  return '₹' + Number(amount || 0).toLocaleString('en-IN')
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const generateInvoiceMessage = (invoice, studio, pdfUrl = null) => {
  const {
    invoiceNumber,
    customerName,
    eventType,
    eventDate,
    totalAmount,
    paidAmount,
    status,
    snapshot
  } = invoice

  const pendingAmount = Number(totalAmount || 0) - Number(paidAmount || 0)
  const packageName = snapshot?.packageName || invoice.packageName || 'Custom'
  
  const statusLabels = {
    paid: '✅ PAID',
    partial: '⏳ PARTIALLY PAID',
    advance: '📋 ADVANCE PENDING'
  }
  const statusLabel = statusLabels[status] || '📋 PENDING'

  let message = '*🎯 ' + (studio?.name || 'Candy Capture Photography') + '*\n'
  message += '━━━━━━━━━━━━━━━━━━━━\n\n'
  
  message += '📄 *INVOICE DETAILS*\n\n'
  message += '📌 Invoice No: *' + invoiceNumber + '*\n'
  message += '👤 Customer: *' + customerName + '*\n'
  
  if (eventType) {
    message += '🎉 Event: ' + eventType + '\n'
  }
  
  if (eventDate) {
    message += '📅 Event Date: ' + formatDate(eventDate) + '\n'
  }
  
  message += '📦 Package: ' + packageName + '\n\n'
  
  message += '━━━━━━━━━━━━━━━━━━━━\n'
  message += '💰 *PAYMENT SUMMARY*\n\n'
  message += 'Total Amount: *' + formatCurrency(totalAmount) + '*\n'
  message += 'Paid Amount: ' + formatCurrency(paidAmount) + '\n'
  message += 'Balance Due: *' + formatCurrency(pendingAmount) + '*\n\n'
  message += 'Status: ' + statusLabel + '\n'
  message += '━━━━━━━━━━━━━━━━━━━━\n\n'

  if (pendingAmount > 0) {
    message += '⚠️ _Kindly clear the pending amount at the earliest._\n\n'
  }

  if (studio) {
    message += '📞 *Contact Us:*\n'
    if (studio.mobile) message += 'Phone: ' + studio.mobile + '\n'
    if (studio.email) message += 'Email: ' + studio.email + '\n'
    if (studio.instagram) message += 'Instagram: ' + studio.instagram + '\n'
  }

  message += '\n_Thank you for choosing ' + (studio?.name || 'us') + '! 📸_'

  return message
}

export const generateWhatsAppUrl = (phoneNumber, message) => {
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, '')
  
  if (!cleanNumber.startsWith('+')) {
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1)
    }
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber
    }
  } else {
    cleanNumber = cleanNumber.substring(1)
  }

  const encodedMessage = encodeURIComponent(message)
  return 'https://wa.me/' + cleanNumber + '?text=' + encodedMessage
}

export const shareInvoiceViaWhatsApp = (invoice, studio, pdfUrl = null) => {
  const phoneNumber = invoice.customerMobile || invoice.mobile
  
  if (!phoneNumber) {
    alert('Customer mobile number not available')
    return false
  }

  const message = generateInvoiceMessage(invoice, studio, pdfUrl)
  const whatsappUrl = generateWhatsAppUrl(phoneNumber, message)
  
  window.open(whatsappUrl, '_blank')
  return true
}

export const generatePaymentReminderMessage = (invoice, studio) => {
  const pendingAmount = Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)
  
  let message = '*🔔 Payment Reminder*\n\n'
  message += 'Dear *' + invoice.customerName + '*,\n\n'
  message += 'This is a gentle reminder for your pending payment:\n\n'
  message += '📄 Invoice: *' + invoice.invoiceNumber + '*\n'
  message += '💰 Pending Amount: *' + formatCurrency(pendingAmount) + '*\n'
  
  if (invoice.eventDate) {
    message += '📅 Event Date: ' + formatDate(invoice.eventDate) + '\n'
  }
  
  message += '\nKindly clear the pending amount at the earliest.\n\n'
  message += '_' + (studio?.name || 'Candy Capture Photography') + '_\n'
  
  if (studio?.mobile) {
    message += '📞 ' + studio.mobile
  }
  
  return message
}

export const sendPaymentReminder = (invoice, studio) => {
  const phoneNumber = invoice.customerMobile || invoice.mobile
  
  if (!phoneNumber) {
    alert('Customer mobile number not available')
    return false
  }

  const message = generatePaymentReminderMessage(invoice, studio)
  const whatsappUrl = generateWhatsAppUrl(phoneNumber, message)
  
  window.open(whatsappUrl, '_blank')
  return true
}

export default {
  generateInvoiceMessage,
  generateWhatsAppUrl,
  shareInvoiceViaWhatsApp,
  generatePaymentReminderMessage,
  sendPaymentReminder,
}