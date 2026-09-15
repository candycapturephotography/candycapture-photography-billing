import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Reports() {
  const { invoices } = useApp()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Generate monthly summary for the year
  const monthlyData = useMemo(() => {
    const data = []
    
    for (let month = 0; month < 12; month++) {
      const monthInvoices = invoices.filter(inv => {
        const date = inv.eventDate ? new Date(inv.eventDate) : (inv.createdAt ? new Date(inv.createdAt) : null)
        if (!date) return false
        return date.getMonth() === month && date.getFullYear() === selectedYear
      })
      
      const totalAmount = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0)
      const paidAmount = monthInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0)
      const pendingAmount = totalAmount - paidAmount
      const invoiceCount = monthInvoices.length
      
      data.push({
        month: MONTHS[month],
        monthIndex: month,
        invoiceCount,
        totalAmount,
        paidAmount,
        pendingAmount,
        invoices: monthInvoices,
      })
    }
    
    return data
  }, [invoices, selectedYear])

  // Yearly totals
  const yearlyTotals = useMemo(() => {
    return monthlyData.reduce((acc, m) => ({
      invoiceCount: acc.invoiceCount + m.invoiceCount,
      totalAmount: acc.totalAmount + m.totalAmount,
      paidAmount: acc.paidAmount + m.paidAmount,
      pendingAmount: acc.pendingAmount + m.pendingAmount,
    }), { invoiceCount: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 })
  }, [monthlyData])

  // Available years (from invoices)
  const availableYears = useMemo(() => {
    const years = new Set()
    invoices.forEach(inv => {
      const date = inv.eventDate ? new Date(inv.eventDate) : (inv.createdAt ? new Date(inv.createdAt) : null)
      if (date) years.add(date.getFullYear())
    })
    // Add current year and next year
    years.add(currentYear)
    years.add(currentYear + 1)
    return Array.from(years).sort((a, b) => b - a)
  }, [invoices, currentYear])

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📊 Billing Reports</h1>
          <p style={s.sub}>Monthly billing summary and statistics</p>
        </div>
        <select style={s.yearSelect} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Yearly Summary Cards */}
      <div style={s.summaryGrid}>
        <div style={s.summaryCard}>
          <div style={s.summaryIcon}>🧾</div>
          <div style={s.summaryValue}>{yearlyTotals.invoiceCount}</div>
          <div style={s.summaryLabel}>Total Invoices</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryIcon}>💰</div>
          <div style={s.summaryValue}>{fmt(yearlyTotals.totalAmount)}</div>
          <div style={s.summaryLabel}>Total Billing</div>
        </div>
        <div style={{ ...s.summaryCard, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
          <div style={s.summaryIcon}>✅</div>
          <div style={{ ...s.summaryValue, color: '#15803d' }}>{fmt(yearlyTotals.paidAmount)}</div>
          <div style={s.summaryLabel}>Received</div>
        </div>
        <div style={{ ...s.summaryCard, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
          <div style={s.summaryIcon}>⏳</div>
          <div style={{ ...s.summaryValue, color: '#b45309' }}>{fmt(yearlyTotals.pendingAmount)}</div>
          <div style={s.summaryLabel}>Pending</div>
        </div>
      </div>

      {/* Monthly Table */}
      <div style={s.tableCard}>
        <h2 style={s.tableTitle}>Monthly Breakdown - {selectedYear}</h2>
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr style={s.tableHeader}>
                <th style={s.th}>Month</th>
                <th style={s.th}>Invoices</th>
                <th style={s.th}>Total Billing</th>
                <th style={s.th}>Received</th>
                <th style={s.th}>Pending</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, i) => {
                const isCurrentMonth = m.monthIndex === new Date().getMonth() && selectedYear === currentYear
                return (
                  <tr key={m.month} style={{ ...s.tableRow, ...(isCurrentMonth ? s.currentMonth : {}) }}>
                    <td style={s.td}>
                      <span style={s.monthName}>{m.month}</span>
                      {isCurrentMonth && <span style={s.currentBadge}>Current</span>}
                    </td>
                    <td style={s.td}>
                      <span style={s.invoiceCount}>{m.invoiceCount}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.amount}>{fmt(m.totalAmount)}</span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.amount, color: '#15803d' }}>{fmt(m.paidAmount)}</span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.amount, color: m.pendingAmount > 0 ? '#b45309' : '#15803d' }}>
                        {fmt(m.pendingAmount)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={s.totalRow}>
                <td style={s.tdTotal}><strong>TOTAL ({selectedYear})</strong></td>
                <td style={s.tdTotal}><strong>{yearlyTotals.invoiceCount}</strong></td>
                <td style={s.tdTotal}><strong>{fmt(yearlyTotals.totalAmount)}</strong></td>
                <td style={{ ...s.tdTotal, color: '#15803d' }}><strong>{fmt(yearlyTotals.paidAmount)}</strong></td>
                <td style={{ ...s.tdTotal, color: '#b45309' }}><strong>{fmt(yearlyTotals.pendingAmount)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Info */}
      <div style={s.infoBox}>
        <div style={s.infoTitle}>📌 Report Period</div>
        <div style={s.infoText}>
          This report shows billing data for <strong>{selectedYear}</strong> based on event dates.
          Total invoices: {yearlyTotals.invoiceCount} | 
          Collection Rate: {yearlyTotals.totalAmount > 0 ? Math.round((yearlyTotals.paidAmount / yearlyTotals.totalAmount) * 100) : 0}%
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { padding: '24px', maxWidth: '1100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  yearSelect: { padding: '10px 20px', border: '2px solid #fce7f3', borderRadius: '10px', background: '#fff', color: '#831843', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  
  // Summary cards
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  summaryCard: { background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #fce7f3' },
  summaryIcon: { fontSize: '2rem', marginBottom: '8px' },
  summaryValue: { fontSize: '1.5rem', fontWeight: '800', color: '#831843' },
  summaryLabel: { fontSize: '0.8rem', color: '#9d174d', marginTop: '4px', fontWeight: '500' },
  
  // Table
  tableCard: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3', marginBottom: '20px' },
  tableTitle: { fontSize: '1rem', fontWeight: '700', color: '#831843', marginBottom: '16px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  tableHeader: { background: '#fdf2f8' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#831843', borderBottom: '2px solid #fce7f3' },
  tableRow: { borderBottom: '1px solid #fce7f3' },
  currentMonth: { background: '#fef3c7' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  monthName: { fontWeight: '600', color: '#374151' },
  currentBadge: { marginLeft: '8px', background: '#fbbf24', color: '#78350f', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '600' },
  invoiceCount: { background: '#fdf2f8', color: '#be185d', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '0.8rem' },
  amount: { fontWeight: '600', color: '#374151' },
  totalRow: { background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
  tdTotal: { padding: '14px 16px', fontWeight: '700', color: '#831843', borderTop: '2px solid #be185d' },
  
  // Info box
  infoBox: { background: '#f0f9ff', borderRadius: '12px', padding: '16px', border: '1px solid #bae6fd' },
  infoTitle: { fontWeight: '700', color: '#0369a1', marginBottom: '6px' },
  infoText: { fontSize: '0.85rem', color: '#0c4a6e', lineHeight: '1.5' },
}
