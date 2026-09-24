import { jsPDF } from 'jspdf'

/**
 * Elegant Invoice PDF Generator - Fixed Alignment
 * Theme: Light pink and white with clean layout
 */

// Safe number formatting
const fmt = (n) => {
  const num = Number(n) || 0
  return 'Rs. ' + num.toLocaleString('en-IN')
}

// Safe date formatting
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
const PINK_ACCENT   = [190, 24, 93]    // #be185d
const PINK_LIGHT    = [253, 242, 248]  // #fdf2f8
const PINK_MEDIUM   = [252, 231, 243]  // #fce7f3
const WHITE         = [255, 255, 255]
const TEXT_DARK     = [31, 41, 55]     // #1f2937
const TEXT_MEDIUM   = [107, 114, 128]  // #6b7280
const TEXT_LIGHT    = [156, 163, 175]  // #9ca3af
const GREEN         = [21, 128, 61]    // #15803d

const STATUS_COLORS = {
  paid:    [21, 128, 61],   // green
  partial: [161, 98, 7],    // amber
  advance: [190, 24, 93],   // pink
}

const STATUS_LABELS = {
  paid:    'PAID',
  partial: 'PARTIAL',
  advance: 'ADVANCE',
}

export async function generatePDF(inv, studio) {
  try {
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
      packageDescription: String(inv.packageDescription || ''),
      totalAmount: Number(inv.totalAmount) || 0,
      paidAmount: Number(inv.paidAmount) || 0,
      status: String(inv.status || 'advance'),
      notes: String(inv.notes || ''),
      payments: Array.isArray(inv.payments) ? inv.payments : [],
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
    const M = 15  // Margin

    // White background
    doc.setFillColor(...WHITE)
    doc.rect(0, 0, W, H, 'F')

    // Watermark logo (faded in center)
    if (safeStudio.logo) {
      try {
        doc.saveGraphicsState()
        doc.setGState(new doc.GState({ opacity: 0.06 }))
        doc.addImage(safeStudio.logo, 'PNG', W/2 - 40, H/2 - 40, 80, 80)
        doc.restoreGraphicsState()
      } catch (e) {
        console.log('Watermark failed:', e)
      }
    }

    // ===== HEADER SECTION =====
    let y = 15

    // Logo (left side)
    let logoOffset = 0
    if (safeStudio.logo) {
      try {
        doc.addImage(safeStudio.logo, 'PNG', M, y, 22, 22)
        logoOffset = 26
      } catch (e) {
        console.log('Logo failed:', e)
      }
    }

    // Studio name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...TEXT_DARK)
    doc.text(safeStudio.name, M + logoOffset, y + 8)

    // Studio contact (below name)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MEDIUM)
    let contactY = y + 14
    if (safeStudio.address) { doc.text(safeStudio.address, M + logoOffset, contactY); contactY += 4 }
    if (safeStudio.mobile) { doc.text('Ph: ' + safeStudio.mobile, M + logoOffset, contactY); contactY += 4 }
    if (safeStudio.email) { doc.text(safeStudio.email, M + logoOffset, contactY) }

    // INVOICE title (right side)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('INVOICE', W - M, y + 8, { align: 'right' })

    // Invoice number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text(safeInv.invoiceNumber, W - M, y + 16, { align: 'right' })

    // Status badge
    const statusColor = STATUS_COLORS[safeInv.status] || STATUS_COLORS.advance
    const statusLabel = STATUS_LABELS[safeInv.status] || 'ADVANCE'
    doc.setFillColor(...statusColor)
    doc.roundedRect(W - M - 28, y + 20, 28, 7, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text(statusLabel, W - M - 14, y + 25, { align: 'center' })

    // Pink divider line
    y = 45
    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.8)
    doc.line(M, y, W - M, y)

    // ===== BILL TO & EVENT DETAILS =====
    y = 52
    const colW = (W - M * 2 - 10) / 2  // Two columns with gap

    // Bill To box
    doc.setFillColor(...PINK_LIGHT)
    doc.roundedRect(M, y, colW, 32, 3, 3, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('BILL TO', M + 6, y + 8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    doc.text(safeInv.customerName, M + 6, y + 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MEDIUM)
    if (safeInv.customerMobile) doc.text(safeInv.customerMobile, M + 6, y + 23)
    if (safeInv.customerEmail) doc.text(safeInv.customerEmail, M + 6, y + 29)

    // Event Details box
    const col2X = M + colW + 10
    doc.setFillColor(...PINK_LIGHT)
    doc.roundedRect(col2X, y, colW, 32, 3, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('EVENT DETAILS', col2X + 6, y + 8)

    let eventY = y + 16
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_DARK)
    if (safeInv.eventType) {
      doc.text(safeInv.eventType, col2X + 6, eventY)
      eventY += 7
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MEDIUM)
    if (safeInv.eventDate) {
      doc.text(formatDate(safeInv.eventDate), col2X + 6, eventY)
      eventY += 5
    }
    if (safeInv.location) {
      doc.text(safeInv.location.substring(0, 35), col2X + 6, eventY)
    }

    // ===== ITEMS TABLE =====
    y = 92

    // Table header
    doc.setFillColor(...PINK_MEDIUM)
    doc.rect(M, y, W - M * 2, 10, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_DARK)
    doc.text('DESCRIPTION', M + 6, y + 7)
    doc.text('AMOUNT', W - M - 6, y + 7, { align: 'right' })

    y += 10

    // Package/Service row
    doc.setFillColor(...WHITE)
    doc.rect(M, y, W - M * 2, 12, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    const serviceName = safeInv.packageName || safeInv.eventType || 'Photography Services'
    doc.text(serviceName, M + 6, y + 8)

    doc.text(fmt(safeInv.totalAmount), W - M - 6, y + 8, { align: 'right' })

    y += 12

    // Services list (if any)
    if (safeInv.services && safeInv.services.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...PINK_ACCENT)
      doc.text('Included Services:', M + 8, y + 5)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_MEDIUM)
      
      safeInv.services.forEach((svc, i) => {
        const svcName = svc.name || svc.description || 'Service'
        const qty = svc.quantity || 1
        doc.text(`${i + 1}. ${svcName}${qty > 1 ? ' (x' + qty + ')' : ''}`, M + 12, y)
        y += 5
        if (y > 200) return // Prevent overflow
      })
      y += 3
    }

    // Divider
    doc.setDrawColor(...PINK_MEDIUM)
    doc.setLineWidth(0.3)
    doc.line(M, y, W - M, y)
    y += 8

    // ===== PAYMENT SUMMARY (right aligned) =====
    const sumW = 70
    const sumX = W - M - sumW

    doc.setFillColor(...PINK_LIGHT)
    doc.roundedRect(sumX, y, sumW, 36, 3, 3, 'F')

    // Total Amount
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text('Total Amount', sumX + 6, y + 10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT_DARK)
    doc.text(fmt(safeInv.totalAmount), sumX + sumW - 6, y + 10, { align: 'right' })

    // Advance Paid
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT_MEDIUM)
    doc.text('Advance Paid', sumX + 6, y + 19)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GREEN)
    doc.text('- ' + fmt(safeInv.paidAmount), sumX + sumW - 6, y + 19, { align: 'right' })

    // Line
    doc.setDrawColor(...PINK_ACCENT)
    doc.line(sumX + 6, y + 23, sumX + sumW - 6, y + 23)

    // Balance Due
    const balance = safeInv.totalAmount - safeInv.paidAmount
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...PINK_ACCENT)
    doc.text('Balance Due', sumX + 6, y + 32)
    doc.setFontSize(12)
    doc.text(fmt(balance), sumX + sumW - 6, y + 32, { align: 'right' })

    y += 44

    // ===== PAYMENT HISTORY =====
    if (safeInv.payments.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...PINK_ACCENT)
      doc.text('PAYMENT HISTORY', M, y)
      y += 6

      // Table header
      doc.setFillColor(...PINK_LIGHT)
      doc.rect(M, y, W - M * 2, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_DARK)
      doc.text('#', M + 6, y + 5.5)
      doc.text('Date', M + 20, y + 5.5)
      doc.text('Amount', M + 70, y + 5.5)
      doc.text('Note', M + 110, y + 5.5)
      y += 8

      safeInv.payments.forEach((p, i) => {
        if (y > 240) return

        const bg = i % 2 === 0 ? WHITE : PINK_LIGHT
        doc.setFillColor(...bg)
        doc.rect(M, y, W - M * 2, 7, 'F')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...TEXT_DARK)
        doc.text(String(i + 1), M + 6, y + 5)
        doc.text(formatDate(p.date), M + 20, y + 5)
        doc.setTextColor(...GREEN)
        doc.setFont('helvetica', 'bold')
        doc.text(fmt(p.amount), M + 70, y + 5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...TEXT_LIGHT)
        doc.text(String(p.note || '-').substring(0, 30), M + 110, y + 5)
        y += 7
      })
      y += 6
    }

    // ===== NOTES =====
    if (safeInv.notes && y < 230) {
      const noteLines = doc.splitTextToSize(safeInv.notes, W - M * 2 - 12)
      const noteH = Math.min(25, noteLines.length * 5 + 12)

      doc.setFillColor(...PINK_LIGHT)
      doc.roundedRect(M, y, W - M * 2, noteH, 3, 3, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...PINK_ACCENT)
      doc.text('NOTES', M + 6, y + 7)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_MEDIUM)
      doc.text(noteLines, M + 6, y + 13)
    }

    // ===== FOOTER =====
    const footerY = 260

    doc.setFillColor(...PINK_LIGHT)
    doc.rect(0, footerY, W, 37, 'F')

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
    doc.text(safeStudio.signature, W / 2, footerY + 20, { align: 'center' })

    doc.setDrawColor(...PINK_ACCENT)
    doc.setLineWidth(0.3)
    doc.line(W / 2 - 30, footerY + 24, W / 2 + 30, footerY + 24)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text('Authorized Signature', W / 2, footerY + 29, { align: 'center' })

    // Save PDF
    const safeName = safeInv.customerName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    const safeInvNum = safeInv.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '')
    doc.save(`${safeInvNum}_${safeName}.pdf`)

    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    alert('PDF generation failed: ' + String(err?.message || err || 'Unknown error'))
    return false
  }
}
