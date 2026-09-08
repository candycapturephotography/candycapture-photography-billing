import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function Invoices() {
  const { invoices, deleteInvoice } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      inv.customerName?.toLowerCase().includes(q) ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerMobile?.includes(q) ||
      inv.eventType?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchType = filterType === 'all' || getEventCategory(inv.eventDate) === filterType
    return matchSearch && matchStatus && matchType
  })

  function getEventCategory(eventDate) {
    if (!eventDate) return 'past'
    const d = new Date(eventDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (d < now) return 'past'
    if (d.toDateString() === now.toDateString()) return 'today'
    return 'upcoming'
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

  const eventBadge = (eventDate) => {
    const cat = getEventCategory(eventDate)
    const map = {
      past: { bg: '#f3f4f6', color: '#6b7280', label: 'Past' },
      today: { bg: '#dbeafe', color: '#1d4ed8', label: 'Today' },
      upcoming: { bg: '#fce7f3', color: '#be185d', label: 'Upcoming' },
    }
    const b = map[cat]
    return <span style={{ background: b.bg, color: b.color, padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '500' }}>{b.label}</span>
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete invoice for ${name}? This cannot be undone.`)) {
      deleteInvoice(id)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Invoices</h1>
          <p style={s.sub}>{invoices.length} total invoices</p>
        </div>
        <button style={s.newBtn} onClick={() => navigate('/invoices/new')}>+ New Invoice</button>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input
          style={s.search}
          placeholder="🔍 Search by name, mobile, invoice no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="advance">Advance</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <select style={s.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Events</option>
          <option value="upcoming">Upcoming</option>
          <option value="today">Today</option>
          <option value="past">Past</option>
        </select>
      </div>

      {/* Table */}
      <div style={s.card}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '3rem' }}>🧾</div>
            <div style={{ marginTop: '12px', fontWeight: '600', color: '#9d174d' }}>No invoices found</div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '4px' }}>
              {invoices.length === 0 ? 'Create your first invoice' : 'Try changing filters'}
            </div>
            {invoices.length === 0 && (
              <button style={{ ...s.newBtn, marginTop: '16px' }} onClick={() => navigate('/invoices/new')}>+ Create Invoice</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Invoice #</th>
                  <th style={s.th}>Customer</th>
                  <th style={s.th}>Mobile</th>
                  <th style={s.th}>Event Type</th>
                  <th style={s.th}>Event Date</th>
                  <th style={s.th}>Location</th>
                  <th style={s.th}>Total</th>
                  <th style={s.th}>Paid</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} style={s.tr}>
                    <td style={s.td}>
                      <span style={{ fontWeight: '700', color: '#be185d', cursor: 'pointer' }}
                        onClick={() => navigate(`/invoices/${inv.id}`)}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: '500' }}>{inv.customerName}</div>
                      {inv.customerEmail && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{inv.customerEmail}</div>}
                    </td>
                    <td style={s.td}>{inv.customerMobile}</td>
                    <td style={s.td}>{inv.eventType || '—'}</td>
                    <td style={s.td}>
                      <div>{inv.eventDate ? new Date(inv.eventDate).toLocaleDateString('en-IN') : '—'}</div>
                      {inv.eventDate && <div style={{ marginTop: '2px' }}>{eventBadge(inv.eventDate)}</div>}
                    </td>
                    <td style={s.td}>{inv.location || '—'}</td>
                    <td style={s.td}><strong>{fmt(inv.totalAmount)}</strong></td>
                    <td style={s.td}>{fmt(inv.paidAmount || 0)}</td>
                    <td style={s.td}>{statusBadge(inv.status)}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button style={s.btnView} onClick={() => navigate(`/invoices/${inv.id}`)}>View</button>
                        <button style={s.btnEdit} onClick={() => navigate(`/invoices/${inv.id}/edit`)}>Edit</button>
                        <button style={s.btnDel} onClick={() => handleDelete(inv.id, inv.customerName)}>Del</button>
                      </div>
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
  page: { padding: '32px', maxWidth: '1400px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  newBtn: { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(190,24,93,0.3)' },
  filters: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  search: { flex: 1, minWidth: '220px', padding: '10px 14px', border: '1.5px solid #fce7f3', borderRadius: '10px', background: '#fff', color: '#374151', fontSize: '0.875rem' },
  select: { padding: '10px 14px', border: '1.5px solid #fce7f3', borderRadius: '10px', background: '#fff', color: '#374151', fontSize: '0.875rem', cursor: 'pointer' },
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3', overflow: 'hidden' },
  empty: { textAlign: 'center', padding: '56px 20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fdf2f8' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: '600', color: '#9d174d', borderBottom: '2px solid #fce7f3', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #fdf2f8' },
  td: { padding: '12px 14px', fontSize: '0.84rem', color: '#374151', verticalAlign: 'top' },
  btnView: { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '6px', padding: '4px 10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' },
  btnEdit: { background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', padding: '4px 10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' },
  btnDel: { background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' },
}
