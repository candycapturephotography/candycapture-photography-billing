import React, { useState } from 'react'

/**
 * PackageSelector component for selecting a package during invoice creation.
 * 
 * Features:
 * - Displays active packages (excludes deactivated packages)
 * - Shows package name and price prominently
 * - Expands to show included services when selected
 * - Visual indication of selected package
 * - Formats prices in Indian Rupee format (₹X,XX,XXX)
 * 
 * Requirements: 6.1, 6.4, 6.5, 16.3
 * 
 * @param {Object} props
 * @param {Array} props.packages - Array of package objects from AppContext
 * @param {string} props.selectedPackageId - Currently selected package ID
 * @param {Function} props.onSelect - Callback when user selects a package (receives packageId)
 */
export default function PackageSelector({ packages = [], selectedPackageId, onSelect }) {
  const [expandedId, setExpandedId] = useState(selectedPackageId || null)

  // Filter to only show active packages (Requirement 16.3)
  const activePackages = packages.filter(pkg => pkg.active !== false)

  // Format price in Indian Rupee format
  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString('en-IN')}`
  }

  // Handle package selection
  const handleSelect = (packageId) => {
    onSelect?.(packageId)
    setExpandedId(packageId)
  }

  // Handle deselection (clicking same package again)
  const handleDeselect = () => {
    onSelect?.('')
    setExpandedId(null)
  }

  // Get sorted services for a package
  const getSortedServices = (pkg) => {
    if (!pkg.services || !Array.isArray(pkg.services)) return []
    return [...pkg.services].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }

  if (activePackages.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📦</div>
        <div style={styles.emptyText}>No packages available</div>
        <div style={styles.emptySubtext}>Create a package in Services to get started</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.packageList}>
        {activePackages.map(pkg => {
          const isSelected = selectedPackageId === pkg.id
          const isExpanded = expandedId === pkg.id
          const services = getSortedServices(pkg)
          
          return (
            <div
              key={pkg.id}
              style={{
                ...styles.packageCard,
                ...(isSelected ? styles.packageCardSelected : {}),
              }}
            >
              {/* Package Header - Clickable area */}
              <div
                style={styles.packageHeader}
                onClick={() => isSelected ? handleDeselect() : handleSelect(pkg.id)}
              >
                <div style={styles.packageInfo}>
                  {/* Selection indicator */}
                  <div style={{
                    ...styles.radio,
                    ...(isSelected ? styles.radioSelected : {}),
                  }}>
                    {isSelected && <div style={styles.radioInner} />}
                  </div>
                  
                  {/* Package name and description */}
                  <div style={styles.packageDetails}>
                    <div style={styles.packageName}>{pkg.name}</div>
                    {pkg.description && (
                      <div style={styles.packageDescription}>{pkg.description}</div>
                    )}
                  </div>
                </div>
                
                {/* Price */}
                <div style={styles.packagePrice}>
                  {formatPrice(pkg.price)}
                </div>
              </div>

              {/* Services Preview - Shown when selected/expanded */}
              {isExpanded && services.length > 0 && (
                <div style={styles.servicesPreview}>
                  <div style={styles.servicesHeader}>
                    <span style={styles.servicesIcon}>✨</span>
                    <span>Included Services ({services.length})</span>
                  </div>
                  <ul style={styles.servicesList}>
                    {services.map((service, index) => (
                      <li key={service.id || index} style={styles.serviceItem}>
                        <span style={styles.serviceBullet}>•</span>
                        <span style={styles.serviceName}>{service.name}</span>
                        {service.quantity > 1 && (
                          <span style={styles.serviceQuantity}>×{service.quantity}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show expand hint if has services but not expanded */}
              {!isExpanded && services.length > 0 && (
                <div style={styles.servicesHint}>
                  <span style={styles.hintIcon}>📋</span>
                  <span>{services.length} service{services.length > 1 ? 's' : ''} included</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
  },
  packageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  packageCard: {
    background: '#fff',
    borderRadius: '12px',
    border: '2px solid #fce7f3',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  packageCardSelected: {
    borderColor: '#be185d',
    boxShadow: '0 4px 12px rgba(190, 24, 93, 0.15)',
  },
  packageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    gap: '12px',
  },
  packageInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
  },
  radio: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
    transition: 'all 0.15s ease',
  },
  radioSelected: {
    borderColor: '#be185d',
  },
  radioInner: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#be185d',
  },
  packageDetails: {
    flex: 1,
  },
  packageName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
  },
  packageDescription: {
    fontSize: '0.8rem',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  packagePrice: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#be185d',
    whiteSpace: 'nowrap',
  },
  servicesPreview: {
    background: '#fdf2f8',
    padding: '14px 16px',
    borderTop: '1px solid #fce7f3',
  },
  servicesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#9d174d',
    marginBottom: '10px',
  },
  servicesIcon: {
    fontSize: '0.9rem',
  },
  servicesList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '6px 16px',
  },
  serviceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: '#4b5563',
  },
  serviceBullet: {
    color: '#ec4899',
    fontWeight: '700',
  },
  serviceName: {
    flex: 1,
  },
  serviceQuantity: {
    fontSize: '0.75rem',
    color: '#9d174d',
    fontWeight: '600',
    background: '#fce7f3',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  servicesHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '0.75rem',
    color: '#9ca3af',
    borderTop: '1px solid #fce7f3',
  },
  hintIcon: {
    fontSize: '0.8rem',
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
  },
}
