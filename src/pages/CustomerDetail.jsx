import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCustomerById, getCustomerInvoices } = useApp()

  const customer = getCustomerById(id)
  if (!customer) return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <div style={{ marginTop: '12px', color: '#9d174d', fontWeight: '600' }}>Customer not found</div>
      <button style={s.backBtn} onClick={() => navigate('/customers')}>← Back</button>
    </div>
  )

  const invoices = getCustomerInvoices(id)
  const totalValue = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0)
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0)
  const pending = totalValue - totalPaid
  const now = new Date()
  const upcoming = invoices.filter(i => i.eventDate && new Date(i.eventDate) > now)
  const past = invoices.filter(i => !i.eventDate || new Date(i.eventDate) <= now)

  const statusBadge = (status) => {
    const map = {
      paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
      partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
      advance: { bg: '#fce7f3', color: '#be185d', label: 'Advance' },
    }
    const st = map[status] || map.advance
    return <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{st.label}</span>
  }

  const InvoiceCard = ({ inv }) => (
    <div style={s.invCard} onClick={() => navigate(`/invoices/${inv.id}`)}>
      <div style={s.invCardTop}>
        <div>
          <div style={s.invNum}>{inv.invoiceNumber}</div>
          <div style={s.invEvent}>{inv.eventType || 'Photography'} {inv.location ? `• ${inv.location}` : ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {statusBadge(inv.status)}
          <div style={{ marginTop: '4px', fontWeight: '700', color: '#be185d' }}>{fmt(inv.totalAmount)}</div>
        </div>
      </div>
      <div style={s.invCardBot}>
        <span>📅 {inv.eventDate ? new Date(inv.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD'}</span>
        <span>💰 Paid: {fmt(inv.paidAmount || 0)}</span>
        <span style={{ color: inv.totalAmount - (inv.paidAmount || 0) > 0 ? '#b91c1c' : '#15803d' }}>
          Balance: {fmt(Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0))}
        </span>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/customers')}>← Customers</button>
      </div>

      {/* Profile */}
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

      {/* Stats */}
      <div style={s.statsGrid}>
        {[
          { label: 'Total Bookings', value: invoices.length, color: '#be185d' },
          { label: 'Total Value', value: fmt(totalValue), color: '#15803d' },
          { label: 'Total Paid', value: fmt(totalPaid), color: '#15803d' },
          { label: 'Pending', value: fmt(pending), color: pending > 0 ? '#b91c1c' : '#15803d' },
          { label: 'Upcoming Events', value: upcoming.length, color: '#1d4ed8' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>📅 Upcoming Events ({upcoming.length})</div>
          {upcoming.map(inv => <InvoiceCard key={inv.id} inv={inv} />)}
        </div>
      )}

      {/* Past Events */}
      <div style={s.section}>
        <div style={s.sectionTitle}>📁 All Bookings ({invoices.length})</div>
        {invoices.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No bookings yet</div>
        ) : (
          invoices.map(inv => <InvoiceCard key={inv.id} inv={inv} />)
        )}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '900px' },
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
  invCard: { border: '1px solid #fce7f3', borderRadius: '10px', padding: '14px', marginBottom: '10px', cursor: 'pointer', transition: 'background 0.1s', background: '#fdf2f8' },
  invCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  invNum: { fontWeight: '700', color: '#be185d', fontSize: '0.875rem' },
  invEvent: { fontSize: '0.82rem', color: '#374151', marginTop: '2px' },
  invCardBot: { display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#6b7280' },
}
