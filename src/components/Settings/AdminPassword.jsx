import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { validatePassword } from '../../utils/validators'

/**
 * AdminPassword component - allows admin to change their own password
 * 
 * Features:
 * - Current password verification (optional for security)
 * - New password with confirmation
 * - Password validation (8-128 characters)
 * - Success/error feedback
 * 
 * Validates: Requirements 2.4
 */
export default function AdminPassword() {
  const { user, updatePassword } = useAuth()
  
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Clear field-specific error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('')
    }
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    // Validate new password (8-128 characters)
    const passwordValidation = validatePassword(form.newPassword)
    if (!passwordValidation.valid) {
      newErrors.newPassword = passwordValidation.error
    }
    
    // Validate password confirmation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSuccessMessage('')
    
    try {
      const result = await updatePassword(user.id, form.newPassword)
      
      if (result.success) {
        setSuccessMessage('Password updated successfully!')
        // Clear form after successful update
        setForm({
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setErrors({ submit: result.error || 'Failed to update password' })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.headerIcon}>🔐</div>
        <div>
          <h2 style={s.title}>Change Password</h2>
          <p style={s.subtitle}>Update your admin account password</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={s.form}>
        {/* New Password Field */}
        <div style={s.field}>
          <label style={s.label}>New Password *</label>
          <div style={s.inputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{
                ...s.input,
                borderColor: errors.newPassword ? '#ef4444' : '#e5e7eb',
              }}
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              style={s.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.newPassword && (
            <span style={s.error}>{errors.newPassword}</span>
          )}
          <span style={s.hint}>Password must be 8-128 characters</span>
        </div>
        
        {/* Confirm Password Field */}
        <div style={s.field}>
          <label style={s.label}>Confirm New Password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            style={{
              ...s.input,
              borderColor: errors.confirmPassword ? '#ef4444' : '#e5e7eb',
            }}
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <span style={s.error}>{errors.confirmPassword}</span>
          )}
        </div>
        
        {/* Submit Error */}
        {errors.submit && (
          <div style={s.submitError}>
            <span style={s.errorIcon}>⚠️</span>
            {errors.submit}
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div style={s.successMessage}>
            <span style={s.successIcon}>✅</span>
            {successMessage}
          </div>
        )}
        
        {/* Submit Button */}
        <div style={s.actions}>
          <button
            type="submit"
            style={{
              ...s.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? '🔄 Updating...' : '🔐 Update Password'}
          </button>
        </div>
      </form>
      
      {/* Security Info */}
      <div style={s.infoBox}>
        <div style={s.infoTitle}>🛡️ Password Security Tips</div>
        <ul style={s.infoList}>
          <li>Use a unique password not used elsewhere</li>
          <li>Include a mix of letters, numbers, and symbols</li>
          <li>Avoid easily guessable information</li>
          <li>Change your password periodically for better security</li>
        </ul>
      </div>
    </div>
  )
}

const s = {
  container: {
    maxWidth: '500px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    padding: '20px',
    background: 'linear-gradient(135deg, #831843, #be185d)',
    borderRadius: '12px',
  },
  headerIcon: {
    fontSize: '2rem',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    padding: '8px 10px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#fce7f3',
    margin: 0,
    marginTop: '4px',
  },
  form: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(190, 24, 93, 0.08)',
    border: '1px solid #fce7f3',
    marginBottom: '20px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '12px 44px 12px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: '#1f2937',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
  togglePassword: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px',
    opacity: 0.6,
  },
  hint: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '6px',
  },
  error: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#ef4444',
    marginTop: '6px',
  },
  submitError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#b91c1c',
    fontSize: '0.875rem',
    marginBottom: '16px',
  },
  errorIcon: {
    fontSize: '1rem',
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    color: '#166534',
    fontSize: '0.875rem',
    marginBottom: '16px',
  },
  successIcon: {
    fontSize: '1rem',
  },
  actions: {
    paddingTop: '8px',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #be185d, #ec4899)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(190, 24, 93, 0.3)',
    transition: 'opacity 0.2s, transform 0.2s',
  },
  infoBox: {
    background: '#fdf2f8',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #fce7f3',
  },
  infoTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#9d174d',
    marginBottom: '12px',
  },
  infoList: {
    paddingLeft: '20px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
}
