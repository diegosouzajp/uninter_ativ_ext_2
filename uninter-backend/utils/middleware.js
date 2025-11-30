const logger = require('./logger')
const jwt = require('jsonwebtoken')
const SECRET = process.env.SECRET

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({ error: 'token expired' })
  }

  next(error)
}

const authMiddleware = (request, response, next) => {
  // 1. Check for the Authorization header
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication token missing or invalid format.' })
  }

  // 2. Extract the token (removing "Bearer ")
  const token = authHeader.split(' ')[1]

  try {
    // 3. Verify the token using the secret
    const decoded = jwt.verify(token, SECRET)
    // 4. Attach decoded user info (including role) to the request object
    request.user = {
      id: decoded.id,
      role: decoded.role,
    }

    next()
  } catch {
    // Token is invalid (expired, wrong signature, etc.)
    return response.status(401).json({ message: 'Invalid or expired token.' })
  }
}

const adminAuthMiddleware = (request, response, next) => {
  // 1. Check if authMiddleware ran successfully
  if (!request.user) {
    // This should theoretically not happen if routes are ordered correctly
    return response.status(500).json({ message: 'User data not found in request (Auth error).' })
  }

  // 2. Check the user's role
  // This uses the role property from the User Schema (models/User.js)
  if (request.user.role !== 'admin') {
    // 3. If not an admin, deny access
    return response.status(403).json({ message: 'Forbidden: Requires Admin privileges.' })
  }

  // 4. If admin, proceed to the route handler
  next()
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  authMiddleware,
  adminAuthMiddleware,
}
