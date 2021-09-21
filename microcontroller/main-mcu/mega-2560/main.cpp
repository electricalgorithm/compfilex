/*
 * == COMPFILEX MCU on Arduino ==
 * software: MAINMCU firmware
 * ver: 0.0.6 (weirdo_comm)
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
#include "machine_structs.hpp"
#include "machine_functions.hpp"

#define SERIAL_WIFIMCU	Serial1
#define SERIAL_PC	Serial
#define JSONOBJ_MEM	512

// Variables are decleared and initilized in "machine_functions.cpp".
extern MachineSettings_t* MachineSettings;
extern ActiveMachineData_t* ActiveMachineData;
NetworkDetails_t NetworkInfo {
	"MCU_ID_HERE",
	"WIFI_SSID_HERE",
	"WIFI_PASS_HERE",
	"SERVER_ADDR_HERE",
	3525
};

// String to hold Serial1 command. (WIFI<->MAIN)
String s1_input_command = "";
// String to hold Serial command. (MAIN<->PC)
String debug_command = "";

// Temporary time variable for loop()'s delay.
unsigned long old_time = 0;

// Communication
const uint8_t MESSAGE_START = '<';
const uint8_t MESSAGE_END = '>';
char recieved_char = '\0';

// Function Declerations
bool networkMsgHandler();
void sendNetworkDetails();
void sendAllSensorData();
void sendCurrentSettings();

void setup() {
	// For PC-MEGA communcation.
	SERIAL_PC.begin(9600);
	SERIAL_PC.println("[CMPLFX] Mega 2560 has been started.");
	// For UNO-MEGA communcation.
	SERIAL_WIFIMCU.begin(115200);
	SERIAL_WIFIMCU.setTimeout(1000);
	pinMode(LED_BUILTIN, OUTPUT);

	/* TODO: NOT IMPLEMENTED YET; SOMETHING IS WRONG
	for (char index = 0; index < 10; index++) {
		sendNetworkDetails();
	}
	*/
}

void loop() {
	if (millis() - old_time > 2500) {
		
		// sendNetworkDetails();
		networkMsgHandler();
		sendAllSensorData();
		
		old_time = millis();
	}
}

void serialEvent1() {
	if (SERIAL_WIFIMCU.available()) {
		recieved_char = SERIAL_WIFIMCU.read();
		
		switch (recieved_char) {
			case '!':
				s1_input_command = SERIAL_WIFIMCU.readStringUntil('\n');
				SERIAL_PC.print("[CMPLFX] Message received:  ");
				SERIAL_PC.println(s1_input_command);	
				break;
			
			default:
				break;
		}
	}
}

void serialEvent() {
	// A debug command general type: $send_sensor#
	if (SERIAL_PC.available() && SERIAL_PC.read() == '$') {
		String debug_command = SERIAL_PC.readStringUntil('#');

		if (debug_command == "send_sensor") {
			sendAllSensorData();
		}
		
		else {
			return;
		}
	}
}

/*
 * networkMsgHandler()
 *  
 * Description: This function let us the JSONize receiving messages from WIFI MCU (such as ESP-01),
 * update the information on the variable that in heap, and call the neccecary functions.
 * 
 * 	- @returns false:				an error occured
 *  - @returns true:				OK, nothings wrong
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

void sendNetworkDetails() {
	const char message_code = 1;

	SERIAL_WIFIMCU.write((const uint8_t*) &MESSAGE_START, sizeof(MESSAGE_START));
	SERIAL_WIFIMCU.write((const uint8_t*) &message_code, sizeof(uint8_t));
	SERIAL_WIFIMCU.write((uint8_t*) &NetworkInfo, sizeof(NetworkInfo));
	SERIAL_WIFIMCU.write((const uint8_t*) &MESSAGE_END, sizeof(MESSAGE_END));
}

void sendAllSensorData() {
	const uint8_t message_code = 2;

	SensorData new_data {
		.dataType = 1,
		.status = get_machine_status(),
		.mixerTemperature1 = get_temperature(0, 1),
		.mixerTemperature2 = get_temperature(0, 2),
		.extruderTemperature1 = get_temperature(1, 1),
		.extruderTemperature2 = get_temperature(1, 2),
		.radiusMeterActive1 = get_current_radius(1),
		.radiusMeterActive2 = get_current_radius(2),
		.scalarMotor1Speed = get_motor_speed(0, 1),
		.scalarMotor2Speed = get_motor_speed(0, 2),
		.mixerMotor1Speed = get_motor_speed(1, 1),
		.extruderMotorSpeed = get_motor_speed(2, 1),
		.pullerMotor1Speed = get_motor_speed(3, 1),
		.collectorMotor1Speed = get_motor_speed(4, 1),
		.pullerCycleCount = get_cycle_count(0),
		.collectorCycleCount = get_cycle_count(1),
		.heaters = get_heater_status(),
		.remainingMixerDuration = get_remaining_duration(0),
		.remainingScalarDuration = get_remaining_duration(1),
		.remainingExtruderDuration = get_remaining_duration(2)
	};

	SERIAL_WIFIMCU.write((const uint8_t*) &MESSAGE_START, sizeof(MESSAGE_START));
	SERIAL_WIFIMCU.write((const uint8_t*) &message_code, sizeof(message_code));
	SERIAL_WIFIMCU.write((uint8_t*) &new_data, sizeof(new_data));
	SERIAL_WIFIMCU.write((const uint8_t*) &MESSAGE_END, sizeof(MESSAGE_END));

	SERIAL_PC.println("[CMPFLX] Sensor data has been sent.");
}
