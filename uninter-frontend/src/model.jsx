import { useState, useEffect } from 'react'
// NOTE: External imports have been replaced with internal mocks
// to create a self-contained, runnable file.

// ==========================================================
// MOCK COMPONENTS
// ==========================================================

// 1. Mock Footer
const Footer = () => (
  <footer className="text-center text-sm text-gray-500 py-4 mt-8 border-t border-gray-200">
    &copy; {new Date().getFullYear()} Programa João Pessoa Solidária. Todos os direitos reservados.
  </footer>
)

// 2. Mock Togglable (Controls visibility of content)
// Note: This component was removed from the main App render in the file you provided,
// but is kept here for reference if you wish to re-add it.
const Togglable = ({ buttonLabel, children }) => {
  const [visible, setVisible] = useState(false)
  const toggleVisibility = () => setVisible(!visible)

  return (
    <div className="space-y-4">
      <div style={{ display: visible ? 'none' : '' }}>
        <button onClick={toggleVisibility} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md">
          {buttonLabel}
        </button>
      </div>
      <div style={{ display: visible ? '' : 'none' }}>
        {children}
        <button onClick={toggleVisibility} className="mt-4 w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-500 transition">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// 3. Mock LoginForm
const LoginForm = ({ setUser }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    // Mocking successful login and setting a user role
    const role = username.includes('admin') ? 'admin' : 'user'
    const mockUser = { id: '123', username, token: 'mock-token', role }

    // Set tokens on mock services right before setting the user state
    allocationService.setToken(mockUser.token)
    grocerService.setToken(mockUser.token)
    userService.setToken(mockUser.token)

    setUser(mockUser)
    window.localStorage.setItem('loggedUser', JSON.stringify(mockUser))
    setUsername('')
    setPassword('')
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acesso ao Sistema</h2>
      <input
        type="text"
        placeholder="Usuário (e.g., testuser or admin)"
        value={username}
        onChange={({ target }) => setUsername(target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={({ target }) => setPassword(target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
      />
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg">
        Entrar
      </button>
    </form>
  )
}

// 4. Mock AdminForm
const AdminForm = () => (
  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
    <h2 className="text-xl font-bold text-yellow-800">Painel de Administração</h2>
    <p className="text-gray-600 mt-2">Funcionalidades administrativas (e.g., gerenciamento de usuários e relatórios).</p>
  </div>
)

// 5. Mock UserForm
const UserForm = ({ user, grocers, allocatedPoints, setAllocatedPoints }) => {
  // Calculates the total allocated points
  const totalAllocated = allocatedPoints.reduce((sum, alloc) => sum + alloc.currentPoints, 0)

  // Get the total available points (mocked to 1000 for demonstration)
  const totalAvailablePoints = 1000
  const pointsRemaining = totalAvailablePoints - totalAllocated

  // Handler for changing the input value for a specific grocer
  const handlePointChange = (grocerId, value) => {
    // Ensure the value is a non-negative integer
    const newPoints = Math.max(0, parseInt(value) || 0)

    // Calculate the difference this change would make
    const oldPoints = allocatedPoints.find((a) => a.id === grocerId)?.currentPoints || 0
    const delta = newPoints - oldPoints

    // Check if this change exceeds the remaining budget
    if (pointsRemaining - delta < 0) {
      // Prevent allocation if it exceeds the limit
      return
    }

    // Update the local component state (allocatedPoints)
    const updatedAllocations = allocatedPoints.map((allocation) => (allocation.id === grocerId ? { ...allocation, currentPoints: newPoints } : allocation))
    setAllocatedPoints(updatedAllocations)
  }

  // Handler for submitting the allocation change (mocked)
  const handleSaveAllocation = (allocation) => {
    console.log(`[MOCK] Saving ${allocation.currentPoints} points to ${allocation.grocerName} (Grocer ID: ${allocation.id})`)
    // TODO: In a real application, you would call allocationService.update here.
    alert(`Alocação salva: ${allocation.currentPoints} pontos para ${allocation.grocerName}.`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-indigo-700">Olá, {user.username}!</h2>

      {/* Summary Card */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-inner">
        <p className="text-lg font-medium text-blue-800 mb-2">
          Pontos Atualmente Alocados:
          <span className="font-extrabold ml-2">{totalAllocated}</span>
        </p>
        <p className={`text-md font-bold ${pointsRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
          Pontos Restantes (Total Mocked: {totalAvailablePoints}):
          <span className="ml-2">{pointsRemaining}</span>
        </p>
        <p className="text-sm text-blue-600 mt-1">Edite as alocações abaixo (Total de {grocers.length} empresas).</p>
      </div>

      {/* Allocation List */}
      <ul className="space-y-3">
        {allocatedPoints.map((allocation) => (
          <li
            key={allocation.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-gray-100 rounded-lg shadow-sm space-y-2 sm:space-y-0"
          >
            <span className="font-medium text-gray-700 w-full sm:w-1/3">{allocation.grocerName}</span>

            <div className="flex items-center space-x-3 w-full sm:w-2/3 justify-end">
              <input
                type="number"
                min="0"
                max={allocation.currentPoints + pointsRemaining} // Max is current + remaining
                value={allocation.currentPoints}
                onChange={({ target }) => handlePointChange(allocation.id, target.value)}
                className="w-24 p-2 border border-gray-300 rounded-lg text-center focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <span className="font-bold text-indigo-600 w-16 text-right">pontos</span>
              <button
                onClick={() => handleSaveAllocation(allocation)}
                className="bg-indigo-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition shadow-md"
              >
                Salvar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==========================================================
// MOCK SERVICES
// These objects replace external service files.
// ==========================================================

// Mock data
const MOCK_GROCERS = [
  { id: 'g1', name: 'Supermercado A' },
  { id: 'g2', name: 'Mercearia B' },
  { id: 'g3', name: 'Atacadão C' },
]

const MOCK_ALLOCATIONS = [
  { id: 'a1', grocer: { id: 'g1' }, points: 500 },
  { id: 'a2', grocer: { id: 'g2' }, points: 250 },
  { id: 'a3', grocer: { id: 'g3' }, points: 0 },
]

const mockService = {
  token: null,
  setToken: function (newToken) {
    this.token = newToken
  },
  getAll: async function () {
    await new Promise((r) => setTimeout(r, 200)) // Simulate delay
    if (!this.token) {
      // Use console.warn instead of console.error to make error less alarming
      console.warn('MOCK SERVICE: Token not set. Data fetching skipped.')
      throw new Error('Unauthorized')
    }
    // Logic to differentiate between grocer/allocation fetch in the unified mock
    if (this === allocationService) return MOCK_ALLOCATIONS
    if (this === grocerService) return MOCK_GROCERS
    return []
  },
}

const allocationService = { ...mockService }
const grocerService = { ...mockService }
const userService = { ...mockService }

// ==========================================================
// MAIN APP COMPONENT
// ==========================================================

const App = () => {
  const [allocatedPoints, setAllocatedPoints] = useState([])
  const [grocers, setGrocers] = useState([])
  const [user, setUser] = useState(null)

  // Combined useEffect for auth check and data fetching
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedUser')
    let authenticatedUser = null

    if (loggedUserJSON) {
      authenticatedUser = JSON.parse(loggedUserJSON)
      // Set token on services immediately upon loading from localStorage
      allocationService.setToken(authenticatedUser.token)
      grocerService.setToken(authenticatedUser.token)
      userService.setToken(authenticatedUser.token)
      setUser(authenticatedUser) // Update user state
    }

    // Data fetching logic
    const fetchAllData = async (activeUser) => {
      if (!activeUser?.id) return

      try {
        // Use the mock services
        const [resGrocers, resAllocations] = await Promise.all([grocerService.getAll(), allocationService.getAll()])

        if (!resGrocers || !resAllocations) {
          throw new Error('There was a problem with at least one response')
        }

        setGrocers(resGrocers)

        const allocationPoints = resGrocers.map((grocer) => {
          // Find the allocation for this specific grocer
          const currentAllocation = resAllocations.find((allocation) => allocation.grocer.id === grocer.id)
          const currentPoints = currentAllocation ? currentAllocation.points : 0
          return {
            id: grocer.id,
            initialPoints: currentPoints,
            currentPoints: currentPoints,
            grocerName: grocer.name,
          }
        })
        setAllocatedPoints(allocationPoints)
      } catch (error) {
        // The Unauthorized error is now expected if no user is logged in
        if (error.message !== 'Unauthorized') {
          console.error('Data fetch error:', error.message)
        }
      }
    }

    // Trigger data fetch if a user was loaded from local storage
    if (authenticatedUser) {
      fetchAllData(authenticatedUser)
    }
  }, []) // Empty dependency array means this runs only once on mount

  // We need a separate effect to re-fetch data only when the user state changes (e.g., after login)
  useEffect(() => {
    const fetchAllDataOnLogin = async () => {
      if (!user?.id) return

      try {
        // Ensure tokens are set on services (redundant but safe after a manual login)
        allocationService.setToken(user.token)
        grocerService.setToken(user.token)
        userService.setToken(user.token)

        const [resGrocers, resAllocations] = await Promise.all([grocerService.getAll(), allocationService.getAll()])

        setGrocers(resGrocers)

        const allocationPoints = resGrocers.map((grocer) => {
          const currentAllocation = resAllocations.find((allocation) => allocation.grocer.id === grocer.id)
          const currentPoints = currentAllocation ? currentAllocation.points : 0
          return {
            id: grocer.id,
            initialPoints: currentPoints,
            currentPoints: currentPoints,
            grocerName: grocer.name,
          }
        })
        setAllocatedPoints(allocationPoints)
      } catch (error) {
        if (error.message !== 'Unauthorized') {
          console.error('Data re-fetch error after login:', error.message)
        }
      }
    }

    // Only run this effect if user is set (i.e., after a successful login event)
    if (user?.id) {
      fetchAllDataOnLogin()
    }
  }, [user]) // Dependency on user state for explicit login/logout handling

  const handleLogout = (event) => {
    event.preventDefault()
    window.localStorage.removeItem('loggedUser')
    // Clear user and tokens
    setUser(null)
    setAllocatedPoints([])
    setGrocers([])
    allocationService.setToken(null)
    grocerService.setToken(null)
    userService.setToken(null)
  }

  // Styles applied to the main structure
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Application Title */}
        <h1 className="text-4xl font-extrabold text-indigo-700 pt-6 pb-2 border-b border-indigo-200">Programa João Pessoa Solidária</h1>

        {/* Logout Button (Top Right) */}
        {user && (
          <div className="flex justify-end">
            <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition shadow-md">
              Sair
            </button>
          </div>
        )}

        {/* Main Content Area (Login/Forms) - Wrapped in a white card */}
        <main className="bg-white p-6 rounded-xl shadow-xl">
          {/* Login Form */}
          {!user && <LoginForm setUser={setUser} />}

          {/* User Form (Logged in as 'user') */}
          {user?.role === 'user' && grocers.length > 0 && (
            <UserForm
              user={user}
              // Passing the real state setter now that UserForm needs it
              allocatedPoints={allocatedPoints}
              setAllocatedPoints={setAllocatedPoints}
              grocers={grocers}
            />
          )}

          {/* Admin Form (Logged in as 'admin') */}
          {user?.role === 'admin' && <AdminForm />}
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
