import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute Component
 * 
 * A route wrapper that protects routes from unauthenticated access.
 * - Redirects unauthenticated users to the login page
 * - Passes session expiry state to login page for displaying appropriate message
 * - Shows loading state while authentication is initializing
 * - Renders children when authenticated
 * 
 * Validates: Requirements 1.1, 1.4
 * - Requirement 1.1: WHEN an unauthenticated user requests any Portal route other than the login route,
 *   THE Auth_Service SHALL redirect the user to the login page.
 * - Requirement 1.4: Session management with redirect handling
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The protected content to render when authenticated
 * @returns {React.ReactElement} - Protected route content or redirect
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized, wasSessionExpired, clearSessionExpiredFlag } = useAuth()
  const location = useLocation()
  
  // Show loading state while authentication is initializing
  // This prevents flashing the login page before session restoration completes
  if (!isInitialized) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    )
  }
  
  // If not authenticated, redirect to login page
  // Pass the current location so we can redirect back after login
  // Also check if this might be a session expiry (user was on a protected route)
  if (!isAuthenticated) {
    // Check if session was expired due to timeout
    const sessionExpired = wasSessionExpired()
    
    // Clear the session expired flag so it doesn't persist across reloads
    if (sessionExpired) {
      clearSessionExpiredFlag()
    }
    
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location,
          sessionExpired: sessionExpired,
          // The message will be shown if session was expired due to timeout
          message: sessionExpired 
            ? 'Your session has expired. Please log in again.' 
            : undefined
        }} 
        replace 
      />
    )
  }
  
  // User is authenticated, render the protected content
  return children
}

// Styles for loading state
const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(190, 24, 93, 0.2)',
    borderTop: '4px solid #be185d',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#831843',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
}

// Add keyframe animation for spinner
// Note: In a real application, this would be in a CSS file or use CSS-in-JS library
// For inline styles, we need to inject the animation
if (typeof document !== 'undefined') {
  const styleId = 'protected-route-styles'
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style')
    styleSheet.id = styleId
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(styleSheet)
  }
}
