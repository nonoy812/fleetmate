import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import './Vehiclecalendar.css'

function VehicleCalendar({ vehicleId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchBookings()
  }, [vehicleId])

  async function fetchBookings() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('pickup_date, return_date, status, customer_name')
      .eq('vehicle_id', vehicleId)
      .in('status', ['approved', 'pending'])

    setBookings(data || [])
    setLoading(false)
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
  }

  function getDateStatus(day) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const date = new Date(year, month, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const booking of bookings) {
    const [sy, sm, sd] = booking.pickup_date.split('-').map(Number)
    const [ey, em, ed] = booking.return_date.split('-').map(Number)
    const start = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)

    if (date >= start && date <= end) {
      if (booking.status === 'approved' && end < today) return 'past'
      return booking.status
    }
  }
  return null
  }

  function isToday(day) {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const monthName = currentDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const approvedBookings = bookings.filter(b => b.status === 'approved')
  const pendingBookings = bookings.filter(b => b.status === 'pending')

  if (loading) return <div className="vc-loading">Loading calendar...</div>

  return (
    <div className="vehicle-calendar">
      <div className="vc-header">
        <button className="vc-nav" onClick={prevMonth}>‹</button>
        <span className="vc-month">{monthName}</span>
        <button className="vc-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="vc-grid">
        {dayNames.map(d => (
          <div key={d} className="vc-day-name">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="vc-day vc-day--empty" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const status = getDateStatus(day)
          return (
            <div
              key={day}
              className={`vc-day ${status ? `vc-day--${status}` : ''} ${isToday(day) ? 'vc-day--today' : ''}`}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="vc-legend">
        <div className="vc-legend-item">
          <div className="vc-legend-dot vc-legend-dot--approved" />
          <span>Approved ({approvedBookings.length})</span>
        </div>
        <div className="vc-legend-item">
          <div className="vc-legend-dot vc-legend-dot--pending" />
          <span>Pending ({pendingBookings.length})</span>
        </div>
        <div className="vc-legend-item">
          <div className="vc-legend-dot vc-legend-dot--past" />
          <span>Completed</span>
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="vc-bookings">
          <p className="vc-bookings-title">Bookings</p>
          {bookings.map((b, i) => (
            <div key={i} className={`vc-booking-item vc-booking-item--${b.status}`}>
              <div className="vc-booking-customer">{b.customer_name}</div>
              <div className="vc-booking-dates">{b.pickup_date} → {b.return_date}</div>
              <span className={`status-badge ${b.status}`}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VehicleCalendar