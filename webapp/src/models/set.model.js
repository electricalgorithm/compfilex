const mongoose = require("mongoose")
const database = require("../db-server")

// Connection to the database-as-a-service provider.
// mongoose.connect(`mongodb+srv://${database.username}:${database.pass}@${database.serverAddr}/${database.dbSS}`)

// Creating a scheme/modal.
let set = new mongoose.Schema({
    setNumber: {
        type: Number,
        required: true,
        unique: true
    },

    // Set name will be used for GUI purposes.
    setName: {
        type: String,
        required: true,
        unique: true
    },

    // This ratio is based on a hundred. Like 0.33 for 1/3. 
    scalarRatio: {
        type: Number,
        required: true
    },

    filamentDiameter: {
        type: Number,
        required: true
    },

    scalarMotor1Speed: {
        type: Number,
        required: true,
    },

    scalarMotor2Speed: {
        type: Number,
        required: true,
    },

    scalarRunDuration: {
        type: Number,
        required: true,
    },

    mixerMotor1Speed: {
        type: Number,
        required: true
    },

    mixerRunDuration: {
        type: Number,
        required: true
    },

    extruderMotorSpeed: {
        type: Number,
        required: true
    },

    extruderRunDuration: {
        type: Number,
        required: true
    },

    pullerMotorSpeed: {
        type: Number,
        required: true
    },

    collectorMotorSpeed: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model("Predetermined Set", set)