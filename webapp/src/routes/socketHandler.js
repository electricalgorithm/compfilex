const userScheme = require("../models/user.model");
const mongoose = require("mongoose");

var send_reload_data = async (socket, io) => {
    // Get current machine settings from database for given username.
    var currentSettingFromUser = {};
    var activeDataFromUser = {};

    await userScheme.findOne({
        userName: socket.request.session.username
    })
    .then(doc => {
        if (doc._id != undefined) {
            currentSettingFromUser = doc.currentSetting;
            activeDataFromUser = doc.activeData;
        }
    })
    .catch(error => {
        console.error(`${new Date().toString()} -> ERROR: ${error}`);
    })

    // Send machine settings and active data.
    io.to(socket.request.session.username).emit("reload_data", {
        currentSetting: currentSettingFromUser,
        activeData: activeDataFromUser
    });
}


var send_data_to_mcu = async (socket, io) => {
    var currentSettingFromUser = {
        status: false,
        scalarMotor1Speed: 0,
        scalarMotor2Speed: 0,
        mixerMotor1Speed: 0,
        extruderMotorSpeed: 0,
        pullerMotor1Speed: 0,
        collectorMotor1Speed: 0,
        scalingMotorsDuration: 0,
        mixerMotorsDuration: 0,
        extruderMotorsDuration: 0,
        mixerTemperature: 0,
        extruderTemperature: 0,
        filamentDiameter: 0,
        filamentLength: 0
    };

    var userMCUid = "";

    // Send current data to MCU.
    await userScheme.findOne({
        userName: socket.request.session.username
    })
    .then(doc => {
        if (doc._id != undefined) {
            currentSettingFromUser.status = doc.currentSetting.status;
            userMCUid = doc.mcuID;
            
            currentSettingFromUser.scalarMotor1Speed = doc.currentSetting.scalarMotor1Speed;
            currentSettingFromUser.scalarMotor2Speed = doc.currentSetting.scalarMotor2Speed;
            currentSettingFromUser.mixerMotor1Speed = doc.currentSetting.mixerMotor1Speed;
            currentSettingFromUser.extruderMotorSpeed = doc.currentSetting.extruderMotorSpeed;
            currentSettingFromUser.pullerMotor1Speed = doc.currentSetting.pullerMotor1Speed;
            currentSettingFromUser.collectorMotor1Speed = doc.currentSetting.collectorMotor1Speed;

            currentSettingFromUser.scalingMotorsDuration = doc.currentSetting.scalarRunDuration.split(":")[0] * 60 + doc.currentSetting.scalarRunDuration.split(":")[1];
            currentSettingFromUser.mixerMotorsDuration = doc.currentSetting.mixerRunDuration.split(":")[0] * 60 + doc.currentSetting.mixerRunDuration.split(":")[1];
            currentSettingFromUser.extruderMotorsDuration = doc.currentSetting.extruderRunDuration.split(":")[0] * 60 + doc.currentSetting.extruderRunDuration.split(":")[1];
            
            currentSettingFromUser.mixerTemperature = doc.currentSetting.mixerTemperature;
            currentSettingFromUser.extruderTemperature = doc.currentSetting.mixerTemperature;
            
            currentSettingFromUser.filamentDiameter = doc.currentSetting.filamentDiameter;
            currentSettingFromUser.filamentLength = doc.currentSetting.filamentLength;
        }
    })
    .catch(error => {
        console.error(`${new Date().toString()} -> ERROR: ${error}`);
    })

    io.to(userMCUid).emit("settings_update", currentSettingFromUser);
}

