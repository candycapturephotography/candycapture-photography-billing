import { jsPDF } from 'jspdf'

/**
 * Elegant Invoice PDF Generator
 * Theme: Light pink and white with subtle, sophisticated design
 */

const fmt = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN')

// Elegant color palette - Light pink & white
const PINK_ACCENT   = [219, 112, 147]   // Soft rose pink for accents
const PINK_LIGHT    = [255, 240, 245]   // Lavender blush - very light pink
const PINK_MEDIUM   = [255, 228, 235]   // Misty rose
const PINK_SOFT     = [252, 243, 246]   // Almost white pink
const WHITE         = [255, 255, 255]
const TEXT_DARK     = [60, 60, 70]      // Soft dark for main text
const TEXT_MEDIUM   = [120, 120, 130]   // Medium gray for secondary text
const TEXT_LIGHT    = [160, 160, 170]   // Light gray
const GREEN_SOFT    = [76, 175, 130]    // Soft green for payments

const STATUS_COLORS = {
  paid:    [76, 175, 130],    // Soft green
  partial: [230, 170, 90],    // Soft amber
  advance: [219, 112, 147],   // Rose pink
}

const STATUS_LABELS = {
  paid:    'FULLY PAID',
  partial: 'PARTIAL',
  advance: 'ADVANCE',
}

