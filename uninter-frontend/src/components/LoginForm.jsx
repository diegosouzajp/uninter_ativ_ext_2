import { useState } from 'react'
import allocationService from '../services/allocations'
import grocerService from '../services/grocers'
import loginService from '../services/login'
import Notification from './Notification'

const LoginForm = ({ setUser }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const user = await loginService.login({ username, password })

      window.localStorage.setItem('loggedUser', JSON.stringify(user))
      grocerService.setToken(user.token)
      allocationService.setToken(user.token)
      setUser(user)
      setErrorMessage(null)
    } catch {
      setErrorMessage('Usuário ou senha incorretos')
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    }
  }

  return (
    <div>
      {errorMessage && <Notification className="error" message={errorMessage} />}
      <form onSubmit={handleLogin} className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acesso ao Sistema</h2>
        <div>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={({ target }) => setUsername(target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg">
          Entrar
        </button>
      </form>
    </div>
  )
}

export default LoginForm
