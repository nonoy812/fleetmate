import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import VehicleCalendar from './Vehiclecalendar'
import ReactDOM from 'react-dom'
import './Vehiclespage.css'

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [seatsFilter, setSeatsFilter] = useState('')
  const [showTopBtn, setShowTopBtn] = useState(false)
  const [cols, setCols] = useState(3)
  const [uploading, setUploading] = useState(false)
  const filterRef = useRef(null)
  const gridRef = useRef(null)
  const calendarRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '', type: '', seats: '', price_per_day: '',
    has_driver: false, driver_fee: '', image_url: '',
    description: '', status: 'available'
  })

  useEffect(() => { fetchVehicles() }, [])

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedVehicle && calendarRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        const rect = calendarRef.current.getBoundingClientRect()
        const scrollTop = window.scrollY + rect.top - 80
        window.scrollTo({ top: scrollTop, behavior: 'smooth' })
      }, 100)
    }
  }, [selectedVehicle])

  useEffect(() => {
    function updateCols() {
      if (!gridRef.current) return
      const width = gridRef.current.offsetWidth
      if (width < 600) setCols(1)
      else if (width < 900) setCols(2)
      else setCols(3)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [vehicles])

  async function fetchVehicles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setVehicles(data || [])
    setLoading(false)
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function openAddForm() {
    setEditingVehicle(null)
    setFormData({
      name: '', type: '', seats: '', price_per_day: '',
      has_driver: false, driver_fee: '', image_url: '',
      description: '', status: 'available'
    })
    setShowForm(true)
  }

  function openEditForm(vehicle) {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name, type: vehicle.type || '',
      seats: vehicle.seats, price_per_day: vehicle.price_per_day,
      has_driver: vehicle.has_driver, driver_fee: vehicle.driver_fee || '',
      image_url: vehicle.image_url || '', description: vehicle.description || '',
      status: vehicle.status || 'available'
    })
    setShowForm(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('vehicles')
      .upload(fileName, file, { upsert: true })

    if (error) {
      alert('Error uploading image')
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('vehicles')
      .getPublicUrl(fileName)

    setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
    setUploading(false)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    const vehicleData = {
      name: formData.name, type: formData.type,
      seats: parseInt(formData.seats),
      price_per_day: parseFloat(formData.price_per_day),
      has_driver: formData.has_driver,
      driver_fee: formData.has_driver ? parseFloat(formData.driver_fee) || 0 : 0,
      image_url: formData.image_url, description: formData.description,
      status: formData.status
    }
    if (editingVehicle) {
      const { error } = await supabase.from('vehicles').update(vehicleData).eq('id', editingVehicle.id)
      if (error) { alert('Error updating vehicle'); return }
    } else {
      const { error } = await supabase.from('vehicles').insert([vehicleData])
      if (error) { alert('Error adding vehicle'); return }
    }
    setShowForm(false)
    fetchVehicles()
  }

  async function confirmAndDelete() {
    const today = new Date().toISOString().split('T')[0]
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', confirmDelete.id)
      .eq('status', 'approved')
      .gte('return_date', today)

    if (upcomingBookings && upcomingBookings.length > 0) {
      alert(`This vehicle has ${upcomingBookings.length} upcoming approved booking${upcomingBookings.length > 1 ? 's' : ''}. Please manage them in the Bookings page before deleting.`)
      setConfirmDelete(null)
      return
    }

    const { error } = await supabase
      .from('vehicles')
      .update({ status: 'archived' })
      .eq('id', confirmDelete.id)

    if (error) alert('Error archiving vehicle.')
    else {
      setConfirmDelete(null)
      setShowForm(false)
      if (selectedVehicle?.id === confirmDelete.id) setSelectedVehicle(null)
      fetchVehicles()
    }
  }

  async function confirmAndToggle() {
    const newStatus = confirmToggle.status === 'available' ? 'unavailable' : 'available'
    const { error } = await supabase.from('vehicles').update({ status: newStatus }).eq('id', confirmToggle.id)
    if (error) alert('Error updating status')
    else {
      setConfirmToggle(null)
      setShowForm(false)
      fetchVehicles()
    }
  }

  function handleCardClick(vehicle) {
    setSelectedVehicle(prev => prev?.id === vehicle.id ? null : vehicle)
  }

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (seatsFilter ? 1 : 0)

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesSeats = !seatsFilter || v.seats >= parseInt(seatsFilter)
    return matchesSearch && matchesStatus && matchesSeats
  })

  const rows = []
  for (let i = 0; i < filteredVehicles.length; i += cols) {
    rows.push(filteredVehicles.slice(i, i + cols))
  }

  const selectedRowIndex = selectedVehicle
    ? Math.floor(filteredVehicles.findIndex(v => v.id === selectedVehicle.id) / cols)
    : -1

  if (loading) return <div className="vehicles-loading">Loading vehicles...</div>

  return (
    <div className="vehicles-page-admin">

      {/* Header */}
      <div className="vehicles-page-header">
        <p className="vehicles-count">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in fleet</p>
        <button className="btn-primary" onClick={openAddForm}>+ Add Vehicle</button>
      </div>

      {/* Search + Filter */}
      <div className="vehicles-controls">
        <div className="vehicles-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="vehicles-search"
          />
        </div>
        <div className="filter-dropdown-wrap" ref={filterRef}>
          <button
            className={`filter-dropdown-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setShowFilterDropdown(prev => !prev)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filter
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
          {showFilterDropdown && (
            <div className="filter-dropdown">
              <div className="filter-section">
                <p className="filter-section-label">Status</p>
                <div className="filter-options">
                  {['all', 'available', 'unavailable', 'maintenance'].map(s => (
                    <button key={s} className={`filter-option ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <p className="filter-section-label">Min. Seats</p>
                <div className="filter-options">
                  {['', '2', '4', '6', '8'].map(s => (
                    <button key={s} className={`filter-option ${seatsFilter === s ? 'active' : ''}`} onClick={() => setSeatsFilter(s)}>
                      {s ? `${s}+` : 'Any'}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button className="filter-clear" onClick={() => { setStatusFilter('all'); setSeatsFilter('') }}>Clear filters</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`vehicles-main-layout ${selectedVehicle ? 'has-calendar' : ''}`}>

        {/* Vehicle Grid */}
        <div className="vehicles-grid-admin" ref={gridRef}>
          {filteredVehicles.length === 0 ? (
            <div className="vehicles-empty">No vehicles found.</div>
          ) : (
            rows.map((row, rowIndex) => (
              <div key={rowIndex} className="vehicle-grid-row">
                <div className="vehicle-row-cards">
                  {row.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className={`vehicle-admin-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                      onClick={() => handleCardClick(vehicle)}
                    >
                      <div className="vehicle-admin-img-wrap">
                        <img
                          src={vehicle.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                          alt={vehicle.name}
                        />
                        <span className={`vehicle-admin-status vehicle-admin-status--${vehicle.status}`}>
                          {vehicle.status}
                        </span>
                      </div>
                      <div className="vehicle-admin-info">
                        <h3 className="vehicle-admin-name">{vehicle.name}</h3>
                        <p className="vehicle-admin-meta">{vehicle.type} · {vehicle.seats} seats</p>
                        <p className="vehicle-admin-price">₱{Number(vehicle.price_per_day).toLocaleString()}/day</p>
                      </div>
                      <div className="vehicle-admin-actions" onClick={e => e.stopPropagation()}>
                        <button className="edit-btn" onClick={() => openEditForm(vehicle)}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile only — inline calendar */}
                {selectedVehicle && selectedRowIndex === rowIndex && (
                  <div className="inline-calendar mobile-only" ref={calendarRef}>
                    <div className="inline-calendar-header">
                      <div>
                        <h3 className="inline-calendar-title">{selectedVehicle.name}</h3>
                        <p className="inline-calendar-sub">Tap card again to close</p>
                      </div>
                      <button className="inline-calendar-close" onClick={() => setSelectedVehicle(null)}>✕</button>
                    </div>
                    <VehicleCalendar vehicleId={selectedVehicle.id} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* PC only — side panel */}
        {selectedVehicle && (
          <div className="calendar-side-panel desktop-only">
            <div className="inline-calendar-header">
              <div>
                <h3 className="inline-calendar-title">{selectedVehicle.name}</h3>
                <p className="inline-calendar-sub">Click card again to close</p>
              </div>
              <button className="inline-calendar-close" onClick={() => setSelectedVehicle(null)}>✕</button>
            </div>
            <VehicleCalendar vehicleId={selectedVehicle.id} />
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && ReactDOM.createPortal(
        <div className="vehicle-form-overlay" onClick={() => setShowForm(false)}>
          <div className="vehicle-form-modal" onClick={e => e.stopPropagation()}>
            <div className="vehicle-form-header">
              <h2>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <button className="form-close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Toyota Innova 2024" required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={formData.type} onChange={handleFormChange}>
                    <option value="">Select type</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Hatchback">Hatchback</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Seats *</label>
                  <input type="number" name="seats" value={formData.seats} onChange={handleFormChange} placeholder="e.g. 7" min="1" required />
                </div>
                <div className="form-group">
                  <label>Price per Day (₱) *</label>
                  <input type="number" name="price_per_day" value={formData.price_per_day} onChange={handleFormChange} placeholder="e.g. 3500" min="0" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" name="has_driver" checked={formData.has_driver} onChange={handleFormChange} />
                    Driver Available
                  </label>
                </div>
                {formData.has_driver && (
                  <div className="form-group">
                    <label>Driver Fee (₱/day)</label>
                    <input type="number" name="driver_fee" value={formData.driver_fee} onChange={handleFormChange} placeholder="e.g. 800" min="0" />
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label>Vehicle Image</label>
                <div className="image-upload-wrap">
                  {formData.image_url ? (
                    <div className="image-preview-wrap">
                      <img src={formData.image_url} alt="Preview" className="image-preview" />
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : uploading ? (
                    <div className="image-uploading">
                      <div className="image-upload-spinner" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <label className="image-upload-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Brief description of the vehicle..." rows="3" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange}>
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              {editingVehicle && (
                <div className="form-danger-zone">
                  <p className="danger-zone-label">Danger Zone</p>
                  <div className="danger-zone-actions">
                    <button type="button" className="delete-vehicle-btn" onClick={() => setConfirmDelete(editingVehicle)}>
                      Delete Vehicle
                    </button>
                  </div>
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Toggle Modal */}
      {confirmToggle && ReactDOM.createPortal(
        <div className="vehicle-form-overlay" onClick={() => setConfirmToggle(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Availability</h3>
            <p>Mark <strong>{confirmToggle.name}</strong> as <strong>{confirmToggle.status === 'available' ? 'unavailable' : 'available'}</strong>?</p>
            <div className="confirm-modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmToggle(null)}>Cancel</button>
              <button className="btn-primary" onClick={confirmAndToggle}>Yes, confirm</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && ReactDOM.createPortal(
        <div className="vehicle-form-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Vehicle</h3>
            <p>Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <div className="confirm-modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger-solid" onClick={confirmAndDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Back to Top */}
      {showTopBtn && (
        <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑ Top</button>
      )}
    </div>
  )
}

export default VehiclesPage