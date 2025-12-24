const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ================= PAYMENT SCHEMA ================= */
const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  workId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Work'
  }
});

/* ================= FARMER SCHEMA ================= */
const FarmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    profileImage: {
      type: String
    },
    payments: [PaymentSchema]
  },
  {
    timestamps: true // adds createdAt & updatedAt automatically
  }
);

/* ================= HASH PASSWORD ================= */
FarmerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* ================= COMPARE PASSWORD ================= */
FarmerSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Farmer', FarmerSchema);
