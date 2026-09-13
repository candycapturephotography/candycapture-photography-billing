import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * MobileSidebar Component
 * 
 * A mobile-friendly sidebar with hamburger menu that opens a drawer/overlay
 * for navigation on smaller screens (viewport width <= 768px).
 * 
 * Features:
 * - Navigation entries: Dashboard, New Invoice, Customer Info, Invoices, Services, Settings
 * - Active section indication
 * - Settings expandable sub-menu with:
 *   - Profile (all users)
 *   - Admin Password (admin only)
 *   - User Management (admin only)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 22.2
 */

const MOBILE_BREAKPOINT = 768

// Main navigation links
const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/invoices/new', label: 'New Invoice', icon: '📝' },
  { to: '/customers', label: 'Customer Info', icon: '👥' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/services', label: 'Services', icon: '📋' },
]

// Settings sub-menu items
const SETTINGS_SUB_ITEMS = [
  { to: '/settings/profile', label: 'Profile', adminOnly: false },
  { to: '/settings/admin-password', label: 'Admin Password', adminOnly: true },
  { to: '/settings/users', label: 'User Management', adminOnly: true },
]

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const location = useLocation()
  const { isAdmin, user } = useAuth()

  // Check if viewport is mobile width
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
  }, [])

  // Handle window resize
  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Auto-expand settings when a settings route is active
  useEffect(() => {
    if (location.pathname.startsWith('/settings')) {
      setSettingsExpanded(true)
    }
  }, [location.pathname])

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Only render on mobile viewports
  if (!isMobile) {
    return null
  }

  const toggleDrawer = () => setIsOpen(!isOpen)
  const closeDrawer = () => setIsOpen(false)
  const toggleSettings = () => setSettingsExpanded(!settingsExpanded)

  // Check if link is active
  const isLinkActive = (linkTo) => {
    if (linkTo === '/') {
      return location.pathname === '/'
    }
    if (linkTo === '/invoices/new') {
      return location.pathname === '/invoices/new'
    }
    if (linkTo === '/invoices') {
      // Invoices is active for /invoices but not for /invoices/new
      return location.pathname === '/invoices' || 
             (location.pathname.startsWith('/invoices/') && !location.pathname.includes('/new'))
    }
    return location.pathname.startsWith(linkTo)
  }

  // Check if Settings section is active
  const isSettingsActive = () => {
    return location.pathname.startsWith('/settings')
  }

  return (
    <>
      {/* Hamburger Button - Fixed at top */}
      <button
        onClick={toggleDrawer}
        style={styles.hamburgerButton}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        <span style={styles.hamburgerIcon}>
          {isOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          style={styles.overlay}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        id="mobile-navigation-drawer"
        style={{
          ...styles.drawer,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Logo */}
        <div style={styles.drawerHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>📸</div>
            <div>
              <div style={styles.logoTitle}>CandyCapture</div>
              <div style={styles.logoSub}>Photography</div>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            style={styles.closeButton}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(link.to)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                style={{ textDecoration: 'none' }}
                onClick={closeDrawer}
              >
                <div
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                  }}
                >
                  <span style={styles.navIcon}>{link.icon}</span>
                  <span style={styles.navLabel}>{link.label}</span>
                </div>
              </NavLink>
            )
          })}

          {/* Settings with expandable sub-menu */}
          <div>
            <div
              onClick={toggleSettings}
              style={{
                ...styles.navItem,
                ...(isSettingsActive() ? styles.navItemActive : {}),
                cursor: 'pointer',
              }}
            >
              <span style={styles.navIcon}>⚙️</span>
              <span style={styles.navLabel}>Settings</span>
              <span style={{
                ...styles.expandIcon,
                transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▼
              </span>
            </div>

            {/* Settings Sub-menu */}
            {settingsExpanded && (
              <div style={styles.subMenu}>
                {SETTINGS_SUB_ITEMS.map(item => {
                  // Hide admin-only items for non-admin users
                  if (item.adminOnly && !isAdmin) {
                    return null
                  }

                  const isActive = location.pathname === item.to
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      style={{ textDecoration: 'none' }}
                      onClick={closeDrawer}
                    >
                      <div style={{
                        ...styles.subMenuItem,
                        ...(isActive ? styles.subMenuItemActive : {}),
                      }}>
                        <span style={styles.subMenuBullet}>•</span>
                        <span style={styles.subMenuLabel}>{item.label}</span>
                      </div>
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer with user info */}
        <div style={styles.drawerFooter}>
          {user && (
            <div style={styles.userInfo}>
              <span style={styles.userIcon}>👤</span>
              <div style={styles.userDetails}>
                <div style={styles.userName}>{user.username}</div>
                <div style={styles.userRole}>{user.role === 'Admin' ? 'Administrator' : 'Staff'}</div>
              </div>
            </div>
          )}
          <div style={styles.footerText}>
            © 2024 CandyCapture Photography
          </div>
        </div>
      </aside>
    </>
  )
}

// Hook to check if viewport is mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

const styles = {
  // Hamburger button - fixed position at top left
  hamburgerButton: {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: 1001,
    width: '44px',
    height: '44px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #831843 0%, #be185d 100%)',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(131, 24, 67, 0.3)',
    transition: 'all 0.2s ease',
  },
  hamburgerIcon: {
    fontSize: '1.25rem',
    lineHeight: 1,
  },

  // Overlay - semi-transparent background
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    transition: 'opacity 0.3s ease',
  },

  // Drawer - slides in from left
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    maxWidth: '85vw',
    background: 'linear-gradient(180deg, #831843 0%, #9d174d 40%, #be185d 100%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(131, 24, 67, 0.4)',
    transition: 'transform 0.3s ease',
  },

  // Drawer header with logo and close button
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    borderBottom: '1px solid rgba(249, 168, 212, 0.2)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '1.75rem',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    padding: '6px 8px',
  },
  logoTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    lineHeight: '1.2',
  },
  logoSub: {
    color: '#f9a8d4',
    fontSize: '0.75rem',
    fontWeight: '400',
  },
  closeButton: {
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
  },

  // Navigation
  nav: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: '#fce7f3',
  },
  navItemActive: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  navIcon: {
    fontSize: '1.25rem',
    width: '24px',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '0.95rem',
    flex: 1,
  },
  expandIcon: {
    fontSize: '0.6rem',
    marginLeft: 'auto',
    transition: 'transform 0.2s ease',
    color: '#f9a8d4',
  },

  // Settings sub-menu
  subMenu: {
    marginTop: '2px',
    paddingLeft: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  subMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px 12px 28px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#fce7f3',
  },
  subMenuItemActive: {
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    fontWeight: '500',
  },
  subMenuBullet: {
    fontSize: '0.8rem',
    color: '#f9a8d4',
  },
  subMenuLabel: {
    fontSize: '0.875rem',
  },

  // Footer
  drawerFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(249, 168, 212, 0.2)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)',
    marginBottom: '12px',
  },
  userIcon: {
    fontSize: '1.2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '50%',
    padding: '6px',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '0.8rem',
    lineHeight: '1.2',
  },
  userRole: {
    color: '#f9a8d4',
    fontSize: '0.7rem',
  },
  footerText: {
    fontSize: '0.7rem',
    color: '#f9a8d4',
    textAlign: 'center',
  },
}

export default MobileSidebar
