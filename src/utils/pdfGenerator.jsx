import { jsPDF } from 'jspdf'

/**
 * Elegant Invoice PDF Generator
 * Theme: Light pink and white with subtle, sophisticated design
 * Fixed for mobile browsers
 */

// Safe number formatting
const fmt = (n) => {
  const num = Number(n) || 0
  return 'Rs. ' + num.toLocaleString('en-IN')
}

// Safe date formatting (mobile compatible)
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return String(dateStr)
  }
}

// Color palette
const PINK_ACCENT   = [219, 112, 147]
const PINK_LIGHT    = [255, 240, 245]
const PINK_MEDIUM   = [255, 228, 235]
const PINK_SOFT     = [252, 243, 246]
const WHITE         = [255, 255, 255]
const TEXT_DARK     = [60, 60, 70]
const TEXT_MEDIUM   = [120, 120, 130]
const TEXT_LIGHT    = [160, 160, 170]
const GREEN_SOFT    = [76, 175, 130]

const STATUS_COLORS = {
  paid:    [76, 175, 130],
  partial: [230, 170, 90],
  advance: [219, 112, 147],
}

const STATUS_LABELS = {
  paid:    'FULLY PAID',
  partial: 'PARTIAL',
  advance: 'ADVANCE',
}

export async function generatePDF(inv, studio) {
  try {
    // Validate inputs
    if (!inv) {
      alert('No invoice data provided')
      return false
    }

    const safeInv = {
      invoiceNumber: String(inv.invoiceNumber || 'INV-001'),
      customerName: String(inv.customerName || 'Customer'),
      customerMobile: String(inv.customerMobile || ''),
      customerEmail: String(inv.customerEmail || ''),
      eventType: String(inv.eventType || ''),
      eventDate: inv.eventDate || '',
      location: String(inv.location || inv.venue || ''),
      packageName: String(inv.packageName || inv.snapshot?.packageName || ''),
      packageDescription: String(inv.packageDescription || inv.description || ''),
      totalAmount: Number(inv.totalAmount) || 0,
      paidAmount: Number(inv.paidAmount) || 0,
      status: String(inv.status || 'advance'),
      notes: String(inv.notes || ''),
      payments: Array.isArray(inv.payments) ? inv.payments : [],
      // Get services from snapshot
      services: inv.snapshot?.lineItems || inv.lineItems || [],
    }

    const safeStudio = {
      name: String(studio?.name || 'Candy Capture Photography'),
      address: String(studio?.address || ''),
      mobile: String(studio?.mobile || ''),
      email: String(studio?.email || ''),
      instagram: String(studio?.instagram || ''),
      signature: String(studio?.signature || studio?.name || 'Candy Capture Photography'),
      logo: studio?.logo || null,
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    const H = 297
    const M = 20

    // Main white background
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2])
    doc.rect(0, 0, W, H, 'F')
    
    // Top decorative band
    doc.setFillColor(PINK_LIGHT[0], PINK_LIGHT[1], PINK_LIGHT[2])
    doc.rect(0, 0, W, 55, 'F')
    
    // Accent line
    doc.setDrawColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.setLineWidth(0.8)
    doc.line(0, 55, W, 55)
    
    let y = 18
    
    // Logo
    if (safeStudio.logo) {
      try {
        doc.addImage(safeStudio.logo, 'PNG', M, 12, 24, 24)
      } catch (e) {
        console.log('Logo load failed:', e)
      }
    }
    
    const logoOffset = safeStudio.logo ? 30 : 0
    
    // Studio name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text(safeStudio.name, M + logoOffset, y)
    
    // Accent line under name
    doc.setDrawColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.setLineWidth(0.5)
    doc.line(M + logoOffset, y + 3, M + logoOffset + 45, y + 3)
    
    // Studio contact info
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
    y += 10
    const contactInfo = [
      safeStudio.address,
      safeStudio.mobile ? 'Phone: ' + safeStudio.mobile : '',
      safeStudio.email ? 'Email: ' + safeStudio.email : '',
      safeStudio.instagram ? 'Instagram: ' + safeStudio.instagram : '',
    ].filter(Boolean)
    contactInfo.forEach((line, i) => {
      doc.text(line, M + logoOffset, y + (i * 4.5))
    })
    
    // INVOICE title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.text('INVOICE', W - M, 22, { align: 'right' })
    
    // Invoice number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
    doc.text(safeInv.invoiceNumber, W - M, 30, { align: 'right' })
    
    // Status badge
    const statusColor = STATUS_COLORS[safeInv.status] || STATUS_COLORS.advance
    const statusLabel = STATUS_LABELS[safeInv.status] || 'ADVANCE'
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    doc.roundedRect(W - M - 32, 35, 32, 8, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2])
    doc.text(statusLabel, W - M - 16, 40.5, { align: 'center' })
    
    // BILL TO & EVENT DETAILS
    y = 65
    
    // Bill To card
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2])
    doc.setDrawColor(PINK_MEDIUM[0], PINK_MEDIUM[1], PINK_MEDIUM[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, 82, 38, 4, 4, 'FD')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.text('BILL TO', M + 6, y + 8)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text(safeInv.customerName, M + 6, y + 17)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
    doc.text(safeInv.customerMobile, M + 6, y + 24)
    if (safeInv.customerEmail) {
      doc.text(safeInv.customerEmail, M + 6, y + 30)
    }
    
    // Event Details card
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2])
    doc.roundedRect(M + 88, y, 82, 38, 4, 4, 'FD')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.text('EVENT DETAILS', M + 94, y + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    let ey = y + 16
    
    if (safeInv.eventType) {
      doc.setFont('helvetica', 'bold')
      doc.text(safeInv.eventType, M + 94, ey)
      ey += 7
    }
    
    if (safeInv.eventDate) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
      doc.text(formatDate(safeInv.eventDate), M + 94, ey)
      ey += 6
    }
    
    if (safeInv.location) {
      doc.text(safeInv.location, M + 94, ey)
    }
    
    // PACKAGE/SERVICES SECTION
    y = 112
    
    // Table header
    doc.setFillColor(PINK_LIGHT[0], PINK_LIGHT[1], PINK_LIGHT[2])
    doc.rect(M, y, W - M * 2, 10, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text('DESCRIPTION', M + 6, y + 7)
    doc.text('AMOUNT', W - M - 6, y + 7, { align: 'right' })
    
    y += 10
    
    // Package name row
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2])
    const packageRowHeight = 14
    doc.rect(M, y, W - M * 2, packageRowHeight, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    const serviceName = safeInv.packageName || safeInv.eventType || 'Photography Services'
    doc.text(serviceName, M + 6, y + 9)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(fmt(safeInv.totalAmount), W - M - 6, y + 9, { align: 'right' })
    
    y += packageRowHeight
    
    // SERVICES LIST - Show what's included in the package
    if (safeInv.services && safeInv.services.length > 0) {
      doc.setFillColor(PINK_SOFT[0], PINK_SOFT[1], PINK_SOFT[2])
      
      // Services header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
      doc.text('Services Included:', M + 10, y + 6)
      y += 10
      
      // List each service
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
      
      safeInv.services.forEach((svc, i) => {
        const svcName = svc.name || svc.description || 'Service'
        const qty = svc.quantity || 1
        const bullet = (i + 1) + '.'
        doc.text(bullet, M + 12, y)
        doc.text(svcName + (qty > 1 ? ' (x' + qty + ')' : ''), M + 20, y)
        y += 5
        
        // Add new page if needed
        if (y > 230) {
          doc.addPage()
          y = 20
        }
      })
      
      y += 4
    }
    
    // Divider line
    doc.setDrawColor(PINK_MEDIUM[0], PINK_MEDIUM[1], PINK_MEDIUM[2])
    doc.setLineWidth(0.2)
    doc.line(M, y, W - M, y)
    y += 6
    
    // PAYMENT SUMMARY
    const totalsW = 75
    const totalsX = W - M - totalsW
    
    doc.setFillColor(PINK_SOFT[0], PINK_SOFT[1], PINK_SOFT[2])
    doc.roundedRect(totalsX, y, totalsW, 38, 3, 3, 'F')
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
    doc.text('Total Amount', totalsX + 6, y + 10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text(fmt(safeInv.totalAmount), totalsX + totalsW - 6, y + 10, { align: 'right' })
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
    doc.text('Advance Paid', totalsX + 6, y + 19)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(GREEN_SOFT[0], GREEN_SOFT[1], GREEN_SOFT[2])
    doc.text('- ' + fmt(safeInv.paidAmount), totalsX + totalsW - 6, y + 19, { align: 'right' })
    
    doc.setDrawColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.setLineWidth(0.3)
    doc.line(totalsX + 6, y + 24, totalsX + totalsW - 6, y + 24)
    
    const balance = safeInv.totalAmount - safeInv.paidAmount
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.text('Balance Due', totalsX + 6, y + 33)
    doc.setFontSize(12)
    doc.text(fmt(balance), totalsX + totalsW - 6, y + 33, { align: 'right' })
    
    y += 45
    
    // PAYMENT HISTORY
    if (safeInv.payments.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
      doc.text('PAYMENT HISTORY', M, y)
      y += 6
      
      doc.setFillColor(PINK_LIGHT[0], PINK_LIGHT[1], PINK_LIGHT[2])
      doc.rect(M, y, W - M * 2, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
      doc.text('#', M + 4, y + 5.5)
      doc.text('Date', M + 14, y + 5.5)
      doc.text('Amount', M + 55, y + 5.5)
      doc.text('Note', M + 90, y + 5.5)
      y += 8
      
      safeInv.payments.forEach((p, i) => {
        if (y > 250) return // Avoid overflow
        
        doc.setFillColor(i % 2 === 0 ? WHITE[0] : PINK_SOFT[0], i % 2 === 0 ? WHITE[1] : PINK_SOFT[1], i % 2 === 0 ? WHITE[2] : PINK_SOFT[2])
        doc.rect(M, y, W - M * 2, 7, 'F')
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
        doc.text(String(i + 1), M + 4, y + 5)
        doc.text(formatDate(p.date), M + 14, y + 5)
        doc.setTextColor(GREEN_SOFT[0], GREEN_SOFT[1], GREEN_SOFT[2])
        doc.setFont('helvetica', 'bold')
        doc.text(fmt(p.amount), M + 55, y + 5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2])
        const note = String(p.note || '-').substring(0, 25)
        doc.text(note, M + 90, y + 5)
        y += 7
      })
      y += 6
    }
    
    // NOTES
    if (safeInv.notes) {
      const noteLines = doc.splitTextToSize(safeInv.notes, W - M * 2 - 12)
      const noteH = Math.max(18, noteLines.length * 4.5 + 12)
      
      if (y + noteH < 255) {
        doc.setFillColor(PINK_SOFT[0], PINK_SOFT[1], PINK_SOFT[2])
        doc.roundedRect(M, y, W - M * 2, noteH, 3, 3, 'F')
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
        doc.text('NOTES', M + 6, y + 8)
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2])
        doc.text(noteLines, M + 6, y + 14)
      }
    }
    
    // FOOTER
    const footerY = 265
    
    doc.setFillColor(PINK_LIGHT[0], PINK_LIGHT[1], PINK_LIGHT[2])
    doc.rect(0, footerY, W, 32, 'F')
    
    doc.setDrawColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.setLineWidth(0.5)
    doc.line(0, footerY, W, footerY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text('Thank you for choosing us!', W / 2, footerY + 10, { align: 'center' })
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.text(safeStudio.signature, W / 2, footerY + 20, { align: 'center' })
    
    doc.setDrawColor(PINK_ACCENT[0], PINK_ACCENT[1], PINK_ACCENT[2])
    doc.setLineWidth(0.3)
    doc.line(W / 2 - 35, footerY + 23, W / 2 + 35, footerY + 23)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2])
    doc.text('Authorized Signature', W / 2, footerY + 28, { align: 'center' })
    
    // SAVE PDF
    const safeName = safeInv.customerName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    const safeInvNum = safeInv.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '')
    const filename = safeInvNum + '_' + safeName + '.pdf'
    doc.save(filename)
    
    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    alert('PDF generation failed: ' + String(err?.message || err || 'Unknown error'))
    return false
  }
}
