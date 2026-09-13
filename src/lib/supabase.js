import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cyvvjbqymewaaamulgrqo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dnZqYnF5bWV3YWFtdWdscnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjM4MjIsImV4cCI6MjEwNDg5OTgyMn0.MCjlFLw1kMUQOuMkZzeIo22Cjd4-LidsNYxkWT6hDxk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result
}

// Helper to convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

// Database operations
export const db = {
  // Customers
  async getCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toCamelCase)
  },
  
  async upsertCustomer(customer) {
    const { data, error } = await supabase.from('customers').upsert(toSnakeCase(customer)).select()
    if (error) throw error
    return toCamelCase(data?.[0])
  },
  
  async deleteCustomer(id) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  },

  // Invoices
  async getInvoices() {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toCamelCase)
  },
  
  async addInvoice(invoice) {
    const { data, error } = await supabase.from('invoices').insert(toSnakeCase(invoice)).select()
    if (error) throw error
    return toCamelCase(data?.[0])
  },
  
  async updateInvoice(id, updates) {
    const { data, error } = await supabase.from('invoices').update(toSnakeCase(updates)).eq('id', id).select()
    if (error) throw error
    return toCamelCase(data?.[0])
  },
  
  async deleteInvoice(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },

  // Services
  async getServices() {
    const { data, error } = await supabase.from('services').select('*')
    if (error) throw error
    return (data || []).map(toCamelCase)
  },
  
  async upsertService(service) {
    const { data, error } = await supabase.from('services').upsert(toSnakeCase(service)).select()
    if (error) throw error
    return toCamelCase(data?.[0])
  },
  
  async deleteService(id) {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
  },

  // Packages
  async getPackages() {
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toCamelCase)
  },
  
  async upsertPackage(pkg) {
    const { data, error } = await supabase.from('packages').upsert(toSnakeCase(pkg)).select()
    if (error) throw error
    return toCamelCase(data?.[0])
  },
  
  async deletePackage(id) {
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) throw error
  },

  // Studio
  async getStudio() {
    const { data, error } = await supabase.from('studio').select('*').eq('id', 'main').single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data ? toCamelCase(data) : null
  },
  
  async saveStudio(studio) {
    const { data, error } = await supabase.from('studio').upsert({ ...toSnakeCase(studio), id: 'main' }).select()
    if (error) throw error
    return toCamelCase(data?.[0])
  },

  // Invoice counter
  async getNextInvoiceNumber() {
    const { data, error } = await supabase.rpc('increment_invoice_counter')
    if (error) {
      // Fallback if RPC doesn't exist
      const { data: counter } = await supabase.from('invoice_counter').select('current_number').eq('id', 'counter').single()
      const nextNum = (counter?.current_number || 0) + 1
      await supabase.from('invoice_counter').update({ current_number: nextNum }).eq('id', 'counter')
      return `INV-${String(nextNum).padStart(4, '0')}`
    }
    return `INV-${String(data).padStart(4, '0')}`
  }
}
