import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '../../supabaseClient'
import VehicleCalendar from './Vehiclecalendar'
import './Bookingspage.css'

function BookingsPage({ onStatusChange }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [confirming, setConfirming] = useState(null)

  // Cancellation state
  const [cancelFlow, setCancelFlow] = useState(false)
  const [cancelledBy, setCancelledBy] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [filter])

  async function fetchBookings() {
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select('*, vehicles(name, status)')
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
      setSelectedBooking(null)
      fetchBookings()
      onStatusChange()
    }
  }

  async function handleApprove() {
    if (selectedBooking.vehicles?.status === 'archived') return

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('status, name')
      .eq('id', selectedBooking.vehicle_id)
      .single()

    if (vehicle?.status === 'archived') {
      alert(`Cannot approve — ${vehicle.name} has been removed from the fleet. Please reject this booking instead.`)
      return
    }

    await updateStatus(selectedBooking.id, 'approved')
  }

  async function handleCancelSubmit() {
    if (!cancelledBy) {
      setCancelError('Please select who is cancelling.')
      return
    }
    if (!cancellationReason.trim()) {
      setCancelError('Please provide a reason for cancellation.')
      return
    }

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy,
        cancellation_reason: cancellationReason.trim()
      })
      .eq('id', selectedBooking.id)

    if (error) {
      alert('Error cancelling booking')
    } else {
      setCancelFlow(false)
      setCancelledBy('')
      setCancellationReason('')
      setCancelError('')
      setSelectedBooking(null)
      fetchBookings()
      onStatusChange()
    }
  }

  function openCancelFlow() {
    setCancelFlow(true)
    setCancelledBy('')
    setCancellationReason('')
    setCancelError('')
  }

  function closeCancelFlow() {
    setCancelFlow(false)
    setCancelledBy('')
    setCancellationReason('')
    setCancelError('')
  }

  function closeModal() {
    setSelectedBooking(null)
    setConfirming(null)
    setCancelFlow(false)
    setCancelledBy('')
    setCancellationReason('')
    setCancelError('')
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function formatDateTime(date) {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function getDuration(pickup, returnDate) {
    const days = Math.ceil((new Date(returnDate) - new Date(pickup)) / (1000 * 60 * 60 * 24))
    return `${days} day${days !== 1 ? 's' : ''}`
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

  const filterTabs = ['pending', 'approved',  'rejected','cancelled', 'all']

  const DriverIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
    </svg>
  )

  const NoDriverIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 4v4h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )

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
            <div
              key={booking.id}
              className={`booking-strip booking-strip--${booking.status} ${booking.vehicles?.status === 'archived' ? 'booking-strip--archived' : ''}`}
              onClick={() => setSelectedBooking(booking)}
            >
              {/* Vehicle + driver */}
              <div className="booking-strip-vehicle-wrap">
                <span className="booking-strip-vehicle">{booking.vehicles?.name || 'Unknown Vehicle'}</span>
                <div className={`driver-indicator ${booking.with_driver ? 'driver-indicator--yes' : 'driver-indicator--no'}`}>
                  {booking.with_driver ? <DriverIcon /> : <NoDriverIcon />}
                  <span>{booking.with_driver ? 'With Driver' : 'Self Drive'}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="booking-strip-field">
                <span className="booking-strip-label">Customer</span>
                <span className="booking-strip-value">{booking.customer_name}</span>
                <span className="booking-strip-sub">{booking.customer_phone}</span>
              </div>

              {/* Pickup */}
              <div className="booking-strip-field">
                <span className="booking-strip-label">Pickup</span>
                <span className="booking-strip-value booking-strip-dates">{formatDate(booking.pickup_date)}</span>
              </div>

              {/* Return */}
              <div className="booking-strip-field">
                <span className="booking-strip-label">Return</span>
                <span className="booking-strip-value booking-strip-dates">{formatDate(booking.return_date)}</span>
                <span className="booking-strip-sub">{getDuration(booking.pickup_date, booking.return_date)}</span>
              </div>

              {/* Price + status */}
              <div className="booking-strip-right">
                <span className="booking-strip-price">₱{booking.total_price?.toLocaleString()}</span>
                <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                <span className="booking-strip-date">{formatDateTime(booking.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="booking-detail-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="booking-detail-header">
              <div>
                <h2 className="booking-detail-vehicle">{selectedBooking.vehicles?.name || 'Unknown Vehicle'}</h2>
                <p className="booking-detail-created">Submitted {formatDateTime(selectedBooking.created_at)}</p>
              </div>
              <div className="booking-detail-header-right">
                <span className={`status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span>
                <button className="detail-close-btn" onClick={closeModal}>✕</button>
              </div>
            </div>

            {/* Archived Warning */}
            {selectedBooking.vehicles?.status === 'archived' && (
              <div className="booking-archived-warning">
                ⚠️ This vehicle has been removed from the fleet. Please reject this booking.
              </div>
            )}

            {/* Driver indicator */}
            <div className={`booking-detail-driver ${selectedBooking.with_driver ? 'with-driver' : 'no-driver'}`}>
              {selectedBooking.with_driver ? <DriverIcon /> : <NoDriverIcon />}
              <span>{selectedBooking.with_driver ? 'Driver Requested' : 'Self Drive'}</span>
            </div>

            {/* Details Grid */}
            <div className="booking-detail-grid">
              <div className="booking-detail-item">
                <span className="booking-detail-label">Customer</span>
                <span className="booking-detail-value">{selectedBooking.customer_name}</span>
              </div>
              <div className="booking-detail-item">
                <span className="booking-detail-label">Phone</span>
                <a href={`tel:${selectedBooking.customer_phone}`} className="booking-detail-phone">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {selectedBooking.customer_phone}
                </a>
              </div>
              <div className="booking-detail-item booking-detail-item--full">
                <span className="booking-detail-label">Email</span>
                <span className="booking-detail-value">{selectedBooking.customer_email}</span>
              </div>
              <div className="booking-detail-item">
                <span className="booking-detail-label">Pickup Date</span>
                <span className="booking-detail-value">{formatDate(selectedBooking.pickup_date)}</span>
              </div>
              <div className="booking-detail-item">
                <span className="booking-detail-label">Return Date</span>
                <span className="booking-detail-value">{formatDate(selectedBooking.return_date)}</span>
              </div>
              <div className="booking-detail-item">
                <span className="booking-detail-label">Duration</span>
                <span className="booking-detail-value">{getDuration(selectedBooking.pickup_date, selectedBooking.return_date)}</span>
              </div>
              <div className="booking-detail-item">
                <span className="booking-detail-label">Total Price</span>
                <span className="booking-detail-value booking-detail-price">₱{selectedBooking.total_price?.toLocaleString()}</span>
              </div>
              {selectedBooking.notes && (
                <div className="booking-detail-item booking-detail-item--full">
                  <span className="booking-detail-label">Notes</span>
                  <span className="booking-detail-value">{selectedBooking.notes}</span>
                </div>
              )}

              {/* Cancellation Info — show if cancelled */}
              {selectedBooking.status === 'cancelled' && (
                <>
                  <div className="booking-detail-item booking-detail-item--full">
                    <span className="booking-detail-label">Cancelled By</span>
                    <span className="booking-detail-value">
                      {selectedBooking.cancelled_by === 'customer' ? '👤 Customer Request' : '🔧 Other / Admin'}
                    </span>
                  </div>
                  {selectedBooking.cancellation_reason && (
                    <div className="booking-detail-item booking-detail-item--full">
                      <span className="booking-detail-label">Reason</span>
                      <span className="booking-detail-value">{selectedBooking.cancellation_reason}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Vehicle Calendar */}
            <div className="booking-detail-calendar">
              <p className="booking-detail-calendar-title">Vehicle Availability</p>
              <VehicleCalendar
                vehicleId={selectedBooking.vehicle_id}
                highlightRange={{
                  start: selectedBooking.pickup_date,
                  end: selectedBooking.return_date
                }}
              />
            </div>

            {/* Actions */}
            <div className="booking-detail-actions">

              {/* Pending actions */}
              {selectedBooking.status === 'pending' && !confirming && (
                <>
                  <button
                    className="action-approve"
                    disabled={selectedBooking.vehicles?.status === 'archived'}
                    onClick={() => setConfirming({ action: 'approved' })}
                  >
                    ✓ Approve Booking
                  </button>
                  <button className="action-reject" onClick={() => setConfirming({ action: 'rejected' })}>
                    ✕ Reject Booking
                  </button>
                </>
              )}

              {/* Approved actions */}
              {selectedBooking.status === 'approved' && !cancelFlow && (
                <button className="action-cancel" onClick={openCancelFlow}>
                  Cancel Booking
                </button>
              )}

              {/* Confirm approve/reject */}
              {confirming && (
                <div className="confirm-dialog-modal">
                  <p className="confirm-dialog-text">
                    {confirming.action === 'approved' ? 'Approve this booking?' : 'Reject this booking? The customer will need to be informed manually.'}
                  </p>
                  <div className="confirm-dialog-btns">
                    <button
                      className={`confirm-yes-${confirming.action === 'approved' ? 'approve' : 'reject'}`}
                      onClick={() => confirming.action === 'approved' ? handleApprove() : updateStatus(selectedBooking.id, 'rejected')}
                    >
                      Yes, {confirming.action === 'approved' ? 'Approve' : 'Reject'}
                    </button>
                    <button className="confirm-no" onClick={() => setConfirming(null)}>Go Back</button>
                  </div>
                </div>
              )}

              {/* Cancel flow */}
              {cancelFlow && (
                <div className="cancel-flow">
                  <p className="cancel-flow-title">Cancel Booking</p>

                  <p className="cancel-flow-label">Who is cancelling?</p>
                  <div className="cancel-by-options">
                    <button
                      className={`cancel-by-btn ${cancelledBy === 'customer' ? 'active' : ''}`}
                      onClick={() => setCancelledBy('customer')}
                    >
                      👤 Customer Request
                    </button>
                    <button
                      className={`cancel-by-btn ${cancelledBy === 'other' ? 'active' : ''}`}
                      onClick={() => setCancelledBy('other')}
                    >
                      🔧 Other / Admin
                    </button>
                  </div>

                  <p className="cancel-flow-label">Reason for cancellation *</p>
                  <textarea
                    className="cancel-reason-input"
                    placeholder="e.g. Customer called to cancel, vehicle unavailable..."
                    value={cancellationReason}
                    onChange={e => { setCancellationReason(e.target.value); setCancelError('') }}
                    rows="3"
                  />

                  {cancelError && <p className="cancel-error">{cancelError}</p>}

                  <div className="cancel-flow-btns">
                    <button className="confirm-yes-reject" onClick={handleCancelSubmit}>
                      Confirm Cancellation
                    </button>
                    <button className="confirm-no" onClick={closeCancelFlow}>Go Back</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default BookingsPage