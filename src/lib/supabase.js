import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cyvvjbqymewaamuglrqo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dnZqYnF5bWV3YWFtdWdscnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjM4MjIsImV4cCI6MjEwNDg5OTgyMn0.MCjlFLw1kMUQOuMkZzeIo22Cjd4-LidsNYxkWT6hDxk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to convert camelCase to snake_case for database
const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    // Handle special mappings
    let snakeKey = key
    if (key === 'location') snakeKey = 'venue'
    else snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    
    // Handle nested objects (like snapshot, payments)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = value // Keep objects as-is for JSONB columns
    } else if (Array.isArray(value)) {
      result[snakeKey] = value // Keep arrays as-is for JSONB columns
    } else {
      result[snakeKey] = value
    }
  }
  return result
}

// Helper to convert snake_case to camelCase for app
const toCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    // Handle special mappings
    let camelKey = key
    if (key === 'venue') camelKey = 'location'
    else camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    
    result[camelKey] = value
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
    return (data || []).map(toCamelCase)
  },
  
  async upsertCustomer(customer) {
    const dbData = toSnakeCase(customer)
    const { data, error } = await supabase.from('customers').upsert(dbData).select()
    if (error) {
      console.error('upsertCustomer error:', error)
      throw error
    }
    return toCamelCase(data?.[0])
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
    return (data || []).map(toCamelCase)
  },
  
  async addInvoice(invoice) {
    const dbData = toSnakeCase(invoice)
    console.log('Saving invoice to Supabase:', dbData)
    const { data, error } = await supabase.from('invoices').insert(dbData).select()
    if (error) {
      console.error('addInvoice error:', error)
      throw error
    }
    console.log('Invoice saved successfully:', data)
    return toCamelCase(data?.[0])
  },
  
  async updateInvoice(id, updates) {
    const dbData = toSnakeCase(updates)
    const { data, error } = await supabase.from('invoices').update(dbData).eq('id', id).select()
    if (error) {
      console.error('updateInvoice error:', error)
      throw error
    }
    return toCamelCase(data?.[0])
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
    return (data || []).map(toCamelCase)
  },
  
  async upsertService(service) {
    const dbData = toSnakeCase(service)
    const { data, error } = await supabase.from('services').upsert(dbData).select()
    if (error) {
      console.error('upsertService error:', error)
      throw error
    }
    return toCamelCase(data?.[0])
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
    return (data || []).map(toCamelCase)
  },
  
  async upsertPackage(pkg) {
    const dbData = toSnakeCase(pkg)
    const { data, error } = await supabase.from('packages').upsert(dbData).select()
    if (error) {
      console.error('upsertPackage error:', error)
      throw error
    }
    return toCamelCase(data?.[0])
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
    return data ? toCamelCase(data) : null
  },
  
  async saveStudio(studio) {
    const dbData = { ...toSnakeCase(studio), id: 'main' }
    const { data, error } = await supabase.from('studio').upsert(dbData).select()
    if (error) {
      console.error('saveStudio error:', error)
      throw error
    }
    return toCamelCase(data?.[0])
  },
}
