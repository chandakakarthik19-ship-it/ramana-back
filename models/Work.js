const mongoose = require('mongoose');

const WorkSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  date: { type: Date, default: Date.now },
  workType: String,
  minutes: Number,
  ratePer60: Number,
  totalAmount: Number,
  paymentGiven: { type: Number, default: 0 },
  notes: String
});

module.exports = mongoose.model('Work', WorkSchema);