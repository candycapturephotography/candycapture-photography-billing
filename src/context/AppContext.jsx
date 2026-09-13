import React, { createContext, useContext, useState, useEffect } from 'react'
import { getNextInvoiceNumber } from '../utils/invoiceNumberGenerator.js'
import { createInvoiceSnapshot } from '../utils/snapshotUtils.js'

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
// Package structure follows design.md:
// interface Package {
//   id: string;
//   name: string;
//   price: number;
//   description?: string;
//   services: PackageService[];     // List of included services
//   active: boolean;
//   createdAt: string;
//   updatedAt: string;
// }
//
// interface PackageService {
//   id: string;                     // Unique within package
//   serviceId?: string;             // Reference to Service (optional)
//   name: string;
//   description?: string;
//   quantity: number;
//   sortOrder: number;
// }
const DEFAULT_PACKAGES = [
  { 
    id: 'p1', 
    name: 'Basic Package', 
    price: 15000, 
    description: '4 hours coverage, 100 edited photos', 
    services: [],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'p2', 
    name: 'Standard Package', 
    price: 25000, 
    description: '8 hours coverage, 200 edited photos + album', 
    services: [],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'p3', 
    name: 'Premium Package', 
    price: 40000, 
    description: 'Full day coverage, 400 edited photos + album + video', 
    services: [],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'p4', 
    name: 'Royal Package', 
    price: 60000, 
    description: '2 days coverage, unlimited photos + album + full video', 
    services: [],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ── seeded packages from requirements (used on first run only) ─────────────
// These packages are loaded on first run when no packages exist in localStorage
// They become editable data that the Admin can modify later (Requirement 17.5)
const SEEDED_PACKAGES = [
  {
    id: 'seed_p1',
    name: 'PREMIUM PACKAGE 1',
    price: 75000,
    description: 'Complete wedding coverage',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    services: [
      { id: 'sp1_1', name: 'Traditional Photography', quantity: 1, sortOrder: 1 },
      { id: 'sp1_2', name: 'Traditional Videography', quantity: 1, sortOrder: 2 },
      { id: 'sp1_3', name: 'Candid Photography', quantity: 1, sortOrder: 3 },
      { id: 'sp1_4', name: 'Pre Wedding Photo', quantity: 1, sortOrder: 4 },
      { id: 'sp1_5', name: '200 Photos & 50 Sheet Premium Album', quantity: 1, sortOrder: 5 },
      { id: 'sp1_6', name: 'Documentary Highlight Video', quantity: 1, sortOrder: 6 },
      { id: 'sp1_7', name: 'Wedding Full Function Video', quantity: 1, sortOrder: 7 },
      { id: 'sp1_8', name: 'Complimentary 2 Photo Frames', quantity: 1, sortOrder: 8 },
      { id: 'sp1_9', name: 'Photo Table Frame and Calendar', quantity: 1, sortOrder: 9 },
    ],
  },
  {
    id: 'seed_p2',
    name: 'PREMIUM PACKAGE 2',
    price: 45000,
    description: 'Standard wedding coverage',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    services: [
      { id: 'sp2_1', name: 'Traditional Photography', quantity: 1, sortOrder: 1 },
      { id: 'sp2_2', name: 'Traditional Videography', quantity: 1, sortOrder: 2 },
      { id: 'sp2_3', name: 'Pre Wedding Photo', quantity: 1, sortOrder: 3 },
      { id: 'sp2_4', name: '100 Photos & 35 Sheet Premium Album', quantity: 1, sortOrder: 4 },
      { id: 'sp2_5', name: 'Documentary Highlight Video', quantity: 1, sortOrder: 5 },
      { id: 'sp2_6', name: 'Wedding Full Function Video', quantity: 1, sortOrder: 6 },
      { id: 'sp2_7', name: 'Complimentary 2 Photo Frames', quantity: 1, sortOrder: 7 },
      { id: 'sp2_8', name: 'Photo Table Frame and Calendar', quantity: 1, sortOrder: 8 },
    ],
  },
  {
    id: 'seed_p5',
    name: 'PREMIUM PACKAGE 5',
    price: 210000,
    description: 'Comprehensive premium coverage',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    services: [
      { id: 'sp5_1', name: 'One Traditional Photo', quantity: 1, sortOrder: 1 },
      { id: 'sp5_2', name: 'One Traditional Video', quantity: 1, sortOrder: 2 },
      { id: 'sp5_3', name: 'One Candid Photo', quantity: 1, sortOrder: 3 },
      { id: 'sp5_4', name: 'Two Candid Video', quantity: 1, sortOrder: 4 },
      { id: 'sp5_5', name: 'One Drone', quantity: 1, sortOrder: 5 },
      { id: 'sp5_6', name: 'Pre or Post Wedding', quantity: 1, sortOrder: 6 },
      { id: 'sp5_7', name: 'Two Album + One Candid Album', quantity: 1, sortOrder: 7 },
      { id: 'sp5_8', name: 'Pen Drive + Harddisk', quantity: 1, sortOrder: 8 },
      { id: 'sp5_9', name: 'Four Photo Frames', quantity: 1, sortOrder: 9 },
      { id: 'sp5_10', name: 'Two Candid Video + Two Teaser', quantity: 1, sortOrder: 10 },
      { id: 'sp5_11', name: 'One E-Invite', quantity: 1, sortOrder: 11 },
      { id: 'sp5_12', name: 'Two Traditional Film', quantity: 1, sortOrder: 12 },
    ],
  },
  {
    id: 'seed_p4',
    name: 'PREMIUM PACKAGE 4',
    price: 250000,
    description: 'Ultimate premium coverage',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    services: [
      { id: 'sp4_1', name: 'One Traditional Photo', quantity: 1, sortOrder: 1 },
      { id: 'sp4_2', name: 'One Traditional Video', quantity: 1, sortOrder: 2 },
      { id: 'sp4_3', name: 'Two Candid Photo', quantity: 1, sortOrder: 3 },
      { id: 'sp4_4', name: 'Two Candid Video', quantity: 1, sortOrder: 4 },
      { id: 'sp4_5', name: 'One Drone', quantity: 1, sortOrder: 5 },
      { id: 'sp4_6', name: 'Pre or Post Wedding', quantity: 1, sortOrder: 6 },
      { id: 'sp4_7', name: 'Two Album + One Candid Album', quantity: 1, sortOrder: 7 },
      { id: 'sp4_8', name: 'Pen Drive + Harddisk', quantity: 1, sortOrder: 8 },
      { id: 'sp4_9', name: 'Four Photo Frames', quantity: 1, sortOrder: 9 },
      { id: 'sp4_10', name: 'Two Candid Video + Two Teaser', quantity: 1, sortOrder: 10 },
      { id: 'sp4_11', name: 'One E-Invite', quantity: 1, sortOrder: 11 },
      { id: 'sp4_12', name: 'Two Traditional Film', quantity: 1, sortOrder: 12 },
    ],
  },
]

// ── helper to migrate old packages to new format ───────────────────────────
const migratePackageToNewFormat = (pkg) => {
  const now = new Date().toISOString()
  return {
    ...pkg,
    services: pkg.services || [],
    createdAt: pkg.createdAt || now,
    updatedAt: pkg.updatedAt || now,
  }
}

// ── provider ───────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [invoices, setInvoices] = useState(() => load('ccp_invoices', []))
  const [customers, setCustomers] = useState(() => load('ccp_customers', []))
  const [services, setServices] = useState(() => load('ccp_services', DEFAULT_SERVICES))
  const [packages, setPackages] = useState(() => {
    const loaded = load('ccp_packages', SEEDED_PACKAGES)
    // Migrate old packages to new format with services array
    return loaded.map(migratePackageToNewFormat)
  })
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
    
    // Look up the selected package for snapshot creation
    const selectedPackage = invoiceData.selectedPackageId 
      ? packages.find(p => p.id === invoiceData.selectedPackageId) 
      : null
    
    // Create the invoice snapshot with package, services, and studio profile
    // This captures the complete state at invoice creation time for immutability
    const snapshot = createInvoiceSnapshot(invoiceData, selectedPackage, studio)
    
    // Generate a persistent, unique invoice number using the counter
    const invoiceNumber = getNextInvoiceNumber()
    
    const newInvoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
      paidAmount: paidAmt,
      status: calcStatus(invoiceData.totalAmount, paidAmt),
      snapshot, // Include the immutable snapshot
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
    const now = new Date().toISOString()
    setPackages(prev => [...prev, { 
      ...data, 
      id: Date.now().toString(), 
      services: data.services || [],
      active: true,
      createdAt: now,
      updatedAt: now,
    }])
  }
  const updatePackage = (id, data) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== id) return p
      return { 
        ...p, 
        ...data,
        updatedAt: new Date().toISOString(),
      }
    }))
  }
  const deletePackage = (id) => {
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  // ── package service actions ─────────────────────────────────────────────
  const addServiceToPackage = (packageId, serviceData) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const services = p.services || []
      const maxSortOrder = services.length > 0 
        ? Math.max(...services.map(s => s.sortOrder || 0)) 
        : 0
      const newService = {
        id: Date.now().toString(),
        serviceId: serviceData.serviceId || undefined,
        name: serviceData.name,
        description: serviceData.description || undefined,
        quantity: serviceData.quantity || 1,
        sortOrder: serviceData.sortOrder ?? (maxSortOrder + 1),
      }
      return {
        ...p,
        services: [...services, newService],
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  const removeServiceFromPackage = (packageId, serviceId) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const services = (p.services || []).filter(s => s.id !== serviceId)
      // Re-normalize sortOrder to keep them sequential
      const normalizedServices = services
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((s, idx) => ({ ...s, sortOrder: idx + 1 }))
      return {
        ...p,
        services: normalizedServices,
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  const updatePackageService = (packageId, serviceId, data) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const services = (p.services || []).map(s => {
        if (s.id !== serviceId) return s
        return { ...s, ...data }
      })
      return {
        ...p,
        services,
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  const reorderPackageServices = (packageId, serviceIds) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const servicesMap = new Map((p.services || []).map(s => [s.id, s]))
      // Reorder services based on the provided serviceIds array
      const reorderedServices = serviceIds
        .filter(id => servicesMap.has(id))
        .map((id, idx) => ({
          ...servicesMap.get(id),
          sortOrder: idx + 1,
        }))
      // Include any services not in serviceIds at the end (edge case)
      const remainingServices = (p.services || [])
        .filter(s => !serviceIds.includes(s.id))
        .map((s, idx) => ({
          ...s,
          sortOrder: reorderedServices.length + idx + 1,
        }))
      return {
        ...p,
        services: [...reorderedServices, ...remainingServices],
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  // ── dashboard stats ──────────────────────────────────────────────────────
  // monthFilter: optional { month: number (0-11), year: number } to filter invoices by eventDate
  // 
  // Requirements (5.1, 5.2, 5.5):
  // - Total Income = sum of paidAmount (what the user has actually received)
  // - Pending Amount = sum of (totalAmount - paidAmount) for all invoices
  // - Total Customers = count of unique customers
  // - Upcoming Events = count of invoices with eventDate > today and status !== 'paid'
  // - Monthly Total Events = count of invoices for the filtered month (based on eventDate)
  const getStats = (monthFilter) => {
    // Filter invoices by month if monthFilter is provided
    let filteredInvoices = invoices
    if (monthFilter && monthFilter.month !== undefined && monthFilter.year !== undefined) {
      filteredInvoices = invoices.filter(inv => {
        if (!inv.eventDate) return false
        const eventDate = new Date(inv.eventDate)
        return eventDate.getMonth() === monthFilter.month && eventDate.getFullYear() === monthFilter.year
      })
    }
    
    // Monthly Total Events: count of invoices for the filtered month
    const monthlyTotalEvents = filteredInvoices.length
    
    // Total Customers: count of unique customers (not filtered by month)
    const totalCustomers = customers.length
    
    // Total Income: sum of paidAmount across invoices (what the user has actually received)
    const totalIncome = filteredInvoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0)
    
    // Pending Amount: sum of (totalAmount - paidAmount) for all invoices
    const pendingAmount = filteredInvoices.reduce((s, inv) => {
      const total = Number(inv.totalAmount || 0)
      const paid = Number(inv.paidAmount || 0)
      return s + (total - paid)
    }, 0)
    
    // Upcoming Events: count of invoices with eventDate > today and status !== 'paid'
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day for accurate date comparison
    const upcomingEvents = invoices.filter(inv => {
      if (inv.status === 'paid') return false
      const eventDate = inv.eventDate ? new Date(inv.eventDate) : null
      if (!eventDate) return false
      eventDate.setHours(0, 0, 0, 0) // Reset for accurate date comparison
      return eventDate > today
    }).length
    
    // Keep backward compatible property names alongside new ones
    return { 
      totalInvoices: monthlyTotalEvents, // Deprecated: use monthlyTotalEvents
      totalCustomers, 
      totalRevenue: totalIncome, // Deprecated: use totalIncome
      totalIncome,
      pendingPayment: pendingAmount, // Deprecated: use pendingAmount
      pendingAmount,
      upcomingPayments: upcomingEvents, // Deprecated: use upcomingEvents
      upcomingEvents,
      monthlyTotalEvents,
    }
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
      addServiceToPackage, removeServiceFromPackage, updatePackageService, reorderPackageServices,
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
