import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function Payments() {
  const { invoices, addPayment } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })

  const now = new Date()

  // Categorize
  const allUnpaid = invoices.filter(i => i.status !== 'paid')
  const advance   = invoices.filter(i => i.status === 'advance')
  const partial   = invoices.filter(i => i.status === 'partial')
  const upcoming  = invoices.filter(i => i.status !== 'paid' && i.eventDate && new Date(i.eventDate) > now)
  const overdue   = invoices.filter(i => i.status !== 'paid' && i.eventDate && new Date(i.eventDate) < now)

  const tabData = {
    all: allUnpaid,
    advance,
    partial,
    upcoming,
    overdue,
  }

  const filtered = (tabData[tab] || []).filter(inv => {
    const q = search.toLowerCase()
    return !q ||
      inv.customerName?.toLowerCase().includes(q) ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerMobile?.includes(q)
  })

  // Overall stats
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0)
  const totalCollected = invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0)
  const totalPending = totalRevenue - totalCollected

  const openPayModal = (inv) => {
    setPayModal(inv)
    setPayForm({ amount: String(Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)), date: new Date().toISOString().split('T')[0], note: '' })
  }

  const handlePay = () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) return
    addPayment(payModal.id, payForm)
    setPayModal(null)
  }

  const statusBadge = (status) => {
    const map = {
      paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
      partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
      advance: { bg: '#fce7f3', color: '#be185d', label: 'Advance' },
    }
    const st = map[status] || map.advance
    return <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' }}>{st.label}</span>
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Payments</h1>
          <p style={s.sub}>Track all payments and follow-ups</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), color: '#15803d', bg: '#dcfce7', icon: '💰' },
          { label: 'Collected', value: fmt(totalCollected), color: '#1d4ed8', bg: '#dbeafe', icon: '✅' },
          { label: 'Pending', value: fmt(totalPending), color: '#b91c1c', bg: '#fee2e2', icon: '⏳' },
          { label: 'Advance',         value: advance.length,    color: '#be185d', bg: '#fce7f3', icon: '📋' },
          { label: 'Upcoming Events', value: upcoming.length, color: '#be185d', bg: '#fce7f3', icon: '📅' },
        ].map(stat => (
          <div key={stat.label} style={{ ...s.statCard, background: stat.bg }}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[
        { key: 'all',      label: `All Unpaid (${allUnpaid.length})` },
          { key: 'advance',  label: `Advance (${advance.length})` },
          { key: 'partial',  label: `Partial (${partial.length})` },
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'overdue',  label: `Overdue (${overdue.length})` },
        ].map(t => (
          <button key={t.key}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          style={s.search}
          placeholder="🔍 Search customer, invoice..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={s.card}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <div style={{ marginTop: '8px', fontWeight: '600', color: '#15803d' }}>
              {tab === 'all' ? 'No pending payments!' : `No ${tab} payments`}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Invoice #</th>
                  <th style={s.th}>Customer</th>
                  <th style={s.th}>Event</th>
                  <th style={s.th}>Event Date</th>
                  <th style={s.th}>Total</th>
                  <th style={s.th}>Paid</th>
                  <th style={s.th}>Balance</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)
                  const isOverdue = inv.eventDate && new Date(inv.eventDate) < now
                  return (
                    <tr key={inv.id} style={{ ...s.tr, ...(isOverdue ? { background: '#fff9f9' } : {}) }}>
                      <td style={s.td}>
                        <span style={{ fontWeight: '700', color: '#be185d', cursor: 'pointer' }}
                          onClick={() => navigate(`/invoices/${inv.id}`)}>
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: '500' }}>{inv.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{inv.customerMobile}</div>
                      </td>
                      <td style={s.td}>{inv.eventType || '—'}</td>
                      <td style={s.td}>
                        {inv.eventDate ? (
                          <div>
                            <div>{new Date(inv.eventDate).toLocaleDateString('en-IN')}</div>
                            {isOverdue && <div style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: '600' }}>⚠️ Overdue</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={s.td}><strong>{fmt(inv.totalAmount)}</strong></td>
                      <td style={s.td}><span style={{ color: '#15803d', fontWeight: '500' }}>{fmt(inv.paidAmount || 0)}</span></td>
                      <td style={s.td}><strong style={{ color: '#b91c1c' }}>{fmt(balance)}</strong></td>
                      <td style={s.td}>{statusBadge(inv.status)}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={s.payBtn} onClick={() => openPayModal(inv)}>+ Pay</button>
                          <button style={s.waBtn} onClick={() => {
                            const mobile = inv.customerMobile?.replace(/\D/g, '')
                            const num = mobile?.startsWith('91') ? mobile : `91${mobile}`
                            const msg = encodeURIComponent(
                              `Hello ${inv.customerName}! 🌸\n\n` +
                              `This is a payment reminder from *${inv.studioName || 'Candy Capture Photography'}*.\n\n` +
                              `📋 Invoice: ${inv.invoiceNumber}\n` +
                              `💰 Balance Due: ${fmt(balance)}\n\n` +
                              `Please arrange the payment at your earliest convenience.\n\n` +
                              `Thank you! 🙏`
                            )
                            window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
                          }}>📲</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment modal */}
      {payModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>💵 Record Payment</div>
            <div style={{ marginBottom: '16px', background: '#fdf2f8', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontWeight: '600', color: '#831843' }}>{payModal.customerName}</div>
              <div style={{ fontSize: '0.82rem', color: '#9d174d' }}>{payModal.invoiceNumber}</div>
              <div style={{ marginTop: '6px', fontSize: '0.875rem' }}>
                Balance: <strong style={{ color: '#b91c1c' }}>{fmt(Number(payModal.totalAmount || 0) - Number(payModal.paidAmount || 0))}</strong>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Amount Received (₹)</label>
              <input type="number" style={s.input} placeholder="Enter amount"
                value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Payment Date</label>
              <input type="date" style={s.input} value={payForm.date}
                onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Note</label>
              <input style={s.input} placeholder="e.g. 2nd installment, Final payment"
                value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.saveBtn} onClick={handlePay}>Save Payment</button>
              <button style={s.cancelBtn} onClick={() => setPayModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '1300px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.5)' },
  statIcon: { fontSize: '1.4rem', marginBottom: '4px' },
  statVal: { fontSize: '1.05rem', fontWeight: '700' },
  statLabel: { fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' },
  tabs: { display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' },
  tab: { padding: '8px 14px', border: '1.5px solid #fce7f3', borderRadius: '8px', background: '#fff', color: '#9d174d', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  tabActive: { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: '1.5px solid transparent', fontWeight: '700' },
  search: { padding: '10px 14px', border: '1.5px solid #fce7f3', borderRadius: '10px', background: '#fff', fontSize: '0.875rem', color: '#374151', width: '100%', maxWidth: '360px' },
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3', overflow: 'hidden' },
  empty: { padding: '48px', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fdf2f8' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: '600', color: '#9d174d', borderBottom: '2px solid #fce7f3', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #fdf2f8' },
  td: { padding: '11px 14px', fontSize: '0.84rem', color: '#374151', verticalAlign: 'middle' },
  payBtn: { background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', padding: '5px 10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' },
  waBtn: { background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', padding: '5px 10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.78rem' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#831843', marginBottom: '16px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '0.875rem', color: '#1f2937' },
  saveBtn: { flex: 1, background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { padding: '10px 18px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '9px', fontWeight: '600', cursor: 'pointer' },
}