export async function generatePDF(inv, studio) {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    const H = 297
    const M = 20   // margins

    // Main white background
    doc.setFillColor(...WHITE)
    doc.rect(0, 0, W, H, 'F')
    
    // Top decorative band - very subtle pink
    doc.setFillColor(...PINK_LIGHT)
    doc.rect(0, 0, W, 55, 'F')
    
    // Elegant curved accent line
    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.8)
    doc.line(0, 55, W, 55)
    
    // Subtle corner decoration - top right
    doc.setFillColor(...PINK_MEDIUM)
    doc.circle(W + 20, -20, 60, 'F')
    
    let y = 18
    
    // Logo (if available)
    if (studio.logo) {
      try {
        doc.addImage(studio.logo, 'PNG', M, 12, 24, 24)
      } catch {}
    }
    
    const logoOffset = studio.logo ? 30 : 0
    
    // Studio name - elegant typography
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...TEXT_DARK)
    doc.text(studio.name || 'Candy Capture Photography', M + logoOffset, y)
    
    // Tagline/subtitle line
    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.5)
    doc.line(M + logoOffset, y + 3, M + logoOffset + 45, y + 3)
    
    // Studio contact info - refined styling
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MEDIUM)
    y += 10
    const contactInfo = [
      studio.address || '',
      studio.mobile ? 'Phone: ' + studio.mobile : '',
      studio.email ? 'Email: ' + studio.email : '',
      studio.instagram ? 'Instagram: ' + studio.instagram : '',
    ].filter(Boolean)
    contactInfo.forEach((line, i) => {
      doc.text(line, M + logoOffset, y + (i * 4.5))
    })
    
    // INVOICE title - right aligned, elegant
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('INVOICE', W - M, 22, { align: 'right' })
    
    // Invoice number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text(inv.invoiceNumber || '', W - M, 30, { align: 'right' })
    
    // Status badge - elegant rounded style
    const status = inv.status || 'advance'
    const statusColor = STATUS_COLORS[status] || STATUS_COLORS.advance
    const statusLabel = STATUS_LABELS[status] || 'ADVANCE'
    
    doc.setFillColor(...statusColor)
    doc.roundedRect(W - M - 32, 35, 32, 8, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text(statusLabel, W - M - 16, 40.5, { align: 'center' })
    
    // BILL TO & EVENT DETAILS
    y = 65
    
    // Bill To card
    doc.setFillColor(...WHITE)
    doc.setDrawColor(...PINK_MEDIUM)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, 82, 38, 4, 4, 'FD')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('BILL TO', M + 6, y + 8)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...TEXT_DARK)
    doc.text(inv.customerName || 'Customer', M + 6, y + 17)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text(inv.customerMobile || '', M + 6, y + 24)
    if (inv.customerEmail) {
      doc.text(inv.customerEmail, M + 6, y + 30)
    }
    
    // Event Details card
    doc.setFillColor(...WHITE)
    doc.roundedRect(M + 88, y, 82, 38, 4, 4, 'FD')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('EVENT DETAILS', M + 94, y + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_DARK)
    let ey = y + 16
    
    if (inv.eventType) {
      doc.setFont('helvetica', 'bold')
      doc.text(inv.eventType, M + 94, ey)
      ey += 7
    }
    
    if (inv.eventDate) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT_MEDIUM)
      const eventDateStr = new Date(inv.eventDate).toLocaleDateString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      })
      doc.text(eventDateStr, M + 94, ey)
      ey += 6
    }
    
    if (inv.location) {
      doc.text(inv.location, M + 94, ey)
    }
    
    // SERVICES TABLE
    y = 112
    
    // Table header
    doc.setFillColor(...PINK_LIGHT)
    doc.rect(M, y, W - M * 2, 10, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_DARK)
    doc.text('DESCRIPTION', M + 6, y + 7)
    doc.text('AMOUNT', W - M - 6, y + 7, { align: 'right' })
    
    y += 10
    
    // Service/Package row
    doc.setFillColor(...WHITE)
    doc.rect(M, y, W - M * 2, 22, 'F')
    doc.setDrawColor(...PINK_MEDIUM)
    doc.setLineWidth(0.2)
    doc.line(M, y + 22, W - M, y + 22)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    const serviceName = inv.packageName || inv.eventType || 'Photography Services'
    doc.text(serviceName, M + 6, y + 9)
    
    if (inv.packageDescription) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_LIGHT)
      const desc = inv.packageDescription.length > 70 
        ? inv.packageDescription.substring(0, 70) + '...' 
        : inv.packageDescription
      doc.text(desc, M + 6, y + 17)
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    doc.text(fmt(inv.totalAmount), W - M - 6, y + 9, { align: 'right' })
    
    y += 26
    
    // PAYMENT SUMMARY
    const totalsW = 75
    const totalsX = W - M - totalsW
    
    doc.setFillColor(...PINK_SOFT)
    doc.roundedRect(totalsX, y, totalsW, 38, 3, 3, 'F')
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text('Total Amount', totalsX + 6, y + 10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT_DARK)
    doc.text(fmt(inv.totalAmount), totalsX + totalsW - 6, y + 10, { align: 'right' })
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text('Advance Paid', totalsX + 6, y + 19)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GREEN_SOFT)
    doc.text('- ' + fmt(inv.paidAmount || 0), totalsX + totalsW - 6, y + 19, { align: 'right' })
    
    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.3)
    doc.line(totalsX + 6, y + 24, totalsX + totalsW - 6, y + 24)
    
    const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('Balance Due', totalsX + 6, y + 33)
    doc.setFontSize(12)
    doc.text(fmt(balance), totalsX + totalsW - 6, y + 33, { align: 'right' })
    
    y += 45
    
    // PAYMENT HISTORY
    if ((inv.payments || []).length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...PINK_ACCENT)
      doc.text('PAYMENT HISTORY', M, y)
      y += 6
      
      doc.setFillColor(...PINK_LIGHT)
      doc.rect(M, y, W - M * 2, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...TEXT_DARK)
      doc.text('#', M + 4, y + 5.5)
      doc.text('Date', M + 14, y + 5.5)
      doc.text('Amount', M + 55, y + 5.5)
      doc.text('Note', M + 90, y + 5.5)
      y += 8
      
      inv.payments.forEach((p, i) => {
        doc.setFillColor(i % 2 === 0 ? WHITE : PINK_SOFT)
        doc.rect(M, y, W - M * 2, 7, 'F')
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...TEXT_DARK)
        doc.text(String(i + 1), M + 4, y + 5)
        doc.text(new Date(p.date).toLocaleDateString('en-IN'), M + 14, y + 5)
        doc.setTextColor(...GREEN_SOFT)
        doc.setFont('helvetica', 'bold')
        doc.text(fmt(p.amount), M + 55, y + 5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...TEXT_LIGHT)
        const note = (p.note || '-').substring(0, 25)
        doc.text(note, M + 90, y + 5)
        y += 7
      })
      y += 6
    }
    
    // NOTES
    if (inv.notes) {
      const noteLines = doc.splitTextToSize(inv.notes, W - M * 2 - 12)
      const noteH = Math.max(18, noteLines.length * 4.5 + 12)
      
      doc.setFillColor(...PINK_SOFT)
      doc.roundedRect(M, y, W - M * 2, noteH, 3, 3, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...PINK_ACCENT)
      doc.text('NOTES', M + 6, y + 8)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_MEDIUM)
      doc.text(noteLines, M + 6, y + 14)
      
      y += noteH + 6
    }
    
    // FOOTER
    const footerY = 265
    
    doc.setFillColor(...PINK_LIGHT)
    doc.rect(0, footerY, W, 32, 'F')
    
    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.5)
    doc.line(0, footerY, W, footerY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_DARK)
    doc.text('Thank you for choosing us!', W / 2, footerY + 10, { align: 'center' })
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...PINK_ACCENT)
    doc.text(studio.signature || studio.name || 'Candy Capture Photography', W / 2, footerY + 20, { align: 'center' })
    
    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.3)
    doc.line(W / 2 - 35, footerY + 23, W / 2 + 35, footerY + 23)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text('Authorized Signature', W / 2, footerY + 28, { align: 'center' })
    
    // SAVE PDF
    const safeName = (inv.customerName || 'Customer').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    const safeInvNum = (inv.invoiceNumber || 'INV').replace(/\//g, '-')
    const filename = safeInvNum + '_' + safeName + '.pdf'
    doc.save(filename)
    
    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    alert('PDF generation failed: ' + (err?.message || 'Unknown error'))
    return false
  }
}