/**
 * Invoice Number Generator Utility
 * 
 * Generates unique, persistent invoice numbers in the format CCP-YYYY-NNN
 * for the CandyCapture Photography billing portal.
 * 
 * @module invoiceNumberGenerator
 */

import { load, save, STORAGE_KEYS } from './storage.js'

/**
 * Invoice counter state structure
 * @typedef {Object} InvoiceCounter
 * @property {number} year - The year for the current counter sequence
 * @property {number} lastNumber - The last issued invoice number
 */

/**
 * Get the next unique invoice number.
 * 
 * Generates invoice numbers in the format CCP-YYYY-NNN where:
 * - CCP is the fixed prefix for CandyCapture Photography
 * - YYYY is the four-digit generation year
 * - NNN is a zero-padded sequence number (minimum 3 digits, extends beyond when > 999)
 * 
 * The counter:
 * - Persists across application restarts
 * - Resets to 1 when the year changes
 * - Increments atomically (save before return) to prevent duplicates
 * 
 * @returns {string} The next invoice number in format CCP-YYYY-NNN
 * 
 * @example
 * // First invoice of 2024
 * getNextInvoiceNumber() // Returns 'CCP-2024-001'
 * 
 * @example
 * // After 999 invoices
 * getNextInvoiceNumber() // Returns 'CCP-2024-1000'
 */
export function getNextInvoiceNumber() {
  const currentYear = new Date().getFullYear()
  
  // Load existing counter or initialize with defaults
  let counter = load(STORAGE_KEYS.INVOICE_COUNTER, { year: currentYear, lastNumber: 0 })
  
  // Reset counter if year changed (new year starts fresh sequence)
  if (counter.year !== currentYear) {
    counter = { year: currentYear, lastNumber: 0 }
  }
  
  // Increment the counter
  counter.lastNumber += 1
  
  // Save immediately before returning to prevent duplicates
  // This ensures atomic increment behavior
  save(STORAGE_KEYS.INVOICE_COUNTER, counter)
  
  // Format: CCP-YYYY-NNN (padded to minimum 3 digits, extends beyond if > 999)
  const paddedNumber = String(counter.lastNumber).padStart(3, '0')
  
  return `CCP-${currentYear}-${paddedNumber}`
}

/**
 * Get the current invoice counter state without incrementing.
 * Useful for displaying the next expected invoice number.
 * 
 * @returns {{ year: number, lastNumber: number, nextNumber: string }} Counter info
 * 
 * @example
 * const info = getInvoiceCounterInfo()
 * console.log(info.nextNumber) // 'CCP-2024-042' (next number that would be issued)
 */
export function getInvoiceCounterInfo() {
  const currentYear = new Date().getFullYear()
  let counter = load(STORAGE_KEYS.INVOICE_COUNTER, { year: currentYear, lastNumber: 0 })
  
  // Calculate what the next number would be
  let nextNumber
  if (counter.year !== currentYear) {
    // Year changed, next would be first of new year
    nextNumber = `CCP-${currentYear}-001`
  } else {
    const nextSeq = counter.lastNumber + 1
    const paddedNumber = String(nextSeq).padStart(3, '0')
    nextNumber = `CCP-${currentYear}-${paddedNumber}`
  }
  
  return {
    year: counter.year,
    lastNumber: counter.lastNumber,
    nextNumber,
  }
}

/**
 * Validate an invoice number format.
 * 
 * @param {string} invoiceNumber - The invoice number to validate
 * @returns {boolean} True if the format is valid CCP-YYYY-NNN
 * 
 * @example
 * isValidInvoiceNumber('CCP-2024-001') // true
 * isValidInvoiceNumber('CCP-2024-1000') // true
 * isValidInvoiceNumber('INV-2024-001') // false
 */
export function isValidInvoiceNumber(invoiceNumber) {
  if (typeof invoiceNumber !== 'string') {
    return false
  }
  
  // Pattern: CCP-YYYY-NNN where NNN is at least 3 digits
  const pattern = /^CCP-\d{4}-\d{3,}$/
  return pattern.test(invoiceNumber)
}

/**
 * Parse an invoice number into its components.
 * 
 * @param {string} invoiceNumber - The invoice number to parse
 * @returns {{ prefix: string, year: number, sequence: number } | null} Parsed components or null if invalid
 * 
 * @example
 * parseInvoiceNumber('CCP-2024-042')
 * // Returns { prefix: 'CCP', year: 2024, sequence: 42 }
 */
export function parseInvoiceNumber(invoiceNumber) {
  if (!isValidInvoiceNumber(invoiceNumber)) {
    return null
  }
  
  const parts = invoiceNumber.split('-')
  return {
    prefix: parts[0],
    year: parseInt(parts[1], 10),
    sequence: parseInt(parts[2], 10),
  }
}

// Default export for convenience
export default {
  getNextInvoiceNumber,
  getInvoiceCounterInfo,
  isValidInvoiceNumber,
  parseInvoiceNumber,
}
