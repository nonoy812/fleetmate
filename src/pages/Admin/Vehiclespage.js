import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import VehicleCalendar from './Vehiclecalendar'
import './Vehiclespage.css'

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [calendarVehicle, setCalendarVehicle] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [seatsFilter, setSeatsFilter] = useState('')
  const [showTopBtn, setShowTopBtn] = useState(false)
  const filterRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '', type: '', seats: '', price_per_day: '',
    has_driver: false, driver_fee: '', image_url: '',
    description: '', status: 'available'
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  async function fetchVehicles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setVehicles(data || [])
    setLoading(false)
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
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
      name: vehicle.name,
      type: vehicle.type || '',
      seats: vehicle.seats,
      price_per_day: vehicle.price_per_day,
      has_driver: vehicle.has_driver,
      driver_fee: vehicle.driver_fee || '',
      image_url: vehicle.image_url || '',
      description: vehicle.description || '',
      status: vehicle.status || 'available'
    })
    setShowForm(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    const vehicleData = {
      name: formData.name,
      type: formData.type,
      seats: parseInt(formData.seats),
      price_per_day: parseFloat(formData.price_per_day),
      has_driver: formData.has_driver,
      driver_fee: formData.has_driver ? parseFloat(formData.driver_fee) || 0 : 0,
      image_url: formData.image_url,
      description: formData.description,
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
    const { error } = await supabase.from('vehicles').delete().eq('id', confirmDelete.id)
    if (error) alert('Error deleting vehicle. Make sure it has no bookings.')
    else {
      setConfirmDelete(null)
      setShowForm(false)
      fetchVehicles()
    }
  }

  async function confirmAndToggle() {
    const newStatus = confirmToggle.status === 'available' ? 'unavailable' : 'available'
    const { error } = await supabase
      .from('vehicles')
      .update({ status: newStatus })
      .eq('id', confirmToggle.id)

    if (error) alert('Error updating status')
    else {
      setConfirmToggle(null)
      setShowForm(false)
      fetchVehicles()
    }
  }

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (seatsFilter ? 1 : 0)

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesSeats = !seatsFilter || v.seats >= parseInt(seatsFilter)
    return matchesSearch && matchesStatus && matchesSeats
  })

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

        {/* Filter Dropdown */}
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
                    <button
                      key={s}
                      className={`filter-option ${statusFilter === s ? 'active' : ''}`}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <p className="filter-section-label">Min. Seats</p>
                <div className="filter-options">
                  {['', '2', '4', '6', '8'].map(s => (
                    <button
                      key={s}
                      className={`filter-option ${seatsFilter === s ? 'active' : ''}`}
                      onClick={() => setSeatsFilter(s)}
                    >
                      {s ? `${s}+` : 'Any'}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button className="filter-clear" onClick={() => { setStatusFilter('all'); setSeatsFilter('') }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="vehicles-grid-admin">
        {filteredVehicles.length === 0 ? (
          <div className="vehicles-empty">No vehicles found.</div>
        ) : (
          filteredVehicles.map(vehicle => (
            <div key={vehicle.id} className="vehicle-admin-card">
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
              <div className="vehicle-admin-actions">
                <button className="view-calendar-btn" onClick={() => setCalendarVehicle(vehicle)}>
                  📅 View Calendar
                </button>
                <button className="edit-btn" onClick={() => openEditForm(vehicle)}>Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back to Top */}
      {showTopBtn && (
        <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑ Top
        </button>
      )}

      {/* Calendar Modal */}
      {calendarVehicle && (
        <div className="modal-overlay" onClick={() => setCalendarVehicle(null)}>
          <div className="calendar-modal" onClick={e => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <div>
                <h3 className="calendar-panel-title">{calendarVehicle.name}</h3>
                <p className="calendar-panel-sub">Booking availability</p>
              </div>
              <button className="calendar-close" onClick={() => setCalendarVehicle(null)}>✕</button>
            </div>
            <VehicleCalendar vehicleId={calendarVehicle.id} />
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
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

              <div className="form-group">
                <label>Image URL</label>
                <input type="url" name="image_url" value={formData.image_url} onChange={handleFormChange} placeholder="https://example.com/car-photo.jpg" />
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
                    <button
                      type="button"
                      className="toggle-availability-btn"
                      onClick={() => setConfirmToggle(editingVehicle)}
                    >
                      {editingVehicle.status === 'available' ? 'Mark as Unavailable' : 'Mark as Available'}
                    </button>
                    <button
                      type="button"
                      className="delete-vehicle-btn"
                      onClick={() => setConfirmDelete(editingVehicle)}
                    >
                      Delete Vehicle
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingVehicle ? 'Save Changes' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Toggle Modal */}
      {confirmToggle && (
        <div className="modal-overlay" onClick={() => setConfirmToggle(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Availability</h3>
            <p>Mark <strong>{confirmToggle.name}</strong> as <strong>{confirmToggle.status === 'available' ? 'unavailable' : 'available'}</strong>?</p>
            <div className="confirm-modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmToggle(null)}>Cancel</button>
              <button className="btn-primary" onClick={confirmAndToggle}>Yes, confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Vehicle</h3>
            <p>Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <div className="confirm-modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger-solid" onClick={confirmAndDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehiclesPage