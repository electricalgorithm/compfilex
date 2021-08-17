const express = require("express");
const esentials = require("./essentials")
let router = express.Router();

/*
t = s1 => Scaler System   | One
t = s2 => Scaler System   | Two
t = m1 => Mixer System    | One
t = e1 => Extruder System | One
t = p1 => Puller System   | One
t = p2 => Puller System   | Two
*/

// TODO: CONNECT HERE TO DATABASE AND SERVE THE DATA.

// "GET /motor" will be used in microcontroller to
// access wanted motor speeds.
router.get("/motor", (req, res) => {    
    if (bothCaseArray(_prefixScalerMotor, 1).indexOf(req.query.t) != -1) {
        res.status(200).send("Scaler Motor Speed 1")
    }

    else if (bothCaseArray(_prefixScalerMotor, 2).indexOf(req.query.t) != -1) {
        res.status(200).send("Scaler Motor Speed 2")
    }
    
    else if (bothCaseArray(_prefixMixerMotor, 1).indexOf(req.query.t) != -1) {
        res.status(200).send("Mixer Motor Speed 1")
    }
    
    else if (bothCaseArray(_prefixExtruderMotor, 1).indexOf(req.query.t) != -1) {
        res.send("Extruder Motor Speed 1")
    }

    else if (bothCaseArray(_prefixPullerMotor, 1).indexOf(req.query.t) != -1) {
        res.send("Puller Motor Speed 1")
    }

    else if (bothCaseArray(_prefixPullerMotor, 2).indexOf(req.query.t) != -1) {
        res.send("Puller Motor Speed 2")
    }
    
    else {
        res.send("Something wrong!")
    }
})


// "POST /motor" will be used in microcontroller to
// push new data from motor drivers. 
router.post("/motor", (req, res) => {    
    if (bothCaseArray(_prefixScalerMotor, 1).indexOf(req.query.t) != -1) {
        res.status(200).send(`Scaler Motor Speed 1 changed to ${req.body.speed}.`)
    }

    else if (bothCaseArray(_prefixScalerMotor, 2).indexOf(req.query.t) != -1) {
        res.status(200).send("Scaler Motor Speed 2")
    }
    
    else if (bothCaseArray(_prefixMixerMotor, 1).indexOf(req.query.t) != -1) {
        res.status(200).send("Mixer Motor Speed 1")
    }
    
    else if (bothCaseArray(_prefixExtruderMotor, 1).indexOf(req.query.t) != -1) {
        res.send("Extruder Motor Speed 1")
    }

    else if (bothCaseArray(_prefixPullerMotor, 1).indexOf(req.query.t) != -1) {
        res.send("Puller Motor Speed 1")
    }

    else if (bothCaseArray(_prefixPullerMotor, 2).indexOf(req.query.t) != -1) {
        res.send("Puller Motor Speed 2")
    }
    
    else {
        res.send("Something wrong!")
    }
})


module.exports = router
