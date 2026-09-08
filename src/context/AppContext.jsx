import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

// ── helpers ────────────────────────────────────────────────────────────────
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

const generateInvoiceNumber = (invoices) => {
  const year = new Date().getFullYear()
  const count = invoices.filter(i => i.invoiceNumber?.includes(`CCP/${year}`)).length
  const seq = String(count + 1).padStart(3, '0')
  return `CCP/${year}/${seq}`
}

// ── Status logic ───────────────────────────────────────────────────────────
// paid    → fully paid
// partial → some payment made but not full
// advance → booked, no payment yet (replaces "pending")
export const calcStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0)
  const paid = Number(paidAmount || 0)
  if (paid <= 0) return 'advance'
  if (paid >= total) return 'paid'
  return 'partial'
}

// ── default studio info ────────────────────────────────────────────────────
const DEFAULT_STUDIO = {
  name: 'Candy Capture Photography',
  address: 'Your Address, City, State - PIN',
  mobile: '+91 XXXXX XXXXX',
  email: 'candycapture@gmail.com',
  instagram: '@candycapturephotography',
  website: 'www.candycapturephotography.com',
  signature: 'Candy Capture Photography',
  logo: '', // base64 string
}

// ── default services ───────────────────────────────────────────────────────
const DEFAULT_SERVICES = [
  { id: 's1', name: 'Wedding Photography', description: 'Full day wedding coverage', active: true },
  { id: 's2', name: 'Pre-Wedding Shoot', description: 'Pre-wedding photoshoot session', active: true },
  { id: 's3', name: 'Baby Shower', description: 'Baby shower event photography', active: true },
  { id: 's4', name: 'Birthday Photography', description: 'Birthday event coverage', active: true },
  { id: 's5', name: 'Engagement Ceremony', description: 'Engagement event photography', active: true },
  { id: 's6', name: 'Naming Ceremony', description: 'Naming ceremony coverage', active: true },
  { id: 's7', name: 'Corporate Events', description: 'Corporate event photography', active: true },
  { id: 's8', name: 'Videography', description: 'Full event video coverage', active: true },
]

// ── default packages ───────────────────────────────────────────────────────
const DEFAULT_PACKAGES = [
  { id: 'p1', name: 'Basic Package', price: 15000, description: '4 hours coverage, 100 edited photos', active: true },
  { id: 'p2', name: 'Standard Package', price: 25000, description: '8 hours coverage, 200 edited photos + album', active: true },
  { id: 'p3', name: 'Premium Package', price: 40000, description: 'Full day coverage, 400 edited photos + album + video', active: true },
  { id: 'p4', name: 'Royal Package', price: 60000, description: '2 days coverage, unlimited photos + album + full video', active: true },
]

