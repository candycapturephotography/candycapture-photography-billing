/**
 * Invoice Snapshot Utilities
 * 
 * Creates immutable snapshots of invoice data at creation time.
 * These snapshots capture the complete state of package, services,
 * and studio profile, ensuring invoice immutability.
 * 
 * @module snapshotUtils
 */

/**
 * Creates a studio profile snapshot capturing current studio settings.
 * 
 * @param {Object} studio - Current studio profile
 * @returns {Object} StudioProfileSnapshot - Immutable copy of studio data
 */
export const createStudioProfileSnapshot = (studio) => {
  if (!studio) {
    return {
      name: '',
      address: '',
      mobile: '',
      email: undefined,
      instagram: undefined,
      website: undefined,
      logo: undefined,
      signature: undefined,
    }
  }

  return {
    name: studio.name || '',
    address: studio.address || '',
    mobile: studio.mobile || '',
    email: studio.email || undefined,
    instagram: studio.instagram || undefined,
    website: studio.website || undefined,
    logo: studio.logo || undefined,
    signature: studio.signature || undefined,
  }
}

/**
 * Creates a line item snapshot from package services or custom items.
 * 
 * @param {Object} params - Line item parameters
 * @param {string} params.id - Unique identifier for the line item
 * @param {string} params.name - Service/item name
 * @param {string} [params.description] - Optional description
 * @param {number} [params.quantity=1] - Quantity (defaults to 1)
 * @param {number} [params.price=0] - Per-unit price (0 for included services)
 * @param {boolean} [params.isCustom=false] - True if added manually
 * @param {boolean} [params.isIncluded=true] - True if from package (no additional cost)
 * @returns {Object} SnapshotLineItem - Immutable line item data
 */
export const createSnapshotLineItem = ({
  id,
  name,
  description,
  quantity = 1,
  price = 0,
  isCustom = false,
  isIncluded = true,
}) => {
  return {
    id: id || `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || '',
    description: description || undefined,
    quantity: Number(quantity) || 1,
    price: Number(price) || 0,
    isCustom: Boolean(isCustom),
    isIncluded: Boolean(isIncluded),
  }
}

/**
 * Converts package services to snapshot line items.
 * Package services are marked as included (no additional cost).
 * 
 * @param {Array} packageServices - Array of PackageService objects
 * @returns {Array} Array of SnapshotLineItem objects
 */
export const packageServicesToLineItems = (packageServices = []) => {
  return packageServices
    .filter(service => service && service.name)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(service => createSnapshotLineItem({
      id: service.id || `pkg_service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: service.name,
      description: service.description,
      quantity: service.quantity || 1,
      price: 0, // Package services are included in base price
      isCustom: false,
      isIncluded: true,
    }))
}

/**
 * Creates a complete invoice snapshot capturing package, services, and studio profile.
 * This snapshot is immutable and preserves the exact state at invoice creation time.
 * 
 * @param {Object} invoiceData - Invoice form data with customized line items
 * @param {Array} [invoiceData.lineItems] - Customized line items from the form
 * @param {Object} [selectedPackage] - Selected package (optional, may be null for custom invoices)
 * @param {string} [selectedPackage.id] - Package ID
 * @param {string} [selectedPackage.name] - Package name
 * @param {number} [selectedPackage.price] - Package price
 * @param {Array} [selectedPackage.services] - Package services
 * @param {Object} studio - Current studio profile
 * @returns {Object} InvoiceSnapshot - Complete immutable snapshot
 * 
 * @example
 * const snapshot = createInvoiceSnapshot(
 *   { lineItems: customizedItems },
 *   { id: 'p1', name: 'Premium Package', price: 75000, services: [...] },
 *   { name: 'Studio Name', mobile: '123456789', ... }
 * )
 */
export const createInvoiceSnapshot = (invoiceData = {}, selectedPackage = null, studio = null) => {
  // Create studio profile snapshot
  const studioProfile = createStudioProfileSnapshot(studio)

  // If no package selected, create a custom invoice snapshot
  if (!selectedPackage) {
    const lineItems = (invoiceData.lineItems || []).map(item => 
      createSnapshotLineItem({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price || 0,
        isCustom: true,
        isIncluded: false,
      })
    )

    return {
      packageId: undefined,
      packageName: 'Custom Invoice',
      packagePrice: 0,
      lineItems,
      studioProfile,
    }
  }

  // Create line items from package services or use customized line items
  let lineItems
  
  if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
    // Use customized line items from the form (user may have modified package services)
    lineItems = invoiceData.lineItems.map(item => createSnapshotLineItem({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price || 0,
      isCustom: item.isCustom || false,
      isIncluded: item.isIncluded !== undefined ? item.isIncluded : !item.isCustom,
    }))
  } else {
    // Use package services as-is (no customization)
    lineItems = packageServicesToLineItems(selectedPackage.services || [])
  }

  return {
    packageId: selectedPackage.id || undefined,
    packageName: selectedPackage.name || 'Unknown Package',
    packagePrice: Number(selectedPackage.price) || 0,
    lineItems,
    studioProfile,
  }
}

/**
 * Validates an invoice snapshot has all required fields.
 * 
 * @param {Object} snapshot - Invoice snapshot to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export const validateInvoiceSnapshot = (snapshot) => {
  const errors = []

  if (!snapshot) {
    return { valid: false, errors: ['Snapshot is required'] }
  }

  if (typeof snapshot.packageName !== 'string' || snapshot.packageName.trim() === '') {
    errors.push('Package name is required')
  }

  if (typeof snapshot.packagePrice !== 'number' || isNaN(snapshot.packagePrice)) {
    errors.push('Package price must be a valid number')
  }

  if (!Array.isArray(snapshot.lineItems)) {
    errors.push('Line items must be an array')
  }

  if (!snapshot.studioProfile) {
    errors.push('Studio profile snapshot is required')
  } else {
    if (typeof snapshot.studioProfile.name !== 'string') {
      errors.push('Studio name is required in profile')
    }
    if (typeof snapshot.studioProfile.mobile !== 'string') {
      errors.push('Studio mobile is required in profile')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Deep freezes an invoice snapshot to prevent modifications.
 * Use this when storing the snapshot to ensure immutability.
 * 
 * @param {Object} snapshot - Invoice snapshot to freeze
 * @returns {Object} Frozen (immutable) snapshot
 */
export const freezeSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') {
    return snapshot
  }

  // Freeze line items array and each item
  if (Array.isArray(snapshot.lineItems)) {
    snapshot.lineItems.forEach(Object.freeze)
    Object.freeze(snapshot.lineItems)
  }

  // Freeze studio profile
  if (snapshot.studioProfile) {
    Object.freeze(snapshot.studioProfile)
  }

  // Freeze the snapshot itself
  return Object.freeze(snapshot)
}

/**
 * Creates and freezes an immutable invoice snapshot in one operation.
 * This is the recommended way to create snapshots for storage.
 * 
 * @param {Object} invoiceData - Invoice form data
 * @param {Object} selectedPackage - Selected package (optional)
 * @param {Object} studio - Current studio profile
 * @returns {Object} Frozen (immutable) InvoiceSnapshot
 */
export const createImmutableSnapshot = (invoiceData, selectedPackage, studio) => {
  const snapshot = createInvoiceSnapshot(invoiceData, selectedPackage, studio)
  return freezeSnapshot(snapshot)
}
