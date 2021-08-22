const userScheme = require("./models/user.model");
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
        active: activeDataFromUser
    });
}

var socketHandler = async (socket, io) => {
    console.log(`${new Date().toString()} -> SOCKET_START (${socket.id})`)
    
    if (socket.request.session.isAuth) {
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