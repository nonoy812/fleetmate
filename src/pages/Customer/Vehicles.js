import {Link} from 'react-router-dom' 
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import './Vehicles.css'

function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicles()
  }, [])

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

  if (loading) return <p className="loading">Loading vehicles...</p>

  return (
    <div className="vehicles-page">
      <h1>Our Vehicles</h1>
      <p className="subtitle">Browse our available fleet and find your perfect ride</p>

      {vehicles.length === 0 ? (
        <p className="no-vehicles">No vehicles available at the moment.</p>
      ) : (
        <div className="vehicle-grid">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <img
                src={vehicle.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={vehicle.name}
                className="vehicle-image"
              />
              <div className="vehicle-info">
                <h3>{vehicle.name}</h3>
                <p className="vehicle-type">{vehicle.type}</p>
                <div className="vehicle-details">
                  <span>{vehicle.seats} seats</span>
                  <span>₱{vehicle.price_per_day}/day</span>
                </div>
                {vehicle.has_driver && (
                  <p className="driver-available">Driver available (+₱{vehicle.driver_fee}/day)</p>
                )}
                <Link to={`/vehicles/${vehicle.id}`} className="book-btn">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Vehicles