import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">FleetMate</Link>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/vehicles">Vehicles</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </nav>
  )
}

export default Navbar