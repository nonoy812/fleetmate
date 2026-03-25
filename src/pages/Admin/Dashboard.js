import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  // Vehicle form state
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    seats: '',
    price_per_day: '',
    has_driver: false,
    driver_fee: '',
    image_url: '',
    description: '',
    status: 'available'
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings()
    } else {
      fetchVehicles()
    }
  }, [activeTab, filter])

  // ─── BOOKINGS ───────────────────────────

  async function fetchBookings() {
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select('*, vehicles(name)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query
    if (error) console.error('Error:', error)
    else setBookings(data)
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) alert('Error updating booking')
    else fetchBookings()
  }

  // ─── VEHICLES ───────────────────────────

  async function fetchVehicles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setVehicles(data)
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
      name: '',
      type: '',
      seats: '',
      price_per_day: '',
      has_driver: false,
      driver_fee: '',
      image_url: '',
      description: '',
      status: 'available'
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
      const { error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', editingVehicle.id)

      if (error) {
        alert('Error updating vehicle')
        return
      }
    } else {
      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData])

      if (error) {
        alert('Error adding vehicle')
        return
      }
    }

    setShowForm(false)
    fetchVehicles()
  }

  async function deleteVehicle(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting vehicle. Make sure it has no bookings.')
    } else {
      fetchVehicles()
    }
  }

  // ─── SHARED ─────────────────────────────

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={`main-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          Vehicles
        </button>
      </div>

      {/* ─── BOOKINGS TAB ─── */}
      {activeTab === 'bookings' && (
        <>
          <div className="filter-tabs">
            {['pending', 'approved', 'rejected', 'all'].map((tab) => (
              <button
                key={tab}
                className={`filter-tab ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="dashboard-loading">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="dashboard-loading">No {filter} bookings.</p>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className={`booking-card status-${booking.status}`}>
                  <div className="booking-top">
                    <h3>{booking.vehicles?.name || 'Unknown Vehicle'}</h3>
                    <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                  </div>
                  <div className="booking-details">
                    <div><strong>Customer:</strong> {booking.customer_name}</div>
                    <div><strong>Email:</strong> {booking.customer_email}</div>
                    <div><strong>Phone:</strong> {booking.customer_phone}</div>
                    <div><strong>Pickup:</strong> {formatDate(booking.pickup_date)}</div>
                    <div><strong>Return:</strong> {formatDate(booking.return_date)}</div>
                    <div><strong>Driver:</strong> {booking.with_driver ? 'Yes' : 'No'}</div>
                    <div><strong>Total:</strong> ₱{booking.total_price?.toLocaleString()}</div>
                    {booking.notes && <div><strong>Notes:</strong> {booking.notes}</div>}
                  </div>
                  {booking.status === 'pending' && (
                    <div className="booking-actions">
                      <button className="approve-btn" onClick={() => updateStatus(booking.id, 'approved')}>
                        Approve
                      </button>
                      <button className="reject-btn" onClick={() => updateStatus(booking.id, 'rejected')}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── VEHICLES TAB ─── */}
      {activeTab === 'vehicles' && (
        <>
          <div className="vehicles-header">
            <button className="add-vehicle-btn" onClick={openAddForm}>
              + Add Vehicle
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="vehicle-form-overlay">
              <div className="vehicle-form">
                <h2>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                <form onSubmit={handleFormSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vehicle Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Toyota Innova 2024"
                        required
                      />
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
                      <input
                        type="number"
                        name="seats"
                        value={formData.seats}
                        onChange={handleFormChange}
                        placeholder="e.g. 7"
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Price per Day (₱) *</label>
                      <input
                        type="number"
                        name="price_per_day"
                        value={formData.price_per_day}
                        onChange={handleFormChange}
                        placeholder="e.g. 3500"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="has_driver"
                          checked={formData.has_driver}
                          onChange={handleFormChange}
                        />
                        Driver Available
                      </label>
                    </div>
                    {formData.has_driver && (
                      <div className="form-group">
                        <label>Driver Fee (₱/day)</label>
                        <input
                          type="number"
                          name="driver_fee"
                          value={formData.driver_fee}
                          onChange={handleFormChange}
                          placeholder="e.g. 800"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleFormChange}
                      placeholder="https://example.com/car-photo.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Brief description of the vehicle..."
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleFormChange}>
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="save-btn">
                      {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Vehicle List */}
          {loading ? (
            <p className="dashboard-loading">Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p className="dashboard-loading">No vehicles yet. Add your first one!</p>
          ) : (
            <div className="vehicles-grid">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="vehicle-manage-card">
                  <img
                    src={vehicle.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={vehicle.name}
                    className="vehicle-manage-img"
                  />
                  <div className="vehicle-manage-info">
                    <h3>{vehicle.name}</h3>
                    <p className="vehicle-manage-type">{vehicle.type} • {vehicle.seats} seats</p>
                    <p className="vehicle-manage-price">₱{vehicle.price_per_day?.toLocaleString()}/day</p>
                    <span className={`vehicle-status ${vehicle.status}`}>{vehicle.status}</span>
                  </div>
                  <div className="vehicle-manage-actions">
                    <button className="edit-btn" onClick={() => openEditForm(vehicle)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteVehicle(vehicle.id, vehicle.name)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard