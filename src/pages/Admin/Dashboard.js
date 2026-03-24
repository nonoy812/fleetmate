import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    fetchBookings()
  }, [filter])

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

    if (error) {
      console.error('Error:', error)
    } else {
      setBookings(data)
    }
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert('Error updating booking')
    } else {
      fetchBookings()
    }
  }

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
    </div>
  )
}

export default Dashboard