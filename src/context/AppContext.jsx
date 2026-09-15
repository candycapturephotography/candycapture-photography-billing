import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase.js'
import { createInvoiceSnapshot } from '../utils/snapshotUtils.js'

const AppContext = createContext(null)

// Status calculation
export const calcStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0)
  const paid = Number(paidAmount || 0)
  if (paid <= 0) return 'advance'
  if (paid >= total) return 'paid'
  return 'partial'
}

// Default studio info
const DEFAULT_STUDIO = {
  name: 'Candy Capture Photography',
  address: 'Your Address, City, State - PIN',
  mobile: '+91 XXXXX XXXXX',
  email: 'candycapture@gmail.com',
  instagram: '@candycapturephotography',
  website: 'www.candycapturephotography.com',
  signature: 'Candy Capture Photography',
  logo: '',
}

// Default services
const DEFAULT_SERVICES = [
  { id: 's1', name: 'Wedding Photography', description: 'Full day wedding coverage', active: true },
  { id: 's2', name: 'Pre-Wedding Shoot', description: 'Pre-wedding photoshoot session', active: true },
  { id: 's3', name: 'Baby Shower', description: 'Baby shower event photography', active: true },
  { id: 's4', name: 'Birthday Photography', description: 'Birthday event coverage', active: true },
  { id: 's5', name: 'Engagement Ceremony', description: 'Engagement event photography', active: true },
]

// Default packages
const DEFAULT_PACKAGES = [
  { 
    id: 'seed_p1', name: 'PREMIUM PACKAGE 1', price: 75000,
    description: 'Complete wedding coverage', active: true,
    services: [
      { id: 'sp1_1', name: 'Traditional Photography', quantity: 1, sortOrder: 1 },
      { id: 'sp1_2', name: 'Traditional Videography', quantity: 1, sortOrder: 2 },
      { id: 'sp1_3', name: 'Candid Photography', quantity: 1, sortOrder: 3 },
    ],
  },
]

