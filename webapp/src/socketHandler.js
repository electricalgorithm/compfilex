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
        io.to(socket.request.session.username).emit("room_entered", {
            socket_ID: socket.id,
            socket_ROOM: socket.request.session.username,
            status: "OK"
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
                        console.log(`${new Date().toString()} -> For ${socket.request.session.username}, ${object.setting_name}=${object.setting_value}`);

                        // After saving, send new data to client.
                        send_reload_data(socket, io);
                    }
                })
                .catch(error => {
                    console.error(`${new Date().toString()} -> ERROR: ${error}`);
                })
            }
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