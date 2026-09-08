import React, { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { generatePDF } from '../utils/pdfGenerator.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

// ── Shared status badge helper (advance / partial / paid) ──────────────────
export const StatusBadge = ({ status, large }) => {
  const map = {
    paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
    partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
    advance: { bg: '#fce7f3', color: '#be185d', label: 'Advance' },
  }
  const st = map[status] || map.advance
  return (
    <span style={{
      background: st.bg, color: st.color,
      padding: large ? '5px 16px' : '2px 10px',
      borderRadius: '20px',
      fontSize: large ? '0.85rem' : '0.72rem',
      fontWeight: '700',
    }}>
      {st.label}
    </span>
  )
}

// ── WhatsApp Share Modal ───────────────────────────────────────────────────
function WhatsAppModal({ inv, studio, onClose }) {
  const [step, setStep]         = useState(1) // 1=ready, 2=done pdf
  const [pdfDone, setPdfDone]   = useState(false)
  const [downloading, setDown]  = useState(false)

  const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)
  const eventDateStr = inv.eventDate
    ? new Date(inv.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'TBD'

  const message = [
    `Hello ${inv.customerName}!`,
    ``,
    `Thank you for choosing *${studio.name || 'Candy Capture Photography'}*!`,
    `Your booking is confirmed!`,
    ``,
    `*Invoice Details:*`,
    `Invoice No: ${inv.invoiceNumber}`,
    `Event: ${inv.eventType || 'Photography'}`,
    `Event Date: ${eventDateStr}`,
    `Location: ${inv.location || 'TBD'}`,
    `Package: ${inv.packageName || 'Custom Package'}`,
    `Total Amount: ${fmt(inv.totalAmount)}`,
    `Advance Paid: ${fmt(inv.paidAmount || 0)}`,
    `Balance Due: ${fmt(balance)}`,
    ``,
    `Looking forward to capturing your special moments!`,
    ``,
    `Best Regards,`,
    `*${studio.signature || studio.name}*`,
    studio.mobile    || '',
    studio.instagram || '',
  ].filter(l => l !== null).join('\n')

  const handleDownloadPDF = async () => {
    setDown(true)
    await generatePDF(inv, studio)
    setDown(false)
    setPdfDone(true)
    setStep(2)
  }

  const handleOpenWhatsApp = () => {
    const mobile = (inv.customerMobile || '').replace(/\D/g, '')
    const num    = mobile.startsWith('91') ? mobile : `91${mobile}`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank')
    onClose()
  }

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={m.header}>
          <div style={m.headerIcon}>💬</div>
          <div>
            <div style={m.headerTitle}>Send via WhatsApp</div>
            <div style={m.headerSub}>{inv.customerName} • {inv.customerMobile}</div>
          </div>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Steps */}
        <div style={m.steps}>
          {/* Step 1 */}
          <div style={{ ...m.step, ...(step >= 1 ? m.stepActive : {}) }}>
            <div style={{ ...m.stepNum, background: pdfDone ? '#15803d' : '#be185d' }}>
              {pdfDone ? '✓' : '1'}
            </div>
            <div style={m.stepContent}>
              <div style={m.stepTitle}>Download Invoice PDF</div>
              <div style={m.stepDesc}>
                Save the PDF to your device — you will attach it manually in WhatsApp
              </div>
              <button
                style={{ ...m.stepBtn, opacity: downloading ? 0.7 : 1, background: pdfDone ? '#dcfce7' : 'linear-gradient(135deg,#be185d,#ec4899)', color: pdfDone ? '#15803d' : '#fff' }}
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? '⏳ Generating PDF...' : pdfDone ? '✅ PDF Downloaded!' : '📄 Download PDF'}
              </button>
            </div>
          </div>

          {/* Connector */}
          <div style={m.connector} />

          {/* Step 2 */}
          <div style={{ ...m.step, opacity: pdfDone ? 1 : 0.4 }}>
            <div style={{ ...m.stepNum, background: '#25D366' }}>2</div>
            <div style={m.stepContent}>
              <div style={m.stepTitle}>Open WhatsApp &amp; Send</div>
              <div style={m.stepDesc}>
                WhatsApp will open with the message pre-filled. Then click the{' '}
                <strong>📎 attachment icon</strong> → select the PDF from your Downloads → Send
              </div>
              <button
                style={{ ...m.stepBtn, background: pdfDone ? '#25D366' : '#e5e7eb', color: pdfDone ? '#fff' : '#9ca3af', cursor: pdfDone ? 'pointer' : 'not-allowed' }}
                onClick={pdfDone ? handleOpenWhatsApp : undefined}
                disabled={!pdfDone}
              >
                💬 Open WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={m.note}>
          <span style={{ fontWeight: '600' }}>ℹ️ Why manual attach?</span> WhatsApp does not allow
          any app or website to attach files automatically — this is WhatsApp's own security policy.
          All billing apps (Vyapar, Zoho, etc.) work the same way.
        </div>
      </div>
    </div>
  )
}

