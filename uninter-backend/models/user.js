const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    // Role is crucial for access control (RBAC). Only 'admin' can add new grocers/users.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
    // The total pool of points the user has earned and can distribute.
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
)

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  },
})

const User = mongoose.model('User', userSchema)

module.exports = User
