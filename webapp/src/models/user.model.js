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

    mcuID: {
        type: String,
        required: true,
        unique: true
    },

    lastAccessTime: String,
    dataCreated: String,

    currentSetting: {
        status: {
            type: Boolean,
            default: false,
            required: true
        },

        scalingRatio: {
            type: String,
            required: true
        },

        filamentDiameter: {
            type: Number,
            required: true
        },
        
        filamentLength: {
            type: Number,
            required: true
        },
        
        scalarMotor1Speed: {
            type: Number,
            required: true
        },

        scalarMotor2Speed: {
            type: Number,
            required: true
        },

        scalarRunDuration: {
            type: String,
            required: true
        },

        mixerMotor1Speed: {
            type: Number,
            required: true
        },

        mixerTemperature: {
            type: Number,
            required: true
        },

        mixerRunDuration: {
            type: String,
            required: true
        },

        extruderMotorSpeed: {
            type: Number,
            required: true
        },

        extruderRunDuration: {
            type: String,
            required: true
        },

        extruderTemperature: {
            type: Number,
            required: true
        },

        collectorMotor1Speed: {
            type: Number,
            required: true
        },

        pullerMotor1Speed: {
            type: Number,
            required: true
        }

    },

    savedSettingsCount: {
            type: Number,
            required: true,
            default: 0
    },

    savedSettings: [{
        saveNumber: {
            type: Number,
            required: true
        },

        scalingRatio: {
            type: String,
            required: true
        },

        filamentDiameter: {
            type: Number,
            required: true
        },
        
        filamentLength: {
            type: Number,
            required: true
        },
        
        scalarMotor1Speed: {
            type: Number,
            required: true
        },

        scalarMotor2Speed: {
            type: Number,
            required: true
        },

        scalarRunDuration: {
            type: String,
            required: true
        },

        mixerMotor1Speed: {
            type: Number,
            required: true
        },

        mixerTemperature: {
            type: Number,
            required: true
        },

        mixerRunDuration: {
            type: String,
            required: true
        },

        extruderMotorSpeed: {
            type: Number,
            required: true
        },

        extruderRunDuration: {
            type: String,
            required: true
        },

        extruderTemperature: {
            type: Number,
            required: true
        },

        collectorMotor1Speed: {
            type: Number,
            required: true
        }
    }],

    activeData: {
        mixerTemperature1: Number,
        mixerTemperature2: Number,
        extruderTemperature1: Number,
        extruderTemperature2: Number,
        
        radiusMeterActive1: Number,
        radiusMeterActive2: Number,
        
        pullerMotor1Speed: Number,
        collectorMotor1Speed: Number,
        scalarMotor1Speed: Number,
        scalarMotor2Speed: Number,
        mixerMotor1Speed: Number,
        extruderMotorSpeed: Number,

        pullerCycleCount: Number,
        collectorCycleCount: Number,

        extruderHeater1: Boolean,
        extruderHeater2: Boolean,
        mixerHeater: Boolean
    }
})

module.exports = mongoose.model("User", user)