import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, user, logout } = useAuth()
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  const mainLinks = [
    { to: '/', label: 'Dashboard', icon: '🏠' },
    { to: '/invoices/new', label: 'New Invoice', icon: '📝' },
    { to: '/customers', label: 'Customer Info', icon: '👥' },
    { to: '/invoices', label: 'Invoices', icon: '🧾' },
    { to: '/services', label: 'Services', icon: '📋' },
    { to: '/reports', label: 'Reports', icon: '📊' },
  ]

  const settingsSubItems = [
    { to: '/settings/profile', label: 'Profile', adminOnly: false },
    { to: '/settings/admin-password', label: 'Admin Password', adminOnly: true },
    { to: '/settings/users', label: 'User Management', adminOnly: true },
  ]

  const isRouteActive = (to) => {
    if (to === '/') return location.pathname === '/'
    if (to === '/invoices') {
      return location.pathname === '/invoices' || 
             (location.pathname.startsWith('/invoices/') && !location.pathname.includes('/new'))
    }
    return location.pathname.startsWith(to)
  }

  const isSettingsActive = () => location.pathname.startsWith('/settings')

  React.useEffect(() => {
    if (isSettingsActive()) setSettingsExpanded(true)
  }, [location.pathname])

  const toggleSettings = () => setSettingsExpanded(!settingsExpanded)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>📸</div>
        <div>
          <div style={styles.logoTitle}>Candy Capture</div>
          <div style={styles.logoSub}>Photography</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {mainLinks.map(link => {
          const isActive = isRouteActive(link.to)
          return (
            <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}>
                <span style={styles.navIcon}>{link.icon}</span>
                <span style={styles.navLabel}>{link.label}</span>
              </div>
            </NavLink>
          )
        })}

        <div>
          <div onClick={toggleSettings} style={{ ...styles.navItem, ...(isSettingsActive() ? styles.navItemActive : {}), cursor: 'pointer' }}>
            <span style={styles.navIcon}>⚙️</span>
            <span style={styles.navLabel}>Settings</span>
            <span style={{ ...styles.expandIcon, transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>

          {settingsExpanded && (
            <div style={styles.subMenu}>
              {settingsSubItems.map(item => {
                if (item.adminOnly && !isAdmin) return null
                const isActive = location.pathname === item.to
                return (
                  <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
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

      <div style={styles.sidebarFooter}>
        {user && (
          <div style={styles.userInfo}>
            <span style={styles.userIcon}>👤</span>
            <div style={styles.userDetails}>
              <div style={styles.userName}>{user.username}</div>
              <div style={styles.userRole}>{user.role === 'Admin' ? 'Administrator' : 'Staff'}</div>
            </div>
          </div>
        )}
        
        <button onClick={handleLogout} style={styles.logoutButton}>
          <span style={styles.logoutIcon}>🚪</span>
          <span>Logout</span>
        </button>
        
        <div style={{ fontSize: '0.7rem', color: '#f9a8d4', textAlign: 'center', marginTop: '12px' }}>
          © 2024 Candy Capture Photography
        </div>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: { width: '240px', minHeight: '100vh', background: 'linear-gradient(180deg, #831843 0%, #9d174d 40%, #be185d 100%)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, boxShadow: '4px 0 20px rgba(131,24,67,0.3)' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px 20px', borderBottom: '1px solid rgba(249,168,212,0.2)', marginBottom: '8px' },
  logoIcon: { fontSize: '2rem', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '6px 8px' },
  logoTitle: { color: '#ffffff', fontWeight: '700', fontSize: '0.95rem', lineHeight: '1.2' },
  logoSub: { color: '#f9a8d4', fontSize: '0.75rem', fontWeight: '400' },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', color: '#fce7f3' },
  navItemActive: { background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  navIcon: { fontSize: '1.1rem', width: '22px', textAlign: 'center' },
  navLabel: { fontSize: '0.875rem', flex: 1 },
  expandIcon: { fontSize: '0.6rem', marginLeft: 'auto', transition: 'transform 0.2s ease', color: '#f9a8d4' },
  subMenu: { marginTop: '2px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' },
  subMenuItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px 8px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', color: '#fce7f3', fontSize: '0.825rem' },
  subMenuItemActive: { background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: '500' },
  subMenuBullet: { fontSize: '0.8rem', color: '#f9a8d4' },
  subMenuLabel: { fontSize: '0.825rem' },
  sidebarFooter: { padding: '16px 12px', borderTop: '1px solid rgba(249,168,212,0.2)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', marginBottom: '12px' },
  userIcon: { fontSize: '1.2rem', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', padding: '6px' },
  userDetails: { flex: 1 },
  userName: { color: '#ffffff', fontWeight: '600', fontSize: '0.8rem', lineHeight: '1.2' },
  userRole: { color: '#f9a8d4', fontSize: '0.7rem' },
  logoutButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fce7f3', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  logoutIcon: { fontSize: '1rem' },
}
