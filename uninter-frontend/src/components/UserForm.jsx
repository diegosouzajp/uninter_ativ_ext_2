import { useState } from 'react'
import allocationService from '../services/allocations'
import Notification from './Notification'

const UserForm = ({ user, setUser, allocatedPoints, setAllocatedPoints, grocers }) => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Calculates the total allocated points
  const totalAllocated = allocatedPoints.reduce((sum, alloc) => sum + alloc.currentPoints, 0)

  // Get the total available points from user
  const pointsRemaining = user.points

  // Handler for changing the input value for a specific grocer
  const handlePointChange = (grocerId, value) => {
    // Ensure the value is a non-negative integer
    const newPoints = Math.max(0, parseInt(value) || 0)

    // Calculate the difference this change would make
    const oldPoints = allocatedPoints.find((a) => a.id === grocerId)?.currentPoints || 0
    const delta = newPoints - oldPoints

    // Check if this change exceeds the remaining budget
    if (pointsRemaining - delta < 0) {
      setErrorMessage('Pontos insuficientes')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    // Update the local component state (allocatedPoints)
    const updatedAllocations = allocatedPoints.map((allocation) => (allocation.id === grocerId ? { ...allocation, currentPoints: newPoints } : allocation))
    setAllocatedPoints(updatedAllocations)
    setUser({ ...user, points: user.points - delta })
  }

  // Handler for submitting the allocation change
  const handleSaveAllocation = async (allocation) => {
    setIsSaving(true)
    try {
      await allocationService.update(allocation.id, {
        user: user.id,
        grocer: allocation.id,
        points: allocation.currentPoints,
        grocerName: allocation.grocerName,
      })

      setAllocatedPoints(allocatedPoints.map((alloc) => (alloc.id === allocation.id ? { ...alloc, initialPoints: alloc.currentPoints } : alloc)))
      setSuccessMessage(`Alocação salva: ${allocation.currentPoints} pontos para ${allocation.grocerName}.`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setErrorMessage('Falha na alocação dos pontos')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage && <Notification className="error" message={errorMessage} />}
      {successMessage && <Notification className="success" message={successMessage} />}

      <h2 className="text-2xl font-semibold text-indigo-700">Olá, {user.name || user.username}!</h2>
      <p>Parabéns pelas suas doações!</p>
      <p>Use seus pontos para obter descontos em suas compras nos supermercados abaixo:</p>

      {/* Summary Card */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-inner">
        <p className={`text-lg font-medium mb-2 ${pointsRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
          Pontos disponíveis para alocação:
          <span className="font-extrabold ml-2">{user.points}</span>
        </p>
        <p className="text-lg font-medium text-blue-800 mb-2">
          Pontos Atualmente Alocados:
          <span className="font-extrabold ml-2">{totalAllocated}</span>
        </p>
        <p className="text-sm text-blue-600 mt-1">Edite as alocações abaixo (Total de {grocers.length} empresas).</p>
      </div>

      {/* Allocation List */}
      <ul className="space-y-3">
        {allocatedPoints.map((allocation) => (
          <li key={allocation.id} className="flex flex-col p-4 bg-white border border-gray-100 rounded-lg shadow-sm space-y-3">
            <span className="font-medium text-gray-700 break-words">{allocation.grocerName}</span>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={allocation.currentPoints + pointsRemaining}
                  value={allocation.currentPoints}
                  onChange={({ target }) => handlePointChange(allocation.id, target.value)}
                  disabled={isSaving}
                  className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <span className="font-bold text-indigo-600">pontos</span>
              </div>
              <button
                onClick={() => handleSaveAllocation(allocation)}
                disabled={isSaving || allocation.initialPoints === allocation.currentPoints}
                className="bg-indigo-500 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UserForm
