
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Customer/Home'
import Vehicles from './pages/Customer/Vehicles'
import Dashboard from './pages/Admin/Dashboard'


function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/vehicles' element={<Vehicles />} />
        <Route path='/admin' element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App