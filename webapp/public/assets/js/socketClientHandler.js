const socket = io("localhost:3525");

// Functions
var reloadSettings = object => {
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
}

var reloadActiveData = object => {
    document.querySelector("#mixerTemperature1Text").innerHTML = object.activeData.mixerTemperature1;
    document.querySelector("#mixerTemperature2Text").innerHTML = object.activeData.mixerTemperature2;
    document.querySelector("#extruderTemperature1Text").innerHTML = object.activeData.extruderTemperature1;
    document.querySelector("#extruderTemperature2Text").innerHTML = object.activeData.extruderTemperature2;
    document.querySelector("#totalTurnText").innerHTML = object.activeData.pullerCycleCount;
    document.querySelector("#estimetedTotalLengthText").innerHTML = object.activeData.collectorCylceCount 
                                                                    * 2 * 3.141527 * object.currentSetting.collectorDiameter;
    document.querySelector("#pullerMotor1SpeedText").innerHTML = object.activeData.pullerMotor1Speed;
    document.querySelector("#pullerMotor1SpeedText").innerHTML = object.activeData.pullerMotor1Speed;
    document.querySelector("#radiusMeterActive1Text").innerHTML = object.activeData.radiusMeterActive1;
    document.querySelector("#radiusMeterActive2Text").innerHTML = object.activeData.radiusMeterActive2;

    // These are not implemented on the front-end. Need to create IDs.
    document.querySelector("#mixerHeaterText").innerHTML = object.activeData.mixerHeater ? "On": "Off";
    document.querySelector("#extruderHeater1Text").innerHTML = object.activeData.extruderHeater1 ? "On": "Off"
    document.querySelector("#extruderHeater2Text").innerHTML = object.activeData.extruderHeater2 ? "On": "Off"
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


/* Socket Receiving 
- on method: to receieve
- emit method: to send
*/
socket.on("room_entered", message => {
    console.log(message);
});

// Reload data in the front-end.
socket.on("reload_data", object => {
    if (object.currentSetting != undefined) reloadSettings(object);
    if (object.activeData != undefined) relaoadActiveData(object);

    console.log(object);
});

// Error handling.
socket.on("error_disconnect", error_message => {
    console.error(`Socket disconnected: ${error_message}`);
    window.alert(`${error_message}`);
});