import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PackageSelector from '../components/Invoice/PackageSelector.jsx'
import LineItemEditor from '../components/Invoice/LineItemEditor.jsx'
import { calculateInvoiceTotal, calculatePendingAmount } from '../utils/invoiceCalculations.js'
import { generateWhatsAppUrl } from '../utils/whatsappUtils.js'
import { generatePDF } from '../utils/pdfGenerator.jsx'

const EVENT_TYPES = [
  'Wedding', 'Pre-Wedding', 'Engagement', 'Baby Shower', 'Birthday',
  'Naming Ceremony', 'Anniversary', 'Corporate Event', 'Product Shoot',
  'Family Portrait', 'Maternity Shoot', 'Other',
]

const emptyForm = {
  customerName: '',
  customerMobile: '',
  customerEmail: '',
  eventDate: '',
  eventType: '',
  selectedPackageId: '',
  lineItems: [],
  advanceAmount: '',
  notes: '',
}

// Format currency
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

// Format date
const fmtDate = (dateStr) => {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Generate WhatsApp booking confirmation message with PDF note
const generateBookingMessage = (invoice, studio) => {
  const balance = Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)
  
  let msg = '*🎉 Booking Confirmed!*\n\n'
  msg += 'Hello *' + invoice.customerName + '*! 👋\n\n'
  msg += 'Thank you for choosing *' + (studio?.name || 'Candy Capture Photography') + '*!\n'
  msg += 'Your booking has been confirmed. ✅\n\n'
  
  msg += '━━━━━━━━━━━━━━━━━━━━\n'
  msg += '📄 *INVOICE DETAILS*\n'
  msg += '━━━━━━━━━━━━━━━━━━━━\n\n'
  
  msg += '📌 Invoice No: *' + invoice.invoiceNumber + '*\n'
  msg += '🎉 Event: ' + (invoice.eventType || 'Photography') + '\n'
  msg += '📅 Event Date: *' + fmtDate(invoice.eventDate) + '*\n'
  if (invoice.packageName) {
    msg += '📦 Package: ' + invoice.packageName + '\n'
  }
  msg += '\n'
  
  msg += '━━━━━━━━━━━━━━━━━━━━\n'
  msg += '💰 *PAYMENT SUMMARY*\n'
  msg += '━━━━━━━━━━━━━━━━━━━━\n\n'
  
  msg += 'Total Amount: *' + fmt(invoice.totalAmount) + '*\n'
  msg += 'Advance Paid: ' + fmt(invoice.paidAmount || 0) + '\n'
  msg += 'Balance Due: *' + fmt(balance) + '*\n\n'
  
  if (balance > 0) {
    msg += '⚠️ _Please clear the balance before the event date._\n\n'
  }
  
  msg += '📎 *Invoice PDF attached separately*\n\n'
  
  msg += '━━━━━━━━━━━━━━━━━━━━\n\n'
  msg += 'Looking forward to capturing your special moments! 📸✨\n\n'
  
  msg += '*' + (studio?.signature || studio?.name || 'Candy Capture Photography') + '*\n'
  if (studio?.mobile) msg += '📞 ' + studio.mobile + '\n'
  if (studio?.instagram) msg += '📱 ' + studio.instagram + '\n'
  
  return msg
}

