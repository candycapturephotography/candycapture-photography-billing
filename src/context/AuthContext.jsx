import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { load, save, STORAGE_KEYS } from '../utils/storage'
import { useConfig } from './ConfigContext'
import { validatePassword, validateUsername } from '../utils/validators'

/**
 * AuthContext - Authentication and User Management
 * 
 * Provides:
 * - User authentication (login/logout)
 * - Session management with 60-minute inactivity timeout
 * - Login attempt tracking and account lockout (5 attempts in 15 minutes)
 * - User data persistence
 * - Initial admin account seeding from configuration
 * 
 * Validates: Requirements 1.1, 1.4, 1.5, 1.6, 1.7, 2.1, 2.6, 2.8
 */

const AuthContext = createContext(null)

// Constants
const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes lockout

/**
 * Simple hash function for password storage.
 * Note: In a production environment with a backend, use bcrypt or similar.
 * This is a client-side app, so we use a basic hash for demonstration.
 * @param {string} password - The password to hash
 * @returns {string} - The hashed password
 */
function hashPassword(password) {
  // Simple hash using btoa + salt pattern
  // In a real backend scenario, this would be bcrypt/argon2
  const salt = 'ccp_salt_v1'
  const combined = salt + password + salt
  // Use a basic encoding approach that's consistent
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(16) + '_' + btoa(combined).slice(0, 16)
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The password to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {boolean} - True if password matches
 */
function verifyPassword(password, storedHash) {
  return hashPassword(password) === storedHash
}

/**
 * Generate a unique ID for users and sessions
 * @returns {string} - A unique identifier
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11)
}

/**
 * AuthProvider component that provides authentication context to the application.
 * 
 * Features:
 * - Seeds initial admin account from config when no users exist (Requirement 2.8)
 * - Manages authenticated sessions with 60-minute timeout (Requirement 1.4)
 * - Tracks login attempts and enforces account lockout (Requirement 1.6)
 * - Does not disclose whether username or password was wrong (Requirement 1.5)
 * - Does not disclose that an account is disabled (Requirement 2.6)
 */
export function AuthProvider({ children }) {
  const { config } = useConfig()
  
  // State
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  /**
   * Get all users from storage
   * @returns {Array} - Array of user objects
   */
  const getUsers = useCallback(() => {
    return load(STORAGE_KEYS.USERS, [])
  }, [])
  
  /**
   * Save users to storage
   * @param {Array} users - Array of user objects to save
   */
  const saveUsers = useCallback((users) => {
    save(STORAGE_KEYS.USERS, users)
  }, [])
  
  /**
   * Get login attempts from storage
   * @param {string} username - Optional username to filter by
   * @returns {Array} - Array of login attempt records
   */
  const getLoginAttempts = useCallback((username = null) => {
    const attempts = load(STORAGE_KEYS.LOGIN_ATTEMPTS, [])
    if (username) {
      return attempts.filter(a => a.username.toLowerCase() === username.toLowerCase())
    }
    return attempts
  }, [])
  
  /**
   * Save login attempts to storage
   * @param {Array} attempts - Array of login attempt records
   */
  const saveLoginAttempts = useCallback((attempts) => {
    save(STORAGE_KEYS.LOGIN_ATTEMPTS, attempts)
  }, [])
  
  /**
   * Record a login attempt
   * @param {string} username - The username attempted
   * @param {boolean} success - Whether the attempt was successful
   */
  const recordLoginAttempt = useCallback((username, success) => {
    const attempts = getLoginAttempts()
    attempts.push({
      username: username.toLowerCase(),
      timestamp: new Date().toISOString(),
      success,
    })
    
    // Clean up old attempts (older than 24 hours) to prevent storage bloat
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    const recentAttempts = attempts.filter(a => 
      new Date(a.timestamp).getTime() > oneDayAgo
    )
    
    saveLoginAttempts(recentAttempts)
  }, [getLoginAttempts, saveLoginAttempts])
  
  /**
   * Check if an account is locked due to too many failed attempts
   * @param {string} username - The username to check
   * @returns {{ isLocked: boolean, lockoutMinutes?: number }} - Lock status and remaining minutes
   */
  const checkAccountLockout = useCallback((username) => {
    const attempts = getLoginAttempts(username)
    const now = Date.now()
    
    // Filter to failed attempts within the lockout window
    const recentFailedAttempts = attempts.filter(a => 
      !a.success && 
      (now - new Date(a.timestamp).getTime()) < LOCKOUT_WINDOW_MS
    )
    
    if (recentFailedAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      // Find the most recent failed attempt
      const mostRecentAttempt = recentFailedAttempts.reduce((latest, current) => {
        return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      })
      
      const lockoutEndsAt = new Date(mostRecentAttempt.timestamp).getTime() + LOCKOUT_DURATION_MS
      const remainingMs = lockoutEndsAt - now
      
      if (remainingMs > 0) {
        return {
          isLocked: true,
          lockoutMinutes: Math.ceil(remainingMs / (60 * 1000)),
        }
      }
    }
    
    return { isLocked: false }
  }, [getLoginAttempts])
  
  /**
   * Seed the initial admin account from configuration
   * Only runs when no users exist in storage (Requirement 2.8)
   */
  const seedInitialAdmin = useCallback(() => {
    const users = getUsers()
    
    if (users.length === 0 && config.initialAdminUsername && config.initialAdminPassword) {
      const adminUser = {
        id: generateId(),
        username: config.initialAdminUsername,
        passwordHash: hashPassword(config.initialAdminPassword),
        role: 'Admin',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      }
      
      saveUsers([adminUser])
      console.log('[Auth] Initial admin account seeded successfully')
    }
  }, [config, getUsers, saveUsers])
  
  /**
   * Check if the current session is valid
   * @returns {boolean} - True if session is valid
   */
  const checkSessionValidity = useCallback(() => {
    const session = load(STORAGE_KEYS.SESSION, null)
    const lastActivity = load(STORAGE_KEYS.LAST_ACTIVITY, null)
    
    if (!session || !lastActivity) {
      return false
    }
    
    const elapsed = Date.now() - new Date(lastActivity).getTime()
    return elapsed < SESSION_TIMEOUT_MS
  }, [])
  
  /**
   * Update the last activity timestamp
   */
  const updateLastActivity = useCallback(() => {
    save(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString())
  }, [])
  
  /**
   * Restore session from storage on initialization
   */
  const restoreSession = useCallback(() => {
    if (checkSessionValidity()) {
      const session = load(STORAGE_KEYS.SESSION, null)
      if (session && session.userId) {
        const users = getUsers()
        const sessionUser = users.find(u => u.id === session.userId)
        
        if (sessionUser && sessionUser.enabled) {
          // Create user object without passwordHash for context
          const { passwordHash, ...safeUser } = sessionUser
          setUser(safeUser)
          updateLastActivity()
        } else {
          // User not found or disabled, clear session
          clearSession()
        }
      }
    } else {
      // Session expired or invalid, clear it
      clearSession()
    }
    setIsInitialized(true)
  }, [checkSessionValidity, getUsers, updateLastActivity])
  
  /**
   * Clear the current session
   */
  const clearSession = useCallback(() => {
    save(STORAGE_KEYS.SESSION, null)
    save(STORAGE_KEYS.LAST_ACTIVITY, null)
    setUser(null)
  }, [])
  
  /**
   * Login function - authenticates user and establishes session
   * @param {string} username - The username to authenticate
   * @param {string} password - The password to verify
   * @returns {Promise<LoginResult>} - Login result with success status and optional error
   * 
   * Validates: Requirements 1.4, 1.5, 1.6, 2.6
   */
  const login = useCallback(async (username, password) => {
    // Check for account lockout first (Requirement 1.6)
    const lockoutStatus = checkAccountLockout(username)
    if (lockoutStatus.isLocked) {
      return {
        success: false,
        error: 'account_locked',
        lockoutMinutes: lockoutStatus.lockoutMinutes,
      }
    }
    
    const users = getUsers()
    const foundUser = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase()
    )
    
    // Check credentials
    // Note: We use the same error for invalid username, invalid password, 
    // and disabled account to avoid information disclosure (Requirements 1.5, 2.6)
    if (!foundUser || !verifyPassword(password, foundUser.passwordHash)) {
      recordLoginAttempt(username, false)
      return {
        success: false,
        error: 'invalid_credentials',
      }
    }
    
    // Check if account is disabled (same error as invalid credentials per Requirement 2.6)
    if (!foundUser.enabled) {
      recordLoginAttempt(username, false)
      return {
        success: false,
        error: 'invalid_credentials', // Don't disclose that account is disabled
      }
    }
    
    // Successful login
    recordLoginAttempt(username, true)
    
    // Update last login timestamp
    const updatedUsers = users.map(u => {
      if (u.id === foundUser.id) {
        return { ...u, lastLogin: new Date().toISOString() }
      }
      return u
    })
    saveUsers(updatedUsers)
    
    // Create session
    const session = {
      userId: foundUser.id,
      createdAt: new Date().toISOString(),
    }
    save(STORAGE_KEYS.SESSION, session)
    updateLastActivity()
    
    // Set user in context (without passwordHash)
    const { passwordHash, ...safeUser } = { ...foundUser, lastLogin: new Date().toISOString() }
    setUser(safeUser)
    
    return { success: true }
  }, [checkAccountLockout, getUsers, recordLoginAttempt, saveUsers, updateLastActivity])
  
  /**
   * Logout function - ends the current session
   * Validates: Requirement 1.7
   */
  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])
  
  /**
   * Check if a username already exists (case-insensitive)
   * @param {string} username - The username to check
   * @param {string} excludeUserId - Optional user ID to exclude (for updates)
   * @returns {boolean} - True if username exists
   */
  const isUsernameTaken = useCallback((username, excludeUserId = null) => {
    const users = getUsers()
    return users.some(u => 
      u.username.toLowerCase() === username.toLowerCase() &&
      u.id !== excludeUserId
    )
  }, [getUsers])
  
  /**
   * Create a new user account
   * Only accessible by Admin users
   * 
   * @param {Object} userData - The user data
   * @param {string} userData.username - Username (1-150 characters)
   * @param {string} userData.password - Password (8-128 characters)
   * @param {string} userData.role - Role ('Admin' or 'Staff_User')
   * @returns {Promise<{success: boolean, user?: User, error?: string}>}
   * 
   * Validates: Requirements 2.2, 2.3
   */
  const createUser = useCallback(async (userData) => {
    const { username, password, role } = userData
    
    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return { success: false, error: usernameValidation.error }
    }
    
    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }
    
    // Validate role
    if (role !== 'Admin' && role !== 'Staff_User') {
      return { success: false, error: 'Role must be Admin or Staff_User' }
    }
    
    // Check username uniqueness (case-insensitive) - Requirement 2.2
    if (isUsernameTaken(username)) {
      return { success: false, error: 'Username already exists' }
    }
    
    // Create new user
    const newUser = {
      id: generateId(),
      username: username.trim(),
      passwordHash: hashPassword(password),
      role,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    }
    
    // Save to storage
    const users = getUsers()
    users.push(newUser)
    saveUsers(users)
    
    // Return user without passwordHash
    const { passwordHash, ...safeUser } = newUser
    return { success: true, user: safeUser }
  }, [getUsers, saveUsers, isUsernameTaken])
  
  /**
   * Update a user's role
   * Only accessible by Admin users
   * 
   * @param {string} userId - The user ID to update
   * @param {Object} data - The update data
   * @param {string} data.role - New role ('Admin' or 'Staff_User')
   * @returns {Promise<{success: boolean, user?: User, error?: string}>}
   * 
   * Validates: Requirement 2.5
   */
  const updateUser = useCallback(async (userId, data) => {
    const { role } = data
    
    // Validate role if provided
    if (role !== undefined && role !== 'Admin' && role !== 'Staff_User') {
      return { success: false, error: 'Role must be Admin or Staff_User' }
    }
    
    const users = getUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' }
    }
    
    // Update user
    const updatedUser = {
      ...users[userIndex],
      ...(role !== undefined && { role }),
    }
    
    users[userIndex] = updatedUser
    saveUsers(users)
    
    // Return user without passwordHash
    const { passwordHash, ...safeUser } = updatedUser
    return { success: true, user: safeUser }
  }, [getUsers, saveUsers])
  
  /**
   * Disable a user account
   * Only accessible by Admin users
   * 
   * @param {string} userId - The user ID to disable
   * @returns {Promise<{success: boolean, error?: string}>}
   * 
   * Validates: Requirement 2.5
   */
  const disableUser = useCallback(async (userId) => {
    const users = getUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' }
    }
    
    // Prevent disabling self (current user)
    if (user && users[userIndex].id === user.id) {
      return { success: false, error: 'Cannot disable your own account' }
    }
    
    // Update user to disabled
    users[userIndex] = {
      ...users[userIndex],
      enabled: false,
    }
    
    saveUsers(users)
    return { success: true }
  }, [getUsers, saveUsers, user])
  
  /**
   * Update a user's password
   * Admin can update any user's password
   * 
   * @param {string} userId - The user ID whose password to update
   * @param {string} newPassword - The new password (8-128 characters)
   * @returns {Promise<{success: boolean, error?: string}>}
   * 
   * Validates: Requirements 2.3, 2.4
   */
  const updatePassword = useCallback(async (userId, newPassword) => {
    // Validate password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }
    
    const users = getUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' }
    }
    
    // Update password hash
    users[userIndex] = {
      ...users[userIndex],
      passwordHash: hashPassword(newPassword),
    }
    
    saveUsers(users)
    return { success: true }
  }, [getUsers, saveUsers])
  
  /**
   * Reset a user's password (Admin function)
   * This is functionally the same as updatePassword but semantically different
   * Used when Admin resets password for another user
   * 
   * @param {string} userId - The user ID whose password to reset
   * @param {string} newPassword - The new password (8-128 characters)
   * @returns {Promise<{success: boolean, error?: string}>}
   * 
   * Validates: Requirements 2.3, 2.4
   */
  const resetPassword = useCallback(async (userId, newPassword) => {
    // Use the same logic as updatePassword
    return updatePassword(userId, newPassword)
  }, [updatePassword])
  
  // Initialize on mount
  useEffect(() => {
    seedInitialAdmin()
    restoreSession()
  }, [seedInitialAdmin, restoreSession])
  
  // Set up activity listener to update last activity on user interaction
  useEffect(() => {
    if (!user) return
    
    const handleActivity = () => {
      updateLastActivity()
    }
    
    // Listen to various user activities
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user, updateLastActivity])
  
  /**
   * Mark session as expired in storage
   * This allows the ProtectedRoute to detect and display session expiry message
   */
  const markSessionExpired = useCallback(() => {
    save(STORAGE_KEYS.SESSION_EXPIRED, true)
  }, [])
  
  /**
   * Clear the session expired flag
   * Called after displaying the expiry message
   */
  const clearSessionExpiredFlag = useCallback(() => {
    save(STORAGE_KEYS.SESSION_EXPIRED, false)
  }, [])
  
  /**
   * Check if the session was marked as expired
   * @returns {boolean} - True if session was expired due to timeout
   */
  const wasSessionExpired = useCallback(() => {
    return load(STORAGE_KEYS.SESSION_EXPIRED, false)
  }, [])
  
  // Set up session timeout checker
  useEffect(() => {
    if (!user) return
    
    const checkSession = () => {
      if (!checkSessionValidity()) {
        // Mark session as expired before clearing
        markSessionExpired()
        clearSession()
      }
    }
    
    // Check session validity every minute
    const intervalId = setInterval(checkSession, 60 * 1000)
    
    return () => clearInterval(intervalId)
  }, [user, checkSessionValidity, clearSession, markSessionExpired])
  
  // Compute derived values
  const isAuthenticated = user !== null
  const isAdmin = user?.role === 'Admin'
  
  // Context value
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin,
    isInitialized,
    login,
    logout,
    getUsers,
    getLoginAttempts,
    createUser,
    updateUser,
    disableUser,
    updatePassword,
    resetPassword,
    wasSessionExpired,
    clearSessionExpiredFlag,
  }), [user, isAuthenticated, isAdmin, isInitialized, login, logout, getUsers, getLoginAttempts, createUser, updateUser, disableUser, updatePassword, resetPassword, wasSessionExpired, clearSessionExpiredFlag])
  
  // Don't render children until initialized
  if (!isInitialized) {
    return null // Or a loading spinner
  }
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to access the authentication context.
 * Must be used within an AuthProvider.
 * 
 * @returns {AuthContextValue} The authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

// Export utilities for potential use in user management (task 2.4)
export { hashPassword, verifyPassword, generateId }
