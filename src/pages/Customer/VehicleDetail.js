import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import './VehicleDetail.css'



function VehicleDetail() {
  const location = useLocation()
  const passedDates = location.state || {}
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingError, setBookingError] = useState('')
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_date: passedDates.pickupDate || '',
    return_date: passedDates.returnDate || '',
    with_driver: false,
    notes: ''
    
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [blockedRanges, setBlockedRanges] = useState([])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  

  useEffect(() => {
    async function fetchVehicle() {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error:', error)
      } else {
        setVehicle(data)
      }
      setLoading(false)

      const { data: approvedBookings } = await supabase
        .from('bookings')
        .select('pickup_date, return_date')
        .eq('vehicle_id', id)
        .eq('status', 'approved')

      if (approvedBookings) {
        setBlockedRanges(approvedBookings.map(b => {
          const [sy, sm, sd] = b.pickup_date.split('-').map(Number)
          const [ey, em, ed] = b.return_date.split('-').map(Number)
          return {
            start: new Date(sy, sm - 1, sd),
            end: new Date(ey, em - 1, ed)
          }
        }))
      }
    }

    fetchVehicle()
  }, [id])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function isDateBlocked(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return blockedRanges.some(range => {
      const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate())
      const end = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate())
      return d >= start && d <= end
    })
  }

  function calculateTotal() {
    if (!formData.pickup_date || !formData.return_date) return 0
    const days = Math.ceil(
      (new Date(formData.return_date) - new Date(formData.pickup_date)) / (1000 * 60 * 60 * 24)
    )
    if (days <= 0) return 0
    let total = days * vehicle.price_per_day
    if (formData.with_driver) total += days * vehicle.driver_fee
    return total
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Final check against database before submitting
    const { data: freshBookings } = await supabase
      .from('bookings')
      .select('pickup_date, return_date')
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'approved')

    if (freshBookings) {
      const conflict = freshBookings.some(b => {
        const [sy, sm, sd] = b.pickup_date.split('-').map(Number)
        const [ey, em, ed] = b.return_date.split('-').map(Number)
        const bStart = new Date(sy, sm - 1, sd)
        const bEnd = new Date(ey, em - 1, ed)
        const pickup = new Date(formData.pickup_date + 'T00:00:00')
        const returnD = new Date(formData.return_date + 'T00:00:00')
        return pickup <= bEnd && returnD >= bStart
      })

    if (conflict) {
      setBookingError('These dates are already reserved. Please choose different dates.')
      // re-fetch fresh blocked ranges so calendar updates
      const { data: refreshed } = await supabase
        .from('bookings')
        .select('pickup_date, return_date')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'approved')

      if (refreshed) {
        setBlockedRanges(refreshed.map(b => {
          const [sy, sm, sd] = b.pickup_date.split('-').map(Number)
          const [ey, em, ed] = b.return_date.split('-').map(Number)
          return {
            start: new Date(sy, sm - 1, sd),
            end: new Date(ey, em - 1, ed)
          }
        }))
      }
      setFormData(prev => ({ ...prev, pickup_date: '', return_date: '' }))
      return
    }
    }
    setSubmitting(true)

    const total = calculateTotal()

    const { error } = await supabase.from('bookings').insert({
      vehicle_id: vehicle.id,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      pickup_date: formData.pickup_date,
      return_date: formData.return_date,
      with_driver: formData.with_driver,
      total_price: total,
      status: 'pending',
      notes: formData.notes
    })

    if (error) {
      console.error('Booking error:', error)
      alert('Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (loading) return <p className="loading">Loading...</p>
  if (!vehicle) return <p className="loading">Vehicle not found.</p>

  if (submitted) {
    return (
      <div className="success-message">
        <h2>Booking Request Sent!</h2>
        <p>Thank you, {formData.customer_name}! Your request for the {vehicle.name} has been submitted.</p>
        <p>We'll confirm your booking via email or SMS shortly.</p>
        <button onClick={() => navigate('/vehicles')} className="back-btn">Browse More Vehicles</button>
      </div>
    )
  }

  const pickupDateObj = formData.pickup_date ? new Date(formData.pickup_date + 'T00:00:00') : null
  const returnDateObj = formData.return_date ? new Date(formData.return_date + 'T00:00:00') : null
  const minReturnDate = pickupDateObj
    ? new Date(pickupDateObj.getTime() + 86400000)
    : today

  return (
    <div className="vehicle-detail">
      <div className="detail-inner">
        <button onClick={() => navigate('/vehicles')} className="back-link">← Back to Vehicles</button>

        <div className="detail-layout">
          <div className="detail-left">
            <img
              src={vehicle.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
              alt={vehicle.name}
              className="detail-image"
            />
            <div className="detail-info">
              <h1>{vehicle.name}</h1>
              <span className="detail-type">{vehicle.type}</span>
              <p className="detail-description">{vehicle.description}</p>
              <div className="detail-specs">
                <div><strong>Seats:</strong> {vehicle.seats}</div>
                <div><strong>Rate:</strong> ₱{vehicle.price_per_day}/day</div>
                {vehicle.has_driver && (
                  <div><strong>Driver:</strong> +₱{vehicle.driver_fee}/day</div>
                )}
              </div>
            </div>
          </div>

          <div className="detail-right">
            <h2>Book This Vehicle</h2>
            <form onSubmit={handleSubmit}>
              <label>Full Name</label>
              <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required />

              <label>Email</label>
              <input type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} required />

              <label>Phone Number</label>
              <input type="tel" name="customer_phone" value={formData.customer_phone} onChange={handleChange} maxLength={11} pattern="\d{11}" required />

              <div className="date-row">
                <div className="date-field">
                  <label>Pickup Date</label>
                  <DatePicker
                    selected={pickupDateObj}
                    onChange={date => {
                      if (!date) return
                      setBookingError('')
                      setFormData(prev => ({
                        ...prev,
                        pickup_date: date.toLocaleDateString('en-CA'),
                        return_date: ''
                      }))
                    }}
                    onFocus={e => e.target.blur()}
                    selectsStart
                    startDate={pickupDateObj}
                    endDate={returnDateObj}
                    minDate={today}
                    filterDate={date => !isDateBlocked(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select pickup date"
                    className="date-input"
                    calendarClassName="detail-calendar"
                    dayClassName={date => isDateBlocked(date) ? 'blocked-date' : undefined}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="date-field">
                  <label>Return Date</label>
                  <DatePicker
                    selected={returnDateObj}
                    onChange={date => {
                      if (!date) return
                      setBookingError('')
                      setFormData(prev => ({
                        ...prev,
                        return_date: date.toLocaleDateString('en-CA')
                      }))
                    }}
                    onFocus={e => e.target.blur()}
                    selectsEnd
                    startDate={pickupDateObj}
                    endDate={returnDateObj}
                    minDate={minReturnDate}
                    filterDate={date => !isDateBlocked(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select return date"
                    className="date-input"
                    calendarClassName="detail-calendar"
                    dayClassName={date => isDateBlocked(date) ? 'blocked-date' : undefined}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>
              {vehicle.has_driver && (
                <div className="driver-checkbox">
                  <input type="checkbox" name="with_driver" checked={formData.with_driver} onChange={handleChange} />
                  <label>I want a driver (+₱{vehicle.driver_fee}/day)</label>
                </div>
              )}

              <label>Notes (optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special requests..." />

              {calculateTotal() > 0 && (
                <div className="total-price">
                  <strong>Estimated Total</strong>
                  <span>₱{calculateTotal().toLocaleString()}</span>
                </div>
              )}
              {bookingError && (
                <p className="booking-error">{bookingError}</p>
              )}
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Booking Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleDetail