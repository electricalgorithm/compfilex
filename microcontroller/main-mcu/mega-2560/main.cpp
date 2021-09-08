/*
 * == COMPFILEX MCU on Arduino ==
 * software: MAINMCU firmware
 * ver: 0.0.4 (IntraNET, happening!)
 * repo: https://github.com/electricalgorithm/compfilex
 * contributors: Gökhan Koçmarlı (@electricalgorithm)
 * 
 * Funded by TUBITAK 2209-A,
 * Contact: gokhankocmarli@marun.edu.tr
 * 
 * Sustainable Energy Research Laboratuary (TermoLAB)
 * in Istanbul University-Cerrahpasa
 * 
 * Check the LICENSE file before doing anything.
 * ==============================
*/

#include <Arduino.h>
#include <ArduinoJson.h>
#include "machine_structs.h"
#include "machine_functions.h"

#define SERIAL_WIFIMCU	Serial1
#define SERIAL_PC		Serial
#define JSONOBJ_MEM		512

// Variables are decleared and initilized in "machine_functions.cpp".
extern MachineSettings_t* MachineSettings;
extern ActiveMachineData_t* ActiveMachineData; 

// String to hold Serial1 command. (WIFI-MAIN)
String s1_input_command = "";

// Temporary time variable for loop()'s delay.
unsigned long old_time = 0;

// Function Declerations
bool networkMsgHandler();

void setup() {
	// For PC-MEGA communcation.
	SERIAL_PC.begin(9600);
	SERIAL_PC.println("[CMPLFX] Mega 2560 has been started.");
	// For UNO-MEGA communcation.
	SERIAL_WIFIMCU.begin(115200);
	SERIAL_WIFIMCU.setTimeout(1000);
}

void loop() {
	if (millis() - old_time > 100) {

		networkMsgHandler();
		
		old_time = millis();
	}
}

void serialEvent1() {
	if (SERIAL_WIFIMCU.available()) {
		if (SERIAL_WIFIMCU.read() == '!') {
			s1_input_command = SERIAL_WIFIMCU.readStringUntil('\n');
			SERIAL_PC.println("[CMPLFX] Message received from SERIAL_WIFIMCU.");
		}
	}
}

/*
 * networkMsgHandler()
 *  
 * Description: This function let us the JSONize receiving messages from WIFI MCU (such as ESP-01),
 * update the information on the variable that in heap, and call the neccecary functions.
 * 
 * 	- return false:				an error occured
 *  - return true:				OK, nothings wrong
 */
bool networkMsgHandler() {
	// If any message is not receieved, return false.
	if (s1_input_command.length() <= 0) return false;

	StaticJsonDocument<JSONOBJ_MEM> document;

	// Deserializing the JSON string to object, if error occurs exit the function.
	DeserializationError error = deserializeJson(document, s1_input_command);
	if (error) {
		SERIAL_PC.print("[CMPLFX] Deserialization of JSON is failed: ");
		SERIAL_PC.println(error.c_str());
		
		s1_input_command = "";
		return false;
	}

	// Clear and open the communcation.
	s1_input_command = "";
	
	// Before doing anything, close machine if wanted.
	if (document["status"] == 0) {
		stop_machine();
	}
	
	if (document["dataType"] == "settings_update") {
		MachineSettings->scalarMotor1Speed = document["scalarMotor1Speed"];
		MachineSettings->scalarMotor2Speed = document["scalarMotor2Speed"];
		MachineSettings->mixerMotor1Speed = document["mixerMotor1Speed"];
		MachineSettings->extruderMotorSpeed = document["extruderMotorSpeed"];
		MachineSettings->pullerMotor1Speed = document["pullerMotor1Speed"];
		MachineSettings->collectorMotor1Speed = document["collectorMotor1Speed"];
		MachineSettings->scalingMotorsDuration = document["scalingMotorsDuration"];
		MachineSettings->mixerMotorsDuration = document["mixerMotorsDuration"];
		MachineSettings->extruderMotorsDuration = document["extruderMotorsDuration"];
		MachineSettings->mixerTemperature = document["mixerTemperature"];
		MachineSettings->extruderTemperature = document["extruderTemperature"];
		MachineSettings->filamentDiameter = document["filamentDiameter"];
		MachineSettings->filamentLength = document["filamentLength"];

		update_machine();
	}
	
	else {
		String dataType = document["dataType"];
		String data = document["data"];
		SERIAL_PC.print("[CMPLFX] dataType: ");
		SERIAL_PC.println(dataType);
		SERIAL_PC.print("[CMPLFX] data: ");
		SERIAL_PC.println(data);
	}

	return true;
}