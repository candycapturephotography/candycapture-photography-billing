import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { generatePDF } from '../utils/pdfGenerator.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCustomerById, getCustomerInvoices, studio } = useApp()
  const [downloadingPdf, setDownloadingPdf] = useState(null)

  const customer = getCustomerById(id)
  if (!customer) return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <div style={{ marginTop: '12px', color: '#9d174d', fontWeight: '600' }}>Customer not found</div>
      <button style={s.backBtn} onClick={() => navigate('/customers')}>← Back</button>
    </div>
  )

  const invoices = getCustomerInvoices(id)
  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0)
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0)
  const totalPending = totalBilled - totalPaid
  const now = new Date()
  const upcoming = invoices.filter(i => i.eventDate && new Date(i.eventDate) > now)

  const statusBadge = (status) => {
    const map = {
      paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
      partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
      advance: { bg: '#fce7f3', color: '#be185d', label: 'Advance' },
    }
    const st = map[status] || map.advance
    return <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{st.label}</span>
  }

  const handleDownloadPDF = async (inv, e) => {
    e.stopPropagation()
    setDownloadingPdf(inv.id)
    try {
      // Use snapshot studio profile if available, otherwise use current studio
      const studioProfile = inv.snapshot?.studioProfile || studio
      await generatePDF(inv, studioProfile)
    } catch (err) {
      console.error('PDF download failed:', err)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPdf(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Sort invoices by event date descending
  const sortedInvoices = [...invoices].sort((a, b) => {
    const dateA = a.eventDate ? new Date(a.eventDate) : new Date(0)
    const dateB = b.eventDate ? new Date(b.eventDate) : new Date(0)
    return dateB - dateA
  })

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/customers')}>← Customers</button>
      </div>

      {/* Customer Profile - Requirement 14.1 */}
      <div style={s.profile}>
        <div style={s.avatar}>{customer.name?.[0]?.toUpperCase()}</div>
        <div style={s.profileInfo}>
          <h1 style={s.name}>{customer.name}</h1>
          <div style={s.contact}>
            <span>📞 {customer.mobile}</span>
            {customer.email && <span>✉️ {customer.email}</span>}
            <span>📅 Since {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <button style={s.waBtn} onClick={() => {
          const mobile = customer.mobile?.replace(/\D/g, '')
          const num = mobile?.startsWith('91') ? mobile : `91${mobile}`
          window.open(`https://wa.me/${num}`, '_blank')
        }}>
          💬 WhatsApp
        </button>
      </div>

      {/* Customer Stats - Computed Values */}
      <div style={s.statsGrid}>
        {[
          { label: 'Total Bookings', value: invoices.length, color: '#be185d' },
          { label: 'Total Billed', value: fmt(totalBilled), color: '#15803d' },
          { label: 'Total Paid', value: fmt(totalPaid), color: '#15803d' },
          { label: 'Total Pending', value: fmt(totalPending), color: totalPending > 0 ? '#b91c1c' : '#15803d' },
          { label: 'Upcoming Events', value: upcoming.length, color: '#1d4ed8' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Event History Table - Requirement 14.2 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>📅 Event History</div>
        {invoices.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No events yet</div>
        ) : (
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr style={s.tableHeaderRow}>
                  <th style={s.th}>Event Date</th>
                  <th style={s.th}>Event Type</th>
                  <th style={s.th}>Package</th>
                  <th style={s.thRight}>Amount</th>
                  <th style={s.thRight}>Advance</th>
                  <th style={s.thRight}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map(inv => {
                  const pending = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)
                  return (
                    <tr key={inv.id} style={s.tableRow}>
                      <td style={s.td}>{formatDate(inv.eventDate)}</td>
                      <td style={s.td}>{inv.eventType || 'Photography'}</td>
                      <td style={s.td}>{inv.snapshot?.packageName || inv.packageName || '-'}</td>
                      <td style={s.tdRight}>{fmt(inv.totalAmount)}</td>
                      <td style={{ ...s.tdRight, color: '#15803d' }}>{fmt(inv.paidAmount || 0)}</td>
                      <td style={{ ...s.tdRight, color: pending > 0 ? '#b91c1c' : '#15803d' }}>{fmt(pending)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice History with Actions - Requirement 14.3, 14.4 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>📄 Invoice History</div>
        {invoices.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No invoices yet</div>
        ) : (
          <div style={s.invoiceList}>
            {sortedInvoices.map(inv => {
              const pending = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)
              return (
                <div key={inv.id} style={s.invCard}>
                  <div style={s.invCardTop}>
                    <div>
                      <div style={s.invNum}>{inv.invoiceNumber}</div>
                      <div style={s.invEvent}>{inv.eventType || 'Photography'} {inv.location ? `• ${inv.location}` : ''}</div>
                      <div style={s.invDate}>Event: {formatDate(inv.eventDate)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {statusBadge(inv.status)}
                      <div style={{ marginTop: '4px', fontWeight: '700', color: '#be185d' }}>{fmt(inv.totalAmount)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Paid: {fmt(inv.paidAmount || 0)} | Balance: <span style={{ color: pending > 0 ? '#b91c1c' : '#15803d' }}>{fmt(pending)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Requirement 14.3 */}
                  <div style={s.actionRow}>
                    <button 
                      style={s.actionBtn} 
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      title="View Invoice"
                    >
                      👁️ View Invoice
                    </button>
                    <button 
                      style={s.actionBtn} 
                      onClick={(e) => handleDownloadPDF(inv, e)}
                      disabled={downloadingPdf === inv.id}
                      title="Download PDF"
                    >
                      {downloadingPdf === inv.id ? '⏳ Downloading...' : '📥 Download PDF'}
                    </button>
                    <button 
                      style={s.actionBtn} 
                      onClick={() => navigate(`/invoices/${inv.id}?tab=event`)}
                      title="View Event Details"
                    >
                      📅 View Event
                    </button>
                    <button 
                      style={s.actionBtn} 
                      onClick={() => navigate(`/invoices/${inv.id}?tab=payments`)}
                      title="View Payment Details"
                    >
                      💰 Payment Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '1000px' },
  header: { marginBottom: '20px' },
  backBtn: { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' },
  profile: { background: '#fff', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3', flexWrap: 'wrap' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', fontWeight: '700', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileInfo: { flex: 1 },
  name: { fontSize: '1.4rem', fontWeight: '700', color: '#831843', marginBottom: '6px' },
  contact: { display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.875rem', color: '#6b7280' },
  waBtn: { background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: '600', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(190,24,93,0.07)', border: '1px solid #fce7f3' },
  statVal: { fontSize: '1.1rem', fontWeight: '700', color: '#831843' },
  statLabel: { fontSize: '0.72rem', color: '#9ca3af', marginTop: '4px' },
  section: { background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(190,24,93,0.07)', border: '1px solid #fce7f3' },
  sectionTitle: { fontSize: '0.9rem', fontWeight: '700', color: '#9d174d', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #fdf2f8' },
  
  // Table styles for Event History
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  tableHeaderRow: { background: '#fdf2f8' },
  th: { padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#831843', borderBottom: '2px solid #fce7f3' },
  thRight: { padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#831843', borderBottom: '2px solid #fce7f3' },
  tableRow: { borderBottom: '1px solid #fce7f3' },
  td: { padding: '12px 10px', color: '#374151' },
  tdRight: { padding: '12px 10px', textAlign: 'right', fontWeight: '600' },
  
  // Invoice list styles
  invoiceList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  invCard: { border: '1px solid #fce7f3', borderRadius: '10px', padding: '14px', background: '#fdf2f8' },
  invCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  invNum: { fontWeight: '700', color: '#be185d', fontSize: '0.875rem' },
  invEvent: { fontSize: '0.82rem', color: '#374151', marginTop: '2px' },
  invDate: { fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' },
  
  // Action buttons row
  actionRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #fce7f3' },
  actionBtn: { 
    padding: '6px 12px', 
    fontSize: '0.75rem', 
    fontWeight: '600', 
    border: '1px solid #fce7f3', 
    borderRadius: '6px', 
    background: '#fff', 
    color: '#be185d', 
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
}
