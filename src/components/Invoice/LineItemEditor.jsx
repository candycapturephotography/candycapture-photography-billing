import React, { useState } from 'react'

/**
 * LineItemEditor component for editing line items (services) on an invoice.
 * 
 * Features:
 * - Displays line items from selected package
 * - Allows add/remove services
 * - Allows edit description and quantity
 * - Allows add custom service with price
 * - Displays each line item with name, description, quantity, and optional price
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * @param {Object} props
 * @param {Array} props.lineItems - Array of line item objects
 * @param {Function} props.onUpdate - Callback when items change (receives updatedLineItems)
 * @param {number} props.packagePrice - Base package price (for reference)
 */
export default function LineItemEditor({ lineItems = [], onUpdate, packagePrice = 0 }) {
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customItem, setCustomItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  // Generate unique ID for new items
  const generateId = () => `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Format price in Indian Rupee format
  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString('en-IN')}`
  }

  // Handle removing a line item (Requirement 7.2)
  const handleRemove = (itemId) => {
    const updatedItems = lineItems.filter(item => item.id !== itemId)
    onUpdate?.(updatedItems)
  }

  // Handle quantity change (Requirement 7.4)
  const handleQuantityChange = (itemId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity) || 1)
    const updatedItems = lineItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    )
    onUpdate?.(updatedItems)
  }

  // Handle inline edit start
  const handleEditStart = (item) => {
    setEditingId(item.id)
    setEditValues({
      description: item.description || '',
    })
  }

  // Handle inline edit save (Requirement 7.3)
  const handleEditSave = (itemId) => {
    const updatedItems = lineItems.map(item => 
      item.id === itemId ? { ...item, description: editValues.description } : item
    )
    onUpdate?.(updatedItems)
    setEditingId(null)
    setEditValues({})
  }

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  // Handle custom item form changes
  const handleCustomChange = (field, value) => {
    setCustomItem(prev => ({ ...prev, [field]: value }))
  }

  // Add custom service (Requirements 7.1, 7.5)
  const handleAddCustom = () => {
    if (!customItem.name.trim()) return

    const newItem = {
      id: generateId(),
      name: customItem.name.trim(),
      description: customItem.description.trim() || undefined,
      quantity: Math.max(1, parseInt(customItem.quantity) || 1),
      price: parseFloat(customItem.price) || 0,
      isCustom: true,
    }

    const updatedItems = [...lineItems, newItem]
    onUpdate?.(updatedItems)
    
    // Reset form
    setCustomItem({
      name: '',
      description: '',
      quantity: 1,
      price: '',
    })
    setShowAddCustom(false)
  }

  // Calculate custom items total
  const customItemsTotal = lineItems
    .filter(item => item.isCustom && item.price)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Render empty state
  if (lineItems.length === 0 && !showAddCustom) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <div style={styles.emptyText}>No line items</div>
          <div style={styles.emptySubtext}>Select a package or add custom services</div>
          <button
            style={styles.addButton}
            onClick={() => setShowAddCustom(true)}
          >
            <span style={styles.addIcon}>+</span>
            Add Custom Service
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Line Items List */}
      <div style={styles.itemsList}>
        {lineItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              ...styles.itemCard,
              ...(item.isCustom ? styles.itemCardCustom : {}),
            }}
          >
            {/* Item Header Row */}
            <div style={styles.itemHeader}>
              <div style={styles.itemIndex}>#{index + 1}</div>
              <div style={styles.itemName}>
                {item.name}
                {item.isCustom && (
                  <span style={styles.customBadge}>Custom</span>
                )}
              </div>
              <button
                style={styles.removeButton}
                onClick={() => handleRemove(item.id)}
                title="Remove item"
                aria-label={`Remove ${item.name}`}
              >
                ✕
              </button>
            </div>

            {/* Description Row */}
            <div style={styles.itemDetails}>
              {editingId === item.id ? (
                <div style={styles.editRow}>
                  <input
                    type="text"
                    value={editValues.description}
                    onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description..."
                    style={styles.editInput}
                    autoFocus
                  />
                  <button
                    style={styles.editSaveButton}
                    onClick={() => handleEditSave(item.id)}
                  >
                    ✓
                  </button>
                  <button
                    style={styles.editCancelButton}
                    onClick={handleEditCancel}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={styles.descriptionRow}>
                  <span style={styles.descriptionText}>
                    {item.description || <span style={styles.noDescription}>No description</span>}
                  </span>
                  <button
                    style={styles.editButton}
                    onClick={() => handleEditStart(item)}
                    title="Edit description"
                    aria-label={`Edit description for ${item.name}`}
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>

            {/* Quantity and Price Row */}
            <div style={styles.itemFooter}>
              <div style={styles.quantityControl}>
                <label style={styles.quantityLabel}>Qty:</label>
                <button
                  style={styles.quantityButton}
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  style={styles.quantityInput}
                  aria-label={`Quantity for ${item.name}`}
                />
                <button
                  style={styles.quantityButton}
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              {/* Show price for custom items */}
              {item.isCustom && item.price > 0 && (
                <div style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                  {item.quantity > 1 && (
                    <span style={styles.priceUnit}>
                      ({formatPrice(item.price)} × {item.quantity})
                    </span>
                  )}
                </div>
              )}
              
              {/* Show "Included" badge for package items */}
              {!item.isCustom && (
                <div style={styles.includedBadge}>
                  <span style={styles.includedIcon}>✓</span>
                  Included
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Service Form */}
      {showAddCustom && (
        <div style={styles.addCustomForm}>
          <div style={styles.formHeader}>
            <span style={styles.formTitle}>Add Custom Service</span>
            <button
              style={styles.closeFormButton}
              onClick={() => setShowAddCustom(false)}
              aria-label="Close form"
            >
              ✕
            </button>
          </div>
          
          <div style={styles.formFields}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Service Name *</label>
              <input
                type="text"
                value={customItem.name}
                onChange={(e) => handleCustomChange('name', e.target.value)}
                placeholder="e.g., Extra Photo Prints"
                style={styles.formInput}
              />
            </div>
            
            <div style={styles.formField}>
              <label style={styles.formLabel}>Description</label>
              <input
                type="text"
                value={customItem.description}
                onChange={(e) => handleCustomChange('description', e.target.value)}
                placeholder="Optional description"
                style={styles.formInput}
              />
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formFieldHalf}>
                <label style={styles.formLabel}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={customItem.quantity}
                  onChange={(e) => handleCustomChange('quantity', e.target.value)}
                  style={styles.formInput}
                />
              </div>
              
              <div style={styles.formFieldHalf}>
                <label style={styles.formLabel}>Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={customItem.price}
                  onChange={(e) => handleCustomChange('price', e.target.value)}
                  placeholder="0"
                  style={styles.formInput}
                />
              </div>
            </div>
          </div>
          
          <div style={styles.formActions}>
            <button
              style={styles.cancelButton}
              onClick={() => setShowAddCustom(false)}
            >
              Cancel
            </button>
            <button
              style={{
                ...styles.submitButton,
                ...(customItem.name.trim() ? {} : styles.submitButtonDisabled),
              }}
              onClick={handleAddCustom}
              disabled={!customItem.name.trim()}
            >
              Add Service
            </button>
          </div>
        </div>
      )}

      {/* Summary and Add Button */}
      <div style={styles.footer}>
        <button
          style={styles.addButton}
          onClick={() => setShowAddCustom(true)}
          disabled={showAddCustom}
        >
          <span style={styles.addIcon}>+</span>
          Add Custom Service
        </button>
        
        {/* Summary */}
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Package Base Price:</span>
            <span style={styles.summaryValue}>{formatPrice(packagePrice)}</span>
          </div>
          {customItemsTotal > 0 && (
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Custom Services:</span>
              <span style={styles.summaryValue}>+{formatPrice(customItemsTotal)}</span>
            </div>
          )}
          <div style={styles.summaryDivider} />
          <div style={{...styles.summaryRow, ...styles.summaryTotal}}>
            <span style={styles.summaryLabel}>Total:</span>
            <span style={styles.summaryTotalValue}>{formatPrice(packagePrice + customItemsTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  itemCard: {
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    padding: '12px',
    transition: 'all 0.2s ease',
  },
  itemCardCustom: {
    borderColor: '#fce7f3',
    background: '#fefce8',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  itemIndex: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#9ca3af',
    background: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  itemName: {
    flex: 1,
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  customBadge: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#b45309',
    background: '#fef3c7',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  removeButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    background: '#fee2e2',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  itemDetails: {
    marginBottom: '10px',
    paddingLeft: '6px',
  },
  descriptionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  descriptionText: {
    flex: 1,
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  noDescription: {
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '0.75rem',
    opacity: 0.6,
    transition: 'opacity 0.15s ease',
  },
  editRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    padding: '6px 10px',
    fontSize: '0.8rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
  },
  editSaveButton: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: '#10b981',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelButton: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  quantityLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  quantityButton: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  quantityInput: {
    width: '40px',
    textAlign: 'center',
    padding: '4px',
    fontSize: '0.85rem',
    fontWeight: '600',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
  },
  itemPrice: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#be185d',
    textAlign: 'right',
  },
  priceUnit: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: '400',
    color: '#9ca3af',
  },
  includedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '500',
  },
  includedIcon: {
    fontSize: '0.7rem',
  },
  addCustomForm: {
    background: '#fdf2f8',
    borderRadius: '12px',
    border: '2px solid #fce7f3',
    padding: '16px',
    marginBottom: '16px',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  formTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#9d174d',
  },
  closeFormButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formFieldHalf: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#4b5563',
  },
  formInput: {
    padding: '10px 12px',
    fontSize: '0.85rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
    transition: 'border-color 0.15s ease',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#6b7280',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitButton: {
    padding: '8px 20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff',
    background: '#be185d',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitButtonDisabled: {
    background: '#d1d5db',
    cursor: 'not-allowed',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#be185d',
    background: '#fdf2f8',
    border: '2px dashed #fce7f3',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  addIcon: {
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  summary: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #e5e7eb',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  summaryLabel: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#374151',
  },
  summaryDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '10px 0',
  },
  summaryTotal: {
    marginBottom: 0,
  },
  summaryTotalValue: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#be185d',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    background: '#fdf2f8',
    borderRadius: '12px',
    border: '2px dashed #fce7f3',
  },
  emptyIcon: {
    fontSize: '2rem',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    marginTop: '4px',
    marginBottom: '16px',
  },
}
