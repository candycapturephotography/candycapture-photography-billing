import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function Services() {
  const {
    services, addService, updateService, deleteService,
    packages, addPackage, updatePackage, deletePackage,
    addServiceToPackage, removeServiceFromPackage, updatePackageService,
  } = useApp()

  const [tab, setTab] = useState('services')
  const [showSvcForm, setShowSvcForm] = useState(false)
  const [showPkgForm, setShowPkgForm] = useState(false)
  const [showPkgServices, setShowPkgServices] = useState(null) // Package being edited
  const [editSvc, setEditSvc] = useState(null)
  const [editPkg, setEditPkg] = useState(null)

  const [svcForm, setSvcForm] = useState({ name: '', description: '' })
  const [pkgForm, setPkgForm] = useState({ name: '', price: '', description: '', services: [] })
  const [newPkgService, setNewPkgService] = useState({ name: '', quantity: 1 })

  const openSvcForm = (svc = null) => {
    setEditSvc(svc)
    setSvcForm(svc ? { name: svc.name, description: svc.description || '' } : { name: '', description: '' })
    setShowSvcForm(true)
  }

  const openPkgForm = (pkg = null) => {
    setEditPkg(pkg)
    setPkgForm(pkg 
      ? { name: pkg.name, price: String(pkg.price), description: pkg.description || '', services: pkg.services || [] } 
      : { name: '', price: '', description: '', services: [] }
    )
    setShowPkgForm(true)
  }

  const saveSvc = async () => {
    if (!svcForm.name.trim()) return
    if (editSvc) await updateService(editSvc.id, svcForm)
    else await addService(svcForm)
    setShowSvcForm(false)
  }

  const savePkg = async () => {
    if (!pkgForm.name.trim() || !pkgForm.price) return
    if (editPkg) {
      await updatePackage(editPkg.id, { ...pkgForm, price: Number(pkgForm.price) })
    } else {
      await addPackage({ ...pkgForm, price: Number(pkgForm.price) })
    }
    setShowPkgForm(false)
  }

  const toggleSvc = (svc) => updateService(svc.id, { active: !svc.active })
  const togglePkg = (pkg) => updatePackage(pkg.id, { active: !pkg.active })

  // Add service to package form
  const addSvcToPkgForm = (svc) => {
    if (pkgForm.services.some(s => s.name === svc.name)) return
    setPkgForm(f => ({
      ...f,
      services: [...f.services, { id: Date.now().toString(), name: svc.name, quantity: 1, sortOrder: f.services.length + 1 }]
    }))
  }

  // Remove service from package form
  const removeSvcFromPkgForm = (svcId) => {
    setPkgForm(f => ({ ...f, services: f.services.filter(s => s.id !== svcId) }))
  }

  // Add custom service to package form
  const addCustomSvcToPkgForm = () => {
    if (!newPkgService.name.trim()) return
    setPkgForm(f => ({
      ...f,
      services: [...f.services, { 
        id: Date.now().toString(), 
        name: newPkgService.name, 
        quantity: newPkgService.quantity || 1, 
        sortOrder: f.services.length + 1 
      }]
    }))
    setNewPkgService({ name: '', quantity: 1 })
  }

  // Edit service in existing package
  const openPkgServicesModal = (pkg) => {
    setShowPkgServices(pkg)
    setNewPkgService({ name: '', quantity: 1 })
  }

  // Add service to existing package
  const addSvcToExistingPkg = async (pkgId, svc) => {
    await addServiceToPackage(pkgId, { name: svc.name, quantity: 1 })
  }

  const addCustomSvcToExistingPkg = async () => {
    if (!newPkgService.name.trim() || !showPkgServices) return
    await addServiceToPackage(showPkgServices.id, { name: newPkgService.name, quantity: newPkgService.quantity || 1 })
    setNewPkgService({ name: '', quantity: 1 })
    // Refresh
    const updated = packages.find(p => p.id === showPkgServices.id)
    if (updated) setShowPkgServices(updated)
  }

  const removeSvcFromExistingPkg = async (pkgId, svcId) => {
    await removeServiceFromPackage(pkgId, svcId)
    const updated = packages.find(p => p.id === pkgId)
    if (updated) setShowPkgServices(updated)
  }

  const updateSvcInExistingPkg = async (pkgId, svcId, data) => {
    await updatePackageService(pkgId, svcId, data)
    const updated = packages.find(p => p.id === pkgId)
    if (updated) setShowPkgServices(updated)
  }

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

  // Get current package services for the modal
  const currentPkgServices = showPkgServices 
    ? packages.find(p => p.id === showPkgServices.id)?.services || []
    : []

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
                  <button style={s.delBtn} onClick={() => { if (window.confirm(`Delete "${svc.name}"?`)) deleteService(svc.id) }}>Delete</button>
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
                
                {/* Show services count */}
                {pkg.services && pkg.services.length > 0 && (
                  <div style={s.svcCount}>📋 {pkg.services.length} services included</div>
                )}
                
                <div style={{ ...s.badge, background: pkg.active ? '#dcfce7' : '#f3f4f6', color: pkg.active ? '#15803d' : '#6b7280' }}>
                  {pkg.active ? 'Active' : 'Inactive'}
                </div>
                <div style={s.cardActions}>
                  <button style={s.editBtn} onClick={() => openPkgForm(pkg)}>Edit</button>
                  <button style={s.svcBtn} onClick={() => openPkgServicesModal(pkg)}>Services</button>
                  <button style={s.delBtn} onClick={() => { if (window.confirm(`Delete "${pkg.name}"?`)) deletePackage(pkg.id) }}>Delete</button>
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

      {/* Package Modal - Add/Edit with Service Selection */}
      {showPkgForm && (
        <div style={s.overlay}>
          <div style={s.modalLarge}>
            <div style={s.modalTitle}>{editPkg ? 'Edit Package' : 'Add New Package'}</div>
            
            <div style={s.modalRow}>
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
            </div>
            
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={{ ...s.input, minHeight: '50px', resize: 'vertical' }}
                placeholder="What's included in this package..."
                value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Services Section */}
            <div style={s.svcSection}>
              <div style={s.svcSectionTitle}>📋 Package Services</div>
              
              {/* Quick add from existing services */}
              <div style={s.quickAdd}>
                <span style={s.quickAddLabel}>Quick add:</span>
                <div style={s.quickAddBtns}>
                  {services.filter(s => s.active).map(svc => (
                    <button key={svc.id} style={s.quickAddBtn} onClick={() => addSvcToPkgForm(svc)}>
                      + {svc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom service input */}
              <div style={s.customSvc}>
                <input style={s.customSvcInput} placeholder="Custom service name..."
                  value={newPkgService.name} onChange={e => setNewPkgService(f => ({ ...f, name: e.target.value }))} />
                <input type="number" style={s.customSvcQty} placeholder="Qty" min="1"
                  value={newPkgService.quantity} onChange={e => setNewPkgService(f => ({ ...f, quantity: Number(e.target.value) }))} />
                <button style={s.customSvcBtn} onClick={addCustomSvcToPkgForm}>Add</button>
              </div>

              {/* Selected services list */}
              <div style={s.selectedSvcs}>
                {pkgForm.services.length === 0 ? (
                  <div style={s.noSvcs}>No services added yet. Click services above to add.</div>
                ) : (
                  pkgForm.services.map((svc, idx) => (
                    <div key={svc.id} style={s.selectedSvc}>
                      <span style={s.svcNum}>{idx + 1}.</span>
                      <span style={s.svcName}>{svc.name}</span>
                      <span style={s.svcQty}>x{svc.quantity}</span>
                      <button style={s.svcRemove} onClick={() => removeSvcFromPkgForm(svc.id)}>✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={s.modalBtns}>
              <button style={s.saveBtn} onClick={savePkg}>Save Package</button>
              <button style={s.cancelBtn} onClick={() => setShowPkgForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Package Services Edit Modal */}
      {showPkgServices && (
        <div style={s.overlay}>
          <div style={s.modalLarge}>
            <div style={s.modalTitle}>📦 {showPkgServices.name} - Services</div>
            <div style={s.modalSub}>Add, edit, or remove services from this package</div>

            {/* Quick add from existing services */}
            <div style={s.quickAdd}>
              <span style={s.quickAddLabel}>Quick add:</span>
              <div style={s.quickAddBtns}>
                {services.filter(s => s.active).map(svc => (
                  <button key={svc.id} style={s.quickAddBtn} onClick={() => addSvcToExistingPkg(showPkgServices.id, svc)}>
                    + {svc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom service input */}
            <div style={s.customSvc}>
              <input style={s.customSvcInput} placeholder="Custom service name..."
                value={newPkgService.name} onChange={e => setNewPkgService(f => ({ ...f, name: e.target.value }))} />
              <input type="number" style={s.customSvcQty} placeholder="Qty" min="1"
                value={newPkgService.quantity} onChange={e => setNewPkgService(f => ({ ...f, quantity: Number(e.target.value) }))} />
              <button style={s.customSvcBtn} onClick={addCustomSvcToExistingPkg}>Add</button>
            </div>

            {/* Current services list */}
            <div style={s.svcList}>
              {currentPkgServices.length === 0 ? (
                <div style={s.noSvcs}>No services in this package. Add services above.</div>
              ) : (
                currentPkgServices.map((svc, idx) => (
                  <div key={svc.id} style={s.svcItem}>
                    <span style={s.svcNum}>{idx + 1}.</span>
                    <input style={s.svcEditName} value={svc.name} 
                      onChange={e => updateSvcInExistingPkg(showPkgServices.id, svc.id, { name: e.target.value })} />
                    <input type="number" style={s.svcEditQty} value={svc.quantity} min="1"
                      onChange={e => updateSvcInExistingPkg(showPkgServices.id, svc.id, { quantity: Number(e.target.value) })} />
                    <button style={s.svcRemoveBtn} onClick={() => removeSvcFromExistingPkg(showPkgServices.id, svc.id)}>🗑️</button>
                  </div>
                ))
              )}
            </div>

            <div style={s.modalBtns}>
              <button style={s.saveBtn} onClick={() => setShowPkgServices(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '24px', maxWidth: '1100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#831843' },
  sub: { color: '#9d174d', fontSize: '0.875rem', marginTop: '4px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', border: '1.5px solid #fce7f3', borderRadius: '10px', background: '#fff', color: '#9d174d', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'all 0.15s' },
  tabActive: { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: '1.5px solid transparent', fontWeight: '700' },
  content: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(190,24,93,0.08)', border: '1px solid #fce7f3' },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  contentTitle: { fontSize: '1rem', fontWeight: '700', color: '#831843' },
  addBtn: { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 3px 10px rgba(190,24,93,0.25)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' },
  card: { border: '1.5px solid #fce7f3', borderRadius: '14px', padding: '16px', background: '#fdf2f8', transition: 'all 0.15s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardIcon: { fontSize: '1.5rem' },
  pkgPrice: { fontSize: '1.1rem', fontWeight: '800', color: '#be185d' },
  cardName: { fontWeight: '700', fontSize: '0.9rem', color: '#1f2937', marginBottom: '4px' },
  cardDesc: { fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', lineHeight: '1.4' },
  svcCount: { fontSize: '0.75rem', color: '#be185d', marginBottom: '8px', fontWeight: '500' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600', marginBottom: '12px' },
  cardActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  editBtn: { flex: 1, background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '7px', padding: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem', minWidth: '50px' },
  svcBtn: { flex: 1, background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: '7px', padding: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem', minWidth: '50px' },
  delBtn: { flex: 1, background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '7px', padding: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem', minWidth: '50px' },
  cardToggle: { display: 'flex', alignItems: 'center' },
  toggle: { cursor: 'pointer' },
  toggleTrack: { width: '40px', height: '22px', borderRadius: '11px', position: 'relative', transition: 'background 0.2s' },
  toggleThumb: { position: 'absolute', top: '3px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalLarge: { background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#831843', marginBottom: '8px' },
  modalSub: { fontSize: '0.8rem', color: '#6b7280', marginBottom: '16px' },
  modalRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '0.875rem', color: '#1f2937', boxSizing: 'border-box' },
  modalBtns: { display: 'flex', gap: '10px', marginTop: '16px' },
  saveBtn: { flex: 1, background: 'linear-gradient(135deg, #be185d, #ec4899)', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { padding: '10px 18px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '9px', fontWeight: '600', cursor: 'pointer' },
  // Services section
  svcSection: { marginTop: '16px', padding: '16px', background: '#fdf2f8', borderRadius: '12px', border: '1px solid #fce7f3' },
  svcSectionTitle: { fontWeight: '700', color: '#831843', marginBottom: '12px', fontSize: '0.9rem' },
  quickAdd: { marginBottom: '12px' },
  quickAddLabel: { fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '8px' },
  quickAddBtns: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  quickAddBtn: { background: '#fff', border: '1px solid #fce7f3', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', color: '#be185d', cursor: 'pointer', fontWeight: '500' },
  customSvc: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
  customSvcInput: { flex: 1, minWidth: '150px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem' },
  customSvcQty: { width: '60px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' },
  customSvcBtn: { background: '#be185d', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  selectedSvcs: { maxHeight: '200px', overflowY: 'auto' },
  noSvcs: { color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', padding: '16px' },
  selectedSvc: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fff', borderRadius: '8px', marginBottom: '6px', border: '1px solid #fce7f3' },
  svcNum: { color: '#be185d', fontWeight: '600', fontSize: '0.8rem', width: '24px' },
  svcName: { flex: 1, fontSize: '0.85rem', color: '#1f2937' },
  svcQty: { color: '#6b7280', fontSize: '0.8rem', fontWeight: '500' },
  svcRemove: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' },
  // Edit services list
  svcList: { maxHeight: '300px', overflowY: 'auto', marginTop: '12px' },
  svcItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#fdf2f8', borderRadius: '8px', marginBottom: '8px', border: '1px solid #fce7f3' },
  svcEditName: { flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem' },
  svcEditQty: { width: '50px', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' },
  svcRemoveBtn: { background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.85rem' },
}
