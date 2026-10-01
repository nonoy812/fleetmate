import { NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-logo">
        JR4L <span>Car Rental</span>
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>Home</NavLink>
        <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'active' : ''}>Vehicles</NavLink>
      </div>
    </nav>
  )
}

export default Navbar