const socket = io("/", {
    extraHeaders: {
        connType: "web-client"
    }
});

// Functions
function reloadSettings(object) {
    document.querySelector("#scalingRatioText").innerHTML = object.currentSetting.scalingRatio;
    document.querySelector("#filamentDiameterText").innerHTML = object.currentSetting.filamentDiameter;
    document.querySelector("#filamentLengthText").innerHTML = object.currentSetting.filamentLength;
    document.querySelector("#scalingMotor1SpeedText").innerHTML = object.currentSetting.scalarMotor1Speed;
    document.querySelector("#scalingMotor2SpeedText").innerHTML = object.currentSetting.scalarMotor2Speed;
    document.querySelector("#scalingMotorDurationText").innerHTML = object.currentSetting.scalarRunDuration;
    document.querySelector("#mixerMotorSpeedText").innerHTML = object.currentSetting.mixerMotor1Speed;
    document.querySelector("#mixerMotorDurationText").innerHTML = object.currentSetting.mixerRunDuration;
    document.querySelector("#mixerTemperatureText").innerHTML = object.currentSetting.mixerTemperature;
    document.querySelector("#extruderMotorSpeedText").innerHTML = object.currentSetting.extruderMotorSpeed;
    document.querySelector("#extruderMotorDurationText").innerHTML = object.currentSetting.extruderRunDuration;
    document.querySelector("#extruderTemperatureText").innerHTML = object.currentSetting.extruderTemperature;
    document.querySelector("#collectorMotor1SpeedText").innerHTML = object.currentSetting.collectorMotor1Speed;
    document.querySelector("#pullerMotor1SpeedText").innerHTML = object.currentSetting.pullerMotor1Speed;
}

function reloadActiveData(object) {
    document.querySelector("#mixerTemperature1Text").innerHTML = object.activeData.mixerTemperature1;
    document.querySelector("#mixerTemperature2Text").innerHTML = object.activeData.mixerTemperature2;
    document.querySelector("#extruderTemperature1Text").innerHTML = object.activeData.extruderTemperature1;
    document.querySelector("#extruderTemperature2Text").innerHTML = object.activeData.extruderTemperature2;
    document.querySelector("#totalTurnText").innerHTML = object.activeData.pullerCycleCount;
    document.querySelector("#activePullerMotor1SpeedText").innerHTML = object.activeData.pullerMotor1Speed;
    document.querySelector("#activeCollectorMotor1SpeedText").innerHTML = object.activeData.collectorMotor1Speed;
    document.querySelector("#activeScalarMotor1SpeedText").innerHTML = object.activeData.scalarMotor1Speed;
    document.querySelector("#activeScalarMotor2SpeedText").innerHTML = object.activeData.scalarMotor2Speed;
    document.querySelector("#activeExtruderMotorSpeedText").innerHTML = object.activeData.extruderMotorSpeed;
    document.querySelector("#activeMixerMotorSpeedText").innerHTML = object.activeData.mixerMotor1Speed;
    //document.querySelector("#radiusMeterActive1Text").innerHTML = object.activeData.radiusMeterActive1;
    //document.querySelector("#radiusMeterActive2Text").innerHTML = object.activeData.radiusMeterActive2;

    // These are not implemented on the front-end. Need to create IDs.
    //document.querySelector("#mixerHeaterText").innerHTML = object.activeData.mixerHeater ? "On": "Off";
    //document.querySelector("#extruderHeater1Text").innerHTML = object.activeData.extruderHeater1 ? "On": "Off"
    //document.querySelector("#extruderHeater2Text").innerHTML = object.activeData.extruderHeater2 ? "On": "Off"

    if (object.hasOwnProperty("currentSetting") && object.currentSetting.hasOwnProperty("collectorDiameter"))
        document.querySelector("#estimetedTotalLengthText").innerHTML = Number(object.activeData.collectorCylceCount)
                                                                        * 2 * 3.141527 * Number(object.currentSetting.collectorDiameter);
    else document.querySelector("#estimetedTotalLengthText").innerHTML = Number(object.activeData.collectorCylceCount)
                                                                        * 2 * 3.141527 * Number(document.querySelector("#filamentDiameterText").innerHTML);
}

var changeSetting = () => {
    // Assign values to variables.
    var selectTag = document.querySelector("#changeSettingSelect");
    var setName = selectTag.options[selectTag.selectedIndex].value;
    var setVal = document.querySelector("#changeSettingValueInput").value;

    if (setName == undefined || setVal == "") return;

    // Send a change_setting request via sockets.
    socket.emit("change_setting", {
        setting_name: setName,
        setting_value: setVal
    });

    // Clear the input.
    document.querySelector("#changeSettingValueInput").value = "";
}

// saveSettings function add current settings into savedSettings section of the user's database entry.
var saveSetting = () => {
    socket.emit("save_current_setting", {
        scalingRatio: document.querySelector("#scalingRatioText").innerHTML,
        filamentDiameter: Number(document.querySelector("#filamentDiameterText").innerHTML),
        filamentLength: Number(document.querySelector("#filamentLengthText").innerHTML),
        scalarMotor1Speed: Number(document.querySelector("#scalingMotor1SpeedText").innerHTML),
        scalarMotor2Speed: Number(document.querySelector("#scalingMotor2SpeedText").innerHTML),
        scalarRunDuration: document.querySelector("#scalingMotorDurationText").innerHTML,
        mixerMotor1Speed: Number(document.querySelector("#mixerMotorSpeedText").innerHTML),
        mixerTemperature: Number(document.querySelector("#mixerTemperatureText").innerHTML),
        mixerRunDuration: document.querySelector("#mixerMotorDurationText").innerHTML,
        extruderMotorSpeed: Number(document.querySelector("#extruderMotorSpeedText").innerHTML),
        extruderRunDuration: document.querySelector("#extruderMotorDurationText").innerHTML,
        extruderTemperature: Number(document.querySelector("#extruderTemperatureText").innerHTML),
        collectorMotor1Speed: Number(document.querySelector("#collectorMotor1SpeedText").innerHTML)
    })
}

// Receieve room entering confirmation.
socket.on("conf_room_entered", object => {
    if (object.status == "OK") console.log(object.message);
});

// Reload data in the front-end.
socket.on("reload_data", object => {
    if (object.currentSetting != undefined) reloadSettings(object);
    if (object.activeData != undefined) reloadActiveData(object);
});

// Current settings' save confirmation handling.
socket.on("conf_save_current_setting", object => {
    if (object.status != "OK") return;
    
    // Showing a snackbar message.
    var snackBar = document.querySelector("#snackbar");
    snackBar.innerHTML = object.message;
    snackBar.className = "show";
    setTimeout(() => {
        snackBar.className = snackBar.className.replace("show", "");
    }, 1500)
}) 

// Error handling.
socket.on("error_disconnect", error_message => {
    console.error(`Socket disconnected: ${error_message}`);
    window.alert(`${error_message}`);
});