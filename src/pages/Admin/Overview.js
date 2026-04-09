import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import './Overview.css'

function Overview({ onNavigate, onStatusChange }) {
  const [stats, setStats] = useState({
    pending: 0,
    totalBookings: 0,
    totalVehicles: 0,
    revenue: 0
  })
  const [recentPending, setRecentPending] = useState([])
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [statusBreakdown, setStatusBreakdown] = useState([])
  const [topVehicles, setTopVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchRecentPending(),
      fetchMonthlyRevenue(),
      fetchStatusBreakdown(),
      fetchTopVehicles()
    ])
    setLoading(false)
  }

  async function fetchStats() {
    const [pendingRes, bookingsRes, vehiclesRes, revenueRes] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('total_price').eq('status', 'approved')
    ])
    const revenue = revenueRes.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
    setStats({
      pending: pendingRes.count || 0,
      totalBookings: bookingsRes.count || 0,
      totalVehicles: vehiclesRes.count || 0,
      revenue
    })
  }

  async function fetchRecentPending() {
    const { data } = await supabase
      .from('bookings')
      .select('*, vehicles(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentPending(data || [])
  }

  async function fetchMonthlyRevenue() {
    const { data } = await supabase
      .from('bookings')
      .select('total_price, created_at')
      .eq('status', 'approved')

    if (!data) return

    const months = {}
    const now = new Date()

    // Build last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
      months[key] = { month: label, revenue: 0 }
    }

    data.forEach(b => {
      const d = new Date(b.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (months[key]) {
        months[key].revenue += b.total_price || 0
      }
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

    const sorted = Object.values(vehicleMap)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    setTopVehicles(sorted)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) {
      alert('Error updating booking')
    } else {
      setConfirming(null)
      fetchAll()
      onStatusChange()
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
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
      label: 'Total Revenue',
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

        {/* Monthly Revenue */}
        <div className="chart-card chart-card--wide">
          <h2 className="chart-title">Monthly Revenue</h2>
          <p className="chart-sub">Last 6 months — approved bookings only</p>
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

        {/* Bookings by Status */}
        <div className="chart-card">
          <h2 className="chart-title">Booking Status</h2>
          <p className="chart-sub">All time breakdown</p>
          {statusBreakdown.every(s => s.value === 0) ? (
            <div className="chart-empty">No bookings yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#555' }}>{value}</span>}
                />
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
          <ResponsiveContainer width="100%" height={topVehicles.length * 52 + 20}>
            <BarChart
              data={topVehicles}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#555' }} axisLine={false} tickLine={false} width={140} />
              <Tooltip content={<VehicleTooltip />} />
              <Bar dataKey="bookings" fill="#059669" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Pending */}
      <div className="overview-section">
        <div className="overview-section-header">
          <h2 className="admin-card-title">Pending Requests</h2>
          {recentPending.length > 0 && (
            <button className="btn-ghost" onClick={() => onNavigate('bookings')}>View all →</button>
          )}
        </div>

        {recentPending.length === 0 ? (
          <div className="overview-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>No pending requests — all clear!</p>
          </div>
        ) : (
          <div className="pending-list">
            {recentPending.map(booking => (
              <div key={booking.id} className="pending-item">
                <div className="pending-item-left">
                  <div className="pending-vehicle">{booking.vehicles?.name || 'Unknown Vehicle'}</div>
                  <div className="pending-meta">
                    <span>{booking.customer_name}</span>
                    <span className="meta-dot">·</span>
                    <span>{formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}</span>
                    <span className="meta-dot">·</span>
                    <span>{formatCurrency(booking.total_price)}</span>
                  </div>
                </div>
                <div className="pending-item-actions">
                  {confirming?.id === booking.id ? (
                    <div className="confirm-dialog">
                      <span className="confirm-text">
                        {confirming.action === 'approved' ? 'Approve this booking?' : 'Reject this booking?'}
                      </span>
                      <button
                        className={confirming.action === 'approved' ? 'confirm-yes-approve' : 'confirm-yes-reject'}
                        onClick={() => updateStatus(booking.id, confirming.action)}
                      >
                        Yes
                      </button>
                      <button className="confirm-no" onClick={() => setConfirming(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button className="action-approve" onClick={() => setConfirming({ id: booking.id, action: 'approved' })}>Approve</button>
                      <button className="action-reject" onClick={() => setConfirming({ id: booking.id, action: 'rejected' })}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Overview