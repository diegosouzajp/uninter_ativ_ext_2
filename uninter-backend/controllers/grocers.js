const jwt = require('jsonwebtoken')
const grocersRouter = require('express').Router()
const Grocer = require('../models/grocer')
const User = require('../models/user')
const auth = require('../utils/middleware')

grocersRouter.get('/', async (request, response) => {
  const grocers = await Grocer.find({})
  response.json(grocers)
})

grocersRouter.get('/:id', async (request, response) => {
  const grocer = await Grocer.findById(request.params.id)
  if (grocer) response.json(grocer)
  else response.status(404).end()
})

const getTokenFrom = (request) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

grocersRouter.post('/', auth.authMiddleware, auth.adminAuthMiddleware, async (request, response) => {
  const body = request.body
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(decodedToken.id)

  if (!user) {
    return response.status(400).json({ error: 'userId missing or not valid' })
  }

  const grocer = new Grocer({
    name: body.name,
    location: body.location,
  })

  const savedGrocer = await grocer.save()

  response.status(201).json(savedGrocer)
})

grocersRouter.delete('/:id', auth.authMiddleware, auth.adminAuthMiddleware, async (request, response) => {
  await Grocer.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

grocersRouter.put('/:id', auth.authMiddleware, auth.adminAuthMiddleware, (request, response, next) => {
  const { name, location } = request.body

  Grocer.findById(request.params.id)
    .then((grocer) => {
      if (!grocer) {
        return response.status(404).end()
      }

      grocer.name = name
      grocer.location = location

      return grocer.save().then((updatedGrocer) => {
        response.json(updatedGrocer)
      })
    })
    .catch((error) => next(error))
})

module.exports = grocersRouter
