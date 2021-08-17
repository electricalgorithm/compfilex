const express = require("express")
const essentials = require("./essentials")
let router = express.Router()

/*
t = r1 => Radius Measurement System 1
t = r2 => Radius Measurement System 1
*/

// TODO: CONNECT HERE TO DATABASE AND SERVE THE DATA.

router.get("/filament", (req, res) => {
    if (bothCaseArray(_prefixActiveRadius, 1).indexOf(req.query.t) != -1) {
        res.send("Active Radius 1")
    }

    else if (bothCaseArray(_prefixActiveRadius, 2).indexOf(req.query.t) != -1) {
        res.send("Active Radius 2")
    }

    else if (req.query.t == "radius") {
        res.send("Radius Wanted")
    }

    else if (req.query.t == "total_length") {
        res.send("Total Length")
    }

    else if (req.query.t == "average_radius") {
        res.send("Average Radius")
    }
    
    else {
        res.send("Something wrong!")
    }
})

router.post("/filament", (req, res) => {
    if (!req.body) {
        return res.status(400).send("Request body is missing.")
    }

    if (bothCaseArray(_prefixActiveRadius, 1).indexOf(req.query.t) != -1) {
        res.send("Active Radius 1")
    }

    else if (bothCaseArray(_prefixActiveRadius, 2).indexOf(req.query.t) != -1) {
        res.send("Active Radius 2")
    }
    
    else if (req.query.t == "radius") {
        res.send("Radius Wanted")
    }

    else if (req.query.t == "total_length") {
        res.send("Total Length")
    }
})

module.exports = router