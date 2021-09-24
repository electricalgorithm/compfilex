/*
 * == COMPFILEX MCU on Arduino ==
 * software: MAINMCU firmware
 * ver: 0.0.91 (two-way-struct-%%)
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
#define SERIAL_PC		Serial
#define JSONOBJ_MEM		512

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
char dbg_r_c = '\0';
uint8_t dbg_r_8 = 0;

uint8_t* incomingMessage = NULL;
uint8_t incomingMessageType = 0;
bool is_msg_processed = false;

// Function Declerations
void networkMsgHandler();
void sendNetworkDetails();
void sendAllSensorData();
void sendCurrentSettings();
void serialEventPC();

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
	if (millis() - old_time > 500) {
		
		// sendNetworkDetails();
		networkMsgHandler();
		// sendAllSensorData();
		
		old_time = millis();
	}

	// serialEventPC();
}

void serialEvent1() {
	if (is_msg_processed) {
		delete incomingMessage;
		incomingMessage = NULL;
		incomingMessageType = 0;
		is_msg_processed = false;
	}

	if (SERIAL_WIFIMCU.available() > 0) {
		// I don't know why delay is neccecary, but without it,
		// function doesn't catch all the UART messages.
		delay(10);
		
		if (SERIAL_WIFIMCU.read() == '<') {
			switch (SERIAL_WIFIMCU.read()) {
				
				case 3: {
					incomingMessageType = 3;
					incomingMessage = new uint8_t[sizeof(MachineSettings_t)];
					memset(incomingMessage, 0, sizeof(MachineSettings_t));

					for (uint16_t index = 0; index < sizeof(MachineSettings_t); index++) {
						uint8_t receving_char = SERIAL_WIFIMCU.read();
						if (receving_char == '>') break;
						incomingMessage[index] = receving_char;
					}

					break;
				}

				default:
					break;

			}
		}
	}
}

void serialEventPC() {
	// A debug command general type: $send_sensor#

	dbg_r_8 = SERIAL_PC.available();

	SERIAL_PC.print("[CMPFLX-DEBUG] available() return value: ");
	SERIAL_PC.println(dbg_r_8);

	if (dbg_r_8 < 1) return;
	
	SERIAL_PC.println("[CMPFLX-DEBUG] available() passed.");
	
	dbg_r_c = SERIAL_PC.read();

	SERIAL_PC.print("[CMPFLX-DEBUG] read() return value: ");
	SERIAL_PC.println(dbg_r_c);

	if (dbg_r_c == '$') {
		SERIAL_PC.println("[CMPFLX-DEBUG] $ character was read.");
		
		debug_command = SERIAL_PC.readStringUntil('#');

		SERIAL_PC.print("[CMPFLX-DEBUG] The command has been read: ");
		SERIAL_PC.println(debug_command);

		if (debug_command == "send_sensor") {
			sendAllSensorData();
			SERIAL_PC.println("[CMPFLX-DEBUG] send_sensor is triggered.");
		}
		
		else {

			SERIAL_PC.println("[CMPFLX-DEBUG] else is triggered.");
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
void networkMsgHandler() {
	// If any message is not receieved, return false.
	if (is_msg_processed) return;

	if (incomingMessageType == 3 && incomingMessage != NULL) {
		MachineSettings_t settings;
		memcpy(&settings, incomingMessage, sizeof(settings));
		is_msg_processed = true;

		MachineSettings->status = settings.status;
		MachineSettings->scalarMotor1Speed = settings.scalarMotor1Speed;
		MachineSettings->scalarMotor2Speed = settings.scalarMotor2Speed;
		MachineSettings->mixerMotor1Speed = settings.mixerMotor1Speed;
		MachineSettings->extruderMotorSpeed = settings.extruderMotorSpeed;
		MachineSettings->pullerMotor1Speed = settings.pullerMotor1Speed;
		MachineSettings->collectorMotor1Speed = settings.collectorMotor1Speed;
		MachineSettings->scalingMotorsDuration = settings.scalingMotorsDuration;
		MachineSettings->mixerMotorsDuration = settings.mixerMotorsDuration;
		MachineSettings->extruderMotorsDuration = settings.extruderMotorsDuration;
		MachineSettings->mixerTemperature = settings.mixerTemperature;
		MachineSettings->extruderTemperature = settings.extruderTemperature;
		MachineSettings->filamentDiameter = settings.filamentDiameter;
		MachineSettings->filamentLength = settings.filamentLength;

		update_machine();
	}
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
