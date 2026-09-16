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
import Reports from './pages/Reports.jsx'
import Sidebar from './components/Layout/Sidebar.jsx'
import { MobileSidebar, useIsMobile } from './components/Layout/MobileSidebar.jsx'

function Layout({ children }) {
  const isMobile = useIsMobile()
  
  return (
    <div style={styles.layout}>
      {isMobile ? (
        <>
          <MobileSidebar />
          <main style={{ ...styles.main, marginLeft: 0, paddingTop: '68px' }}>
            {children}
          </main>
        </>
      ) : (
        <>
          <Sidebar />
          <main style={styles.main}>
            {children}
          </main>
        </>
      )}
    </div>
  )
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedLayout><Dashboard /></ProtectedLayout>
              } />
              
              <Route path="/invoices" element={
                <ProtectedLayout><Invoices /></ProtectedLayout>
              } />
              <Route path="/invoices/new" element={
                <ProtectedLayout><NewInvoice /></ProtectedLayout>
              } />
              <Route path="/invoices/:id" element={
                <ProtectedLayout><InvoiceView /></ProtectedLayout>
              } />
              <Route path="/invoices/:id/edit" element={
                <ProtectedLayout><InvoiceCreate /></ProtectedLayout>
              } />
              
              <Route path="/customers" element={
                <ProtectedLayout><Customers /></ProtectedLayout>
              } />
              <Route path="/customers/:id" element={
                <ProtectedLayout><CustomerDetail /></ProtectedLayout>
              } />
              
              <Route path="/payments" element={
                <ProtectedLayout><Payments /></ProtectedLayout>
              } />
              <Route path="/services" element={
                <ProtectedLayout><Services /></ProtectedLayout>
              } />
              
              <Route path="/reports" element={
                <ProtectedLayout><Reports /></ProtectedLayout>
              } />
              
              <Route path="/settings" element={
                <ProtectedLayout><Settings /></ProtectedLayout>
              } />
              <Route path="/settings/profile" element={
                <ProtectedLayout><Settings /></ProtectedLayout>
              } />
              <Route path="/settings/admin-password" element={
                <ProtectedLayout>
                  <AdminRoute><Settings /></AdminRoute>
                </ProtectedLayout>
              } />
              <Route path="/settings/users" element={
                <ProtectedLayout>
                  <AdminRoute><Settings /></AdminRoute>
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
  layout: { display: 'flex', minHeight: '100vh' },
  main: { flex: 1, marginLeft: '240px', minHeight: '100vh', background: '#fdf2f8', overflowX: 'hidden' },
}
