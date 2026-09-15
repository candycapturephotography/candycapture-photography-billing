import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const MOBILE_BREAKPOINT = 768

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/invoices/new', label: 'New Invoice', icon: '📝' },
  { to: '/customers', label: 'Customer Info', icon: '👥' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/services', label: 'Services', icon: '📋' },
  { to: '/reports', label: 'Reports', icon: '📊' },
]

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
  const navigate = useNavigate()
  const { isAdmin, user, logout } = useAuth()

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname.startsWith('/settings')) {
      setSettingsExpanded(true)
    }
  }, [location.pathname])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isMobile) return null

  const toggleDrawer = () => setIsOpen(!isOpen)
  const closeDrawer = () => setIsOpen(false)
  const toggleSettings = () => setSettingsExpanded(!settingsExpanded)

  const handleLogout = () => {
    closeDrawer()
    logout()
    navigate('/login')
  }

  const isLinkActive = (linkTo) => {
    if (linkTo === '/') return location.pathname === '/'
    if (linkTo === '/invoices/new') return location.pathname === '/invoices/new'
    if (linkTo === '/invoices') {
      return location.pathname === '/invoices' || 
             (location.pathname.startsWith('/invoices/') && !location.pathname.includes('/new'))
    }
    return location.pathname.startsWith(linkTo)
  }

  const isSettingsActive = () => location.pathname.startsWith('/settings')

  return (
    <>
      <button onClick={toggleDrawer} style={styles.hamburgerButton} aria-label="Menu">
        <span style={styles.hamburgerIcon}>{isOpen ? '✕' : '☰'}</span>
      </button>

      {isOpen && <div style={styles.overlay} onClick={closeDrawer} />}

      <aside style={{ ...styles.drawer, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={styles.drawerHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>📸</div>
            <div>
              <div style={styles.logoTitle}>CandyCapture</div>
              <div style={styles.logoSub}>Photography</div>
            </div>
          </div>
          <button onClick={closeDrawer} style={styles.closeButton}>✕</button>
        </div>

        <nav style={styles.nav}>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }} onClick={closeDrawer}>
              <div style={{ ...styles.navItem, ...(isLinkActive(link.to) ? styles.navItemActive : {}) }}>
                <span style={styles.navIcon}>{link.icon}</span>
                <span style={styles.navLabel}>{link.label}</span>
              </div>
            </NavLink>
          ))}

          <div>
            <div onClick={toggleSettings} style={{ ...styles.navItem, ...(isSettingsActive() ? styles.navItemActive : {}), cursor: 'pointer' }}>
              <span style={styles.navIcon}>⚙️</span>
              <span style={styles.navLabel}>Settings</span>
              <span style={{ ...styles.expandIcon, transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>

            {settingsExpanded && (
              <div style={styles.subMenu}>
                {SETTINGS_SUB_ITEMS.map(item => {
                  if (item.adminOnly && !isAdmin) return null
                  const isActive = location.pathname === item.to
                  return (
                    <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }} onClick={closeDrawer}>
                      <div style={{ ...styles.subMenuItem, ...(isActive ? styles.subMenuItemActive : {}) }}>
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
          
          {/* LOGOUT BUTTON - Fixed for mobile */}
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
          
          <div style={styles.footerText}>© 2024 CandyCapture Photography</div>
        </div>
      </aside>
    </>
  )
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  return isMobile
}

const styles = {
  hamburgerButton: {
    position: 'fixed', top: '12px', left: '12px', zIndex: 1001,
    width: '44px', height: '44px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #831843 0%, #be185d 100%)',
    color: '#ffffff', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(131, 24, 67, 0.3)',
  },
  hamburgerIcon: { fontSize: '1.25rem', lineHeight: 1 },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)', zIndex: 999,
  },
  drawer: {
    position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', maxWidth: '85vw',
    background: 'linear-gradient(180deg, #831843 0%, #9d174d 40%, #be185d 100%)',
    zIndex: 1000, display: 'flex', flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(131, 24, 67, 0.4)', transition: 'transform 0.3s ease',
  },
  drawerHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 16px 12px', borderBottom: '1px solid rgba(249, 168, 212, 0.2)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '1.75rem', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '6px 8px' },
  logoTitle: { color: '#ffffff', fontWeight: '700', fontSize: '1rem', lineHeight: '1.2' },
  logoSub: { color: '#f9a8d4', fontSize: '0.75rem', fontWeight: '400' },
  closeButton: {
    width: '36px', height: '36px', border: 'none', borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '1rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  nav: { flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s ease', color: '#fce7f3',
  },
  navItemActive: {
    background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  navIcon: { fontSize: '1.25rem', width: '24px', textAlign: 'center' },
  navLabel: { fontSize: '0.95rem', flex: 1 },
  expandIcon: { fontSize: '0.6rem', marginLeft: 'auto', transition: 'transform 0.2s ease', color: '#f9a8d4' },
  subMenu: { marginTop: '2px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' },
  subMenuItem: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px 12px 28px',
    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', color: '#fce7f3',
  },
  subMenuItemActive: { background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: '500' },
  subMenuBullet: { fontSize: '0.8rem', color: '#f9a8d4' },
  subMenuLabel: { fontSize: '0.875rem' },
  drawerFooter: { padding: '16px', borderTop: '1px solid rgba(249, 168, 212, 0.2)' },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
    borderRadius: '8px', background: 'rgba(255,255,255,0.1)', marginBottom: '12px',
  },
  userIcon: { fontSize: '1.2rem', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', padding: '6px' },
  userDetails: { flex: 1 },
  userName: { color: '#ffffff', fontWeight: '600', fontSize: '0.8rem', lineHeight: '1.2' },
  userRole: { color: '#f9a8d4', fontSize: '0.7rem' },
  logoutButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none',
    background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca',
    fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '12px',
  },
  footerText: { fontSize: '0.7rem', color: '#f9a8d4', textAlign: 'center' },
}

export default MobileSidebar

