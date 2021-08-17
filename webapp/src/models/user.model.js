const mongoose = require("mongoose")
const database = require("../db-server")

// Creating a scheme/modal.
let user = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },

    lastName: {
        type: String,
        required: true,
    },

    userName: {
        type: String,
        required: true,
        unique: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    lastAccessTime: String,
    dataCreated: String
})

module.exports = mongoose.model("User", user)