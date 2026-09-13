import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from './context/ConfigContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx'
import AdminRoute from './components/Auth/AdminRoute.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Invoices from './pages/Invoices.jsx'
import InvoiceCreate from './pages/InvoiceCreate.jsx'
import NewInvoice from './pages/NewInvoice.jsx'
import InvoiceView from './pages/InvoiceView.jsx'
import Customers from './pages/Customers.jsx'
import CustomerDetail from './pages/CustomerDetail.jsx'
import Services from './pages/Services.jsx'
import Payments from './pages/Payments.jsx'
import Settings from './pages/Settings.jsx'
import Sidebar from './components/Layout/Sidebar.jsx'
import { MobileSidebar, useIsMobile } from './components/Layout/MobileSidebar.jsx'

/**
 * Layout Component
 * 
 * Provides the main application layout with sidebar navigation.
 * Adapts to mobile viewports by switching to a mobile drawer sidebar.
 */
function Layout({ children }) {
  const isMobile = useIsMobile()
  
  return (
    <div style={styles.layout}>
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile Sidebar - shown only on mobile */}
      <MobileSidebar />
      
      <main style={{
        ...styles.main,
        marginLeft: isMobile ? 0 : '240px',
        paddingTop: isMobile ? '68px' : 0, // Space for hamburger button
      }}>
        {children}
      </main>
    </div>
  )
}

/**
 * ProtectedLayout Component
 * 
 * Wraps the Layout with ProtectedRoute to ensure authentication.
 * All routes except /login use this wrapper.
 */
function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}

/**
 * App Component
 * 
 * Main application component with provider hierarchy and routing.
 * 
 * Provider Hierarchy: ConfigProvider > AuthProvider > AppProvider
 * - ConfigProvider: Environment-driven configuration
 * - AuthProvider: Authentication and user management
 * - AppProvider: Business logic (invoices, customers, services, packages)
 * 
 * Routing:
 * - /login: Public route for authentication
 * - /: Dashboard (entry screen after login) - protected
 * - All other routes: Protected, require authentication
 * - Admin routes (/settings/admin-password, /settings/users): Admin only
 * 
 * Validates: Requirements 1.1, 2.7, 21.1
 * - 1.1: Unauthenticated users are redirected to login
 * - 2.7: Non-admin users cannot access User Management or Admin Password
 * - 21.1: Dashboard is the entry screen after login
 */
export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route - Login page */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes - require authentication */}
              {/* Dashboard is the entry screen after login (Requirement 21.1) */}
              <Route path="/" element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              } />
              
              {/* Invoice routes */}
              <Route path="/invoices" element={
                <ProtectedLayout>
                  <Invoices />
                </ProtectedLayout>
              } />
              <Route path="/invoices/new" element={
                <ProtectedLayout>
                  <NewInvoice />
                </ProtectedLayout>
              } />
              <Route path="/invoices/:id" element={
                <ProtectedLayout>
                  <InvoiceView />
                </ProtectedLayout>
              } />
              <Route path="/invoices/:id/edit" element={
                <ProtectedLayout>
                  <InvoiceCreate />
                </ProtectedLayout>
              } />
              
              {/* Customer routes */}
              <Route path="/customers" element={
                <ProtectedLayout>
                  <Customers />
                </ProtectedLayout>
              } />
              <Route path="/customers/:id" element={
                <ProtectedLayout>
                  <CustomerDetail />
                </ProtectedLayout>
              } />
              
              {/* Other routes */}
              <Route path="/payments" element={
                <ProtectedLayout>
                  <Payments />
                </ProtectedLayout>
              } />
              <Route path="/services" element={
                <ProtectedLayout>
                  <Services />
                </ProtectedLayout>
              } />
              
              {/* Settings routes */}
              <Route path="/settings" element={
                <ProtectedLayout>
                  <Settings />
                </ProtectedLayout>
              } />
              <Route path="/settings/profile" element={
                <ProtectedLayout>
                  <Settings />
                </ProtectedLayout>
              } />
              
              {/* Admin-only settings routes (Requirement 2.7) */}
              <Route path="/settings/admin-password" element={
                <ProtectedLayout>
                  <AdminRoute>
                    <Settings />
                  </AdminRoute>
                </ProtectedLayout>
              } />
              <Route path="/settings/users" element={
                <ProtectedLayout>
                  <AdminRoute>
                    <Settings />
                  </AdminRoute>
                </ProtectedLayout>
              } />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ConfigProvider>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    marginLeft: '240px',
    minHeight: '100vh',
    background: '#fdf2f8',
    overflowX: 'hidden',
  },
}
