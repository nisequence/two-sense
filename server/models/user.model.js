const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    userName: {
        type: String, // What datatype this is expecting
        required: true, // default is false
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
})

module.exports = mongoose.model("User", UserSchema);