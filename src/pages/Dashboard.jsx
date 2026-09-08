import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function Dashboard() {
  const { getStats, invoices } = useApp()
  const navigate = useNavigate()
  const stats = getStats()

  const cards = [
    {
      label: 'Total Invoices',
      value: stats.totalInvoices,
      icon: '🧾',
      bg: 'linear-gradient(135deg, #be185d, #ec4899)',
      link: '/invoices',
      suffix: '',
      desc: 'All invoices created',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: '👥',
      bg: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      link: '/customers',
      suffix: '',
      desc: 'Registered customers',
    },
    {
      label: 'Total Revenue',
      value: fmt(stats.totalRevenue),
      icon: '💰',
      bg: 'linear-gradient(135deg, #065f46, #10b981)',
      link: '/payments',
      suffix: '',
      desc: 'Gross booking value',
    },
    {
      label: 'Pending Payment',
      value: fmt(stats.pendingPayment),
      icon: '⏳',
      bg: 'linear-gradient(135deg, #b45309, #f59e0b)',
      link: '/payments',
      suffix: '',
      desc: 'Amount yet to collect',
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingPayments,
      icon: '📅',
      bg: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
      link: '/invoices',
      suffix: '',
      desc: 'Future bookings',
    },
  ]

  // Recent invoices
  const recent = invoices.slice(0, 5)

  const statusBadge = (status) => {
    const map = {
      paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
      partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
      advance: { bg: '#fce7f3', color: '#be185d', label: 'Advance' },
    }
    const s = map[status] || map.advance
    return (
      <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
        {s.label}
      </span>
    )
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.subtitle}>Welcome back! Here's your studio overview.</p>
        </div>
        <button style={s.newBtn} onClick={() => navigate('/invoices/new')}>
          + New Invoice
        </button>
      </div>

      {/* Stat cards */}
      <div style={s.grid}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{ ...s.card, background: card.bg }}
            onClick={() => navigate(card.link)}
          >
            <div style={s.cardTop}>
              <div>
                <div style={s.cardLabel}>{card.label}</div>
                <div style={s.cardValue}>{card.value}</div>
                <div style={s.cardDesc}>{card.desc}</div>
              </div>
              <div style={s.cardIcon}>{card.icon}</div>
            </div>
            <div style={s.cardFooter}>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>View details →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Recent Invoices</h2>
          <button style={s.viewAllBtn} onClick={() => navigate('/invoices')}>View All</button>
        </div>
        {recent.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '3rem' }}>📋</div>
            <div style={{ marginTop: '12px', color: '#9d174d', fontWeight: '500' }}>No invoices yet</div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '4px' }}>Create your first invoice to get started</div>
            <button style={{ ...s.newBtn, marginTop: '16px' }} onClick={() => navigate('/invoices/new')}>+ Create Invoice</button>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Invoice #</th>
                  <th style={s.th}>Customer</th>
                  <th style={s.th}>Event</th>
                  <th style={s.th}>Event Date</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.id} style={s.tr}>
                    <td style={s.td}>
                      <span style={{ fontWeight: '600', color: '#be185d' }}>{inv.invoiceNumber}</span>
                    </td>
                    <td style={s.td}>{inv.customerName}</td>
                    <td style={s.td}>{inv.eventType || '—'}</td>
                    <td style={s.td}>{inv.eventDate ? new Date(inv.eventDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={s.td}><strong>{fmt(inv.totalAmount)}</strong></td>
                    <td style={s.td}>{statusBadge(inv.status)}</td>
                    <td style={s.td}>
                      <button style={s.viewBtn} onClick={() => navigate(`/invoices/${inv.id}`)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#831843' },
  subtitle: { color: '#9d174d', marginTop: '4px', fontSize: '0.9rem' },
  newBtn: {
    background: 'linear-gradient(135deg, #be185d, #ec4899)',
    color: '#fff', border: 'none', borderRadius: '10px',
    padding: '10px 20px', fontWeight: '600', cursor: 'pointer',
    fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(190,24,93,0.3)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  card: {
    borderRadius: '16px', padding: '20px', cursor: 'pointer',
    color: '#fff', transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: '0.8rem', opacity: 0.85, fontWeight: '500', marginBottom: '6px' },
  cardValue: { fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.2' },
  cardDesc: { fontSize: '0.7rem', opacity: 0.75, marginTop: '4px' },
  cardIcon: { fontSize: '2rem', opacity: 0.85 },
  cardFooter: { marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', color: '#fff' },
  section: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#831843' },
  viewAllBtn: { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fdf2f8' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#9d174d', borderBottom: '2px solid #fce7f3' },
  tr: { borderBottom: '1px solid #fdf2f8', transition: 'background 0.1s' },
  td: { padding: '12px 14px', fontSize: '0.875rem', color: '#374151' },
  viewBtn: { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '6px', padding: '5px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' },
  empty: { textAlign: 'center', padding: '48px 20px', color: '#9ca3af' },
}
