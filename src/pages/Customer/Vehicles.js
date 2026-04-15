import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import './Vehicles.css'

function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [seatsFilter, setSeatsFilter] = useState('')

  useEffect(() => {
    fetchVehicles()
  }, [])

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.type?.toLowerCase().includes(search.toLowerCase())
    const matchesSeats = !seatsFilter || v.seats >= parseInt(seatsFilter)
    return matchesSearch && matchesSeats
  })

  async function fetchVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available')

    if (error) {
      console.error('Error fetching vehicles:', error)
    } else {
      setVehicles(data)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="vehicles-loading">
      <p>Loading vehicles...</p>
    </div>
  )

  return (
    <div className="vehicles-page">
      <div className="vehicles-header">
        <div className="vehicles-tag">Our Fleet</div>
        <h1 className="vehicles-title">Find Your <span className="vehicles-title-accent">Perfect Ride</span></h1>
        <p className="vehicles-sub">Browse our available fleet — with or without driver.</p>
      </div>
      <div className="vehicles-filters">
        <div className="vehicles-search-bar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="vehicles-search-input"
          />
        </div>
        <select
          value={seatsFilter}
          onChange={e => setSeatsFilter(e.target.value)}
          className="vehicles-seats-filter"
        >
          <option value="">All</option>
          <option value="2">2+ seats</option>
          <option value="4">4+ seats</option>
          <option value="6">6+ seats</option>
          <option value="8">8+ seats</option>
        </select>
      </div>
      {vehicles.length === 0 ? (
        <p className="no-vehicles">No vehicles available at the moment.</p>
      ) : (
        <div className="vehicle-grid">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
            <div className="vehicle-img-wrap">
              {vehicle.image_url
                ? <img src={vehicle.image_url} alt={vehicle.name} />
                : <div className="no-img">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </div>
              }
              <div className="vehicle-type-badge">{vehicle.type}</div>
            </div>
            <div className="vehicle-body">
              <div className="vehicle-info">
                <div className="vehicle-name-row">
                  <h3 className="vehicle-name">{vehicle.name}</h3>
                  <span className="vehicle-seats">{vehicle.seats} seats</span>
                </div>
              </div>
              <div className="vehicle-footer">
                <div className="vehicle-pricing">
                  <span className="vehicle-price">₱{Number(vehicle.price_per_day).toLocaleString()}</span>
                  <span className="vehicle-per"> / day</span>
                  {vehicle.has_driver && (
                    <p className="vehicle-driver">+₱{Number(vehicle.driver_fee).toLocaleString()} with driver</p>
                  )}
                </div>
                <Link to={`/vehicles/${vehicle.id}`} className="vehicle-btn">View →</Link>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Vehicles