const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  budgetName: {
    type: String,
    required: true,
  },
  budgetAmt: {
    type: Number,
    required: true,
  },
  recurring: {
    type: Boolean,
    required: true,
  },
  initialization: {
    type: Date,
    required: true,
  },
  ownerID: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Budget", BudgetSchema);