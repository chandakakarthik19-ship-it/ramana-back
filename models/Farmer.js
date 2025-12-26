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
    ref: 'Work',
    default: null
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
      type: String,
      default: null
    },

    /* 🔹 PAYMENT HISTORY */
    payments: {
      type: [PaymentSchema],
      default: []
    },

    /* 🔹 STORED TOTAL (IMPORTANT) */
    totalPaid: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

/* ================= HASH PASSWORD ================= */
FarmerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

/* ================= COMPARE PASSWORD ================= */
FarmerSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

/* ================= VIRTUAL: CALCULATED BALANCE ================= */
/*
  balance = total work amount - totalPaid
  (frontend can compute total work separately)
*/
FarmerSchema.virtual('balance').get(function () {
  return 0 - this.totalPaid; // work total added separately
});

/* ================= TO JSON SETTINGS ================= */
FarmerSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password; // 🔐 never expose password
    return ret;
  }
});

module.exports = mongoose.model('Farmer', FarmerSchema);
