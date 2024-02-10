const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  budgetCat: {
    type: String,
    required: true,
  },
  budgetAmt: {
    type: Number,
    required: true,
  },
  assignedUser: {
    type: String,
    required: false,
  },
  budgetBase: {
    type: String,
    required: true,
  },
  ownerID: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Budget", BudgetSchema);