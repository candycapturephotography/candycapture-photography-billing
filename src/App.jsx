import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Invoices from './pages/Invoices.jsx'
import InvoiceCreate from './pages/InvoiceCreate.jsx'
import InvoiceView from './pages/InvoiceView.jsx'
import Customers from './pages/Customers.jsx'
import CustomerDetail from './pages/CustomerDetail.jsx'
import Services from './pages/Services.jsx'
import Payments from './pages/Payments.jsx'
import Settings from './pages/Settings.jsx'

function Sidebar() {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Dashboard', icon: '🏠' },
    { to: '/invoices', label: 'Invoices', icon: '🧾' },
    { to: '/customers', label: 'Customers', icon: '👥' },
    { to: '/payments', label: 'Payments', icon: '💰' },
    { to: '/services', label: 'Services', icon: '📋' },
    { to: '/settings', label: 'Studio Info', icon: '⚙️' },
  ]

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>📸</div>
        <div>
          <div style={styles.logoTitle}>Candy Capture</div>
          <div style={styles.logoSub}>Photography</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {links.map(link => {
          const isActive = link.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(link.to)
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={{ textDecoration: 'none' }}
            >
              <div style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}>
                <span style={styles.navIcon}>{link.icon}</span>
                <span style={styles.navLabel}>{link.label}</span>
              </div>
            </NavLink>
          )
        })}
      </nav>

      <div style={styles.sidebarFooter}>
        <div style={{ fontSize: '0.7rem', color: '#f9a8d4', textAlign: 'center' }}>
          © 2024 Candy Capture Photography
        </div>
      </div>
    </aside>
  )
}

function Layout({ children }) {
  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceCreate />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/:id/edit" element={<InvoiceCreate />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/services" element={<Services />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
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
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(249,168,212,0.2)',
    marginBottom: '8px',
  },
  logoIcon: {
    fontSize: '2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '12px',
    padding: '6px 8px',
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
  navLabel: {
    fontSize: '0.875rem',
  },
  sidebarFooter: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(249,168,212,0.2)',
  },
  main: {
    flex: 1,
    marginLeft: '240px',
    minHeight: '100vh',
    background: '#fdf2f8',
    overflowX: 'hidden',
  },
}
