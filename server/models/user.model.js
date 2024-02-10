const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    userName: {
        type: String, // What datatype this is expecting
        required: true, // default is false
        unique: true, // only one account per username
    },
    email: {
        type: String,
        required: true,
        unique: true, // only one account per email address
    },
    password: {
        type: String,
        required: true,
    },
    lastUpload: {
        type: Date,
        required: false,
    }
})

module.exports = mongoose.model("User", UserSchema);