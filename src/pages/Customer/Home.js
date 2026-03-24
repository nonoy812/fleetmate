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

    // 1. Get all vehicles (filtered by seats if provided)
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

    // 2. Get all overlapping bookings for those vehicles
    const vehicleIds = vehicles.map(v => v.id)

    const { data: overlappingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)
      .neq('status', 'cancelled')
      .lte('pickup_date', returnDate)
      .gte('return_date', pickupDate)

    if (bookingError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // 3. Mark vehicles that have overlapping bookings
    const bookedIds = new Set(overlappingBookings.map(b => b.vehicle_id))
    const tagged = vehicles.map(v => ({
      ...v,
      isAvailable: !bookedIds.has(v.id),
    }))

    // Sort: available first, unavailable last
    tagged.sort((a, b) => b.isAvailable - a.isAvailable)

    setResults(tagged)
    setLoading(false)
  }
  
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="home">

      {/* Hero */}
      <div className="hero">
        <h1>FleetMate</h1>
        <p>Your trusted car rental service in Iloilo</p>

        {/* Search Box */}
        <div className="search-box">
          <div className="search-field">
            <label>Pickup Date</label>
            <input
              type="date"
              min={today}
              value={pickupDate}
              onChange={e => setPickupDate(e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>Return Date</label>
            <input
              type="date"
              min={pickupDate || today}
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
            />
          </div>
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
          <button className="search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && <p className="search-error">{error}</p>}
      </div>

      {/* Search Results */}
      {searched && (
        <div className="results-section">
          <h2 className="results-title">
            {loading ? 'Finding available vehicles...' : `${results?.filter(v => v.isAvailable).length} vehicle(s) available`}
          </h2>
          <div className="vehicles-grid">
            {results && results.map(vehicle => (
              <div key={vehicle.id} className={`vehicle-card ${!vehicle.isAvailable ? 'unavailable' : ''}`}>
                <div className="vehicle-img-wrap">
                  {vehicle.image_url
                    ? <img
                        src={vehicle.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={vehicle.name}
                      />
                    : <div className="no-img">No Image</div>
                  }
                  {!vehicle.isAvailable && (
                    <div className="unavailable-badge">Unavailable on selected dates</div>
                  )}
                </div>
                <div className="vehicle-info">
                  <h3>{vehicle.name}</h3>
                  <p className="vehicle-meta">{vehicle.type} · {vehicle.seats} seats</p>
                  <p className="vehicle-price">₱{Number(vehicle.price_per_day).toLocaleString()} / day</p>
                  {vehicle.has_driver && (
                    <p className="vehicle-driver">Driver available (+₱{Number(vehicle.driver_fee).toLocaleString()})</p>
                  )}
                </div>
                <Link
                  to={vehicle.isAvailable ? `/vehicles/${vehicle.id}` : '#'}
                  state={{ pickupDate, returnDate }}
                  className={`vehicle-btn ${!vehicle.isAvailable ? 'vehicle-btn-disabled' : ''}`}
                  onClick={e => !vehicle.isAvailable && e.preventDefault()}
                >
                  {vehicle.isAvailable ? 'View Details' : 'Unavailable'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features — only show when not searched */}
      {!searched && (
        <>
          <div className="features">
            <div className="feature-card">
              <h3>Wide Selection</h3>
              <p>Choose from sedans, SUVs, vans, and more</p>
            </div>
            <div className="feature-card">
              <h3>With or Without Driver</h3>
              <p>Flexible rental options to fit your needs</p>
            </div>
            <div className="feature-card">
              <h3>Easy Booking</h3>
              <p>Book online and get confirmed fast</p>
            </div>
          </div>
          <div className="browse-all">
            <Link to="/vehicles" className="browse-btn">Browse All Vehicles</Link>
          </div>
        </>
      )}

    </div>
  )
}

export default Home