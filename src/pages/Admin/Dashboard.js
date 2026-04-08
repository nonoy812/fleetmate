import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Overview from './Overview'
import BookingsPage from './Bookingspage'
import VehiclesPage from './Vehiclespage'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState('overview')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchPendingCount()
  }, [])

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to logout?')) return
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    },
    {
      id: 'bookings',
      label: 'Bookings',
      badge: pendingCount,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 4v4h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      )
    },
  ]

  return (
    <div className="admin-layout">

      {/* Sidebar — PC only */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-fleet">Fleet</span>
          <span className="sidebar-brand-mate">Mate</span>
          <span className="sidebar-brand-tag">Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <h1 className="admin-page-title">
              {activePage === 'overview' && 'Overview'}
              {activePage === 'bookings' && 'Bookings'}
              {activePage === 'vehicles' && 'Vehicles'}
            </h1>
            <p className="admin-page-sub">
              {activePage === 'overview' && "Here's what's happening with FleetMate today."}
              {activePage === 'bookings' && 'Manage and respond to booking requests.'}
              {activePage === 'vehicles' && 'Manage your fleet and view availability.'}
            </p>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-avatar">R</div>
          </div>
        </div>

        <div className="admin-content">
          {activePage === 'overview' && (
            <Overview onNavigate={setActivePage} onStatusChange={fetchPendingCount} />
          )}
          {activePage === 'bookings' && (
            <BookingsPage onStatusChange={fetchPendingCount} />
          )}
          {activePage === 'vehicles' && (
            <VehiclesPage />
          )}
        </div>
      </main>

      {/* Bottom Tab Bar — mobile only */}
      <nav className="bottom-tab-bar">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`bottom-tab-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className="bottom-tab-item-icon">
              {item.icon}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </div>
            {item.label}
          </button>
        ))}
        <button className="bottom-tab-item" onClick={handleLogout}>
          <div className="bottom-tab-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          Logout
        </button>
      </nav>

    </div>
  )
}

export default Dashboard