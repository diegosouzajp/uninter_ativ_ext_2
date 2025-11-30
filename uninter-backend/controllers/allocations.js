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

// --- 2. PUT /api/allocations/:grocerId ---
// Handles the core point distribution logic (Create or Update) using a transaction.
allocationsRouter.put('/:id', auth.authMiddleware, async (req, res) => {
  const userId = req.user.id
  const grocerId = req.params.id
  // The new total points the user WANTS to assign to this grocer.
  const newPointsTarget = parseInt(req.body.points, 10)

  if (isNaN(newPointsTarget) || newPointsTarget < 0) {
    return res.status(400).json({ message: 'Points must be a non-negative number.' })
  }

  // Start Mongoose Transaction for atomicity
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // --- Step 1: Find the User, Grocer, and Current Allocation ---
    const user = await User.findById(userId).session(session)
    const grocer = await Grocer.findById(grocerId).session(session)

    if (!user || !grocer) {
      await session.abortTransaction()
      return res.status(404).json({ message: 'User or Grocer not found.' })
    }

    // Find the existing allocation or prepare for a new one
    let allocation = await Allocation.findOne({ user: userId, grocer: grocerId }).session(session)

    // Determine the previous point value for calculation
    const oldPoints = allocation ? allocation.points : 0

    // --- Step 2: Calculate the Net Change ---
    const changeInPoints = newPointsTarget - oldPoints

    // --- Step 3: Check for Sufficient Available Points on the User ---
    // If changeInPoints is positive, the user is spending new points.
    if (changeInPoints > 0) {
      const pointsToSpend = changeInPoints
      if (user.totalAvailablePoints < pointsToSpend) {
        await session.abortTransaction()
        return res.status(400).json({
          message: `Insufficient points. Available: ${user.totalAvailablePoints}, Required: ${pointsToSpend}.`,
        })
      }
    }

    // --- Step 4: Update the Documents ---

    // A. Update the User's available points (Atomic $inc)
    const newAvailablePoints = user.totalAvailablePoints - changeInPoints
    await User.updateOne({ _id: userId }, { $set: { totalAvailablePoints: newAvailablePoints } }, { session })

    // B. Update the Grocer's total received points (Atomic $inc)
    const newReceivedPoints = grocer.totalReceivedPoints + changeInPoints
    await Grocer.updateOne({ _id: grocerId }, { $set: { totalReceivedPoints: newReceivedPoints } }, { session })

    // C. Update/Create the Allocation Document
    if (newPointsTarget === 0) {
      // If the user sets points to 0, delete the allocation document for cleanliness
      if (allocation) {
        await Allocation.deleteOne({ _id: allocation._id }, { session })
      }
    } else if (allocation) {
      // Update existing allocation
      allocation.points = newPointsTarget
      await allocation.save({ session })
    } else {
      // Create new allocation
      allocation = new Allocation({
        user: userId,
        grocer: grocerId,
        points: newPointsTarget,
        grocerName: grocer.name, // Store name for easy lookup
      })
      await allocation.save({ session })
    }

    // --- Step 5: Commit the Transaction ---
    await session.commitTransaction()
    session.endSession()

    res.status(200).json({
      message: 'Points allocated successfully.',
      newAvailablePoints: newAvailablePoints,
      newAllocation: allocation,
    })
  } catch (error) {
    // Rollback any changes if an error occurs during the transaction
    await session.abortTransaction()
    session.endSession()

    console.error('Allocation transaction failed:', error)
    res.status(500).json({ message: 'Allocation failed due to a database error.' })
  }
})

module.exports = allocationsRouter
