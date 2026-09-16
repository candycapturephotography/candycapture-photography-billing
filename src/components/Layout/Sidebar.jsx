import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ collapsed = false }) {
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

  const sidebarStyle = collapsed ? styles.sidebarCollapsed : styles.sidebar

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={collapsed ? styles.logoCollapsed : styles.logo}>
        <img src="/logo.png" alt="CandyCapture Logo" style={collapsed ? styles.logoImageCollapsed : styles.logoImage} />
        {!collapsed && (
          <div>
            <div style={styles.logoTitle}>Candy Capture</div>
            <div style={styles.logoSub}>Photography</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {links.map(link => {
          const isActive = isLinkActive(link)
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={{ textDecoration: 'none' }}
              title={collapsed ? link.label : undefined}
            >
              <div style={{ 
                ...styles.navItem,
                ...(collapsed ? styles.navItemCollapsed : {}),
                ...(isActive ? styles.navItemActive : {}) 
              }}>
                <span style={collapsed ? styles.navIconCollapsed : styles.navIcon}>
                  {link.icon}
                </span>
                {!collapsed && (
                  <span style={styles.navLabel}>{link.label}</span>
                )}
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div style={styles.logoutSection}>
        <button 
          onClick={logout} 
          style={collapsed ? styles.logoutButtonCollapsed : styles.logoutButton}
          title={collapsed ? 'Logout' : undefined}
        >
          <span style={styles.logoutIcon}>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Footer */}
      <div style={collapsed ? styles.sidebarFooterCollapsed : styles.sidebarFooter}>
        {!collapsed && (
          <div style={styles.footerText}>
            © 2024 Candy Capture Photography
          </div>
        )}
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #831843 0%, #9d174d 40%, #be185d 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    boxShadow: '4px 0 20px rgba(131,24,67,0.3)',
    transition: 'width 0.2s ease',
  },
  sidebarCollapsed: {
    width: '64px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #831843 0%, #9d174d 40%, #be185d 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    boxShadow: '4px 0 20px rgba(131,24,67,0.3)',
    transition: 'width 0.2s ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(249,168,212,0.2)',
    marginBottom: '8px',
  },
  logoCollapsed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
    borderBottom: '1px solid rgba(249,168,212,0.2)',
    marginBottom: '8px',
  },
  logoImage: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    borderRadius: '10px',
  },
  logoImageCollapsed: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  logoTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    lineHeight: '1.2',
  },
  logoSub: {
    color: '#f9a8d4',
    fontSize: '0.75rem',
    fontWeight: '400',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#fce7f3',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    padding: '12px 8px',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  navIcon: {
    fontSize: '1.1rem',
    width: '22px',
    textAlign: 'center',
  },
  navIconCollapsed: {
    fontSize: '1.3rem',
    width: 'auto',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '0.875rem',
  },
  logoutSection: {
    padding: '8px 12px',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fce7f3',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.15s',
  },
  logoutButtonCollapsed: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 8px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fce7f3',
    cursor: 'pointer',
    fontSize: '1.3rem',
    transition: 'all 0.15s',
  },
  logoutIcon: {
    fontSize: '1.1rem',
  },
  sidebarFooter: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(249,168,212,0.2)',
  },
  sidebarFooterCollapsed: {
    padding: '12px 8px',
    borderTop: '1px solid rgba(249,168,212,0.2)',
  },
  footerText: {
    fontSize: '0.7rem',
    color: '#f9a8d4',
    textAlign: 'center',
  },
}
