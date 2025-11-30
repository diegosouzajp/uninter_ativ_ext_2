const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const auth = require('../utils/middleware')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({})
  response.json(users)
})

usersRouter.post('/', auth.authMiddleware, auth.adminAuthMiddleware, async (request, response) => {
  const { username, name, role, password } = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    role,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

usersRouter.put('/:userId/points', auth.authMiddleware, auth.adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const { points } = req.body

    console.log('req.params: ', req.params)

    // 1. Validation
    if (points === undefined || points < 0) {
      return res.status(400).json({ message: 'Points must be a non-negative number.' })
    }

    // 2. Find and Update the User
    // We use { new: true } to return the updated document
    const updatedUser = await User.findByIdAndUpdate(userId, { totalAvailablePoints: points }, { new: true, runValidators: true })

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' })

    res.json({
      message: `User points updated successfully to ${points}.`,
      user: {
        username: updatedUser.username,
        totalAvailablePoints: updatedUser.totalAvailablePoints,
      },
    })
  } catch (error) {
    console.error('Error updating user points:', error)
    res.status(500).json({ message: 'Server error while updating points.' })
  }
})

module.exports = usersRouter
