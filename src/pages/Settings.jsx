import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminPassword from '../components/Settings/AdminPassword.jsx'
import UserManagement from '../components/Settings/UserManagement.jsx'

/**
 * Settings Page - Contains sub-sections for Profile, Admin Password, and User Management
 * 
 * - Profile: Available to all authenticated users
 * - Admin Password: Admin only - allows changing own password
 * - User Management: Admin only - user CRUD operations
 * 
 * Validates: Requirements 3.4, 2.4
 */
export default function Settings() {
  const { studio, setStudio } = useApp()
  const { isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Determine active tab from route
  const getActiveTabFromRoute = () => {
    if (location.pathname === '/settings/admin-password') return 'admin-password'
    if (location.pathname === '/settings/users') return 'user-management'
    return 'profile' // Default to profile
  }
  
  // Active tab state - based on route
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute)
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute())
  }, [location.pathname])
  
  // Profile form state
  const [form, setForm] = useState({ ...studio })
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState('')
  const fileRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    setStudio(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Logo upload ──────────────────────────────────────────────────────────
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image too large. Please use an image under 2MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setLogoError('Only image files are allowed (PNG, JPG, JPEG).')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      set('logo', ev.target.result) // base64 string
    }
    reader.onerror = () => setLogoError('Failed to read image. Try again.')
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    set('logo', '')
    if (fileRef.current) fileRef.current.value = ''
  }

  // Handle tab change - update route
  const handleTabChange = (tabId) => {
    switch (tabId) {
      case 'profile':
        navigate('/settings/profile')
        break
      case 'admin-password':
        navigate('/settings/admin-password')
        break
      case 'user-management':
        navigate('/settings/users')
        break
      default:
        navigate('/settings/profile')
    }
  }

  // Define tabs - Admin Password and User Management only visible to Admin
  const tabs = [
    { id: 'profile', label: 'Profile', icon: '📸' },
    ...(isAdmin ? [
      { id: 'admin-password', label: 'Admin Password', icon: '🔐' },
      { id: 'user-management', label: 'User Management', icon: '👥' },
    ] : []),
  ]

  // Render Profile Section
  const renderProfileSection = () => (
    <>
      <div style={s.sectionHeader}>
        <h1 style={s.title}>Studio Information</h1>
        <p style={s.sub}>This information appears on all your invoices</p>
      </div>

      <div style={s.card}>
        {/* Preview banner */}
        <div style={s.preview}>
          {form.logo
            ? <img src={form.logo} alt="Studio logo" style={s.previewLogo} />
            : <div style={s.previewIcon}>📸</div>
          }
          <div>
            <div style={s.previewName}>{form.name || 'Studio Name'}</div>
            <div style={s.previewInfo}>{form.address}</div>
            <div style={s.previewInfo}>{form.mobile}{form.email ? ` • ${form.email}` : ''}</div>
          </div>
        </div>

        {/* ── Logo Upload ────────────────────────────────────────────────── */}
        <div style={s.logoSection}>
          <div style={s.logoSectionTitle}>Studio Logo</div>
          <div style={s.logoRow}>
            {form.logo ? (
              <div style={s.logoPreviewWrap}>
                <img src={form.logo} alt="logo" style={s.logoPreview} />
                <button style={s.removeLogoBtn} onClick={removeLogo}>✕ Remove</button>
              </div>
            ) : (
              <div
                style={s.logoUploadBox}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🖼️</div>
                <div style={{ fontWeight: '600', color: '#be185d', fontSize: '0.875rem' }}>Click to Upload Logo</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>PNG or JPG, max 2MB</div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: 'none' }}
              onChange={handleLogoUpload}
            />
            {!form.logo && (
              <button style={s.uploadBtn} onClick={() => fileRef.current?.click()}>
                📁 Choose File
              </button>
            )}
          </div>
          {logoError && <div style={s.logoError}>{logoError}</div>}
          <div style={s.logoHint}>
            Logo will appear on invoice previews and PDF downloads.
          </div>
        </div>

        {/* ── Form fields ────────────────────────────────────────────────── */}
        <div style={s.formGrid}>
          <div style={s.field}>
            <label style={s.label}>Studio / Business Name *</label>
            <input style={s.input} placeholder="Candy Capture Photography"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div style={s.field}>
            <label style={s.label}>Invoice Signature (footer text)</label>
            <input style={s.input} placeholder="Candy Capture Photography"
              value={form.signature || ''} onChange={e => set('signature', e.target.value)} />
          </div>

          <div style={{ ...s.field, gridColumn: '1 / -1' }}>
            <label style={s.label}>Address</label>
            <textarea
              style={{ ...s.input, minHeight: '70px', resize: 'vertical' }}
              placeholder="Full address including city, state, PIN"
              value={form.address || ''}
              onChange={e => set('address', e.target.value)}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Mobile Number *</label>
            <input style={s.input} placeholder="+91 XXXXX XXXXX"
              value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} />
          </div>

          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input type="email" style={s.input} placeholder="studio@email.com"
              value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </div>

          <div style={s.field}>
            <label style={s.label}>Instagram Handle</label>
            <input style={s.input} placeholder="@candycapturephotography"
              value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} />
          </div>

          <div style={s.field}>
            <label style={s.label}>Website</label>
            <input style={s.input} placeholder="www.candycapturephotography.com"
              value={form.website || ''} onChange={e => set('website', e.target.value)} />
          </div>
        </div>

        <div style={s.actions}>
          <button style={s.saveBtn} onClick={handleSave}>
            {saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={s.infoBox}>
        <div style={s.infoTitle}>💡 How this is used</div>
        <ul style={s.infoList}>
          <li>Logo appears on invoice preview and PDF header</li>
          <li>Studio name and address appear at the top of every invoice (FROM section)</li>
          <li>Mobile, email, Instagram, and website are shown as contact details</li>
          <li>Signature text appears at the bottom of each PDF invoice</li>
          <li>All changes take effect immediately on new PDFs</li>
        </ul>
      </div>
    </>
  )

  // Render User Management Section
  const renderUserManagementSection = () => (
    <UserManagement />
  )

  // Render the active section content
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSection()
      case 'admin-password':
        return <AdminPassword />
      case 'user-management':
        return renderUserManagementSection()
      default:
        return renderProfileSection()
    }
  }

  return (
    <div style={s.page}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Settings</h1>
        <p style={s.pageSubtitle}>Manage your studio profile, password, and users</p>
      </div>

      {/* Tab Navigation */}
      <div style={s.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...s.tabBtn,
              ...(activeTab === tab.id ? s.tabBtnActive : {}),
            }}
            onClick={() => handleTabChange(tab.id)}
          >
            <span style={s.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={s.content}>
        {renderContent()}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '900px' },
  // Page header
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '1.75rem', fontWeight: '700', color: '#831843', margin: 0 },
  pageSubtitle: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px', margin: '4px 0 0 0' },
  // Tab navigation
  tabNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #fce7f3',
    paddingBottom: '12px',
    flexWrap: 'wrap',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '10px',
    background: '#fdf2f8',
    color: '#9d174d',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #be185d, #ec4899)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(190, 24, 93, 0.25)',
  },
  tabIcon: {
    fontSize: '1rem',
  },
  // Content area
  content: {},
  // Section header (used inside profile)
  sectionHeader: { marginBottom: '24px' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#831843', margin: 0 },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px', margin: '4px 0 0 0' },
  // Card and form
  card: { background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3', marginBottom: '20px' },
  // Preview banner
  preview: { display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg,#831843,#be185d)', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  previewIcon: { fontSize: '2.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 10px', flexShrink: 0 },
  previewLogo: { width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px', flexShrink: 0 },
  previewName: { color: '#fff', fontWeight: '800', fontSize: '1.1rem', marginBottom: '4px' },
  previewInfo: { color: '#fce7f3', fontSize: '0.8rem', lineHeight: '1.6' },
  // Logo upload section
  logoSection: { background: '#fdf2f8', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px', border: '1px solid #fce7f3' },
  logoSectionTitle: { fontSize: '0.85rem', fontWeight: '700', color: '#9d174d', marginBottom: '12px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  logoUploadBox: {
    width: '120px', height: '90px', border: '2px dashed #f9a8d4', borderRadius: '10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: '#fff', transition: 'border-color 0.15s',
  },
  logoPreviewWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoPreview: { width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #fce7f3', background: '#fff', padding: '4px' },
  removeLogoBtn: { background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '7px', padding: '6px 12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.78rem' },
  uploadBtn: { background: 'linear-gradient(135deg,#be185d,#ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem' },
  logoError: { color: '#b91c1c', fontSize: '0.78rem', marginTop: '8px' },
  logoHint: { fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' },
  // Form
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: {},
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '0.875rem', color: '#1f2937', fontFamily: 'inherit' },
  actions: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #fdf2f8' },
  saveBtn: { background: 'linear-gradient(135deg,#be185d,#ec4899)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 28px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(190,24,93,0.3)' },
  infoBox: { background: '#fdf2f8', borderRadius: '12px', padding: '20px', border: '1px solid #fce7f3' },
  infoTitle: { fontSize: '0.9rem', fontWeight: '700', color: '#9d174d', marginBottom: '10px' },
  infoList: { paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem', color: '#6b7280', margin: 0 },
  // Placeholder section (for User Management - future)
  placeholderSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(190,24,93,0.08)',
    border: '1px solid #fce7f3',
    textAlign: 'center',
  },
  placeholderIcon: {
    fontSize: '4rem',
    marginBottom: '16px',
    opacity: 0.7,
  },
  placeholderTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#831843',
    margin: '0 0 8px 0',
  },
  placeholderText: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: '0 0 8px 0',
  },
  placeholderNote: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: 0,
  },
}
