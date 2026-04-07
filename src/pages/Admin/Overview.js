import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import './Overview.css'

function Overview({ onNavigate, onStatusChange }) {
  const [stats, setStats] = useState({
    pending: 0,
    totalBookings: 0,
    totalVehicles: 0,
    revenue: 0
  })
  const [recentPending, setRecentPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null) // { id, action }

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchStats(), fetchRecentPending()])
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

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert('Error updating booking')
    } else {
      setConfirming(null)
      fetchAll()
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
              <div className={`stat-icon stat-icon--${card.color}`}>
                {card.icon}
              </div>
              {card.color === 'warning' && stats.pending > 0 && (
                <span className="stat-alert">Needs attention</span>
              )}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Pending */}
      <div className="overview-section">
        <div className="overview-section-header">
          <h2 className="admin-card-title">Pending Requests</h2>
          {recentPending.length > 0 && (
            <button className="btn-ghost" onClick={() => onNavigate('bookings')}>
              View all →
            </button>
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
                        Approve
                      </button>
                      <button
                        className="action-reject"
                        onClick={() => setConfirming({ id: booking.id, action: 'rejected' })}
                      >
                        Reject
                      </button>
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