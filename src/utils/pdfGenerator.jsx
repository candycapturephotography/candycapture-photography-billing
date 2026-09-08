import { jsPDF } from 'jspdf'

// NOTE: jsPDF cannot render emoji characters - all text must be plain ASCII/Latin

const fmt = (n) => `Rs.${Number(n || 0).toLocaleString('en-IN')}`

// Color palette
const PINK_DARK  = [131, 24, 67]
const PINK_MID   = [190, 24, 93]
const PINK_LIGHT = [252, 231, 243]
const PINK_PALE  = [253, 242, 248]
const WHITE      = [255, 255, 255]
const GRAY_DARK  = [31, 41, 55]
const GRAY_MID   = [107, 114, 128]
const GREEN      = [21, 128, 61]

const STATUS_COLORS = {
  paid:    [21, 128, 61],
  partial: [161, 98, 7],
  advance: [190, 24, 93],
}
const STATUS_LABELS = {
  paid:    'PAID',
  partial: 'PARTIAL',
  advance: 'ADVANCE',
}

export async function generatePDF(inv, studio) {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    const M = 18   // left/right margin

    // ── HEADER BAND ─────────────────────────────────────────────────────────
    doc.setFillColor(...PINK_DARK)
    doc.rect(0, 0, W, 52, 'F')

    // Logo image (if uploaded)
    if (studio.logo) {
      try {
        doc.addImage(studio.logo, 'PNG', M, 6, 22, 22)
      } catch {
        // logo failed silently
      }
    }

    const textX = studio.logo ? M + 26 : M

    // Studio name
    doc.setTextColor(...WHITE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(studio.name || 'Candy Capture Photography', textX, 16)

    // Studio details
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(252, 231, 243)
    const infoLines = [
      studio.address || '',
      `Ph: ${studio.mobile || ''}`,
      studio.email   ? `Email: ${studio.email}`       : null,
      studio.instagram ? `Instagram: ${studio.instagram}` : null,
      studio.website  ? `Web: ${studio.website}`       : null,
    ].filter(Boolean)
    infoLines.forEach((line, i) => {
      doc.text(line, textX, 23 + i * 5)
    })

    // "INVOICE" label — top right
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(...WHITE)
    doc.text('INVOICE', W - M, 20, { align: 'right' })

    // Invoice number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(249, 168, 212)
    doc.text(inv.invoiceNumber || '', W - M, 28, { align: 'right' })

    // Status badge
    const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.advance
    const sl = STATUS_LABELS[inv.status] || 'ADVANCE'
    doc.setFillColor(...sc)
    doc.roundedRect(W - M - 30, 33, 30, 9, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...WHITE)
    doc.text(sl, W - M - 15, 39, { align: 'center' })

    // ── PINK ACCENT LINE ────────────────────────────────────────────────────
    doc.setFillColor(244, 114, 182)
    doc.rect(0, 52, W, 2.5, 'F')

    // ── BILL TO + EVENT DETAILS + DATES ─────────────────────────────────────
    let y = 64

    // Bill To box
    doc.setFillColor(...PINK_PALE)
    doc.roundedRect(M, y - 6, 80, 44, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...PINK_MID)
    doc.text('BILL TO', M + 4, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...GRAY_DARK)
    doc.text(inv.customerName || '', M + 4, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...GRAY_MID)
    doc.text(`Ph: ${inv.customerMobile || ''}`, M + 4, y + 16)
    if (inv.customerEmail) {
      doc.text(`Email: ${inv.customerEmail}`, M + 4, y + 22)
    }

    // Event Details box
    doc.setFillColor(...PINK_PALE)
    doc.roundedRect(M + 86, y - 6, 80, 44, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...PINK_MID)
    doc.text('EVENT DETAILS', M + 90, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...GRAY_DARK)
    let ey = y + 8
    if (inv.eventType) {
      doc.text(`Event: ${inv.eventType}`, M + 90, ey)
      ey += 6
    }
    if (inv.eventDate) {
      const d = new Date(inv.eventDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
      doc.text(`Date: ${d}`, M + 90, ey)
      ey += 6
    }
    if (inv.location) {
      doc.text(`Venue: ${inv.location}`, M + 90, ey)
    }

    // Dates box
    doc.setFillColor(...PINK_PALE)
    doc.roundedRect(W - M - 20, y - 6, 20, 44, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...PINK_MID)
    doc.text('DATES', W - M - 18, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_MID)
    if (inv.bookingDate) {
      doc.text('Booking:', W - M - 18, y + 8)
      doc.setTextColor(...GRAY_DARK)
      doc.text(new Date(inv.bookingDate).toLocaleDateString('en-IN'), W - M - 18, y + 14)
    }
    if (inv.eventDate) {
      doc.setTextColor(...GRAY_MID)
      doc.text('Event:', W - M - 18, y + 22)
      doc.setTextColor(...GRAY_DARK)
      doc.text(new Date(inv.eventDate).toLocaleDateString('en-IN'), W - M - 18, y + 28)
    }

    y += 48

    // ── SERVICE / PACKAGE TABLE ──────────────────────────────────────────────
    // Header row
    doc.setFillColor(...PINK_MID)
    doc.rect(M, y, W - M * 2, 10, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...WHITE)
    doc.text('DESCRIPTION', M + 4, y + 7)
    doc.text('AMOUNT', W - M - 4, y + 7, { align: 'right' })
    y += 10

    // Item row
    doc.setFillColor(...WHITE)
    doc.rect(M, y, W - M * 2, 20, 'F')
    doc.setDrawColor(...PINK_LIGHT)
    doc.rect(M, y, W - M * 2, 20, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...GRAY_DARK)
    const pkgTitle = inv.packageName || inv.eventType || 'Photography Services'
    doc.text(pkgTitle, M + 4, y + 8)

    if (inv.packageDescription) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...GRAY_MID)
      // Truncate description to avoid overflow
      const desc = inv.packageDescription.length > 80
        ? inv.packageDescription.substring(0, 80) + '...'
        : inv.packageDescription
      doc.text(desc, M + 4, y + 15)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...GRAY_DARK)
    doc.text(fmt(inv.totalAmount), W - M - 4, y + 8, { align: 'right' })
    y += 20

    // ── TOTALS ───────────────────────────────────────────────────────────────
    y += 6
    const totW = 78
    const totX = W - M - totW

    doc.setFillColor(...PINK_PALE)
    doc.rect(totX, y - 4, totW, 32, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_DARK)
    doc.text('Total Amount:', totX + 4, y + 4)
    doc.text(fmt(inv.totalAmount), totX + totW - 4, y + 4, { align: 'right' })

    doc.setTextColor(...GREEN)
    doc.text('Advance Paid:', totX + 4, y + 13)
    doc.text(`-${fmt(inv.paidAmount || 0)}`, totX + totW - 4, y + 13, { align: 'right' })

    // Balance bar
    doc.setFillColor(...PINK_MID)
    doc.rect(totX, y + 18, totW, 10, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...WHITE)
    const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)
    doc.text('Balance Due:', totX + 4, y + 25)
    doc.text(fmt(balance), totX + totW - 4, y + 25, { align: 'right' })

    y += 36

    // ── PAYMENT HISTORY ──────────────────────────────────────────────────────
    if ((inv.payments || []).length > 0) {
      y += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...PINK_MID)
      doc.text('PAYMENT HISTORY', M, y)
      y += 5

      // Table header
      doc.setFillColor(...PINK_PALE)
      doc.rect(M, y, W - M * 2, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...PINK_DARK)
      doc.text('#',      M + 4,   y + 5.5)
      doc.text('Date',   M + 12,  y + 5.5)
      doc.text('Amount', M + 60,  y + 5.5)
      doc.text('Note',   M + 100, y + 5.5)
      y += 8

      inv.payments.forEach((p, i) => {
        doc.setFillColor(...(i % 2 === 0 ? WHITE : PINK_PALE))
        doc.rect(M, y, W - M * 2, 7, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...GRAY_DARK)
        doc.text(String(i + 1), M + 4, y + 5)
        doc.text(new Date(p.date).toLocaleDateString('en-IN'), M + 12, y + 5)
        doc.setTextColor(...GREEN)
        doc.text(fmt(p.amount), M + 60, y + 5)
        doc.setTextColor(...GRAY_MID)
        const note = (p.note || '-').length > 30 ? (p.note || '-').substring(0, 30) + '...' : (p.note || '-')
        doc.text(note, M + 100, y + 5)
        y += 7
      })
      y += 4
    }

    // ── NOTES ────────────────────────────────────────────────────────────────
    if (inv.notes) {
      y += 4
      const noteLines = doc.splitTextToSize(inv.notes, W - M * 2 - 8)
      const noteH = Math.max(16, noteLines.length * 5 + 10)
      doc.setFillColor(...PINK_PALE)
      doc.roundedRect(M, y, W - M * 2, noteH, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...PINK_MID)
      doc.text('NOTES', M + 4, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...GRAY_MID)
      doc.text(noteLines, M + 4, y + 12)
      y += noteH + 4
    }

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = 272
    doc.setFillColor(...PINK_DARK)
    doc.rect(0, footerY, W, 25, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...WHITE)
    doc.text('Thank you for choosing us!', W / 2, footerY + 8, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(249, 168, 212)
    doc.text(studio.signature || studio.name || 'Candy Capture Photography', W / 2, footerY + 17, { align: 'center' })

    doc.setDrawColor(249, 168, 212)
    doc.setLineWidth(0.4)
    doc.line(W / 2 - 32, footerY + 19, W / 2 + 32, footerY + 19)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(252, 231, 243)
    doc.text('Authorized Signature', W / 2, footerY + 23, { align: 'center' })

    // ── SAVE ─────────────────────────────────────────────────────────────────
    const safeName    = (inv.customerName || 'Customer').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    const safeInvNum  = (inv.invoiceNumber || 'INV').replace(/\//g, '-')
    const filename    = `${safeInvNum}_${safeName}.pdf`
    doc.save(filename)

    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    alert('PDF generation failed: ' + (err?.message || 'Unknown error. Please try again.'))
    return false
  }
}
