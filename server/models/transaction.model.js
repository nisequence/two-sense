const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    uploadID: {
        type: Number,
        required: true,
        unique: true,
    },
    date: {
        type: Date,
        required: true,
    },
    desc: {
        type: String,
        required: false,
    },
    withdrawal: {
        type: Boolean,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: false,
    },
    ownerID: {
        type: String,
        required: true,
    },
})

module.exports = mongoose.model("Transaction", TransactionSchema);