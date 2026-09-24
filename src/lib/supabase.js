import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyvvjbqymewaamuglrqo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dnZqYnF5bWV3YWFtdWdscnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjM4MjIsImV4cCI6MjEwNDg5OTgyMn0.MCjlFLw1kMUQOuMkZzeIo22Cjd4-LidsNYxkWT6hDxk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Valid database columns for each table
const INVOICE_COLUMNS = [
  'id', 'invoice_number', 'customer_name', 'customer_mobile', 'customer_email',
  'event_date', 'event_type', 'venue', 'selected_package_id', 'total_amount',
  'paid_amount', 'status', 'items', 'payments', 'snapshot', 'notes', 'created_at'
]

const CUSTOMER_COLUMNS = ['id', 'name', 'mobile', 'email', 'invoice_ids', 'created_at']
const SERVICE_COLUMNS = ['id', 'name', 'description', 'active', 'created_at']
const PACKAGE_COLUMNS = ['id', 'name', 'price', 'description', 'services', 'active', 'created_at', 'updated_at']
const STUDIO_COLUMNS = ['id', 'name', 'address', 'mobile', 'email', 'instagram', 'website', 'signature', 'logo']

// Map camelCase field names to snake_case database columns
const fieldMapping = {
  invoiceNumber: 'invoice_number',
  customerName: 'customer_name',
  customerMobile: 'customer_mobile',
  customerEmail: 'customer_email',
  eventDate: 'event_date',
  eventType: 'event_type',
  location: 'venue',  // App uses 'location', DB uses 'venue'
  selectedPackageId: 'selected_package_id',
  totalAmount: 'total_amount',
  paidAmount: 'paid_amount',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  invoiceIds: 'invoice_ids',
}

// Convert app object to database format, filtering only valid columns
const toDbFormat = (obj, validColumns) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    // Map field name
    let dbKey = fieldMapping[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    
    // Only include if it's a valid column
    if (validColumns.includes(dbKey)) {
      result[dbKey] = value
    }
  }
  return result
}

// Convert database object to app format (snake_case to camelCase)
const toAppFormat = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toAppFormat)
  
  const reverseMapping = {
    invoice_number: 'invoiceNumber',
    customer_name: 'customerName',
    customer_mobile: 'customerMobile',
    customer_email: 'customerEmail',
    event_date: 'eventDate',
    event_type: 'eventType',
    venue: 'location',  // DB uses 'venue', app uses 'location'
    selected_package_id: 'selectedPackageId',
    total_amount: 'totalAmount',
    paid_amount: 'paidAmount',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    invoice_ids: 'invoiceIds',
  }
  
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const appKey = reverseMapping[key] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[appKey] = value
  }
  return result
}

// Database operations
export const db = {
  // Customers
  async getCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('getCustomers error:', error)
      throw error
    }
    return (data || []).map(toAppFormat)
  },
  
  async upsertCustomer(customer) {
    const dbData = toDbFormat(customer, CUSTOMER_COLUMNS)
    console.log('Upserting customer:', dbData)
    const { data, error } = await supabase.from('customers').upsert(dbData).select()
    if (error) {
      console.error('upsertCustomer error:', error)
      throw error
    }
    return toAppFormat(data?.[0])
  },
  
  async deleteCustomer(id) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      console.error('deleteCustomer error:', error)
      throw error
    }
  },

  // Invoices
  async getInvoices() {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('getInvoices error:', error)
      throw error
    }
    return (data || []).map(toAppFormat)
  },
  
  async addInvoice(invoice) {
    const dbData = toDbFormat(invoice, INVOICE_COLUMNS)
    console.log('Adding invoice to Supabase:', dbData)
    const { data, error } = await supabase.from('invoices').insert(dbData).select()
    if (error) {
      console.error('addInvoice error:', error)
      throw error
    }
    console.log('Invoice saved successfully:', data)
    return toAppFormat(data?.[0])
  },
  
  async updateInvoice(id, updates) {
    const dbData = toDbFormat(updates, INVOICE_COLUMNS)
    console.log('Updating invoice:', id, dbData)
    const { data, error } = await supabase.from('invoices').update(dbData).eq('id', id).select()
    if (error) {
      console.error('updateInvoice error:', error)
      throw error
    }
    return toAppFormat(data?.[0])
  },
  
  async deleteInvoice(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) {
      console.error('deleteInvoice error:', error)
      throw error
    }
  },

  // Services
  async getServices() {
    const { data, error } = await supabase.from('services').select('*')
    if (error) {
      console.error('getServices error:', error)
      throw error
    }
    return (data || []).map(toAppFormat)
  },
  
  async upsertService(service) {
    const dbData = toDbFormat(service, SERVICE_COLUMNS)
    const { data, error } = await supabase.from('services').upsert(dbData).select()
    if (error) {
      console.error('upsertService error:', error)
      throw error
    }
    return toAppFormat(data?.[0])
  },
  
  async deleteService(id) {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) {
      console.error('deleteService error:', error)
      throw error
    }
  },

  // Packages
  async getPackages() {
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('getPackages error:', error)
      throw error
    }
    return (data || []).map(toAppFormat)
  },
  
  async upsertPackage(pkg) {
    const dbData = toDbFormat(pkg, PACKAGE_COLUMNS)
    const { data, error } = await supabase.from('packages').upsert(dbData).select()
    if (error) {
      console.error('upsertPackage error:', error)
      throw error
    }
    return toAppFormat(data?.[0])
  },
  
  async deletePackage(id) {
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) {
      console.error('deletePackage error:', error)
      throw error
    }
  },

  // Studio
  async getStudio() {
    const { data, error } = await supabase.from('studio').select('*').eq('id', 'main').single()
    if (error && error.code !== 'PGRST116') {
      console.error('getStudio error:', error)
      throw error
    }
    return data ? toAppFormat(data) : null
  },
  
  async saveStudio(studio) {
    const dbData = { ...toDbFormat(studio, STUDIO_COLUMNS), id: 'main' }
    const { data, error } = await supabase.from('studio').upsert(dbData).select()
    if (error) {
      console.error('saveStudio error:', error)
      throw error
    }
    return toAppFormat(data?.[0])
  },
}
