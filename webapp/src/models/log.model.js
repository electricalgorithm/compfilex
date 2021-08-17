const mongoose = require("mongoose")
const database = require("../db-server")

// Connection to the database-as-a-service provider.
// mongoose.connect(`mongodb+srv://${database.username}:${database.pass}@${database.serverAddr}/${database.dbLog}`, {useNewUrlParser: true})

// Creating a scheme/modal.
let log = new mongoose.Schema({
    entryNo: {
        type: Number,
        unique: true,
        require: true
    },
    entryDate: {
        type: String,
        require: true
    },

    scalarMotor1Speed: Number,
    scalarMotor2Speed: Number,
    scalarRunDuration: Number,

    mixerMotor1Speed: Number,
    mixerRunDuration: Number,
    mixerTemperature1: Number,
    mixerHeater: Boolean,

    extruderMotorSpeed: Number,
    extruderRunDuration: Number,
    extruderTemperature1: Number,
    extruderTemperature2: Number,
    extruderHeater1: Boolean,
    extruderHeater2: Boolean,

    radiusMeterActive1: Number,
    radiusMeterActive2: Number,
    radiusMeterWanted: Number,
    pullerMotorSpeed: Number,
    pullerCycleCount: Number,

    collectorMotorSpeed: Number
})

module.exports = mongoose.model("Log", log)