const mongoose = require("mongoose")
const database = require("../db-server")

// Connection to the database-as-a-service provider.
// connect(`mongodb+srv://${database.username}:${database.pass}@${database.serverAddr}/${database.dbLog}`)

// Creating a scheme/modal.
let deletionHistory = new mongoose.Schema({
    entryNo: {
        type: Number,
        required: true,
        unique: true
    },

    deletedEntryCount: {
        type: Number,
        required: true
    },

    date: {
        type: String,
        required: true
    },

    whois: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Deletion History", deletionHistory)