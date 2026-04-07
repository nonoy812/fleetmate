import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import './Bookingspage.css'

function BookingsPage({ onStatusChange }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState(null) // { id, action }

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
    if (error) console.error('Error:', error)
    else setBookings(data || [])
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
      setConfirming(null)
      fetchBookings()
      onStatusChange()
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatDateTime(date) {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filtered = bookings.filter(b => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      b.customer_name?.toLowerCase().includes(s) ||
      b.vehicles?.name?.toLowerCase().includes(s) ||
      b.customer_email?.toLowerCase().includes(s)
    )
  })

  const filterTabs = ['pending', 'approved', 'rejected', 'all']

  return (
    <div className="bookings-page">

      {/* Controls */}
      <div className="bookings-controls">
        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="bookings-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by customer or vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bookings-search"
          />
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bookings-loading">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="bookings-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>No {filter === 'all' ? '' : filter} bookings found.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filtered.map(booking => (
            <div key={booking.id} className={`booking-card booking-card--${booking.status}`}>

              {/* Card Header */}
              <div className="booking-card-header">
                <div className="booking-card-header-left">
                  <h3 className="booking-vehicle">{booking.vehicles?.name || 'Unknown Vehicle'}</h3>
                  <span className="booking-created">Submitted {formatDateTime(booking.created_at)}</span>
                </div>
                <span className={`status-badge ${booking.status}`}>{booking.status}</span>
              </div>

              {/* Card Body */}
              <div className="booking-card-body">
                <div className="booking-detail-grid">
                  <div className="booking-detail">
                    <span className="booking-detail-label">Customer</span>
                    <span className="booking-detail-value">{booking.customer_name}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Email</span>
                    <span className="booking-detail-value">{booking.customer_email}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Phone</span>
                    <span className="booking-detail-value">{booking.customer_phone}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Driver</span>
                    <span className="booking-detail-value">{booking.with_driver ? 'Yes' : 'No'}</span>
                  </div>
                <div className="booking-detail booking-detail--pickup">
                    <span className="booking-detail-label">Pickup</span>
                    <span className="booking-detail-value">{formatDate(booking.pickup_date)}</span>
                </div>
                <div className="booking-detail booking-detail--return">
                    <span className="booking-detail-label">Return</span>
                    <span className="booking-detail-value">{formatDate(booking.return_date)}</span>
                </div>
                  <div className="booking-detail">
                    <span className="booking-detail-label">Total</span>
                    <span className="booking-detail-value booking-total">₱{booking.total_price?.toLocaleString()}</span>
                  </div>
                  {booking.notes && (
                    <div className="booking-detail booking-detail--full">
                      <span className="booking-detail-label">Notes</span>
                      <span className="booking-detail-value">{booking.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              {booking.status === 'pending' && (
                <div className="booking-card-footer">
                  {confirming?.id === booking.id ? (
                    <div className="confirm-dialog">
                      <span className="confirm-text">
                        {confirming.action === 'approved' ? 'Approve this booking?' : 'Reject this booking?'}
                      </span>
                      <button
                        className={confirming.action === 'approved' ? 'confirm-yes-approve' : 'confirm-yes-reject'}
                        onClick={() => updateStatus(booking.id, confirming.action)}
                      >
                        Yes, {confirming.action === 'approved' ? 'Approve' : 'Reject'}
                      </button>
                      <button className="confirm-no" onClick={() => setConfirming(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="action-approve"
                        onClick={() => setConfirming({ id: booking.id, action: 'approved' })}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="action-reject"
                        onClick={() => setConfirming({ id: booking.id, action: 'rejected' })}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BookingsPage