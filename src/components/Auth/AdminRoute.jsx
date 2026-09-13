import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * AdminRoute Component
 * 
 * A route wrapper that restricts access to Admin users only.
 * This component should be used inside a ProtectedRoute (assumes user is already authenticated).
 * 
 * Behavior:
 * - If user is an Admin, renders the children
 * - If user is not an Admin (Staff_User), redirects to Dashboard with access-denied indication
 * 
 * Validates: Requirement 2.7
 * - IF a Staff_User requests the User Management or Admin Password sections, THEN THE Auth_Service
 *   SHALL deny access by not rendering the requested section and redirecting the user to the
 *   Dashboard with an access-denied indication.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The admin-only content to render when user is admin
 * @returns {React.ReactElement} - Admin-only content or redirect to Dashboard
 * 
 * @example
 * // Usage in routing (wrapped inside ProtectedRoute)
 * <ProtectedRoute>
 *   <AdminRoute>
 *     <UserManagement />
 *   </AdminRoute>
 * </ProtectedRoute>
 */
export default function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated } = useAuth()
  
  // If not authenticated, this component assumes it's wrapped in ProtectedRoute
  // which will handle the redirect to login. But as a safety measure:
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        replace 
      />
    )
  }
  
  // If user is not an admin, redirect to Dashboard with access-denied state
  if (!isAdmin) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          accessDenied: true,
          message: 'You do not have permission to access this section.'
        }} 
        replace 
      />
    )
  }
  
  // User is authenticated and is an Admin, render the protected content
  return children
}
