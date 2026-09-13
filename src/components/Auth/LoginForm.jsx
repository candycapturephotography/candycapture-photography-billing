import React, { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { validateUsername, validatePassword } from '../../utils/validators'

/**
 * LoginForm Component
 * 
 * Displays the login form with "CandyCapture Photography" title and "Billing Portal" subtitle.
 * Implements username/password fields with validation.
 * Shows error messages without disclosing which field failed.
 * Retains username on failed login, clears password.
 * Shows lockout message with remaining time.
 * 
 * Validates: Requirements 1.2, 1.3, 1.5, 1.6
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback function called after successful login
 */
export default function LoginForm({ onSuccess }) {
  const { login } = useAuth()
  
  // Form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Error state
  const [error, setError] = useState(null)
  const [lockoutMinutes, setLockoutMinutes] = useState(null)
  
  // Field validation errors (for inline hints)
  const [fieldErrors, setFieldErrors] = useState({})
  
  /**
   * Validate form fields before submission
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const errors = {}
    
    // Validate username (1-150 characters) - Requirement 1.3
    const usernameResult = validateUsername(username)
    if (!usernameResult.valid) {
      errors.username = usernameResult.error
    }
    
    // Validate password (8-128 characters) - Requirement 1.3
    const passwordResult = validatePassword(password)
    if (!passwordResult.valid) {
      errors.password = passwordResult.error
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [username, password])
  
  /**
   * Handle form submission
   * @param {Event} e - Form submission event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    setLockoutMinutes(null)
    
    // Validate form fields
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await login(username, password)
      
      if (result.success) {
        // Login successful - call onSuccess callback
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Login failed - handle error cases
        // Retain username, clear password - Requirement 1.5
        setPassword('')
        
        if (result.error === 'account_locked') {
          // Account lockout - Requirement 1.6
          setLockoutMinutes(result.lockoutMinutes)
          setError('account_locked')
        } else {
          // Invalid credentials - Requirement 1.5
          // Generic message that doesn't disclose which field failed
          setError('invalid_credentials')
        }
      }
    } catch (err) {
      // Unexpected error
      setPassword('')
      setError('unexpected_error')
    } finally {
      setIsLoading(false)
    }
  }, [username, password, login, onSuccess, validateForm])
  
  /**
   * Get error message to display
   * @returns {string|null} Error message or null
   */
  const getErrorMessage = () => {
    if (error === 'account_locked' && lockoutMinutes) {
      return `Account temporarily locked. Please try again in ${lockoutMinutes} minute${lockoutMinutes === 1 ? '' : 's'}.`
    }
    if (error === 'invalid_credentials') {
      return 'Invalid username or password. Please try again.'
    }
    if (error === 'unexpected_error') {
      return 'An unexpected error occurred. Please try again.'
    }
    return null
  }
  
  const errorMessage = getErrorMessage()
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo/Brand area */}
        <div style={styles.brandSection}>
          <div style={styles.logoIcon}>📸</div>
          <h1 style={styles.title}>CandyCapture Photography</h1>
          <h2 style={styles.subtitle}>Billing Portal</h2>
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div style={styles.errorBanner}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        
        {/* Login form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Username field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="username" style={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setFieldErrors(prev => ({ ...prev, username: null }))
              }}
              placeholder="Enter your username"
              className="login-form-input"
              style={{
                ...styles.input,
                ...(fieldErrors.username ? styles.inputError : {}),
              }}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
            {fieldErrors.username && (
              <span style={styles.fieldError}>{fieldErrors.username}</span>
            )}
          </div>
          
          {/* Password field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFieldErrors(prev => ({ ...prev, password: null }))
              }}
              placeholder="Enter your password"
              className="login-form-input"
              style={{
                ...styles.input,
                ...(fieldErrors.password ? styles.inputError : {}),
              }}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span style={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            className="login-form-submit"
            style={{
              ...styles.submitButton,
              ...(isLoading ? styles.submitButtonDisabled : {}),
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={styles.loadingText}>
                <span style={styles.spinner}>⟳</span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            © {new Date().getFullYear()} CandyCapture Photography
          </span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '20px',
    padding: '40px 36px',
    boxShadow: '0 10px 40px rgba(190, 24, 93, 0.15)',
    border: '1px solid #fce7f3',
  },
  brandSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '3.5rem',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#831843',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#9d174d',
    opacity: 0.85,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '24px',
    color: '#b91c1c',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.9375rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: '#f9fafb',
    color: '#1f2937',
    transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
  inputError: {
    borderColor: '#ef4444',
    background: '#fef2f2',
  },
  fieldError: {
    fontSize: '0.8rem',
    color: '#ef4444',
    marginTop: '2px',
  },
  submitButton: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #be185d, #ec4899)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(190, 24, 93, 0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    marginTop: '8px',
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #f3f4f6',
  },
  footerText: {
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
}

// Add CSS keyframes for spinner animation and input focus styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .login-form-input:focus {
      border-color: #ec4899 !important;
      background-color: #ffffff !important;
      box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15) !important;
    }
    
    .login-form-input:hover:not(:focus):not(:disabled) {
      border-color: #d1d5db;
    }
    
    .login-form-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(190, 24, 93, 0.4);
    }
    
    .login-form-submit:active:not(:disabled) {
      transform: translateY(0);
    }
  `
  if (!document.head.querySelector('style[data-login-form-animation]')) {
    styleSheet.setAttribute('data-login-form-animation', 'true')
    document.head.appendChild(styleSheet)
  }
}