// ── provider ───────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [invoices, setInvoices] = useState(() => load('ccp_invoices', []))
  const [customers, setCustomers] = useState(() => load('ccp_customers', []))
  const [services, setServices] = useState(() => load('ccp_services', DEFAULT_SERVICES))
  const [packages, setPackages] = useState(() => load('ccp_packages', DEFAULT_PACKAGES))
  const [studio, setStudioState] = useState(() => load('ccp_studio', DEFAULT_STUDIO))

  useEffect(() => { save('ccp_invoices', invoices) }, [invoices])
  useEffect(() => { save('ccp_customers', customers) }, [customers])
  useEffect(() => { save('ccp_services', services) }, [services])
  useEffect(() => { save('ccp_packages', packages) }, [packages])
  useEffect(() => { save('ccp_studio', studio) }, [studio])

  const setStudio = (data) => setStudioState(data)

  // ── invoice actions ──────────────────────────────────────────────────────
  const addInvoice = (invoiceData) => {
    const paidAmt = Number(invoiceData.advanceAmount || 0)
    const newInvoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(invoices),
      createdAt: new Date().toISOString(),
      paidAmount: paidAmt,
      status: calcStatus(invoiceData.totalAmount, paidAmt),
      payments: paidAmt > 0 ? [{
        id: Date.now().toString() + '_adv',
        amount: paidAmt,
        date: new Date().toISOString(),
        note: 'Advance payment',
      }] : [],
    }
    const updated = [newInvoice, ...invoices]
    setInvoices(updated)

    // auto-add or update customer
    upsertCustomer({
      name: invoiceData.customerName,
      mobile: invoiceData.customerMobile,
      email: invoiceData.customerEmail || '',
    }, newInvoice.id)

    return newInvoice
  }

  const updateInvoice = (id, data) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv
      const merged = { ...inv, ...data }
      return { ...merged, status: calcStatus(merged.totalAmount, merged.paidAmount) }
    }))
  }

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  const addPayment = (invoiceId, payment) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv
      const payments = [
        ...(inv.payments || []),
        {
          ...payment,
          id: Date.now().toString(),
          amount: Number(payment.amount),
          date: payment.date || new Date().toISOString(),
        },
      ]
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
      return {
        ...inv,
        payments,
        paidAmount: totalPaid,
        status: calcStatus(inv.totalAmount, totalPaid),
      }
    }))
  }

  // ── customer actions ─────────────────────────────────────────────────────
  const upsertCustomer = (data, invoiceId) => {
    setCustomers(prev => {
      const existing = prev.find(c =>
        c.mobile === data.mobile ||
        (c.name?.toLowerCase() === data.name?.toLowerCase())
      )
      if (existing) {
        return prev.map(c => {
          if (c.id !== existing.id) return c
          const invoiceIds = c.invoiceIds || []
          return {
            ...c,
            email: data.email || c.email,
            invoiceIds: invoiceIds.includes(invoiceId) ? invoiceIds : [...invoiceIds, invoiceId],
          }
        })
      } else {
        return [{
          id: Date.now().toString(),
          name: data.name,
          mobile: data.mobile,
          email: data.email || '',
          invoiceIds: invoiceId ? [invoiceId] : [],
          createdAt: new Date().toISOString(),
        }, ...prev]
      }
    })
  }

  const updateCustomer = (id, data) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }

  const deleteCustomer = (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  // ── service actions ──────────────────────────────────────────────────────
  const addService = (data) => {
    setServices(prev => [...prev, { ...data, id: Date.now().toString(), active: true }])
  }
  const updateService = (id, data) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  }
  const deleteService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }

  // ── package actions ──────────────────────────────────────────────────────
  const addPackage = (data) => {
    setPackages(prev => [...prev, { ...data, id: Date.now().toString(), active: true }])
  }
  const updatePackage = (id, data) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }
  const deletePackage = (id) => {
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  // ── dashboard stats ──────────────────────────────────────────────────────
  const getStats = () => {
    const totalInvoices = invoices.length
    const totalCustomers = customers.length
    const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0)
    const totalPaid = invoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0)
    const pendingPayment = totalRevenue - totalPaid
    const today = new Date()
    const upcomingPayments = invoices.filter(inv => {
      if (inv.status === 'paid') return false
      const eventDate = inv.eventDate ? new Date(inv.eventDate) : null
      return eventDate && eventDate > today
    }).length
    return { totalInvoices, totalCustomers, totalRevenue, pendingPayment, upcomingPayments }
  }

  const getInvoiceById = (id) => invoices.find(inv => inv.id === id)
  const getCustomerById = (id) => customers.find(c => c.id === id)
  const getCustomerInvoices = (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return []
    return invoices.filter(inv => (customer.invoiceIds || []).includes(inv.id))
  }

  return (
    <AppContext.Provider value={{
      invoices, customers, services, packages, studio,
      addInvoice, updateInvoice, deleteInvoice, addPayment,
      upsertCustomer, updateCustomer, deleteCustomer,
      addService, updateService, deleteService,
      addPackage, updatePackage, deletePackage,
      setStudio,
      getStats, getInvoiceById, getCustomerById, getCustomerInvoices,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
