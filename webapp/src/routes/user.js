const crypto = require('crypto');
const express = require("express")
const userScheme = require("../models/user.model")
const path = require("path")
const config = require("../config.env.js");
let router = express.Router()

// Secret salt-key for hash function.
const sKey = config.USER_HASH_SALT


// /user?type=register  -> Registration API
// /user?type=login     -> Login API
router.post("/user", async (req, res) => {
    if (!req.body) {
        return res.status(400).send("Request body is missing.")
    }

    if (req.query.type == "register") {
        // Check the request JSON file got firstName, lastName, userName, passwordHash, and email properties.
        // If not, return status 500.
        if (req.body.firstName == undefined ||
            req.body.lastName == undefined ||
            req.body.userName == undefined ||
            req.body.passwordHash == undefined ||
            req.body.email == undefined) {
                return res.status(500).send("Request body does not contain firstName, lastName, userName, passwordHash, or email.")
        }
        
        // Create a new object, assign neccecary fields.
        let postedData = req.body
        postedData.dataCreated = new Date().toString()
        postedData.lastAccessTime = new Date().toString()
        postedData.currentSetting = {
            scalingRatio: "None",
            filamentDiameter: 0,
            filamentLength: 0,
            scalarMotor1Speed: 0,
            scalarMotor2Speed: 0,
            scalarRunDuration: "00:00",
            mixerMotor1Speed: 0,
            mixerTemperature: 0,
            mixerRunDuration: "00:00",
            extruderMotorSpeed: 0,
            extruderRunDuration: "00:00",
            extruderTemperature: 0,
            collectorMotor1Speed: 0,
            pullerMotor1Speed: 0
        }
        postedData.activeData = {
            mixerTemperature1: 0,
            mixerTemperature2: 0,
            mixerHeater: false,
            extruderTemperature1: 0,
            extruderTemperature2: 0,
            extruderHeater1: false,
            extruderHeater2: false,
            radiusMeterActive1: 0,
            radiusMeterActive2: 0,
            pullerCycleCount: 0,
            collectorCycleCount: 0,
            scalarMotor1Speed: 0,
            scalarMotor2Speed: 0,
            mixerMotor1Speed: 0,
            extruderMotorSpeed: 0,
            collectorMotor1Speed: 0,
            pullerMotor1Speed: 0,
        }

        // Hash the password and save it to object.
        postedData.passwordHash = crypto.createHmac("sha256", sKey).update(postedData.passwordHash).digest("hex")

        // Create a new entry from userScheme modal.
        let entry = new userScheme(postedData)
        entry.save()
            // After saving completed, send a "OK" message with status 201.
            .then(doc => {
                if (!doc || doc.length === 0) {
                    return res.status(500).send(doc)
                }
                
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.status(201).send({
                    "status": "OK"
                })
            })
            // If an error occurs, send error message as JSON with status 500.
            .catch(err => {
                res.status(500).json(err)
            })
    }

    if (req.query.type == "login") {
        // Check the request JSON file got userName and passwordHash properties.
        // If not, return status 500.
        if (req.body.userName == undefined ||
            req.body.passwordHash == undefined) {
                return res.status(500).send("Wrong username or password.")
        }
        
        // Create a new object from request body.
        let postedData = req.body
        // Hash the password and save it to object.
        postedData.passwordHash = crypto.createHmac("sha256", sKey).update(postedData.passwordHash).digest("hex")

        // Finding the datum entry from given crediential information in the database.
        await userScheme.findOne({
            userName: postedData.userName,
            passwordHash: postedData.passwordHash
        })
        .then(doc => {
            if (doc._id != undefined) {
                
                // Change the lastAccessTime property of the datum to current date. 
                doc.lastAccessTime = new Date().toString()
                doc.save()

                // Give the session isAuth authority, and store userName to the session data.
                req.session.isAuth = true;
                req.session.username = postedData.userName;
                
                // Send a "OK" message with status code 200, after everyting is correct.
                res.status(200).send({
                    "status": "OK"
                });
            }
            else {
                // Send invalid credientials message with status code 500.
                req.session.error = "Invalid credentials.";
                res.status(500).send("Wrong username or password.")
            }
        })
        .catch(err => {
            res.status(500).send(err)
        })
    }


    if (req.query.type == "changepassword") {
        // Check the request JSON file got userName and passwordHash properties.
        // If not, return status 500.
        if (req.session.username == undefined) {
                return res.status(500).send("Log in first.")
        }
        
        // Create a new object from request body.
        let postedData = req.body
        // Hash the both passwords and save it to object.
        postedData.oldPassword = crypto.createHmac("sha256", sKey).update(postedData.oldPassword).digest("hex")
        postedData.newPassword = crypto.createHmac("sha256", sKey).update(postedData.newPassword).digest("hex")

        // Finding the datum entry from given crediential information in the database.
        await userScheme.findOne({
            userName: req.session.username,
            passwordHash: postedData.oldPassword
        })
        .then(doc => {
            if (doc._id != undefined) {
                
                // Change the lastAccessTime property of the datum to current date. 
                doc.passwordHash = postedData.newPassword;
                doc.save();
                
                // Send a "OK" message with status code 200, after everyting is correct.
                res.status(200).send({
                    "status": "OK"
                });
            }
            else {
                // Send invalid credientials message with status code 500.
                req.session.error = "Invalid credentials.";
                res.status(500).send("Wrong username or password.")
            }
        })
        .catch(err => {
            res.status(500).send(err)
        })
    }

})

module.exports = router