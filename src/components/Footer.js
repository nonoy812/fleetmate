import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            Fleet<span>Mate</span>
          </Link>
          <p className="footer-tagline">
            Reliable vehicle rentals, booked in minutes.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/vehicles">Vehicles</Link>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} FleetMate. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
