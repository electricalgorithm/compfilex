/*
 * == COMPFILEX MCU on Arduino ==
 * software: WIFIMCU firmware
 * ver: 0.0.9 (weirdo_comm!)
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

/*  Includes  */
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WebSocketsClient.h>
#include <SocketIOclient.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>


/*  Global Variables and Configs  */
typedef struct network_data_struct {
	char mcuID[16]; // 15 + \0
	char ssid[100];
	char pass[100];
	char serverAddress[100];
	uint16_t serverPort;
} NetworkDetails_t;

unsigned long int timeOld = 0;
uint8_t* incomingMessage = NULL;
uint8_t incomingMessageType = 0;
bool is_msg_processed = false;
bool is_disconnected = false;


void socketIOEventHandler(socketIOmessageType_t type, uint8_t* payload, size_t length);
void serve(socketIOmessageType_t type, uint8_t* payload, size_t length);
void checkRecevingSensorDataAndSend();
bool createNetworkDetails();
void connectWIFI();
void connectSocketIO();
void SoftwareSerialEvent();

SoftwareSerial SUART(4, 5);
SocketIOclient socketIO;
NetworkDetails_t Connection {
	"MCU_ID_HERE",
	"WIFI_SSID_HERE",
	"WIFI_PASS_HERE",
	"SERVER_ADDR_HERE",
	3525
};

// There is only one HardwareSerial in ESP-12
#define SERIAL_PC Serial
#define SERIAL_MAINMCU SUART
#define WAIT_MS 5000

void setup() {
	// Set 0's to the Connection struct.
	// memset(&Connection, 0, sizeof(Connection));

	// Send opening message to PC.
	SERIAL_PC.begin(115200);
	SERIAL_PC.println("[CMPFLX-WIFI] Serial communication between PC and WIFIMCU has started.");

	// Start serial communication with MAINMCU.
	SERIAL_MAINMCU.begin(115200);
	SERIAL_PC.println("[CMPFLX-WIFI] Serial communication between WIFIMCU and MAINMCU has started.");

	/* TODO: Function does not work what I expected. Will correct it in future. */
	// Wait and check if network details updated from MAINMCU.
	// createNetworkDetails();

	// Connection to the WiFi Network:
	connectWIFI();

	// Connection to the Socket.io Server.
	connectSocketIO();
}

void loop() {
	socketIO.loop();

	if (millis() > timeOld + WAIT_MS) {
		timeOld = millis();


		checkRecevingSensorDataAndSend();
	}

  SoftwareSerialEvent();
}

/*
 * SOCKET.IO NETWORKING FUNCTIONS BETWEEN WEBSERVER AND ESP01
 *
 * socketIOEventHandler() -> Handles the receiving messages from sockets.
 * send_server() -> Sends the sensor and machine active data to web server.
 * serve() -> Process receiving data and send it to the MAIN MCU.
 * 
 */
void socketIOEventHandler(socketIOmessageType_t type, uint8_t* payload, size_t length) {
	switch (type) {
		case sIOtype_DISCONNECT:
			if (is_disconnected) {
				break;
			} else {
				SERIAL_PC.printf("[CMPFLX-WIFI][IOc] Disconnected!\n");
				is_disconnected = true;
			}
			break;

		case sIOtype_CONNECT:
			SERIAL_PC.printf("[CMPFLX-WIFI][IOc] Connected to url: %s\n", payload);
			is_disconnected = false;
			socketIO.send(sIOtype_CONNECT, "/");
			break;

		case sIOtype_EVENT:
			// Call the servant.
			SERIAL_PC.println((char*) payload);
			serve(type, payload, length);
			break;
			
		case sIOtype_ACK:
			SERIAL_PC.printf("[CMPFLX-WIFI][IOc] get ack: %u\n", length);
			hexdump(payload, length);
			break;

		case sIOtype_ERROR:
			SERIAL_PC.printf("[CMPFLX-WIFI][IOc] get error: %u\n", length);
			hexdump(payload, length);
			break;

		case sIOtype_BINARY_EVENT:
			SERIAL_PC.printf("[CMPFLX-WIFI][IOc] get binary: %u\n", length);
			hexdump(payload, length);
			break;

		case sIOtype_BINARY_ACK:
			SERIAL_PC.printf("[CMPFLX-WIFI][IOc] get binary ack: %u\n", length);
			hexdump(payload, length);
			break;
	}
}