export default function NewInvoice() {
  const { addInvoice, updateInvoice, getInvoiceById, packages, studio } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id) && !window.location.pathname.includes('/new')

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Get selected package details
  const selectedPackage = form.selectedPackageId 
    ? packages.find(p => p.id === form.selectedPackageId) 
    : null
  const packagePrice = selectedPackage?.price || 0

  // Calculate totals using utility function
  const { total: calculatedTotal, customItemsTotal } = calculateInvoiceTotal(packagePrice, form.lineItems)
  const advanceAmount = Number(form.advanceAmount) || 0
  const pendingAmount = calculatePendingAmount(calculatedTotal, advanceAmount)

  // Load existing invoice data for edit mode
  useEffect(() => {
    if (isEdit && id) {
      const inv = getInvoiceById(id)
      if (inv) {
        setForm({
          customerName: inv.customerName || '',
          customerMobile: inv.customerMobile || '',
          customerEmail: inv.customerEmail || '',
          eventDate: inv.eventDate ? inv.eventDate.split('T')[0] : '',
          eventType: inv.eventType || '',
          selectedPackageId: inv.selectedPackageId || '',
          lineItems: inv.lineItems || [],
          advanceAmount: inv.advanceAmount || '',
          notes: inv.notes || '',
        })
      }
    }
  }, [id, isEdit, getInvoiceById])

  // Update form field
  const updateField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  // Handle package selection
  const handlePackageSelect = (packageId) => {
    updateField('selectedPackageId', packageId)
    
    if (packageId) {
      const pkg = packages.find(p => p.id === packageId)
      if (pkg && pkg.services && pkg.services.length > 0) {
        const lineItems = pkg.services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          quantity: service.quantity || 1,
          isCustom: false,
        }))
        updateField('lineItems', lineItems)
      } else {
        updateField('lineItems', [])
      }
    } else {
      updateField('lineItems', [])
    }
  }

  // Handle line items update
  const handleLineItemsUpdate = (updatedItems) => {
    updateField('lineItems', updatedItems)
  }

  // Validation
  const validate = () => {
    const e = {}
    if (!form.customerName.trim()) e.customerName = 'Customer name is required'
    if (!form.customerMobile.trim()) e.customerMobile = 'Mobile number is required'
    else if (!/^[0-9+\s-]{10,15}$/.test(form.customerMobile.trim())) e.customerMobile = 'Enter a valid mobile number'
    if (!form.eventDate) e.eventDate = 'Event date is required'
    if (!form.selectedPackageId && calculatedTotal <= 0) e.package = 'Please select a package or add custom services'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Send WhatsApp notification with PDF
  const sendWhatsAppWithPDF = async (invoice) => {
    const phoneNumber = invoice.customerMobile
    if (!phoneNumber) return
    
    // Step 1: Download PDF automatically
    await generatePDF(invoice, studio)
    
    // Step 2: Small delay to ensure PDF download started
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Step 3: Open WhatsApp with message
    const message = generateBookingMessage(invoice, studio)
    const whatsappUrl = generateWhatsAppUrl(phoneNumber, message)
    window.open(whatsappUrl, '_blank')
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!validate()) return

    setIsGenerating(true)

    const data = {
      customerName: form.customerName.trim(),
      customerMobile: form.customerMobile.trim(),
      customerEmail: form.customerEmail.trim(),
      eventDate: form.eventDate,
      eventType: form.eventType,
      selectedPackageId: form.selectedPackageId,
      packageName: selectedPackage?.name || '',
      packageDescription: selectedPackage?.description || '',
      lineItems: form.lineItems,
      totalAmount: calculatedTotal,
      advanceAmount: advanceAmount,
      notes: form.notes,
    }

    try {
      if (isEdit) {
        updateInvoice(id, data)
        navigate('/invoices/' + id)
      } else {
        // Create new invoice
        const inv = addInvoice(data)
        
        // Auto-download PDF and open WhatsApp
        await sendWhatsAppWithPDF(inv)
        
        // Navigate to invoice view
        navigate('/invoices/' + inv.id)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Format price
  const formatPrice = (price) => {
    return '₹' + Number(price || 0).toLocaleString('en-IN')
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1>
          <p style={styles.subtitle}>Fill in the booking details below</p>
        </div>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div style={styles.formGrid}>
        {/* Left Column */}
        <div style={styles.column}>
          {/* Customer Info Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👤 Customer Information</div>
            
            <div style={styles.field}>
              <label style={styles.label}>
                Customer Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={{ ...styles.input, ...(errors.customerName ? styles.inputError : {}) }}
                placeholder="Full name"
                value={form.customerName}
                onChange={e => updateField('customerName', e.target.value)}
              />
              {errors.customerName && <div style={styles.errorMsg}>{errors.customerName}</div>}
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Mobile Number <span style={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  style={{ ...styles.input, ...(errors.customerMobile ? styles.inputError : {}) }}
                  placeholder="+91 XXXXX XXXXX"
                  value={form.customerMobile}
                  onChange={e => updateField('customerMobile', e.target.value)}
                />
                {errors.customerMobile && <div style={styles.errorMsg}>{errors.customerMobile}</div>}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>
                  Email <span style={styles.optional}>(optional)</span>
                </label>
                <input
                  type="email"
                  style={styles.input}
                  placeholder="customer@email.com"
                  value={form.customerEmail}
                  onChange={e => updateField('customerEmail', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Event Info Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📅 Event Information</div>
            
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Event Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  style={{ ...styles.input, ...(errors.eventDate ? styles.inputError : {}) }}
                  value={form.eventDate}
                  onChange={e => updateField('eventDate', e.target.value)}
                />
                {errors.eventDate && <div style={styles.errorMsg}>{errors.eventDate}</div>}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Event Type</label>
                <select
                  style={styles.input}
                  value={form.eventType}
                  onChange={e => updateField('eventType', e.target.value)}
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Notes / Special Instructions</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Any special notes, requirements or instructions..."
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.column}>
          {/* Package Selection Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📦 Package Selection</div>
            {errors.package && <div style={styles.errorMsg}>{errors.package}</div>}
            <PackageSelector
              packages={packages}
              selectedPackageId={form.selectedPackageId}
              onSelect={handlePackageSelect}
            />
          </div>

          {/* Line Items Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📋 Line Items / Services</div>
            <LineItemEditor
              lineItems={form.lineItems}
              onUpdate={handleLineItemsUpdate}
              packagePrice={packagePrice}
            />
          </div>

          {/* Payment Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>💰 Payment Details</div>
            
            <div style={styles.paymentRow}>
              <div style={styles.paymentLabel}>Total Amount</div>
              <div style={styles.paymentValueLarge}>{formatPrice(calculatedTotal)}</div>
            </div>
            
            {customItemsTotal > 0 && (
              <div style={styles.paymentBreakdown}>
                <div style={styles.breakdownRow}>
                  <span>Package Base Price</span>
                  <span>{formatPrice(packagePrice)}</span>
                </div>
                <div style={styles.breakdownRow}>
                  <span>Custom Services</span>
                  <span>+{formatPrice(customItemsTotal)}</span>
                </div>
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Advance Payment (₹)</label>
              <input
                type="number"
                style={styles.input}
                placeholder="0"
                min="0"
                max={calculatedTotal}
                value={form.advanceAmount}
                onChange={e => updateField('advanceAmount', e.target.value)}
              />
            </div>

            <div style={styles.pendingBox}>
              <div style={styles.pendingRow}>
                <span>Total Amount</span>
                <span style={styles.pendingValue}>{formatPrice(calculatedTotal)}</span>
              </div>
              <div style={styles.pendingRow}>
                <span>Advance Paid</span>
                <span style={{ ...styles.pendingValue, color: '#15803d' }}>
                  - {formatPrice(advanceAmount)}
                </span>
              </div>
              <div style={styles.pendingDivider} />
              <div style={styles.pendingRow}>
                <span style={styles.pendingLabel}>Pending Amount</span>
                <span style={{ 
                  ...styles.pendingTotal, 
                  color: pendingAmount > 0 ? '#dc2626' : '#15803d' 
                }}>
                  {formatPrice(pendingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={styles.actions}>
            <button 
              style={{ ...styles.submitBtn, opacity: isGenerating ? 0.7 : 1 }} 
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating 
                ? '⏳ Generating...' 
                : isEdit 
                  ? '💾 Update Invoice' 
                  : '🧾 Generate Invoice & Send WhatsApp'}
            </button>
            <button style={styles.cancelBtn} onClick={() => navigate(-1)} disabled={isGenerating}>
              Cancel
            </button>
          </div>
          
          {!isEdit && (
            <div style={styles.whatsappNote}>
              <span style={styles.whatsappIcon}>💬</span>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '2px' }}>Auto WhatsApp + PDF</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  Invoice PDF will download automatically, then WhatsApp opens. Just attach the PDF and send!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '32px',
    maxWidth: '1200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#831843',
    margin: 0,
  },
  subtitle: {
    color: '#9d174d',
    fontSize: '0.875rem',
    marginTop: '4px',
    margin: 0,
  },
  backBtn: {
    background: '#fce7f3',
    color: '#be185d',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(190, 24, 93, 0.07)',
    border: '1px solid #fce7f3',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#9d174d',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid #fdf2f8',
  },
  field: {
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '6px',
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '9px',
    background: '#fff',
    color: '#1f2937',
    fontSize: '0.875rem',
    transition: 'border 0.15s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: '0.75rem',
    marginTop: '4px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
    marginBottom: '14px',
  },
  paymentLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
  },
  paymentValueLarge: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#be185d',
  },
  paymentBreakdown: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '14px',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#6b7280',
    padding: '3px 0',
  },
  pendingBox: {
    background: '#fdf2f8',
    borderRadius: '12px',
    padding: '14px',
    marginTop: '8px',
  },
  pendingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: '0.875rem',
    color: '#374151',
  },
  pendingValue: {
    fontWeight: '600',
  },
  pendingDivider: {
    height: '1px',
    background: '#fce7f3',
    margin: '8px 0',
  },
  pendingLabel: {
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  pendingTotal: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  submitBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.95rem',
    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
    transition: 'all 0.15s ease',
  },
  cancelBtn: {
    padding: '14px 24px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease',
  },
  whatsappNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #dcfce7, #d1fae5)',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  whatsappIcon: {
    fontSize: '1.4rem',
  },
}