var socketHandler = async (socket, io) => {

    // Web-Client Side Socket Handling
    // ------------------------------
    if (socket.request.session.isAuth) {
        console.log(`${new Date().toString()} -> SOCKET_START (${socket.id})`);

        // Assign connected socket to right socket room.
        socket.join(socket.request.session.username);
        console.log(`${new Date().toString()} -> SOCKET_ASSIGN ${socket.id} in ${socket.request.session.username}`)
    
        // Send a message to all sockets from a user if one connects.
        io.to(socket.request.session.username).emit("conf_room_entered", {
            status: "OK",
            message: `Socket ${socket.id} has been assigned to room ${socket.request.session.username}.`
        });

        // In first time entering, send the data.
        send_reload_data(socket, io);

        // Change given setting in the database
        socket.on("change_setting", async (object) => {
            if (object.setting_name != undefined && object.setting_value != undefined) {
                
                // Search for the username in the database.
                await userScheme.findOne({
                    userName: socket.request.session.username
                })
                .then(async (doc) => {
                    if (doc._id != undefined) {
                        
                        // Change setting_name to setting_value in the database.
                        doc.currentSetting[object.setting_name] = object.setting_value;
                        await doc.save();
                        console.log(`${new Date().toString()} -> ${socket.request.session.username}: ${object.setting_name}=${object.setting_value}`);

                        // After saving, send new data to client.
                        send_reload_data(socket, io);
                        send_data_to_mcu(socket, io);
                    }
                })
                .catch(error => {
                    console.error(`${new Date().toString()} -> ERROR: ${error}`);
                })
            }
        })

        socket.on("start_stop", async (object) => {
            if (object.status != undefined) {
                // Search for the username in the database.
                await userScheme.findOne({
                    userName: socket.request.session.username
                })
                .then(async (doc) => {
                    if (doc._id != undefined) {
                        
                        // Change setting_name to setting_value in the database.
                        doc.currentSetting["status"] = object.status;
                        await doc.save();
                        
                        // After saving, send new data to client.
                        send_reload_data(socket, io);
                        send_data_to_mcu(socket, io);
                    }
                })
                .catch(error => {
                    console.error(`${new Date().toString()} -> ERROR: ${error}`);
                })
            }
        })

        socket.on("save_current_setting", async (object) => {
            if (object.length != 0) {
                // Search for the username in the database.
                await userScheme.findOne({
                    userName: socket.request.session.username
                })
                .then(async (doc) => {
                    if (doc._id != undefined) {
                        var fromDatabase = doc.currentSetting;

                        // If the one client send us is the same with the entry in database,
                        // save it to the savedSettings object in that user's entry.
                        if (JSON.stringify(object) == JSON.stringify(fromDatabase)) {
                            object.saveNumber = doc.savedSettingsCount;
                            doc.savedSettingsCount += 1;
                            doc.savedSettings.push(object);
                            await doc.save();

                            console.log(`${new Date().toString()} -> ${socket.request.session.username}: current settings saved.`);

                            io.to(socket.request.session.username).emit("conf_save_current_setting", {
                                status: "OK",
                                message: `Current settings saved to the library as #${object.saveNumber}.`
                            })
                        }
                    }
                })
                .catch(error => {
                    console.error(`${new Date().toString()} -> ERROR: ${error}`);
                })
            }
        })

        socket.on("setting_use", async (settingNo) => {
            // Search for the username in the database.
            await userScheme.findOne({
                userName: socket.request.session.username
            })
            .then(async (doc) => {
                if (doc._id != undefined) {
                    
                    // Change current settings to the saved setting.
                    doc.currentSetting = doc.savedSettings.find((obj) => {
                        return obj.saveNumber == settingNo;
                    });
                    await doc.save();
                    
                    // Log the change action to server.
                    console.log(`${new Date().toString()} -> ${socket.request.session.username}: current settings changed to ${settingNo}.`)

                    // Send a confirmation signal to user.
                    io.to(socket.request.session.username).emit("conf_setting_use", {
                        status: "OK",
                        message: "Current settings has been updated.",
                        redirect: [true, "/dashboard", 1500]
                    });
                }
            })
            .catch(error => {
                console.error(`${new Date().toString()} -> ERROR: ${error}`);
            })
        })

        socket.on("setting_delete", async (settingNo) => {
            // Search for the username in the database.
            await userScheme.findOne({
                userName: socket.request.session.username
            })
            .then(async (doc) => {
                if (doc._id != undefined) {
                
                    // Filter the array with its saveNumber not equal to settingNo we want to delete.
                    var filteredArray = doc.savedSettings.filter((val, index, arr) => {
                        return val.saveNumber != settingNo;
                    });

                    // Save new filtered array as savedSettings to the database.
                    doc.savedSettings = filteredArray;
                    await doc.save()
                    
                    console.log(`${new Date().toString()} -> ${socket.request.session.username}: setting ${settingNo} is deleted.`)

                    // Send a confirmation signal to user.
                    io.to(socket.request.session.username).emit("conf_setting_delete", {
                        status: "OK",
                        message: "Chosen setting has been deleted."
                    });
                }
            })
            .catch(error => {
                console.error(`${new Date().toString()} -> ERROR: ${error}`);
            })
        })

    // MCU Side Socket Handling
    // ------------------------
    } else if (socket.request.headers["conntype"].includes("MCU")) {
        console.log(`${new Date().toString()} -> MCU_SOCKET_START (${socket.id})`);

        socket.join(socket.request.headers["mcuid"]);
        console.log(`${new Date().toString()} -> MCU_SOCKET_ASSIGN ${socket.id} in ${socket.request.headers["mcuid"]}`);
    
        socket.on("sensor_data", async (object) => {
            if (object.mcuID != undefined) {
                await userScheme.findOne({
                    mcuID: object.mcuID
                })
                .then(async (doc) => {
                    if (doc._id != undefined || doc._id != null) {
                        console.log(`${new Date().toString()} -> MCU_SOCKET_REQ (${object.mcuID})(${doc.userName})`);

                        // Write new data if exist.
                        if (object.mixerTemperature1 != undefined) doc.activeData.mixerTemperature1 = object.mixerTemperature1;
                        if (object.mixerTemperature2 != undefined) doc.activeData.mixerTemperature2 = object.mixerTemperature2;
                        if (object.extruderTemperature1 != undefined) doc.activeData.extruderTemperature1 = object.extruderTemperature1;
                        if (object.extruderTemperature2 != undefined) doc.activeData.extruderTemperature2 = object.extruderTemperature2;
                        
                        if (object.radiusMeterActive1 != undefined) doc.activeData.radiusMeterActive1 = object.radiusMeterActive1;
                        if (object.radiusMeterActive2 != undefined) doc.activeData.radiusMeterActive2 = object.radiusMeterActive2;
                        
                        if (object.pullerMotor1Speed != undefined) doc.activeData.pullerMotor1Speed = object.pullerMotor1Speed;
                        if (object.collectorMotor1Speed != undefined) doc.activeData.collectorMotor1Speed = object.collectorMotor1Speed;
                        if (object.scalarMotor1Speed != undefined) doc.activeData.scalarMotor1Speed = object.scalarMotor1Speed;
                        if (object.scalarMotor2Speed != undefined) doc.activeData.scalarMotor2Speed = object.scalarMotor2Speed; 
                        if (object.mixerMotor1Speed != undefined) doc.activeData.mixerMotor1Speed = object.mixerMotor1Speed;
                        if (object.extruderMotorSpeed != undefined) doc.activeData.extruderMotorSpeed = object.extruderMotorSpeed;
                        
                        if (object.pullerCycleCount != undefined) doc.activeData.pullerCycleCount = object.pullerCycleCount;
                        if (object.collectorCycleCount != undefined) doc.activeData.collectorCycleCount = object.collectorCycleCount;

                        if (object.extruderHeater1 != undefined)    doc.activeData.extruderHeater1 = object.extruderHeater1
                        if (object.extruderHeater2 != undefined)    doc.activeData.extruderHeater2 = object.extruderHeater2
                        if (object.mixerHeater != undefined)        doc.activeData.mixerHeater = object.mixerHeater

                        // Save the database.
                        await doc.save()
                        console.log(`${new Date().toString()} -> MCU_SOCKET_SAVE (${object.mcuID})(${doc.userName})`)

                        // Send the new data to control panel.
                        io.to(doc.userName).emit("reload_data", {
                            activeData: doc.activeData
                        });
                        console.log(`${new Date().toString()} -> MCU_SOCKET_UPDATE (${object.mcuID})(${doc.userName})`)


                        socket.emit("settings_update", {
                            "status": 0,
                            "scalarMotor1Speed": 125.125,
                            "scalarMotor2Speed": 250.25,
                            "mixerMotor1Speed": 50.50,
                            "extruderMotorSpeed": 10,
                            "pullerMotor1Speed": 30.15,
                            "collectorMotor1Speed": 40,
                            "scalingMotorsDuration": 15000,
                            "mixerMotorsDuration": 25000,
                            "extruderMotorsDuration": 35000,
                            "mixerTemperature": 27,
                            "extruderTemperature": 150,
                            "filamentDiameter": 2.20,
                            "filamentLength": 500
                        })
                        
                    } else {
                        // Print an error message if mcuID isn't regoconized in database.
                        console.error(`${new Date().toString()} -> MCU_SOCKET_FAIL mcuID (${object.mcuID}) is not found.`)
                    }
                })
                .catch(error => {
                    // Print an error message if mcuID isn't regoconized in database.
                    console.error(`${new Date().toString()} -> MCU_SOCKET_FAIL mcuID (${object.mcuID}) is not found.`)
                    console.error(`${new Date().toString()} -> ERROR: ${error}`)
                })
            } else {
                // Print an error message if mcuID is not given for instructions.
                console.error(`${new Date().toString()} -> MCU_SOCKET_FAIL mcuID is not given.`)
            }
        })
        
        // Emergency State, it is needed whenever clients ones to reach us from console.
        socket.on("emergency", msg => console.error(`${new Date().toString()} -> SOCKET_EMERGENCY ${msg} from ${socket.id}`))

        // Disconnection of Sockets
        socket.on("disconnect", () => {
        console.log(`${new Date().toString()} -> SOCKET_END (${socket.id})`)
        socket.disconnect()
        })


    } else {
        socket.emit("error_disconnect", "error: There is a problem with your login. Please log out and try again.");
        console.log(`${new Date().toString()} -> SOCKET_END (${socket.id})`)
        socket.disconnect();
    }
    
    // Emergency State, it is needed whenever clients ones to reach us from console.
    socket.on("emergency", msg => console.error(`${new Date().toString()} -> SOCKET_EMERGENCY ${msg} from ${socket.id} in ${socket.request.session.username}`))

    // Disconnection of Sockets
    socket.on("disconnect", () => {
       console.log(`${new Date().toString()} -> SOCKET_END (${socket.id})`)
       socket.disconnect()
    })
}

module.exports = socketHandler