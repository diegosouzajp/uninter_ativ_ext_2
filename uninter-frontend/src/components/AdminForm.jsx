import { useState, useEffect, useCallback } from 'react'
import grocerService from '../services/grocers'
import userService from '../services/users'
import Notification from './Notification'

const AdminForm = () => {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [password, setPassword] = useState('')
  const [points, setPoints] = useState('')
  const [role, setRole] = useState('user')
  const [grocerName, setGrocerName] = useState('')
  const [location, setLocation] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSaving, setisSaving] = useState(false)
  const [isDeleting, setisDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const users = await userService.getAll()

      if (!users) {
        throw new Error('Não foi possível obter a lista de usuários')
      }

      setAllUsers(users)
    } catch (error) {
      console.error(error.message)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSaveUser = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await userService.create({ name: name, username: username, password: password, role: role, points: parseInt(points, 10) || 0 })

      setSuccessMessage('Usuário criado com sucesso!')
      setName('')
      setUsername('')
      setPassword('')
      setRole('user')
      setPoints('')
      setErrorMessage(null)

      setTimeout(() => setSuccessMessage(null), 5000)
      // Refresh users after creating a new one
      await fetchUsers()
    } catch (error) {
      setErrorMessage(`Erro ao criar o usuário ${username}`)
      console.error(error)
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveGrocer = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await grocerService.create({ name: grocerName, location: location })

      setSuccessMessage('Supermercado criado com sucesso!')
      setGrocerName('')
      setLocation('')
      setErrorMessage(null)

      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setErrorMessage(`Erro ao criar o supermercado ${grocerName}`)
      console.error(error)
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePointsChange = async (userId, newPoints) => {
    setisSaving(true)

    try {
      await userService.update(userId, { points: parseInt(newPoints, 10) })

      // Update the local state
      setAllUsers(allUsers.map((user) => (user.id === userId ? { ...user, points: parseInt(newPoints, 10) } : user)))

      setSuccessMessage('Pontos atualizados com sucesso!')
      setErrorMessage(null)

      setTimeout(() => setSuccessMessage(null), 5000)
      // Ensure we have latest from server
      await fetchUsers()
    } catch (error) {
      setErrorMessage('Erro ao atualizar os pontos do usuário')
      console.error(error)
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    } finally {
      setisSaving(false)
    }
  }

  const handleDelete = async (userId) => {
    const user = allUsers.find((u) => u.id === userId)
    const confirmDelete = window.confirm(`Tem certeza de que deseja deletar o usuário "${user?.name || user?.username}"?`)
    if (!confirmDelete) return

    setisDeleting(true)
    try {
      await userService.remove(userId)
      setAllUsers(allUsers.filter((u) => u.id !== userId))
      setSuccessMessage('Usuário deletado com sucesso!')
      setErrorMessage(null)
      setTimeout(() => setSuccessMessage(null), 5000)
      // Refresh users from server
      await fetchUsers()
    } catch (error) {
      setErrorMessage('Erro ao deletar o usuário')
      console.error(error)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setisDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage && <Notification className="error" message={errorMessage} />}
      {successMessage && <Notification className="success" message={successMessage} />}

      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-bold text-yellow-800">Painel de Administração</h2>
        <p className="text-gray-600 mt-2">Gerencie usuários e supermercados do programa.</p>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Usuários cadastrados</h3>
        <ul className="space-y-3">
          {allUsers
            .filter((user) => user.role === 'user')
            .map((user) => (
              <li
                key={user.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-gray-100 rounded-lg shadow-sm space-y-2 sm:space-y-0"
              >
                <span className="font-medium text-gray-700 w-full sm:w-1/3">{user.name}</span>

                <div className="flex items-center space-x-3 w-full sm:w-2/3 justify-end">
                  <input
                    type="number"
                    min="0"
                    value={user.points}
                    onChange={({ target }) => setAllUsers(allUsers.map((u) => (u.id === user.id ? { ...u, points: target.value } : u)))}
                    disabled={isSaving}
                    className="w-24 p-2 border border-gray-300 rounded-lg text-center focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <span className="font-bold text-indigo-600 w-16 text-right">pontos</span>
                  <button
                    onClick={() => handlePointsChange(user.id, user.points)}
                    disabled={isSaving}
                    className="bg-indigo-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={isDeleting}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deletando usuário...' : 'Deletar usuário'}
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cadastrar Usuário</h3>
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome de usuário</label>
            <input
              value={username}
              onChange={({ target }) => setUsername(target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              value={name}
              onChange={({ target }) => setName(target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Escolha um perfil
            </label>
            <select
              id="roles"
              value={role}
              onChange={({ target }) => setRole(target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="user">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pontuação inicial</label>
            <input
              value={points}
              onChange={({ target }) => {
                if (!isNaN(target.value)) setPoints(target.value)
              }}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </form>
      </div>

      {/* Grocer Registration Form */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cadastrar Supermercado</h3>
        <form onSubmit={handleSaveGrocer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do supermercado</label>
            <input
              value={grocerName}
              onChange={({ target }) => setGrocerName(target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input
              value={location}
              onChange={({ target }) => setLocation(target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Supermercado'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminForm
