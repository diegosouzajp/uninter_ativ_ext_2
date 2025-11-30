const mongoose = require('mongoose')

// --- Allocation Schema (The Junction Model) ---
// This document links a single User to a single Grocer and stores the current
// non-negative total points allocated by that specific user to that specific grocer.
const allocationSchema = new mongoose.Schema(
  {
    // Reference to the User who made the allocation.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Reference to the Grocer receiving the points.
    grocer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grocer',
      required: true,
    },
    // The current, non-negative total of points assigned by the user to this grocer.
    points: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Stores the grocer name for easier population/readability on the backend
    grocerName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

// CRITICAL: This unique index ensures that a single user can only have ONE Allocation
// document for any given grocer, preventing multiple rows for the same relationship.
allocationSchema.index({ user: 1, grocer: 1 }, { unique: true })

const Allocation = mongoose.model('Allocation', allocationSchema)
module.exports = Allocation