void serve(socketIOmessageType_t type, uint8_t* payload, size_t length) {
	// Create a StaticJSONDocument.
	StaticJsonDocument<768> document;

	// The payload is a char-array, which contains JSON. Turn it to StaticJSONDocument.
	DeserializationError error = deserializeJson(document, (char*) payload);
	if (error) {
		SERIAL_PC.print(F("[CMPFLX-WIFI] deserializeJson() failed: "));
		SERIAL_PC.println(error.f_str());
		return;
	}

	// Save the event_name coming from payload's first element.
	String event_name = document[0];

	/*
	* This is the receiving section. Think it as ".on()" method in socket.io API.
	* "settings_update" will be used for change settings in Arduino.
	* "panic-halt-down" will be used for sudden shuting down the machine.
	*/
	if (event_name == "settings_update") {
		JsonObject JSONobj = document[1];
		JSONobj["dataType"] = event_name;

		String msg_to_send;
		serializeJson(JSONobj, msg_to_send);
		msg_to_send = "!" + msg_to_send;
		
		SERIAL_MAINMCU.println(msg_to_send);
	} 

	else if (event_name == "panic-halt-down") {
		// NOT IMPLEMENTED!
		SERIAL_PC.println("[CMPFLX-WIFI] Shut-down!");
	}

	else {
		// Unrecognized events goes here.
		SERIAL_PC.println("[CMPFLX-WIFI] [IOc] Unrecognized event:");
		SERIAL_PC.print(event_name);
	}
}

/*
 * COMMUNICATION PROTOCOL IMPLEMENTATION BETWEEN MAIN MCU AND ESP01.
 */

typedef struct __attribute__((packed)) sensor_data_struct {
	uint8_t dataType;
	uint8_t status;
	float mixerTemperature1;
	float mixerTemperature2;
	float extruderTemperature1;
	float extruderTemperature2;
	double radiusMeterActive1;
	double radiusMeterActive2;
	uint16_t scalarMotor1Speed;
	uint16_t scalarMotor2Speed;
	uint16_t mixerMotor1Speed;
	uint16_t extruderMotorSpeed;
	uint16_t pullerMotor1Speed;
	uint16_t collectorMotor1Speed;
	uint16_t pullerCycleCount;
	uint16_t collectorCycleCount;
	uint8_t heaters;
	uint32_t remainingMixerDuration;
	uint32_t remainingScalarDuration;
	uint32_t remainingExtruderDuration;
} SensorData;