const m = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' },
  modal:   { background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' },
  header:  { display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 22px 16px', borderBottom: '1px solid #fce7f3', background: '#fdf2f8' },
  headerIcon:  { fontSize: '1.8rem' },
  headerTitle: { fontWeight: '700', fontSize: '1rem', color: '#831843' },
  headerSub:   { fontSize: '0.78rem', color: '#9d174d', marginTop: '2px' },
  closeBtn:    { marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#9ca3af', padding: '4px 8px' },
  steps:    { padding: '20px 22px' },
  step:     { display: 'flex', gap: '14px', alignItems: 'flex-start' },
  stepActive: {},
  stepNum:  { width: '28px', height: '28px', borderRadius: '50%', color: '#fff', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' },
  stepContent: { flex: 1 },
  stepTitle:   { fontWeight: '700', fontSize: '0.9rem', color: '#1f2937', marginBottom: '4px' },
  stepDesc:    { fontSize: '0.8rem', color: '#6b7280', lineHeight: '1.5', marginBottom: '10px' },
  stepBtn:     { padding: '8px 18px', border: 'none', borderRadius: '9px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' },
  connector:   { width: '2px', height: '16px', background: '#fce7f3', margin: '6px 0 6px 13px' },
  note:  { margin: '0 22px 20px', background: '#fef9c3', borderRadius: '10px', padding: '12px 14px', fontSize: '0.78rem', color: '#92400e', lineHeight: '1.5' },
}

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getInvoiceById, addPayment, studio, services } = useApp()
  const [showPayModal, setShowPayModal]   = useState(false)
  const [showWaModal,  setShowWaModal]    = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [downloading, setDownloading]     = useState(false)

  const inv = getInvoiceById(id)

  if (!inv) return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <div style={{ marginTop: '12px', color: '#9d174d', fontWeight: '600' }}>Invoice not found</div>
      <button style={s.backBtn} onClick={() => navigate('/invoices')}>← Back to Invoices</button>
    </div>
  )

  const service = services.find(sv => sv.id === inv.serviceId)
  const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)

  const handleAddPayment = () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) return
    addPayment(id, payForm)
    setPayForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
    setShowPayModal(false)
  }

  // ── PDF download ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setDownloading(true)
    await generatePDF(inv, studio)
    setDownloading(false)
  }

  return (
    <div style={s.page}>
      {/* Action bar */}
      <div style={s.actionBar}>
        <button style={s.backBtn} onClick={() => navigate('/invoices')}>← Back</button>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={s.btnEdit} onClick={() => navigate(`/invoices/${id}/edit`)}>
            ✏️ Edit
          </button>
          <button style={s.btnPay} onClick={() => setShowPayModal(true)}>
            💵 Add Payment
          </button>
          <button
            style={{ ...s.btnPdf, opacity: downloading ? 0.7 : 1 }}
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? '⏳ Generating...' : '📄 Download PDF'}
          </button>
          <button style={s.btnWa} onClick={() => setShowWaModal(true)}>
            💬 WhatsApp
          </button>
        </div>
      </div>

      {/* ── Invoice Preview ─────────────────────────────────────────────── */}
      <div style={s.invoiceWrap}>

        {/* Header */}
        <div style={s.invHeader}>
          <div style={s.invFrom}>
            {/* Logo or camera emoji */}
            {studio.logo
              ? <img src={studio.logo} alt="logo" style={s.logoImg} />
              : <div style={s.invLogoEmoji}>📸</div>
            }
            <div>
              <div style={s.studioName}>{studio.name}</div>
              <div style={s.studioInfo}>{studio.address}</div>
              <div style={s.studioInfo}>📞 {studio.mobile}</div>
              {studio.email     && <div style={s.studioInfo}>✉️ {studio.email}</div>}
              {studio.instagram && <div style={s.studioInfo}>📱 {studio.instagram}</div>}
              {studio.website   && <div style={s.studioInfo}>🌐 {studio.website}</div>}
            </div>
          </div>
          <div style={s.invMeta}>
            <div style={s.invTitle}>INVOICE</div>
            <div style={s.invNum}>{inv.invoiceNumber}</div>
            <div style={{ marginTop: '10px' }}>
              <StatusBadge status={inv.status} large />
            </div>
            <div style={s.invDateRow}>
              <span style={s.invDateLabel}>Booking Date</span>
              <span style={s.invDateVal}>
                {inv.bookingDate ? new Date(inv.bookingDate).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>
            {inv.eventDate && (
              <div style={s.invDateRow}>
                <span style={s.invDateLabel}>Event Date</span>
                <span style={s.invDateVal}>
                  {new Date(inv.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pink gradient divider */}
        <div style={s.divider} />

        {/* Bill To + Event Details */}
        <div style={s.billRow}>
          <div style={s.billTo}>
            <div style={s.billLabel}>BILL TO</div>
            <div style={s.billName}>{inv.customerName}</div>
            <div style={s.billInfo}>📞 {inv.customerMobile}</div>
            {inv.customerEmail && <div style={s.billInfo}>✉️ {inv.customerEmail}</div>}
          </div>
          <div style={s.billEvent}>
            <div style={s.billLabel}>EVENT DETAILS</div>
            {inv.eventType && <div style={s.billInfo}><strong>Event:</strong> {inv.eventType}</div>}
            {inv.eventDate && (
              <div style={s.billInfo}>
                <strong>Date:</strong>{' '}
                {new Date(inv.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
            {inv.location && <div style={s.billInfo}><strong>Venue:</strong> {inv.location}</div>}
            {service      && <div style={s.billInfo}><strong>Service:</strong> {service.name}</div>}
          </div>
        </div>

        {/* Package row */}
        <div style={s.itemsTable}>
          <div style={s.itemsHeader}>
            <div style={{ flex: 3 }}>Description</div>
            <div style={{ flex: 1, textAlign: 'right' }}>Amount</div>
          </div>
          <div style={s.itemRow}>
            <div style={{ flex: 3 }}>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                {inv.packageName || inv.eventType || 'Photography Services'}
              </div>
              {inv.packageDescription && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                  {inv.packageDescription}
                </div>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{fmt(inv.totalAmount)}</div>
          </div>
        </div>

        {/* Totals */}
        <div style={s.totals}>
          <div style={s.totalRow}>
            <span>Total Amount</span>
            <span style={{ fontWeight: '600' }}>{fmt(inv.totalAmount)}</span>
          </div>
          <div style={s.totalRow}>
            <span style={{ color: '#15803d' }}>Advance Paid</span>
            <span style={{ fontWeight: '600', color: '#15803d' }}>− {fmt(inv.paidAmount || 0)}</span>
          </div>
          <div style={s.totalBalRow}>
            <span>Balance Due</span>
            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: balance > 0 ? '#be185d' : '#15803d' }}>
              {fmt(balance)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div style={s.notes}>
            <div style={s.notesLabel}>Notes</div>
            <div style={s.notesText}>{inv.notes}</div>
          </div>
        )}

        {/* Payment History */}
        {(inv.payments || []).length > 0 && (
          <div style={s.payHistory}>
            <div style={s.payHistTitle}>Payment History</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={s.pth}>#</th>
                  <th style={s.pth}>Date</th>
                  <th style={s.pth}>Amount</th>
                  <th style={s.pth}>Note</th>
                </tr>
              </thead>
              <tbody>
                {(inv.payments || []).map((p, i) => (
                  <tr key={p.id || i} style={{ borderBottom: '1px solid #fdf2f8' }}>
                    <td style={s.ptd}>{i + 1}</td>
                    <td style={s.ptd}>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td style={s.ptd}><strong style={{ color: '#15803d' }}>{fmt(p.amount)}</strong></td>
                    <td style={s.ptd}>{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={s.invFooter}>
          <div style={s.thankMsg}>Thank you for choosing us! 💕</div>
          <div style={s.signature}>{studio.signature || studio.name}</div>
          <div style={s.sigLine} />
          <div style={s.sigName}>Authorized Signature</div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showPayModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>💵 Add Payment</div>
            <div style={{ marginBottom: '12px', background: '#fdf2f8', borderRadius: '10px', padding: '10px 14px', fontSize: '0.875rem' }}>
              Balance due: <strong style={{ color: '#be185d' }}>{fmt(balance)}</strong>
            </div>
            <div style={s.field}>
              <label style={s.label}>Amount Received (₹)</label>
              <input type="number" style={s.input} placeholder="Enter amount"
                value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Payment Date</label>
              <input type="date" style={s.input} value={payForm.date}
                onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Note (optional)</label>
              <input style={s.input} placeholder="e.g. 2nd installment, Final payment"
                value={payForm.note}
                onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.saveBtn} onClick={handleAddPayment}>Save Payment</button>
              <button style={s.cancelBtn} onClick={() => setShowPayModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* WhatsApp Modal */}
      {showWaModal && (
        <WhatsAppModal
          inv={inv}
          studio={studio}
          onClose={() => setShowWaModal(false)}
        />
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '900px' },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  backBtn: { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' },
  btnEdit: { background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  btnPay:  { background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  btnPdf:  { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  btnWa:   { background: '#25D366', color: '#fff',    border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  invoiceWrap: { background: '#fff', borderRadius: '20px', boxShadow: '0 4px 30px rgba(190,24,93,0.12)', border: '1px solid #fce7f3', overflow: 'hidden' },
  invHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 32px 20px', background: 'linear-gradient(135deg,#fff 0%,#fdf2f8 100%)', flexWrap: 'wrap', gap: '16px' },
  invFrom:  { display: 'flex', gap: '14px', alignItems: 'flex-start' },
  logoImg:  { width: '64px', height: '64px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #fce7f3' },
  invLogoEmoji: { fontSize: '2.5rem', background: 'linear-gradient(135deg,#be185d,#ec4899)', borderRadius: '14px', padding: '8px 10px', color: '#fff' },
  studioName: { fontSize: '1.2rem', fontWeight: '800', color: '#831843', marginBottom: '4px' },
  studioInfo: { fontSize: '0.78rem', color: '#6b7280', lineHeight: '1.7' },
  invMeta:  { textAlign: 'right' },
  invTitle: { fontSize: '2rem', fontWeight: '900', color: '#be185d', letterSpacing: '4px' },
  invNum:   { fontSize: '0.875rem', fontWeight: '600', color: '#9d174d', marginTop: '4px' },
  invDateRow:   { display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '7px', alignItems: 'center' },
  invDateLabel: { fontSize: '0.72rem', color: '#9ca3af', fontWeight: '500' },
  invDateVal:   { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  divider: { height: '4px', background: 'linear-gradient(90deg,#be185d,#f472b6,#fce7f3)' },
  billRow:   { display: 'flex', gap: '32px', padding: '20px 32px', flexWrap: 'wrap' },
  billTo:    { flex: 1, minWidth: '180px' },
  billEvent: { flex: 1, minWidth: '180px' },
  billLabel: { fontSize: '0.68rem', fontWeight: '700', color: '#be185d', letterSpacing: '1.5px', marginBottom: '8px' },
  billName:  { fontSize: '1.05rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px' },
  billInfo:  { fontSize: '0.82rem', color: '#6b7280', lineHeight: '1.8' },
  itemsTable:  { margin: '0 32px 8px', border: '1px solid #fce7f3', borderRadius: '12px', overflow: 'hidden' },
  itemsHeader: { display: 'flex', background: '#fdf2f8', padding: '10px 16px', fontSize: '0.78rem', fontWeight: '700', color: '#9d174d' },
  itemRow:     { display: 'flex', padding: '14px 16px', borderTop: '1px solid #fdf2f8' },
  totals:     { margin: '0 32px 24px', borderTop: '2px solid #fce7f3', paddingTop: '16px' },
  totalRow:   { display: 'flex', justifyContent: 'flex-end', gap: '32px', padding: '4px 0', fontSize: '0.875rem', color: '#374151' },
  totalBalRow:{ display: 'flex', justifyContent: 'flex-end', gap: '32px', padding: '12px 0 4px', borderTop: '2px solid #fce7f3', marginTop: '8px' },
  notes:      { margin: '0 32px 20px', background: '#fdf2f8', borderRadius: '10px', padding: '14px 16px' },
  notesLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#be185d', marginBottom: '6px' },
  notesText:  { fontSize: '0.84rem', color: '#374151', lineHeight: '1.6' },
  payHistory:   { margin: '0 32px 24px' },
  payHistTitle: { fontSize: '0.85rem', fontWeight: '700', color: '#9d174d', marginBottom: '10px' },
  pth: { padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#9d174d', background: '#fdf2f8' },
  ptd: { padding: '8px 12px', fontSize: '0.84rem', color: '#374151' },
  invFooter: { background: 'linear-gradient(135deg,#831843,#be185d)', padding: '22px 32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  thankMsg:  { fontSize: '0.9rem', color: '#fce7f3' },
  signature: { fontSize: '1.2rem', fontWeight: '800', color: '#fff', fontStyle: 'italic' },
  sigLine:   { width: '150px', height: '2px', background: 'rgba(255,255,255,0.4)', marginTop: '4px' },
  sigName:   { fontSize: '0.7rem', color: '#fce7f3', letterSpacing: '1px' },
  // Modal
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:      { background: '#fff', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#831843', marginBottom: '16px' },
  field:      { marginBottom: '12px' },
  label:      { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
  input:      { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '0.875rem', color: '#1f2937' },
  saveBtn:    { flex: 1, background: 'linear-gradient(135deg,#be185d,#ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontWeight: '700', cursor: 'pointer' },
  cancelBtn:  { padding: '10px 18px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '9px', fontWeight: '600', cursor: 'pointer' },
}