export function AppProvider({ children }) {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [packages, setPackages] = useState(DEFAULT_PACKAGES)
  const [studio, setStudioState] = useState(DEFAULT_STUDIO)
  const [loading, setLoading] = useState(true)

  // Load all data from Supabase on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [inv, cust, serv, pkg, stud] = await Promise.all([
        db.getInvoices().catch(e => { console.log('Load invoices error:', e); return [] }),
        db.getCustomers().catch(e => { console.log('Load customers error:', e); return [] }),
        db.getServices().catch(e => { console.log('Load services error:', e); return [] }),
        db.getPackages().catch(e => { console.log('Load packages error:', e); return [] }),
        db.getStudio().catch(e => { console.log('Load studio error:', e); return null }),
      ])
      
      setInvoices(inv || [])
      setCustomers(cust || [])
      setServices(serv.length > 0 ? serv : DEFAULT_SERVICES)
      setPackages(pkg.length > 0 ? pkg : DEFAULT_PACKAGES)
      setStudioState(stud || DEFAULT_STUDIO)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Invoice actions
  const addInvoice = useCallback(async (invoiceData) => {
    const paidAmt = Number(invoiceData.advanceAmount || 0)
    const selectedPackage = invoiceData.selectedPackageId 
      ? packages.find(p => p.id === invoiceData.selectedPackageId) 
      : null
    
    const snapshot = createInvoiceSnapshot(invoiceData, selectedPackage, studio)
    const currentYear = new Date().getFullYear()
    const invoiceNumber = `CCP-${currentYear}-${String(invoices.length + 1).padStart(3, '0')}`
    
    const newInvoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
      paidAmount: paidAmt,
      status: calcStatus(invoiceData.totalAmount, paidAmt),
      snapshot,
      payments: paidAmt > 0 ? [{
        id: Date.now().toString() + '_adv',
        amount: paidAmt,
        date: new Date().toISOString(),
        note: 'Advance payment',
      }] : [],
    }

    // Update local state first for immediate UI response
    setInvoices(prev => [newInvoice, ...prev])
    
    // Then save to database
    try {
      await db.addInvoice(newInvoice)
      // Auto-add customer
      await upsertCustomer({
        name: invoiceData.customerName,
        mobile: invoiceData.customerMobile,
        email: invoiceData.customerEmail || '',
      }, newInvoice.id)
    } catch (err) {
      console.error('Error saving invoice:', err)
    }
    
    return newInvoice
  }, [packages, studio, invoices])

  const updateInvoice = useCallback(async (id, data) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return
    
    const merged = { ...invoice, ...data }
    merged.status = calcStatus(merged.totalAmount, merged.paidAmount)
    
    setInvoices(prev => prev.map(inv => inv.id === id ? merged : inv))
    
    try {
      await db.updateInvoice(id, merged)
    } catch (err) {
      console.error('Error updating invoice:', err)
    }
  }, [invoices])

  const deleteInvoice = useCallback(async (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
    try {
      await db.deleteInvoice(id)
    } catch (err) {
      console.error('Error deleting invoice:', err)
    }
  }, [])

  const addPayment = useCallback(async (invoiceId, payment) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    const payments = [
      ...(invoice.payments || []),
      {
        ...payment,
        id: Date.now().toString(),
        amount: Number(payment.amount),
        date: payment.date || new Date().toISOString(),
      },
    ]
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
    const updated = {
      ...invoice,
      payments,
      paidAmount: totalPaid,
      status: calcStatus(invoice.totalAmount, totalPaid),
    }

    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updated : inv))
    
    try {
      await db.updateInvoice(invoiceId, updated)
    } catch (err) {
      console.error('Error adding payment:', err)
    }
  }, [invoices])

  // Customer actions
  const upsertCustomer = useCallback(async (data, invoiceId) => {
    const existing = customers.find(c =>
      c.mobile === data.mobile ||
      (c.name?.toLowerCase() === data.name?.toLowerCase())
    )

    if (existing) {
      const invoiceIds = existing.invoiceIds || []
      const updated = {
        ...existing,
        email: data.email || existing.email,
        invoiceIds: invoiceIds.includes(invoiceId) ? invoiceIds : [...invoiceIds, invoiceId],
      }
      setCustomers(prev => prev.map(c => c.id === existing.id ? updated : c))
      try {
        await db.upsertCustomer(updated)
      } catch (err) {
        console.error('Error updating customer:', err)
      }
    } else {
      const newCustomer = {
        id: Date.now().toString(),
        name: data.name,
        mobile: data.mobile,
        email: data.email || '',
        invoiceIds: invoiceId ? [invoiceId] : [],
        createdAt: new Date().toISOString(),
      }
      setCustomers(prev => [newCustomer, ...prev])
      try {
        await db.upsertCustomer(newCustomer)
      } catch (err) {
        console.error('Error adding customer:', err)
      }
    }
  }, [customers])

  const updateCustomer = useCallback(async (id, data) => {
    const customer = customers.find(c => c.id === id)
    if (!customer) return
    const updated = { ...customer, ...data }
    setCustomers(prev => prev.map(c => c.id === id ? updated : c))
    try {
      await db.upsertCustomer(updated)
    } catch (err) {
      console.error('Error updating customer:', err)
    }
  }, [customers])

  const deleteCustomer = useCallback(async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id))
    try {
      await db.deleteCustomer(id)
    } catch (err) {
      console.error('Error deleting customer:', err)
    }
  }, [])

  // Service actions
  const addService = useCallback(async (data) => {
    const newService = { ...data, id: Date.now().toString(), active: true }
    setServices(prev => [...prev, newService])
    try {
      await db.upsertService(newService)
    } catch (err) {
      console.error('Error adding service:', err)
    }
  }, [])

  const updateService = useCallback(async (id, data) => {
    const service = services.find(s => s.id === id)
    if (!service) return
    const updated = { ...service, ...data }
    setServices(prev => prev.map(s => s.id === id ? updated : s))
    try {
      await db.upsertService(updated)
    } catch (err) {
      console.error('Error updating service:', err)
    }
  }, [services])

  const deleteService = useCallback(async (id) => {
    setServices(prev => prev.filter(s => s.id !== id))
    try {
      await db.deleteService(id)
    } catch (err) {
      console.error('Error deleting service:', err)
    }
  }, [])

  // Package actions - FIXED
  const addPackage = useCallback(async (data) => {
    console.log('Adding package:', data)
    const now = new Date().toISOString()
    const newPackage = { 
      ...data, 
      id: Date.now().toString(), 
      services: data.services || [],
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    // Update UI immediately
    setPackages(prev => [...prev, newPackage])
    // Save to database
    try {
      await db.upsertPackage(newPackage)
      console.log('Package saved successfully')
    } catch (err) {
      console.error('Error adding package:', err)
    }
  }, [])

  const updatePackage = useCallback(async (id, data) => {
    console.log('Updating package:', id, data)
    const pkg = packages.find(p => p.id === id)
    if (!pkg) return
    const updated = { ...pkg, ...data, updatedAt: new Date().toISOString() }
    setPackages(prev => prev.map(p => p.id === id ? updated : p))
    try {
      await db.upsertPackage(updated)
    } catch (err) {
      console.error('Error updating package:', err)
    }
  }, [packages])

  const deletePackage = useCallback(async (id) => {
    console.log('Deleting package:', id)
    // Update UI immediately
    setPackages(prev => prev.filter(p => p.id !== id))
    // Delete from database
    try {
      await db.deletePackage(id)
      console.log('Package deleted successfully')
    } catch (err) {
      console.error('Error deleting package:', err)
    }
  }, [])

  // Package service actions - FIXED
  const addServiceToPackage = useCallback(async (packageId, serviceData) => {
    console.log('Adding service to package:', packageId, serviceData)
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const services = p.services || []
      const maxSortOrder = services.length > 0 ? Math.max(...services.map(s => s.sortOrder || 0)) : 0
      const newService = {
        id: Date.now().toString(),
        name: serviceData.name,
        description: serviceData.description || '',
        quantity: serviceData.quantity || 1,
        sortOrder: maxSortOrder + 1,
      }
      const updated = {
        ...p,
        services: [...services, newService],
        updatedAt: new Date().toISOString(),
      }
      // Save to DB asynchronously
      db.upsertPackage(updated).catch(err => console.error('Error:', err))
      return updated
    }))
  }, [])

  const removeServiceFromPackage = useCallback(async (packageId, serviceId) => {
    console.log('Removing service from package:', packageId, serviceId)
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const services = (p.services || []).filter(s => s.id !== serviceId)
      const updated = { ...p, services, updatedAt: new Date().toISOString() }
      db.upsertPackage(updated).catch(err => console.error('Error:', err))
      return updated
    }))
  }, [])

  const updatePackageService = useCallback(async (packageId, serviceId, data) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const services = (p.services || []).map(s => s.id === serviceId ? { ...s, ...data } : s)
      const updated = { ...p, services, updatedAt: new Date().toISOString() }
      db.upsertPackage(updated).catch(err => console.error('Error:', err))
      return updated
    }))
  }, [])

  const reorderPackageServices = useCallback(async (packageId, serviceIds) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p
      const servicesMap = new Map((p.services || []).map(s => [s.id, s]))
      const reorderedServices = serviceIds
        .filter(id => servicesMap.has(id))
        .map((id, idx) => ({ ...servicesMap.get(id), sortOrder: idx + 1 }))
      const updated = { ...p, services: reorderedServices, updatedAt: new Date().toISOString() }
      db.upsertPackage(updated).catch(err => console.error('Error:', err))
      return updated
    }))
  }, [])

  // Studio
  const setStudio = useCallback(async (data) => {
    setStudioState(data)
    try {
      await db.saveStudio(data)
    } catch (err) {
      console.error('Error saving studio:', err)
    }
  }, [])

  // Stats
  const getStats = useCallback((monthFilter) => {
    let filteredInvoices = invoices
    if (monthFilter && monthFilter.month !== undefined && monthFilter.year !== undefined) {
      filteredInvoices = invoices.filter(inv => {
        if (!inv.eventDate) return false
        const eventDate = new Date(inv.eventDate)
        return eventDate.getMonth() === monthFilter.month && eventDate.getFullYear() === monthFilter.year
      })
    }
    
    const monthlyTotalEvents = filteredInvoices.length
    const totalCustomers = customers.length
    const totalIncome = filteredInvoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0)
    const pendingAmount = filteredInvoices.reduce((s, inv) => {
      const total = Number(inv.totalAmount || 0)
      const paid = Number(inv.paidAmount || 0)
      return s + (total - paid)
    }, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcomingEvents = invoices.filter(inv => {
      if (inv.status === 'paid') return false
      const eventDate = inv.eventDate ? new Date(inv.eventDate) : null
      if (!eventDate) return false
      eventDate.setHours(0, 0, 0, 0)
      return eventDate > today
    }).length
    
    return { 
      totalInvoices: monthlyTotalEvents,
      totalCustomers, 
      totalRevenue: totalIncome,
      totalIncome,
      pendingPayment: pendingAmount,
      pendingAmount,
      upcomingPayments: upcomingEvents,
      upcomingEvents,
      monthlyTotalEvents,
    }
  }, [invoices, customers])

  const getInvoiceById = useCallback((id) => invoices.find(inv => inv.id === id), [invoices])
  const getCustomerById = useCallback((id) => customers.find(c => c.id === id), [customers])
  const getCustomerInvoices = useCallback((customerId) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return []
    return invoices.filter(inv => (customer.invoiceIds || []).includes(inv.id))
  }, [customers, invoices])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf2f8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #fce7f3', borderTop: '4px solid #be185d', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#be185d' }}>Loading...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      invoices, customers, services, packages, studio, loading,
      addInvoice, updateInvoice, deleteInvoice, addPayment,
      upsertCustomer, updateCustomer, deleteCustomer,
      addService, updateService, deleteService,
      addPackage, updatePackage, deletePackage,
      addServiceToPackage, removeServiceFromPackage, updatePackageService, reorderPackageServices,
      setStudio,
      getStats, getInvoiceById, getCustomerById, getCustomerInvoices,
      refreshData: loadAllData,
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
