var hardwareData = {
    "scalarMotor1Speed": 0, // First motor's speed of Scaler System -- as m/s
    "scalarMotor2Speed": 0, // Second motor's speed of Scaler System -- as m/s
    "scalarRunDuration": 0, // Scaler System working time -- as seconds

    "mixerMotor1Speed": 0, // Mixer System's motor speed -- as m/s
    "mixerHeater": false, // Mixer System's heater resistance -- as boolean
    "mixerTemperature1": 0, // Mixer System's temperature -- as celcius
    "mixerRunDuration": 0, // Mixer System's working time -- as seconds

    "extruderMotorSpeed": 0, // Extruder System's motor speed
    "extruderRunDuration": 0, // Extruder System's working time -- as seconds
    "extruderTemperature1": 0, // Extruder System's first temperature -- as celcius
    "extruderTemperature2": 0, // Extruder System's second temperature -- as celcius
    "extruderHeater1": false, // Extruder System's first heater resistance -- as boolean
    "extruderHeater2": false, // Extruder System's second heater resistance -- as boolean

    "radiusMeterActive1": 0, // Radius Calculation System's first obsorvation -- as millimeters
    "radiusMeterActive2": 0, // Radius Calculation System's second obsorvation -- as millimeters
    "radiusMeterWanted": 0, // Radius of the filament wanted -- as mm
    "pullerMotorSpeed": 0, // Puller System's motor speed -- as m/s
    "pullerCycleCount": 0, // Puller System's cycle count -- as count

    "collectorMotorSpeed": 0 // Collector System's motor speed -- as m/s
}

module.exports = hardwareData