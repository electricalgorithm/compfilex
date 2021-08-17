const express = require("express")
let router = express.Router()

router.get("/temperature", (req, res) => {
    // t for `type`:
    // t = s1 => Scaler System   | One
    // t = e1 => Extruder System | One
    // t = e2 => Extruder System | Two
    if (req.query.t == "s1" || req.query.t == "S1") {
        res.send("You've accessed Scaler's Temperature 1")
    } 
    else if (req.query.t == "e1" || req.query.t ==  "E1") {
        res.send("You've accessed Extruder's Temperature 1")
    }
    else if (req.query.t == "e2" || req.query.t == "E2") {
        res.send("You've accessed Extruder's Temperature 2")
    }
    else {
        res.send("Something wrong!")
    }
})

module.exports = router
