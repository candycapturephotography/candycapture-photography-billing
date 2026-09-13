import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/Auth/LoginForm'

/**
 * Login Page
 * 
 * Displays the login form for unauthenticated users.
 * Redirects authenticated users to the Dashboard immediately.
 * On successful login, navigates to the Dashboard.
 * Displays session expiry message when redirected from protected routes.
 * 
 * Validates: Requirement 1.4 (redirect to Dashboard after successful login)
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isInitialized } = useAuth()
  
  // Session expiry message state
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null)
  
  // Check for session expiry message from ProtectedRoute redirect
  useEffect(() => {
    if (location.state?.sessionExpired && location.state?.message) {
      setSessionExpiredMessage(location.state.message)
    }
  }, [location.state])
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Clear session expiry message on redirect
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isInitialized, navigate])
  
  /**
   * Handle successful login
   * Navigate to Dashboard after authentication
   * Or to the original page the user was trying to access
   */
  const handleLoginSuccess = () => {
    // Clear session expiry message
    setSessionExpiredMessage(null)
    
    // Navigate to the page user was trying to access, or dashboard by default
    const from = location.state?.from?.pathname || '/'
    navigate(from, { replace: true })
  }
  
  // Don't render login form if already authenticated (will redirect)
  // Also show nothing while auth is initializing to prevent flash
  if (!isInitialized || isAuthenticated) {
    return null
  }
  
  return (
    <div>
      {/* Session expiry banner */}
      {sessionExpiredMessage && (
        <div style={styles.sessionExpiryBanner}>
          <span style={styles.sessionExpiryIcon}>⏱️</span>
          <span>{sessionExpiredMessage}</span>
          <button 
            onClick={() => setSessionExpiredMessage(null)}
            style={styles.dismissButton}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  )
}

const styles = {
  sessionExpiryBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    borderBottom: '1px solid #f59e0b',
    padding: '12px 48px 12px 16px',
    color: '#92400e',
    fontSize: '0.9rem',
    fontWeight: '500',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
  },
  sessionExpiryIcon: {
    fontSize: '1.1rem',
  },
  dismissButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#92400e',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.15s',
  },
}
