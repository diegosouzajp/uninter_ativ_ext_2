import { useState, useEffect } from 'react'
import Footer from './components/Footer'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import Togglable from './components/Togglable'
import loginService from './services/login'
import grocerService from './services/grocers'
import allocationService from './services/allocations'

const App = () => {
  const [grocers, setGrocers] = useState([])
  const [allocations, setAllocations] = useState([])
  const [allocatedPoints, setAllocatedPoints] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totalAvailablePoints, setTotalAvailablePoints] = useState(0)

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      setTotalAvailablePoints(user.totalAvailablePoints)
      grocerService.setToken(user.token)
      allocationService.setToken(user.token)
    }
  }, [])

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const allGrocers = grocerService.getAll()
        const allAllocations = allocationService.getAll()
        const [resGrocers, resAllocations] = await Promise.all([allGrocers, allAllocations])

        if (!resGrocers || !resAllocations) {
          throw new Error('There was a problem with at least one of the responses')
        }

        setGrocers(resGrocers)
        setAllocations(resAllocations)

        const allocationPoints = resGrocers.map((grocer) => {
          const currentAllocation = resAllocations.find((allocation) => allocation.grocer.id === grocer.id)
          const currentPoints = currentAllocation ? currentAllocation.points : 0
          return { id: grocer.id, initialPoints: currentPoints, currentPoints: currentPoints }
        })
        setAllocatedPoints(allocationPoints)
      } catch (error) {
        setErrorMessage(error.message)
      }
    }

    if (user) fetchAllData()
  }, [user])

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const user = await loginService.login({ username, password })

      window.localStorage.setItem('loggedUser', JSON.stringify(user))
      grocerService.setToken(user.token)
      allocationService.setToken(user.token)
      setUser(user)
      setTotalAvailablePoints(user.totalAvailablePoints)
      setUsername('')
      setPassword('')
    } catch {
      setErrorMessage('wrong credentials')
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    }
  }

  const handleLogout = async (event) => {
    event.preventDefault()
    window.localStorage.removeItem('loggedUser')
    setUser(null)
  }

  const loginForm = () => {
    return (
      <Togglable buttonLabel="Entrar">
        <LoginForm
          username={username}
          password={password}
          handleUsernameChange={({ target }) => setUsername(target.value)}
          handlePasswordChange={({ target }) => setPassword(target.value)}
          handleSubmit={handleLogin}
        />
      </Togglable>
    )
  }

  const GrocerAllocationItem = ({ grocer, allocation }) => {
    const handleInputChange = (event) => {
      const pointsVariation = event.target.value - allocation.currentPoints
      if (pointsVariation === 1 && totalAvailablePoints === 0) return
      allocation.currentPoints = allocation.currentPoints + pointsVariation
      const updatedAllocations = allocatedPoints.map((alloc) => {
        if (alloc.id === allocation.id) return allocation
        else return alloc
      })
      setAllocatedPoints(updatedAllocations)
      setTotalAvailablePoints(totalAvailablePoints - pointsVariation)
    }

    return (
      <li key={grocer.id}>
        {grocer.name} <input type="number" min="0" value={allocation.currentPoints} onChange={handleInputChange} />
      </li>
    )
  }

  return (
    <div>
      <h1>Programa João Pessoa Solidária</h1>
      <Notification message={errorMessage} />
      {!user && loginForm()}
      {user && grocers.length > 0 && (
        <div>
          <h2>Olá, {user.name}!</h2>
          <h2>Você tem {totalAvailablePoints} pontos disponíveis para usar com o supermercado de sua preferência.</h2>
          <button onClick={handleLogout}>Sair</button>
          <h2>Empresas participantes</h2>
          <ul>
            {grocers.map((grocer) => {
              const allocation = allocatedPoints.find((alloc) => alloc.id === grocer.id)
              return <GrocerAllocationItem key={grocer.id} grocer={grocer} allocation={allocation} />
            })}
          </ul>
        </div>
      )}
      <Footer />
    </div>
  )
}

export default App
