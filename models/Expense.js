const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Oil", "Finance", "Driver", "Mechanic", "Others"]
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Expense", expenseSchema);
