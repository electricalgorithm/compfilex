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
    } else if (socket.request.headers.conntype.includes("MCU")) {
        console.log(`${new Date().toString()} -> MCU_SOCKET_START (${socket.id})`)
    
        socket.on("send_data", async (object) => {
            if (object.mcuID != undefined) {
                await userScheme.findOne({
                    mcuID: object.mcuID
                })
                .then(async (doc) => {
                    if (doc._id != undefined || doc._id != null) {
                        console.log(`${new Date().toString()} -> MCU_SOCKET_REQ (${object.mcuID})(${doc.userName})`);

                        // Write new data if exist.
                        doc.activeData.mixerTemperature1    = object.mixerTemperature1      || doc.activeData.mixerTemperature1
                        doc.activeData.mixerTemperature2    = object.mixerTemperature2      || doc.activeData.mixerTemperature2
                        doc.activeData.extruderTemperature1 = object.extruderTemperature1   || doc.activeData.extruderTemperature1
                        doc.activeData.extruderTemperature2 = object.extruderTemperature2   || doc.activeData.extruderTemperature2
                        doc.activeData.radiusMeterActive1   = object.radiusMeterActive1     || doc.activeData.radiusMeterActive1
                        doc.activeData.radiusMeterActive2   = object.radiusMeterActive2     || doc.activeData.radiusMeterActive2
                        doc.activeData.pullerMotor1Speed    = object.pullerMotor1Speed      || doc.activeData.pullerMotor1Speed
                        doc.activeData.pullerCycleCount     = object.pullerCycleCount       || doc.activeData.pullerCycleCount
                        doc.activeData.collectorCycleCount  = object.collectorCycleCount    || doc.activeData.collectorCycleCount
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