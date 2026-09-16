import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()

  const links = [
    { to: '/', label: 'Dashboard', icon: '🏠' },
    { to: '/invoices/new', label: 'New Invoice', icon: '➕' },
    { to: '/invoices', label: 'Invoices', icon: '🧾' },
    { to: '/customers', label: 'Customer Info', icon: '👥' },
    { to: '/services', label: 'Services', icon: '📋' },
    { to: '/reports', label: 'Reports', icon: '📊' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const isLinkActive = (link) => {
    if (link.to === '/') {
      return location.pathname === '/'
    } else if (link.to === '/invoices/new') {
      return location.pathname === '/invoices/new'
    } else if (link.to === '/invoices') {
      return location.pathname === '/invoices' || 
        (location.pathname.startsWith('/invoices/') && location.pathname !== '/invoices/new')
    } else {
      return location.pathname.startsWith(link.to)
    }
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div style={styles.mobileHeader}>
        <button
          onClick={() => setIsOpen(true)}
          style={styles.hamburgerButton}
          aria-label="Open navigation menu"
        >
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
        </button>
        
        <div style={styles.mobileLogo}>
          <img src="/logo.png" alt="CandyCapture Logo" style={styles.mobileLogoImage} />
          <span style={styles.mobileLogoText}>Candy Capture</span>
        </div>
        
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          style={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          ...styles.drawer,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Drawer Header */}
        <div style={styles.drawerHeader}>
          <div style={styles.drawerLogo}>
            <img src="/logo.png" alt="CandyCapture Logo" style={styles.drawerLogoImage} />
            <div>
              <div style={styles.drawerLogoTitle}>Candy Capture</div>
              <div style={styles.drawerLogoSub}>Photography</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={styles.closeButton}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          {links.map(link => {
            const isActive = isLinkActive(link)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                style={{ textDecoration: 'none' }}
                onClick={() => setIsOpen(false)}
              >
                <div style={{ 
                  ...styles.navItem, 
                  ...(isActive ? styles.navItemActive : {}) 
                }}>
                  <span style={styles.navIcon}>{link.icon}</span>
                  <span style={styles.navLabel}>{link.label}</span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div style={styles.logoutSection}>
          <button onClick={logout} style={styles.logoutButton}>
            <span style={styles.logoutIcon}>🚪</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div style={styles.drawerFooter}>
          <div style={styles.footerText}>
            © 2024 Candy Capture Photography
          </div>
        </div>
      </aside>
    </>
  )
}

const styles = {
  mobileHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    background: 'linear-gradient(135deg, #831843 0%, #9d174d 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(131,24,67,0.3)',
  },
  hamburgerButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: '8px',
  },
  hamburgerLine: {
    width: '20px',
    height: '2px',
    background: '#ffffff',
    borderRadius: '1px',
    display: 'block',
  },
  mobileLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileLogoImage: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
    borderRadius: '6px',
  },
  mobileLogoText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '1rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    maxWidth: '85vw',
    background: 'linear-gradient(180deg, #831843 0%, #9d174d 40%, #be185d 100%)',
    zIndex: 300,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease-out',
    boxShadow: '4px 0 20px rgba(131,24,67,0.3)',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid rgba(249,168,212,0.2)',
  },
  drawerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  drawerLogoImage: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    borderRadius: '10px',
  },
  drawerLogoTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    lineHeight: '1.2',
  },
  drawerLogoSub: {
    color: '#f9a8d4',
    fontSize: '0.75rem',
    fontWeight: '400',
  },
  closeButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#fce7f3',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  navIcon: {
    fontSize: '1.25rem',
    width: '28px',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '1rem',
    fontWeight: '500',
  },
  logoutSection: {
    padding: '8px 12px',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fce7f3',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  logoutIcon: {
    fontSize: '1.25rem',
    width: '28px',
    textAlign: 'center',
  },
  drawerFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(249,168,212,0.2)',
  },
  footerText: {
    fontSize: '0.7rem',
    color: '#f9a8d4',
    textAlign: 'center',
  },
}
