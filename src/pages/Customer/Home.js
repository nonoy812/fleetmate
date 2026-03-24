import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to FleetMate</h1>
        <p>Your trusted car rental service in Iloilo</p>
        <Link to="/vehicles" className="hero-btn">Browse Vehicles</Link>
      </div>

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
    </div>
  )
}

export default Home