import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ textAlign: 'center', padding: '60px' }}>Loading...</p>
  if (!user) return <Navigate to="/login" />

  return children
}

export default ProtectedRoute