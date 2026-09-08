import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function Customers() {
  const { customers, invoices, deleteCustomer } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q ||
      c.name?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.email?.toLowerCase().includes(q)
  })

  const getCustomerStats = (customer) => {
    const invs = invoices.filter(inv => (customer.invoiceIds || []).includes(inv.id))
    const totalBookings = invs.length
    const totalValue = invs.reduce((s, i) => s + Number(i.totalAmount || 0), 0)
    const totalPaid = invs.reduce((s, i) => s + Number(i.paidAmount || 0), 0)
    const pending = totalValue - totalPaid
    const upcoming = invs.filter(i => i.eventDate && new Date(i.eventDate) > new Date()).length
    return { totalBookings, totalValue, pending, upcoming }
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove customer ${name}? Their invoices will remain.`)) {
      deleteCustomer(id)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Customers</h1>
          <p style={s.sub}>{customers.length} registered customers</p>
        </div>
      </div>

      <div style={s.filterRow}>
        <input
          style={s.search}
          placeholder="🔍 Search by name, mobile, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: '3rem' }}>👥</div>
          <div style={{ marginTop: '12px', fontWeight: '600', color: '#9d174d' }}>No customers yet</div>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '4px' }}>
            Customers are added automatically when you create invoices
          </div>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(customer => {
            const stats = getCustomerStats(customer)
            return (
              <div key={customer.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>
                    {customer.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={s.info}>
                    <div style={s.name}>{customer.name}</div>
                    <div style={s.mobile}>📞 {customer.mobile}</div>
                    {customer.email && <div style={s.email}>✉️ {customer.email}</div>}
                  </div>
                </div>

                <div style={s.statsRow}>
                  <div style={s.statBox}>
                    <div style={s.statVal}>{stats.totalBookings}</div>
                    <div style={s.statLabel}>Bookings</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={s.statVal}>{fmt(stats.totalValue)}</div>
                    <div style={s.statLabel}>Total Value</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ ...s.statVal, color: stats.pending > 0 ? '#b91c1c' : '#15803d' }}>
                      {fmt(stats.pending)}
                    </div>
                    <div style={s.statLabel}>Pending</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ ...s.statVal, color: '#1d4ed8' }}>{stats.upcoming}</div>
                    <div style={s.statLabel}>Upcoming</div>
                  </div>
                </div>

                <div style={s.cardActions}>
                  <button style={s.viewBtn} onClick={() => navigate(`/customers/${customer.id}`)}>View Details</button>
                  <button style={s.delBtn} onClick={() => handleDelete(customer.id, customer.name)}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  filterRow: { marginBottom: '20px' },
  search: { width: '100%', maxWidth: '400px', padding: '10px 14px', border: '1.5px solid #fce7f3', borderRadius: '10px', background: '#fff', fontSize: '0.875rem', color: '#374151' },
  empty: { background: '#fff', borderRadius: '16px', padding: '56px 20px', textAlign: 'center', border: '1px solid #fce7f3' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3', transition: 'transform 0.15s, box-shadow 0.15s' },
  cardTop: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #be185d, #ec4899)',
    color: '#fff', fontWeight: '700', fontSize: '1.3rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: '1rem', color: '#1f2937', marginBottom: '2px' },
  mobile: { fontSize: '0.82rem', color: '#6b7280' },
  email: { fontSize: '0.78rem', color: '#9ca3af' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px', background: '#fdf2f8', borderRadius: '10px', padding: '10px' },
  statBox: { textAlign: 'center' },
  statVal: { fontWeight: '700', fontSize: '0.85rem', color: '#831843' },
  statLabel: { fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' },
  cardActions: { display: 'flex', gap: '8px' },
  viewBtn: { flex: 1, background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem' },
  delBtn: { padding: '8px 14px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem' },
}
