import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '../../supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import './Overview.css'

function Overview({ onNavigate }) {
  const [stats, setStats] = useState({
    pending: 0,
    totalBookings: 0,
    totalVehicles: 0,
    revenue: 0
  })
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [statusBreakdown, setStatusBreakdown] = useState([])
  const [topVehicles, setTopVehicles] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPickupsModal, setShowPickupsModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchMonthlyRevenue(),
      fetchStatusBreakdown(),
      fetchTopVehicles(),
      fetchUpcomingBookings(),
    ])
    setLoading(false)
  }

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]
    const [pendingRes, bookingsRes, vehiclesRes, revenueRes] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }).neq('status', 'archived'),
      supabase.from('bookings').select('total_price').eq('status', 'approved').lt('return_date', today)
    ])
    const revenue = revenueRes.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
    setStats({
      pending: pendingRes.count || 0,
      totalBookings: bookingsRes.count || 0,
      totalVehicles: vehiclesRes.count || 0,
      revenue
    })
  }

  async function fetchMonthlyRevenue() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('bookings')
      .select('total_price, created_at')
      .eq('status', 'approved')
      .lt('return_date', today)

    if (!data) return

    const months = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
      months[key] = { month: label, revenue: 0 }
    }

    data.forEach(b => {
      const d = new Date(b.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (months[key]) months[key].revenue += b.total_price || 0
    })

    setMonthlyRevenue(Object.values(months))
  }

  async function fetchStatusBreakdown() {
    const { data } = await supabase.from('bookings').select('status')
    if (!data) return
    const counts = { pending: 0, approved: 0, rejected: 0 }
    data.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++ })
    setStatusBreakdown([
      { name: 'Approved', value: counts.approved, color: '#059669' },
      { name: 'Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'Rejected', value: counts.rejected, color: '#ef4444' }
    ])
  }

  async function fetchTopVehicles() {
    const { data } = await supabase
      .from('bookings')
      .select('vehicle_id, total_price, vehicles(name)')
      .eq('status', 'approved')

    if (!data) return
    const vehicleMap = {}
    data.forEach(b => {
      const name = b.vehicles?.name || 'Unknown'
      if (!vehicleMap[name]) vehicleMap[name] = { name, bookings: 0, revenue: 0 }
      vehicleMap[name].bookings++
      vehicleMap[name].revenue += b.total_price || 0
    })
    const sorted = Object.values(vehicleMap).sort((a, b) => b.bookings - a.bookings).slice(0, 5)
    setTopVehicles(sorted)
  }

  async function fetchUpcomingBookings() {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase
      .from('bookings')
      .select('*, vehicles(name)')
      .eq('status', 'approved')
      .gte('pickup_date', today)
      .lte('pickup_date', nextWeek)
      .order('pickup_date', { ascending: true })
    setUpcomingBookings(data || [])
  }

  function getThisWeekDays() {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      days.push(d)
    }
    return days
  }

  function getPickupsForDay(date) {
    const dateStr = date.toLocaleDateString('en-CA')
    return upcomingBookings.filter(b => b.pickup_date === dateStr)
  }

  function formatDate(date) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function formatCurrency(amount) {
    return '₱' + Number(amount).toLocaleString()
  }

  const statCards = [
    {
      label: 'Pending Requests',
      value: stats.pending,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: 'warning',
      action: () => onNavigate('bookings')
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
      color: 'primary',
      action: () => onNavigate('bookings')
    },
    {
      label: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 4v4h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
      color: 'neutral',
      action: () => onNavigate('vehicles')
    },
    {
      label: 'Earned Revenue',
      value: formatCurrency(stats.revenue),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      color: 'success',
    }
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          <p className="chart-tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const VehicleTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{payload[0].payload.name}</p>
          <p className="chart-tooltip-value">{payload[0].value} bookings</p>
          <p className="chart-tooltip-sub">{formatCurrency(payload[0].payload.revenue)}</p>
        </div>
      )
    }
    return null
  }

  const weekDays = getThisWeekDays()
  const visiblePickups = upcomingBookings.slice(0, 3)
  const hasMore = upcomingBookings.length > 3
  const extraCount = upcomingBookings.length - 3

  if (loading) return <div className="overview-loading">Loading overview...</div>

  return (
    <div className="overview">

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`stat-card stat-card--${card.color} ${card.action ? 'stat-card--clickable' : ''}`}
            onClick={card.action}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="stat-card-top">
              <div className={`stat-icon stat-icon--${card.color}`}>{card.icon}</div>
              {card.color === 'warning' && stats.pending > 0 && (
                <span className="stat-alert">Needs attention</span>
              )}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card chart-card--wide">
          <h2 className="chart-title">Monthly Revenue</h2>
          <p className="chart-sub">Last 6 months — completed bookings only</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Booking Status</h2>
          <p className="chart-sub">All time breakdown</p>
          {statusBreakdown.every(s => s.value === 0) ? (
            <div className="chart-empty">No bookings yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 12, color: '#555' }}>{value}</span>} />
                <Tooltip formatter={(value) => [value, 'bookings']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Vehicles */}
      {topVehicles.length > 0 && (
        <div className="chart-card chart-card--full">
          <h2 className="chart-title">Top Vehicles</h2>
          <p className="chart-sub">By number of approved bookings</p>
          <ResponsiveContainer width="100%" height={topVehicles.length * 44 + 20}>
            <BarChart data={topVehicles} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<VehicleTooltip />} />
              <Bar dataKey="bookings" fill="#059669" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Row — Pickups This Week + Week Calendar */}
      <div className="overview-bottom-row">

        {/* Pickups This Week */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h2 className="admin-card-title">Pickups This Week</h2>
            {hasMore && (
              <button
                className="view-all-pulse"
                onClick={() => setShowPickupsModal(true)}
              >
                +{extraCount} more
              </button>
            )}
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="overview-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p>No pickups this week</p>
            </div>
          ) : (
            <div className="upcoming-list">
              {visiblePickups.map(booking => (
                <div key={booking.id} className="upcoming-item" onClick={() => setSelectedBooking(booking)} style={{ cursor: 'pointer' }}>
                  <div className="upcoming-date-badge">
                    <span className="upcoming-day">
                      {new Date(booking.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { day: 'numeric' })}
                    </span>
                    <span className="upcoming-month">
                      {new Date(booking.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short' })}
                    </span>
                  </div>
                  <div className="upcoming-info">
                    <p className="upcoming-vehicle">{booking.vehicles?.name}</p>
                    <p className="upcoming-customer">{booking.customer_name}</p>
                  </div>
                  <div className="upcoming-return">
                    <span className="upcoming-return-label">Returns</span>
                    <span className="upcoming-return-date">{formatDate(booking.return_date)}</span>
                  </div>
                </div>
              ))}
              {hasMore && (
                <button className="show-more-btn" onClick={() => setShowPickupsModal(true)}>
                  View all {upcomingBookings.length} pickups this week →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Week Calendar */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h2 className="admin-card-title">This Week</h2>
          </div>
          <div className="week-calendar">
            {weekDays.map((day, i) => {
              const pickups = getPickupsForDay(day)
              const isToday = day.toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
              return (
                <div
                  key={i}
                  className={`week-day ${pickups.length > 0 ? 'week-day--has-pickup' : ''} ${isToday ? 'week-day--today' : ''}`}
                >
                  <span className="week-day-name">{day.toLocaleDateString('en-PH', { weekday: 'short' })}</span>
                  <span className="week-day-num">{day.getDate()}</span>
                  {pickups.length > 0 && (
                    <span className="week-day-count">{pickups.length}</span>
                  )}
                </div>
              )
            })}
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="week-empty">No pickups this week</p>
          ) : (
            <div className="week-pickups">
              {upcomingBookings.map((booking, i) => (
                <div key={i} className="week-pickup-item">
                  <span className="week-pickup-date">
                    {new Date(booking.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="week-pickup-vehicle">{booking.vehicles?.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Pickups Modal */}
      {showPickupsModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowPickupsModal(false)}>
          <div className="pickups-modal" onClick={e => e.stopPropagation()}>
            <div className="pickups-modal-header">
              <div>
                <h2 className="pickups-modal-title">Pickups This Week</h2>
                <p className="pickups-modal-sub">{upcomingBookings.length} scheduled pickup{upcomingBookings.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="detail-close-btn" onClick={() => setShowPickupsModal(false)}>✕</button>
            </div>
            <div className="pickups-modal-list">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="upcoming-item" onClick={() => setSelectedBooking(booking)} style={{ cursor: 'pointer' }}>
                  <div className="upcoming-date-badge">
                    <span className="upcoming-day">
                      {new Date(booking.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { day: 'numeric' })}
                    </span>
                    <span className="upcoming-month">
                      {new Date(booking.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short' })}
                    </span>
                  </div>
                  <div className="upcoming-info">
                    <p className="upcoming-vehicle">{booking.vehicles?.name}</p>
                    <p className="upcoming-customer">{booking.customer_name} · {booking.customer_phone}</p>
                  </div>
                  <div className="upcoming-return">
                    <span className="upcoming-return-label">Returns</span>
                    <span className="upcoming-return-date">{formatDate(booking.return_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Booking Detail Modal */}
      {selectedBooking && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="pickups-modal" onClick={e => e.stopPropagation()}>
            <div className="pickups-modal-header">
              <div>
                <h2 className="pickups-modal-title">{selectedBooking.vehicles?.name}</h2>
                <p className="pickups-modal-sub">Pickup {formatDate(selectedBooking.pickup_date)} → Returns {formatDate(selectedBooking.return_date)}</p>
              </div>
              <button className="detail-close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>
            <div className="booking-detail-grid-overview">
              <div className="booking-detail-item-o">
                <span className="booking-detail-label-o">Customer</span>
                <span className="booking-detail-value-o">{selectedBooking.customer_name}</span>
              </div>
              <div className="booking-detail-item-o">
                <span className="booking-detail-label-o">Phone</span>
                <a href={`tel:${selectedBooking.customer_phone}`} className="booking-detail-phone-o">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {selectedBooking.customer_phone}
                </a>
              </div>
              <div className="booking-detail-item-o">
                <span className="booking-detail-label-o">Email</span>
                <span className="booking-detail-value-o">{selectedBooking.customer_email}</span>
              </div>
              <div className="booking-detail-item-o">
                <span className="booking-detail-label-o">Driver</span>
                <span className="booking-detail-value-o">{selectedBooking.with_driver ? 'Yes' : 'No'}</span>
              </div>
              <div className="booking-detail-item-o">
                <span className="booking-detail-label-o">Total</span>
                <span className="booking-detail-value-o" style={{ color: '#059669', fontWeight: 700 }}>₱{selectedBooking.total_price?.toLocaleString()}</span>
              </div>
              {selectedBooking.notes && (
                <div className="booking-detail-item-o" style={{ gridColumn: '1 / -1' }}>
                  <span className="booking-detail-label-o">Notes</span>
                  <span className="booking-detail-value-o">{selectedBooking.notes}</span>
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

export default Overview