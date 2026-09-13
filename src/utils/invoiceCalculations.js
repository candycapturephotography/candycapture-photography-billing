/**
 * Invoice Calculations Utility
 * 
 * Provides consistent calculation functions for invoice totals and line items.
 * Requirements covered: 7.6 - Recalculate total on any line item change
 */

/**
 * Calculate invoice total from package price and line items.
 * Total = package base price + sum of (custom item price × quantity)
 * 
 * @param {number} packagePrice - Base package price
 * @param {Array} lineItems - Array of line items
 * @returns {{ total: number, customItemsTotal: number, packagePrice: number }}
 */
export function calculateInvoiceTotal(packagePrice, lineItems = []) {
  const validPackagePrice = Number(packagePrice) || 0
  
  const customItemsTotal = lineItems
    .filter(item => item.isCustom && typeof item.price === 'number')
    .reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0
      const itemQuantity = Number(item.quantity) || 1
      return sum + (itemPrice * itemQuantity)
    }, 0)
  
  return {
    packagePrice: validPackagePrice,
    customItemsTotal,
    total: validPackagePrice + customItemsTotal,
  }
}

/**
 * Calculate pending amount: Total - Advance
 */
export function calculatePendingAmount(totalAmount, advance) {
  const total = Number(totalAmount) || 0
  const paid = Number(advance) || 0
  return Math.max(0, total - paid)
}

/**
 * Calculate sum of custom items only
 */
export function calculateCustomItemsTotal(lineItems = []) {
  return lineItems
    .filter(item => item.isCustom && typeof item.price === 'number')
    .reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0
      const itemQuantity = Number(item.quantity) || 1
      return sum + (itemPrice * itemQuantity)
    }, 0)
}
