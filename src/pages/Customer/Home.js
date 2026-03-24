import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import './Home.css'

function Home() {
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [seats, setSeats] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!pickupDate || !returnDate) {
      setError('Please select both pickup and return dates.')
      return
    }
    if (pickupDate > returnDate) {
      setError('Return date must be after pickup date.')
      return
    }
    setError('')
    setLoading(true)
    setSearched(true)

    let vehicleQuery = supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available')

    if (seats) {
      vehicleQuery = vehicleQuery.gte('seats', parseInt(seats))
    }

    const { data: vehicles, error: vehicleError } = await vehicleQuery

    if (vehicleError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const vehicleIds = vehicles.map(v => v.id)

    const { data: overlappingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)
      .not('status','in', '("cancelled","rejected")')
      .lte('pickup_date', returnDate)
      .gte('return_date', pickupDate)

    if (bookingError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const bookedIds = new Set(overlappingBookings.map(b => b.vehicle_id))
    const tagged = vehicles.map(v => ({
      ...v,
      isAvailable: !bookedIds.has(v.id),
    }))

    tagged.sort((a, b) => b.isAvailable - a.isAvailable)
    setResults(tagged)
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="home">

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-text">FLEET</div>
        <div className="hero-content">
          <div className="hero-tag">Iloilo's Premier Car Rental</div>
          <h1 className="hero-title">
            Drive Your<br />
            <span className="hero-title-accent">Next Adventure</span>
          </h1>
          <p className="hero-sub">Premium vehicles, flexible rentals, with or without driver.</p>
        </div>

        {/* Search Bar */}
        <div className="search-card">
          <div className="search-fields">
            <div className="search-field">
              <label>Pickup Date</label>
              <input
                type="date"
                min={today}
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
              />
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <label>Return Date</label>
              <input
                type="date"
                min={pickupDate || today}
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
              />
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <label>Min. Seats</label>
              <select value={seats} onChange={e => setSeats(e.target.value)}>
                <option value="">Any</option>
                <option value="2">2+</option>
                <option value="4">4+</option>
                <option value="6">6+</option>
                <option value="8">8+</option>
              </select>
            </div>
          </div>
          <button className="search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? (
              <span className="search-btn-inner">Searching...</span>
            ) : (
              <span className="search-btn-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search
              </span>
            )}
          </button>
          {error && <p className="search-error">{error}</p>}
        </div>
      </section>

      {/* Results */}
      {searched && (
        <section className="results-section">
          <div className="results-header">
            <h2 className="results-title">
              {loading
                ? 'Finding vehicles...'
                : <><span className="results-count">{results?.filter(v => v.isAvailable).length}</span> vehicle{results?.filter(v => v.isAvailable).length !== 1 ? 's' : ''} available</>
              }
            </h2>
            <button className="clear-btn" onClick={() => { setSearched(false); setResults(null); }}>
              ← New Search
            </button>
          </div>

          <div className="vehicles-grid">
            {results && results.map(vehicle => (
              <div key={vehicle.id} className={`vehicle-card ${!vehicle.isAvailable ? 'unavailable' : ''}`}>
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
                  {!vehicle.isAvailable && (
                    <div className="unavailable-overlay">
                      <span>Unavailable</span>
                    </div>
                  )}
                </div>
                <div className="vehicle-body">
                  <div className="vehicle-info">
                    <h3 className="vehicle-name">{vehicle.name}</h3>
                    <p className="vehicle-seats">{vehicle.seats} seats</p>
                  </div>
                  <div className="vehicle-footer">
                    <div className="vehicle-pricing">
                      <span className="vehicle-price">₱{Number(vehicle.price_per_day).toLocaleString()}</span>
                      <span className="vehicle-per"> / day</span>
                      {vehicle.has_driver && (
                        <p className="vehicle-driver">+₱{Number(vehicle.driver_fee).toLocaleString()} with driver</p>
                      )}
                    </div>
                    <Link
                      to={vehicle.isAvailable ? `/vehicles/${vehicle.id}` : '#'}
                      state={{ pickupDate, returnDate }}
                      className={`vehicle-btn ${!vehicle.isAvailable ? 'vehicle-btn-disabled' : ''}`}
                      onClick={e => !vehicle.isAvailable && e.preventDefault()}
                    >
                      {vehicle.isAvailable ? 'Book' : '—'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      {!searched && (
        <>
          <section className="features-section">
            <div className="features-label">Why FleetMate</div>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <h3>Wide Selection</h3>
                <p>Sedans, SUVs, vans and more — pick what fits your trip.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3>With or Without Driver</h3>
                <p>Flexible options — self-drive or let a professional take the wheel.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h3>Easy Booking</h3>
                <p>Book online in minutes and get confirmed fast.</p>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="cta-inner">
              <h2>Ready to hit the road?</h2>
              <p>Browse our full fleet and find your perfect vehicle.</p>
              <Link to="/vehicles" className="cta-btn">Browse All Vehicles →</Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Home