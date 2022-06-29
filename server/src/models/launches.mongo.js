const mongoose = require('mongoose');

const launchesSchema = new mongoose.Schema({
  flightNumber: {
    type: Number,
    required: true,
  },
  mission: {
    type: String,
    required: true,
  },
  rocket: {
    type: String,
    ref: 'Planet',
  },
  launchDate: {
    type: Date,
    required: true,
  },
  target: {
    type: String,
  },
  customers: {
    type: [String],
  },
  upcoming: {
    type: Boolean,
    required: true,
    default: true,
  },
  success: {
    type: Boolean,
    required: true,
    default: true,
  },
});

// 1st arg (name of a collection) must be singular
// connects launchesSchema with the "launches" collection
module.exports = mongoose.model('Launch', launchesSchema);
