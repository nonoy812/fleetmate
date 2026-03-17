import { supabase } from './supabaseClient'

function App() {
  console.log('Supabase connected:', supabase)
  return <div>FleetMate</div>
}

export default App