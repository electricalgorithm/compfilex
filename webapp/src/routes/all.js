const express = require("express")
const logScheme = require("../models/log.model")
const dataInMemory = require("../data.js")
let router = express.Router()

router.post("/all", (req, res) => {
    // Check if request is empty or does not have neccecary fields. 
    // Send status code 500 if it does not provide the information.
    if (!req.body ||
        req.body.mixerTemperature1 == undefined     || 
        req.body.extruderTemperature1 == undefined  ||
        req.body.extruderTemperature2 == undefined  ||
        req.body.radiusMeterActive1 == undefined    ||
        req.body.radiusMeterActive2 == undefined    ||
        req.body.pullerCycleCount == undefined
        ) {
            return res.status(500).send("Request body needs to have mixerTemperature1, extruderTemperature1, extruderTemperature2, radiusMeterActive1, radiusMeterActive2, and pullerCycleCount parameters.")
    }

    // Create a object from request body, and insert date to object.
    let postedData = req.body
    postedData.entryDate = new Date().toString()
    
    // Count the number of documents in the database, which will be stored as 
    // identification number property.
    logScheme.countDocuments({}, function (err, count) {
        postedData.entryNo = count + 1
        Object.assign(dataInMemory, postedData)
    })
    
    // Save the object as a document to the database.
    // Send status code 201, and the document itself if everything is correct.
    let entry = new logScheme(dataInMemory)
    entry.save()
        .then(doc => {
            if (!doc || doc.length === 0) {
                return res.status(500).send(doc)
            }
            res.status(201).send(doc)
        })
        .catch(err => {
            res.status(500).json(err)
        })
})

module.exports = router