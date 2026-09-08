import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function Services() {
  const {
    services, addService, updateService, deleteService,
    packages, addPackage, updatePackage, deletePackage,
  } = useApp()

  const [tab, setTab] = useState('services')
  const [showSvcForm, setShowSvcForm] = useState(false)
  const [showPkgForm, setShowPkgForm] = useState(false)
  const [editSvc, setEditSvc] = useState(null)
  const [editPkg, setEditPkg] = useState(null)

  const [svcForm, setSvcForm] = useState({ name: '', description: '' })
  const [pkgForm, setPkgForm] = useState({ name: '', price: '', description: '' })

  const openSvcForm = (svc = null) => {
    setEditSvc(svc)
    setSvcForm(svc ? { name: svc.name, description: svc.description || '' } : { name: '', description: '' })
    setShowSvcForm(true)
  }

  const openPkgForm = (pkg = null) => {
    setEditPkg(pkg)
    setPkgForm(pkg ? { name: pkg.name, price: String(pkg.price), description: pkg.description || '' } : { name: '', price: '', description: '' })
    setShowPkgForm(true)
  }

  const saveSvc = () => {
    if (!svcForm.name.trim()) return
    if (editSvc) updateService(editSvc.id, svcForm)
    else addService(svcForm)
    setShowSvcForm(false)
  }

  const savePkg = () => {
    if (!pkgForm.name.trim() || !pkgForm.price) return
    if (editPkg) updatePackage(editPkg.id, { ...pkgForm, price: Number(pkgForm.price) })
    else addPackage({ ...pkgForm, price: Number(pkgForm.price) })
    setShowPkgForm(false)
  }

  const toggleSvc = (svc) => updateService(svc.id, { active: !svc.active })
  const togglePkg = (pkg) => updatePackage(pkg.id, { active: !pkg.active })

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Services & Packages</h1>
          <p style={s.sub}>Manage your photography services and pricing packages</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === 'services' ? s.tabActive : {}) }} onClick={() => setTab('services')}>
          📋 Services ({services.length})
        </button>
        <button style={{ ...s.tab, ...(tab === 'packages' ? s.tabActive : {}) }} onClick={() => setTab('packages')}>
          📦 Packages ({packages.length})
        </button>
      </div>

      {/* Services Tab */}
      {tab === 'services' && (
        <div style={s.content}>
          <div style={s.contentHeader}>
            <div style={s.contentTitle}>Photography Services</div>
            <button style={s.addBtn} onClick={() => openSvcForm()}>+ Add Service</button>
          </div>
          <div style={s.grid}>
            {services.map(svc => (
              <div key={svc.id} style={{ ...s.card, opacity: svc.active ? 1 : 0.6 }}>
                <div style={s.cardHeader}>
                  <div style={s.cardIcon}>📷</div>
                  <div style={s.cardToggle}>
                    <label style={s.toggle}>
                      <input type="checkbox" checked={svc.active} onChange={() => toggleSvc(svc)} style={{ display: 'none' }} />
                      <div style={{ ...s.toggleTrack, background: svc.active ? '#be185d' : '#e5e7eb' }}>
                        <div style={{ ...s.toggleThumb, transform: svc.active ? 'translateX(20px)' : 'translateX(2px)' }} />
                      </div>
                    </label>
                  </div>
                </div>
                <div style={s.cardName}>{svc.name}</div>
                {svc.description && <div style={s.cardDesc}>{svc.description}</div>}
                <div style={{ ...s.badge, background: svc.active ? '#dcfce7' : '#f3f4f6', color: svc.active ? '#15803d' : '#6b7280' }}>
                  {svc.active ? 'Active' : 'Inactive'}
                </div>
                <div style={s.cardActions}>
                  <button style={s.editBtn} onClick={() => openSvcForm(svc)}>Edit</button>
                  <button style={s.delBtn} onClick={() => {
                    if (window.confirm(`Delete "${svc.name}"?`)) deleteService(svc.id)
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {tab === 'packages' && (
        <div style={s.content}>
          <div style={s.contentHeader}>
            <div style={s.contentTitle}>Photography Packages</div>
            <button style={s.addBtn} onClick={() => openPkgForm()}>+ Add Package</button>
          </div>
          <div style={s.grid}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{ ...s.card, opacity: pkg.active ? 1 : 0.6 }}>
                <div style={s.cardHeader}>
                  <div style={s.pkgPrice}>{fmt(pkg.price)}</div>
                  <div style={s.cardToggle}>
                    <label style={s.toggle}>
                      <input type="checkbox" checked={pkg.active} onChange={() => togglePkg(pkg)} style={{ display: 'none' }} />
                      <div style={{ ...s.toggleTrack, background: pkg.active ? '#be185d' : '#e5e7eb' }}>
                        <div style={{ ...s.toggleThumb, transform: pkg.active ? 'translateX(20px)' : 'translateX(2px)' }} />
                      </div>
                    </label>
                  </div>
                </div>
                <div style={s.cardName}>{pkg.name}</div>
                {pkg.description && <div style={s.cardDesc}>{pkg.description}</div>}
                <div style={{ ...s.badge, background: pkg.active ? '#dcfce7' : '#f3f4f6', color: pkg.active ? '#15803d' : '#6b7280' }}>
                  {pkg.active ? 'Active' : 'Inactive'}
                </div>
                <div style={s.cardActions}>
                  <button style={s.editBtn} onClick={() => openPkgForm(pkg)}>Edit</button>
                  <button style={s.delBtn} onClick={() => {
                    if (window.confirm(`Delete "${pkg.name}"?`)) deletePackage(pkg.id)
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showSvcForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{editSvc ? 'Edit Service' : 'Add New Service'}</div>
            <div style={s.field}>
              <label style={s.label}>Service Name *</label>
              <input style={s.input} placeholder="e.g. Wedding Photography"
                value={svcForm.name} onChange={e => setSvcForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={{ ...s.input, minHeight: '70px', resize: 'vertical' }}
                placeholder="What's included in this service..."
                value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={s.modalBtns}>
              <button style={s.saveBtn} onClick={saveSvc}>Save</button>
              <button style={s.cancelBtn} onClick={() => setShowSvcForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPkgForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{editPkg ? 'Edit Package' : 'Add New Package'}</div>
            <div style={s.field}>
              <label style={s.label}>Package Name *</label>
              <input style={s.input} placeholder="e.g. Premium Package"
                value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Price (₹) *</label>
              <input type="number" style={s.input} placeholder="e.g. 50000"
                value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={{ ...s.input, minHeight: '70px', resize: 'vertical' }}
                placeholder="What's included in this package..."
                value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={s.modalBtns}>
              <button style={s.saveBtn} onClick={savePkg}>Save</button>
              <button style={s.cancelBtn} onClick={() => setShowPkgForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '32px', maxWidth: '1100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { padding: '10px 20px', border: '1.5px solid #fce7f3', borderRadius: '10px', background: '#fff', color: '#9d174d', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'all 0.15s' },
  tabActive: { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: '1.5px solid transparent', fontWeight: '700' },
  content: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3' },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  contentTitle: { fontSize: '1rem', fontWeight: '700', color: '#831843' },
  addBtn: { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 3px 10px rgba(190,24,93,0.25)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' },
  card: { border: '1.5px solid #fce7f3', borderRadius: '14px', padding: '18px', background: '#fdf2f8', transition: 'all 0.15s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardIcon: { fontSize: '1.5rem' },
  pkgPrice: { fontSize: '1.2rem', fontWeight: '800', color: '#be185d' },
  cardName: { fontWeight: '700', fontSize: '0.95rem', color: '#1f2937', marginBottom: '4px' },
  cardDesc: { fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', marginBottom: '12px' },
  cardActions: { display: 'flex', gap: '6px' },
  editBtn: { flex: 1, background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '7px', padding: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.78rem' },
  delBtn: { flex: 1, background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '7px', padding: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.78rem' },
  cardToggle: { display: 'flex', alignItems: 'center' },
  toggle: { cursor: 'pointer' },
  toggleTrack: { width: '40px', height: '22px', borderRadius: '11px', position: 'relative', transition: 'background 0.2s' },
  toggleThumb: { position: 'absolute', top: '3px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '16px', padding: '28px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#831843', marginBottom: '20px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '0.875rem', color: '#1f2937' },
  modalBtns: { display: 'flex', gap: '10px', marginTop: '8px' },
  saveBtn: { flex: 1, background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { padding: '10px 18px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '9px', fontWeight: '600', cursor: 'pointer' },
}
