import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const EVENT_TYPES = [
  'Wedding', 'Pre-Wedding', 'Engagement', 'Baby Shower', 'Birthday',
  'Naming Ceremony', 'Anniversary', 'Corporate Event', 'Product Shoot',
  'Family Portrait', 'Maternity Shoot', 'Other',
]

const emptyForm = {
  customerName: '', customerMobile: '', customerEmail: '',
  eventDate: '', bookingDate: new Date().toISOString().split('T')[0],
  location: '', eventType: '', serviceId: '', packageId: '',
  packageName: '', packageDescription: '',
  totalAmount: '', advanceAmount: '', notes: '',
  status: 'advance',
}

export default function InvoiceCreate() {
  const { addInvoice, updateInvoice, getInvoiceById, services, packages } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id) && !window.location.pathname.includes('/new')

  const [form, setForm] = useState(emptyForm)
  const [pkgMode, setPkgMode] = useState('select') // 'select' | 'manual'
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit && id) {
      const inv = getInvoiceById(id)
      if (inv) {
        setForm({
          customerName: inv.customerName || '',
          customerMobile: inv.customerMobile || '',
          customerEmail: inv.customerEmail || '',
          eventDate: inv.eventDate ? inv.eventDate.split('T')[0] : '',
          bookingDate: inv.bookingDate || new Date().toISOString().split('T')[0],
          location: inv.location || '',
          eventType: inv.eventType || '',
          serviceId: inv.serviceId || '',
          packageId: inv.packageId || '',
          packageName: inv.packageName || '',
          packageDescription: inv.packageDescription || '',
          totalAmount: inv.totalAmount || '',
          advanceAmount: inv.advanceAmount || '',
          notes: inv.notes || '',
          status: inv.status || 'pending',
        })
        if (inv.packageId) setPkgMode('select')
        else if (inv.packageName) setPkgMode('manual')
      }
    }
  }, [id, isEdit])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const handlePackageSelect = (pkgId) => {
    if (!pkgId) { set('packageId', ''); return }
    const pkg = packages.find(p => p.id === pkgId)
    if (pkg) {
      setForm(f => ({
        ...f,
        packageId: pkgId,
        packageName: pkg.name,
        packageDescription: pkg.description || '',
        totalAmount: String(pkg.price),
      }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.customerName.trim()) e.customerName = 'Customer name required'
    if (!form.customerMobile.trim()) e.customerMobile = 'Mobile number required'
    else if (!/^[0-9+\s-]{10,15}$/.test(form.customerMobile.trim())) e.customerMobile = 'Enter valid mobile'
    if (!form.totalAmount || Number(form.totalAmount) <= 0) e.totalAmount = 'Total amount required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const data = {
      ...form,
      totalAmount: Number(form.totalAmount),
      advanceAmount: Number(form.advanceAmount || 0),
      paidAmount: Number(form.advanceAmount || 0),
      payments: form.advanceAmount > 0 ? [{
        id: Date.now().toString(),
        amount: Number(form.advanceAmount),
        date: new Date().toISOString(),
        note: 'Advance payment',
      }] : [],
    }

    if (isEdit) {
      updateInvoice(id, data)
      navigate(`/invoices/${id}`)
    } else {
      const inv = addInvoice(data)
      navigate(`/invoices/${inv.id}`)
    }
  }

  const activeServices = services.filter(s => s.active)
  const activePkgs = packages.filter(p => p.active)
  const balance = Number(form.totalAmount || 0) - Number(form.advanceAmount || 0)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1>
          <p style={s.sub}>Fill in the booking details below</p>
        </div>
        <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={s.formGrid}>
        {/* Left column */}
        <div style={s.col}>
          {/* Customer Details */}
          <div style={s.section}>
            <div style={s.sectionTitle}>👤 Customer Details</div>
            <div style={s.field}>
              <label style={s.label}>Customer Name <span style={s.req}>*</span></label>
              <input style={{ ...s.input, ...(errors.customerName ? s.inputErr : {}) }}
                placeholder="Full name" value={form.customerName}
                onChange={e => set('customerName', e.target.value)} />
              {errors.customerName && <div style={s.errMsg}>{errors.customerName}</div>}
            </div>
            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Mobile Number <span style={s.req}>*</span></label>
                <input style={{ ...s.input, ...(errors.customerMobile ? s.inputErr : {}) }}
                  placeholder="+91 XXXXX XXXXX" value={form.customerMobile}
                  onChange={e => set('customerMobile', e.target.value)} />
                {errors.customerMobile && <div style={s.errMsg}>{errors.customerMobile}</div>}
              </div>
              <div style={s.field}>
                <label style={s.label}>Email <span style={s.opt}>(optional)</span></label>
                <input style={s.input} placeholder="customer@email.com"
                  value={form.customerEmail}
                  onChange={e => set('customerEmail', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div style={s.section}>
            <div style={s.sectionTitle}>📅 Event Details</div>
            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Event Type</label>
                <select style={s.input} value={form.eventType} onChange={e => set('eventType', e.target.value)}>
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Event Date</label>
                <input type="date" style={s.input} value={form.eventDate}
                  onChange={e => set('eventDate', e.target.value)} />
              </div>
            </div>
            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Booking Date</label>
                <input type="date" style={s.input} value={form.bookingDate}
                  onChange={e => set('bookingDate', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Location / Venue</label>
                <input style={s.input} placeholder="Event venue or city"
                  value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Notes / Special Instructions</label>
              <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Any special notes, requirements or instructions..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={s.col}>
          {/* Service */}
          <div style={s.section}>
            <div style={s.sectionTitle}>📋 Service</div>
            <div style={s.field}>
              <label style={s.label}>Select Service</label>
              <select style={s.input} value={form.serviceId} onChange={e => set('serviceId', e.target.value)}>
                <option value="">Select a service</option>
                {activeServices.map(sv => (
                  <option key={sv.id} value={sv.id}>{sv.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Package */}
          <div style={s.section}>
            <div style={s.sectionTitle}>📦 Package</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                style={{ ...s.toggleBtn, ...(pkgMode === 'select' ? s.toggleActive : {}) }}
                onClick={() => setPkgMode('select')}>
                Select Package
              </button>
              <button
                style={{ ...s.toggleBtn, ...(pkgMode === 'manual' ? s.toggleActive : {}) }}
                onClick={() => setPkgMode('manual')}>
                Enter Manually
              </button>
            </div>

            {pkgMode === 'select' ? (
              <div style={s.field}>
                <label style={s.label}>Choose Package</label>
                <select style={s.input} value={form.packageId} onChange={e => handlePackageSelect(e.target.value)}>
                  <option value="">Select a package</option>
                  {activePkgs.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')}</option>
                  ))}
                </select>
                {form.packageId && (
                  <div style={s.pkgPreview}>
                    <strong>{form.packageName}</strong>
                    {form.packageDescription && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{form.packageDescription}</div>}
                    <div style={{ color: '#be185d', fontWeight: '700', marginTop: '4px' }}>
                      ₹{Number(form.totalAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={s.field}>
                  <label style={s.label}>Package Name</label>
                  <input style={s.input} placeholder="e.g. Custom Wedding Package"
                    value={form.packageName} onChange={e => set('packageName', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Package Description</label>
                  <input style={s.input} placeholder="What's included..."
                    value={form.packageDescription} onChange={e => set('packageDescription', e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* Payment */}
          <div style={s.section}>
            <div style={s.sectionTitle}>💰 Payment Details</div>
            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Total Amount (₹) <span style={s.req}>*</span></label>
                <input type="number" style={{ ...s.input, ...(errors.totalAmount ? s.inputErr : {}) }}
                  placeholder="0" value={form.totalAmount}
                  onChange={e => set('totalAmount', e.target.value)} />
                {errors.totalAmount && <div style={s.errMsg}>{errors.totalAmount}</div>}
              </div>
              <div style={s.field}>
                <label style={s.label}>Advance Paid (₹)</label>
                <input type="number" style={s.input} placeholder="0"
                  value={form.advanceAmount}
                  onChange={e => set('advanceAmount', e.target.value)} />
              </div>
            </div>
            {form.totalAmount && (
              <div style={s.balanceBox}>
                <div style={s.balRow}>
                  <span>Total Amount</span>
                  <span style={{ fontWeight: '600' }}>₹{Number(form.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={s.balRow}>
                  <span>Advance Paid</span>
                  <span style={{ fontWeight: '600', color: '#15803d' }}>₹{Number(form.advanceAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ ...s.balRow, borderTop: '1px solid #fce7f3', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700' }}>Balance Due</span>
                  <span style={{ fontWeight: '700', color: balance > 0 ? '#b91c1c' : '#15803d', fontSize: '1.1rem' }}>
                    ₹{balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={s.submitBtn} onClick={handleSubmit}>
              {isEdit ? '💾 Update Invoice' : '🧾 Generate Invoice'}
            </button>
            <button style={s.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  backBtn: { background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  col: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(190,24,93,0.07)', border: '1px solid #fce7f3' },
  sectionTitle: { fontSize: '0.9rem', fontWeight: '700', color: '#9d174d', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #fdf2f8' },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
  req: { color: '#ef4444' },
  opt: { color: '#9ca3af', fontWeight: '400' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: '#fff', color: '#1f2937', fontSize: '0.875rem', transition: 'border 0.15s' },
  inputErr: { borderColor: '#ef4444' },
  errMsg: { color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  toggleBtn: { padding: '7px 16px', border: '1.5px solid #fce7f3', borderRadius: '8px', background: '#fdf2f8', color: '#9d174d', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', transition: 'all 0.15s' },
  toggleActive: { background: '#be185d', color: '#fff', borderColor: '#be185d' },
  pkgPreview: { marginTop: '10px', background: '#fdf2f8', borderRadius: '8px', padding: '10px 12px', border: '1px solid #fce7f3' },
  balanceBox: { background: '#fdf2f8', borderRadius: '10px', padding: '12px 14px', marginTop: '4px' },
  balRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.875rem', color: '#374151' },
  submitBtn: { flex: 1, background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(190,24,93,0.3)' },
  cancelBtn: { padding: '12px 20px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' },
}
