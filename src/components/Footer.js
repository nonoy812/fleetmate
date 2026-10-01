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

        <div className="footer-col">
          <h4>Contact</h4>
          <span>LJ Ledesma Subdivision 1, South Street, Buhang, Jaro, Iloilo City, 5000 Iloilo</span>
          <a href="tel:+639310058236">0931 005 8236</a>
          <a href="mailto:quinonrex3@gmail.com">quinonrex3@gmail.com</a>
          <a href="https://www.facebook.com/JR4LCarRental/" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} FleetMate. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
