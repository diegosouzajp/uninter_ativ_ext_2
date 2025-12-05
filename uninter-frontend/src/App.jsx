import { useState, useEffect } from 'react'
import Footer from './components/Footer'
import LoginForm from './components/LoginForm'
import AdminForm from './components/AdminForm'
import UserForm from './components/UserForm'
import allocationService from './services/allocations'
import grocerService from './services/grocers'
import userService from './services/users'
import './index.css'

const App = () => {
  const [allocatedPoints, setAllocatedPoints] = useState([])
  const [grocers, setGrocers] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      allocationService.setToken(user.token)
      grocerService.setToken(user.token)
      userService.setToken(user.token)
    }
  }, [])

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [resGrocers, resAllocations] = await Promise.all([grocerService.getAll(), allocationService.getAll()])

        if (!resGrocers || !resAllocations) {
          throw new Error('There was a problem with at least one response')
        }

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
        console.error(error.message)
      }
    }

    if (user?.id) fetchAllData()
  }, [user?.id])

  const handleLogout = (event) => {
    event.preventDefault()
    window.localStorage.removeItem('loggedUser')
    setUser(null)
    setAllocatedPoints([])
    setGrocers([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-extrabold text-indigo-700 pt-6 pb-2 border-b border-indigo-200">Programa João Pessoa Solidária</h1>
        {user && (
          <div className="flex justify-end">
            <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition shadow-md">
              Sair
            </button>
          </div>
        )}

        <main className="bg-white p-6 rounded-xl shadow-xl">
          {!user && <LoginForm setUser={setUser} />}
          {user?.role === 'user' && grocers.length > 0 && (
            <UserForm user={user} setUser={setUser} allocatedPoints={allocatedPoints} setAllocatedPoints={setAllocatedPoints} grocers={grocers} />
          )}
          {user?.role === 'admin' && <AdminForm />}
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
