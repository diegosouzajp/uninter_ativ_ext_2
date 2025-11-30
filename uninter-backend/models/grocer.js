const mongoose = require('mongoose')

const grocerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Grocer name is required'],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: true, // Optional location field
    },
    // This field stores the SUM of points received from ALL users.
    // It is updated by the transaction logic whenever an Allocation changes.
    totalReceivedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
)

grocerSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Grocer', grocerSchema)
