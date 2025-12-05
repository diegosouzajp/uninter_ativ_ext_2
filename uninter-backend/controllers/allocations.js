const express = require('express')
const allocationsRouter = express.Router()
const mongoose = require('mongoose')
const User = require('../models/user')
const Grocer = require('../models/grocer')
const Allocation = require('../models/allocation')
const auth = require('../utils/middleware')

allocationsRouter.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const allocations = await Allocation.find({ user: userId }).populate('grocer', 'name').exec()

    res.json(allocations)
  } catch (error) {
    console.error('Error fetching user allocations:', error)
    res.status(500).json({ message: 'Failed to retrieve allocations.' })
  }
})

allocationsRouter.put('/:id', auth.authMiddleware, async (req, res) => {
  const userId = req.user.id
  const grocerId = req.params.id
  const newPointsTarget = parseInt(req.body.points, 10)

  if (isNaN(newPointsTarget) || newPointsTarget < 0) {
    return res.status(400).json({ message: 'Points must be a non-negative number.' })
  }

  const session = await mongoose.startSession()
  let newAvailablePoints
  let allocation

  try {
    await session.withTransaction(async () => {
      // --- Step 1: Find the User, Grocer, and Current Allocation ---
      const user = await User.findById(userId).session(session)
      const grocer = await Grocer.findById(grocerId).session(session)

      if (!user || !grocer) {
        throw new Error('User or Grocer not found.')
      }

      allocation = await Allocation.findOne({ user: userId, grocer: grocerId }).session(session)
      const oldPoints = allocation ? allocation.points : 0
      const changeInPoints = newPointsTarget - oldPoints

      // --- Step 3: Check for Sufficient Available Points ---
      if (changeInPoints > 0 && user.points < changeInPoints) {
        throw new Error(`Insufficient points. Available: ${user.points}, Required: ${changeInPoints}.`)
      }

      // --- Step 4: Update the Documents ---
      newAvailablePoints = user.points - changeInPoints
      await User.updateOne({ _id: userId }, { $set: { points: newAvailablePoints } }, { session })

      const newReceivedPoints = grocer.totalReceivedPoints + changeInPoints
      await Grocer.updateOne({ _id: grocerId }, { $set: { totalReceivedPoints: newReceivedPoints } }, { session })

      if (newPointsTarget === 0) {
        if (allocation) {
          await Allocation.deleteOne({ _id: allocation._id }, { session })
        }
      } else if (allocation) {
        allocation.points = newPointsTarget
        await allocation.save({ session })
      } else {
        allocation = new Allocation({
          user: userId,
          grocer: grocerId,
          points: newPointsTarget,
          grocerName: grocer.name,
        })
        await allocation.save({ session })
      }
    })

    session.endSession()

    res.status(200).json({
      message: 'Points allocated successfully.',
      newAvailablePoints: newAvailablePoints,
      newAllocation: allocation,
    })
  } catch (error) {
    session.endSession()
    console.error('Allocation transaction failed:', error)
    res.status(500).json({ message: error.message || 'Allocation failed due to a database error.' })
  }
})

module.exports = allocationsRouter
