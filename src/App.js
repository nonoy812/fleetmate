import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Customer/Home'
import Vehicles from './pages/Customer/Vehicles'
import VehicleDetail from './pages/Customer/VehicleDetail'
import Dashboard from './pages/Admin/Dashboard'
import Login from './pages/Admin/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'

function CustomerLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <ChatWidget />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
        <Route path="/vehicles" element={<CustomerLayout><Vehicles /></CustomerLayout>} />
        <Route path="/vehicles/:id" element={<CustomerLayout><VehicleDetail /></CustomerLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App