void SoftwareSerialEvent() {
	if (is_msg_processed) {
		delete incomingMessage;
		incomingMessage = NULL;
		incomingMessageType = 0;
		is_msg_processed = false;
	}

	if (SERIAL_MAINMCU.available() > 0 && SERIAL_MAINMCU.read() == '<') {
		switch(SERIAL_MAINMCU.read()) {

			// DATA: NETWORK DETAILS
			case 1: {
				SERIAL_PC.println("SoftwareSerialEvent() '1' captured.");
				incomingMessageType = 1;
				incomingMessage = new uint8_t[sizeof(NetworkDetails_t)];
				memset(incomingMessage, 0, sizeof(NetworkDetails_t));

				for (uint16_t index = 0; index < sizeof(NetworkDetails_t); index++) {
					uint8_t receving_char = SERIAL_MAINMCU.read();
					if (receving_char == '>') break;
					incomingMessage[index] = receving_char;
				}

				SERIAL_PC.printf("SoftwareSerialEvent() %s captured.\n", incomingMessage);
		
				break;
			}

			// DATA: SENSOR VALUES
			case 2: {
				SERIAL_PC.println("SoftwareSerialEvent() SensorData captured.");
				incomingMessageType = 2;
				incomingMessage = new uint8_t[sizeof(SensorData)];
				memset(incomingMessage, 0, sizeof(SensorData));

				for (uint16_t index = 0; index < sizeof(SensorData); index++) {
					uint8_t receving_char = SERIAL_MAINMCU.read();
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

void checkRecevingSensorDataAndSend() {
	SERIAL_PC.printf("incomingMessageType: %d, incomingMessage: %d\n", incomingMessageType, sizeof(incomingMessage));
	
	if (incomingMessageType == 2 && incomingMessage != NULL) {
		String messageToSend;
		SensorData new_data;
		memcpy(&new_data, incomingMessage, sizeof(new_data));
		is_msg_processed = 1;

    	SERIAL_PC.printf("$ mcuID: %s,\n|status: %c,\n|mixerTemperature1: %.02f,\n|mixerTemperature2: %.02f,\n|extruderTemperature1: %.02f,\n|extruderTemperature2: %.02f,\n|radiusMeterActive1: %0.2f,\n|radiusMeterActive2: %.02f,\n|pullerMotor1Speed: %d,\n|collectorMotor1Speed: %d,\n|scalarMotor1Speed: %d,\n|scalarMotor2Speed: %d,\n|mixerMotor1Speed: %d,\n|extruderMotorSpeed: %d,\n|pullerCycleCount: %d,\n|collectorCycleCount: %d,\n", 
						Connection.mcuID,
						new_data.status,
						new_data.mixerTemperature1,
						new_data.mixerTemperature2,
						new_data.extruderTemperature1,
						new_data.extruderTemperature2,
						new_data.radiusMeterActive1,
						new_data.radiusMeterActive2,
						new_data.pullerMotor1Speed,
						new_data.collectorMotor1Speed,
						new_data.scalarMotor1Speed,
						new_data.scalarMotor2Speed,
						new_data.mixerMotor1Speed,
						new_data.extruderMotorSpeed,
						new_data.pullerCycleCount,
						new_data.collectorCycleCount
		);
		
		
		StaticJsonDocument<512> json_document;

		// Add event name to the document.
		json_document.add("sensor_data");

		// Add JSON object to the document.
		JsonObject json_object = json_document.createNestedObject();

		json_object["mcuID"] = Connection.mcuID;
		json_object["status"] = new_data.status;
		json_object["mixerTemperature1"] = new_data.mixerTemperature1;
		json_object["mixerTemperature2"] = new_data.mixerTemperature2;
		json_object["extruderTemperature1"] = new_data.extruderTemperature1;
		json_object["extruderTemperature2"] = new_data.extruderTemperature2;
		json_object["radiusMeterActive1"] = new_data.radiusMeterActive1;
		json_object["radiusMeterActive2"] = new_data.radiusMeterActive2;
		json_object["pullerMotor1Speed"] = new_data.pullerMotor1Speed;
		json_object["collectorMotor1Speed"] = new_data.collectorMotor1Speed;
		json_object["scalarMotor1Speed"] = new_data.scalarMotor1Speed;
		json_object["scalarMotor2Speed"] = new_data.scalarMotor2Speed;
		json_object["mixerMotor1Speed"] = new_data.mixerMotor1Speed;
		json_object["extruderMotorSpeed"] = new_data.extruderMotorSpeed;
		json_object["pullerCycleCount"] = new_data.pullerCycleCount;
		json_object["collectorCycleCount"] = new_data.collectorCycleCount;
		

		bool mixerHeater1 = bitRead(new_data.heaters, 0);
		bool extruderHeater1 = bitRead(new_data.heaters, 2);
		bool extruderHeater2 = bitRead(new_data.heaters, 4);

		json_object["extruderHeater1"] = extruderHeater1;
		json_object["extruderHeater2"] = extruderHeater2;
		json_object["mixerHeater"] = mixerHeater1;

		// Convert the JSON document to String.
		serializeJson(json_document, messageToSend);

    SERIAL_PC.println(messageToSend);

		// Send the message to the server.
		socketIO.sendEVENT(messageToSend);
		
	}
}

bool createNetworkDetails() {
	if (incomingMessage != NULL && incomingMessageType != 0) {
		delete incomingMessage;
		incomingMessage = NULL;
		incomingMessageType = 0;

	}

	if (SERIAL_MAINMCU.available() > 0) {
		char deneme = SERIAL_MAINMCU.read();
		SERIAL_PC.printf("createNetworkDetails() '%c' captured.\n", deneme);
		
		if (deneme == '<') {
		char recv_2 = SERIAL_MAINMCU.read();
		SERIAL_PC.printf("SERIAL_COMM.read() -> recv_2: %c\n", recv_2);
		
		if (recv_2 == '1') {
			SERIAL_PC.println("createNetworkDetails() '1' captured.");
			incomingMessageType = 1;
			incomingMessage = new uint8_t[sizeof(NetworkDetails_t)];
			memset(incomingMessage, 0, sizeof(NetworkDetails_t));

			for (uint16_t index = 0; index < sizeof(NetworkDetails_t); index++) {
				uint8_t receving_char = SERIAL_MAINMCU.read();
				if (receving_char == '>') break;
				incomingMessage[index] = receving_char;
			}

			SERIAL_PC.printf("createNetworkDetails() %s captured.\n", incomingMessage);
		}
		}
	}

	if (Connection.mcuID[0] != 0xFF && 
		Connection.serverAddress[0] != 0xFF &&
		Connection.serverPort != 0 &&
		Connection.ssid[0] != 0xFF &&
		Connection.pass[0] != 0xFF) {
			
			memcpy(&Connection, incomingMessage, sizeof(Connection));
			
			SERIAL_PC.printf("[CMPFLX-WIFI] Network details are captured from the MAINMCU and setted.");
			return true;
	} else {

		return false;
	}
}

void connectWIFI() {
	WiFi.begin(Connection.ssid, Connection.pass);
	SERIAL_PC.printf("\n[CMPFLX-WIFI] Compfilex searching your WiFi and will try to connect it. Please wait.\n");
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
		SERIAL_PC.print("*");
	}
	SERIAL_PC.printf("\n[CMPFLX-WIFI] Connected to %s.\n", Connection.ssid);
}

/*
* Socket.io Connection to NodeJS Server:
* "conntype" header is important for the server
* to handle data correctly. socketIOEventHandler()
* is the function to process coming events from
* server.
*/
void connectSocketIO() {
	// Concat header_front and MCUID in Connection struct.
	const char* header_front = "conntype: MCU-esp01\nmcuid: ";
	char* extra_headers = (char*) malloc(strlen(header_front) + strlen(Connection.mcuID));
	strcpy(extra_headers, header_front);
	strcat(extra_headers, Connection.mcuID);

	// Connect to the Socket.io server.
	socketIO.setExtraHeaders(extra_headers);
	socketIO.begin(Connection.serverAddress, Connection.serverPort, "/socket.io/?EIO=4");
	socketIO.onEvent(socketIOEventHandler);
}

