/*
 * == COMPFILEX MCU on Arduino ==
 * ver: 0.0.3 (Something's_happening)
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


/*  Global Variables and Configs  */
const char* ssID = "NETWORK_SSID";
const char* networkPass = "NETWORK_PASS";
const char* serverIP = "SERVER_IP";
const uint16_t serverPORT = 3525;
const char* mcuID = "MCU_UNQIUE_ID";
unsigned long int timeOld = 0;
#define SERIAL_COMM Serial
#define WAIT_MS 5000
SocketIOclient socketIO;

typedef struct message_web_wifi {
	String mcu_id;
	float mixerTemperature1;
	float mixerTemperature2;
	float extruderTemperature1;
	float extruderTemperature2;
	float radiusMeterActive1;
	float radiusMeterActive2;
	float pullerMotor1Speed;
	float collectorMotor1Speed;
	float scalarMotor1Speed;
	float scalarMotor2Speed;
	float mixerMotor1Speed;
	float extruderMotorSpeed;
	uint16_t pullerCycleCount;
	uint16_t collectorCycleCount;
	bool extruderHeater1;
	bool extruderHeater2;
	bool mixerHeater;
} FakeJSONforData;

typedef struct message_main_wifi {
	// Motor Speeds
	float scalarMotor1Speed;
	float scalarMotor2Speed;
	float mixerMotor1Speed;
	float extruderMotorSpeed;
	float pullerMotor1Speed;
	float collectorMotor1Speed;

	// Motor Durations
	long unsigned int scalingMotorsDuration;
	long unsigned int mixerMotorsDuration;
	long unsigned int extruderMotorsDuration;

	// Temperatures
	float mixerTemperature;
	float extruderTemperature;

	// Filament Specifications
	double filamentDiameter;
	float filamentLength;
} Main2WIFIMCUsMessage_t;


/*  Function Declerations */
void socketIOEventHandler(socketIOmessageType_t type, uint8_t* payload, size_t length);
void send_server(SocketIOclient* socketio_object, FakeJSONforData datum);
void serve(socketIOmessageType_t type, uint8_t* payload, size_t length);


void setup() {
	SERIAL_COMM.begin(115200);

	// Connection to the WiFi Network:
	WiFi.begin(ssID, networkPass);
	SERIAL_COMM.printf("\nCompfilex searching your WiFi and will try to connect it! Please wait.\n");
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
		SERIAL_COMM.print("*");
	}
	SERIAL_COMM.printf("\nConnected to %s.\n", ssID);

	/*
	* Socket.io Connection to NodeJS Server:
	* "conntype" header is important for the server
	* to handle data correctly. socketIOEventHandler()
	* is the function to process coming events from
	* server.
	*/
	socketIO.setExtraHeaders("conntype: MCU-esp01");
	socketIO.begin(serverIP, serverPORT, "/socket.io/?EIO=4");
	socketIO.onEvent(socketIOEventHandler);
}

void loop() {
	socketIO.loop();

	if (millis() > timeOld + WAIT_MS) {
		timeOld = millis();

		// Stay here for debugging purposes.
		FakeJSONforData random_data = {
			.mcu_id = "A1",
			.mixerTemperature1 = float(random(150)) + float(random(100)/100.00),
			.mixerTemperature2 = float(random(150)) + float(random(100)/100.00),
			.extruderTemperature1 = float(random(150)) + float(random(100)/100.00),
			.extruderTemperature2 = float(random(150)) + float(random(100)/100.00),
			.radiusMeterActive1 = float(random(2)) + float(random(100)/100.00),
			.radiusMeterActive2 = float(random(2)) + float(random(100)/100.00),
			.pullerMotor1Speed = float(random(500)) + float(random(100)/100.00),
			.collectorMotor1Speed = float(random(500)) + float(random(100)/100.00),
			.scalarMotor1Speed = float(random(500)) + float(random(100)/100.00),
			.scalarMotor2Speed = float(random(500)) + float(random(100)/100.00),
			.mixerMotor1Speed = float(random(500)) + float(random(100)/100.00),
			.extruderMotorSpeed = float(random(500)) + float(random(100)/100.00),
			.pullerCycleCount = random(1024),
			.collectorCycleCount = random(1024),
			.extruderHeater1 = false,
			.extruderHeater2 = true,
			.mixerHeater = false
		};

		send_server(&socketIO, random_data);
	}
}

void socketIOEventHandler(socketIOmessageType_t type, uint8_t* payload, size_t length) {
	switch (type) {
        case sIOtype_DISCONNECT:
            SERIAL_COMM.printf("[IOc] Disconnected!\n");
            break;

        case sIOtype_CONNECT:
            SERIAL_COMM.printf("[IOc] Connected to url: %s\n", payload);
            socketIO.send(sIOtype_CONNECT, "/");
            break;

        case sIOtype_EVENT:
			// Call the servant.
			serve(type, payload, length);
            break;

        case sIOtype_ACK:
            SERIAL_COMM.printf("[IOc] get ack: %u\n", length);
            hexdump(payload, length);
            break;

        case sIOtype_ERROR:
            SERIAL_COMM.printf("[IOc] get error: %u\n", length);
            hexdump(payload, length);
            break;

        case sIOtype_BINARY_EVENT:
            SERIAL_COMM.printf("[IOc] get binary: %u\n", length);
            hexdump(payload, length);
            break;

        case sIOtype_BINARY_ACK:
            SERIAL_COMM.printf("[IOc] get binary ack: %u\n", length);
            hexdump(payload, length);
            break;
    }
}


void send_server(SocketIOclient* socketio_object, FakeJSONforData datum) {
	String msg_to_send;
	StaticJsonDocument<384> json_document;

	// Add event name to the document.
	json_document.add("send_data");

	// Add JSON object to the document.
	JsonObject json_object = json_document.createNestedObject();
	json_object["mcuID"] = datum.mcu_id;
	json_object["mixerTemperature1"] = datum.mixerTemperature1;
	json_object["mixerTemperature2"] = datum.mixerTemperature2;
	json_object["extruderTemperature1"] = datum.extruderTemperature1;
	json_object["extruderTemperature2"] = datum.extruderTemperature2;
	json_object["radiusMeterActive1"] = datum.radiusMeterActive1;
	json_object["radiusMeterActive2"] = datum.radiusMeterActive2;
	json_object["pullerMotor1Speed"] = datum.pullerMotor1Speed;
	json_object["collectorMotor1Speed"] = datum.collectorMotor1Speed;
	json_object["scalarMotor1Speed"] = datum.scalarMotor1Speed;
	json_object["scalarMotor2Speed"] = datum.scalarMotor2Speed;
	json_object["mixerMotor1Speed"] = datum.mixerMotor1Speed;
	json_object["extruderMotorSpeed"] = datum.extruderMotorSpeed;
	json_object["pullerCycleCount"] = datum.pullerCycleCount;
	json_object["collectorCycleCount"] = datum.collectorCycleCount;
	json_object["extruderHeater1"] = datum.extruderHeater1;
	json_object["extruderHeater2"] = datum.extruderHeater2;
	json_object["mixerHeater"] = datum.mixerHeater;

	// Convert the JSON document to String.
	serializeJson(json_document, msg_to_send);

	// Send the message to the server.
	socketio_object->sendEVENT(msg_to_send);

}

void serve(socketIOmessageType_t type, uint8_t* payload, size_t length) {
	// Create a StaticJSONDocument.
	StaticJsonDocument<768> document;

	// The payload is a char-array, which contains JSON. Turn it to StaticJSONDocument.
	DeserializationError error = deserializeJson(document, (char*) payload);
	if (error) {
		SERIAL_COMM.print(F("[ERROR] deserializeJson() failed: "));
		SERIAL_COMM.println(error.f_str());
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
		
		Main2WIFIMCUsMessage_t* coming_data = new Main2WIFIMCUsMessage_t;

		coming_data->scalarMotor1Speed = JSONobj["scalarMotor1Speed"];
		coming_data->scalarMotor2Speed = JSONobj["scalarMotor2Speed"];
		coming_data->mixerMotor1Speed = JSONobj["mixerMotor1Speed"];
		coming_data->extruderMotorSpeed = JSONobj["extruderMotorSpeed"];
		coming_data->pullerMotor1Speed = JSONobj["pullerMotor1Speed"];
		coming_data->collectorMotor1Speed = JSONobj["collectorMotor1Speed"];
		coming_data->scalingMotorsDuration = JSONobj["scalingMotorsDuration"];
		coming_data->mixerMotorsDuration = JSONobj["mixerMotorsDuration"];
		coming_data->extruderMotorsDuration = JSONobj["extruderMotorsDuration"];
		coming_data->mixerTemperature = JSONobj["mixerTemperature"];
		coming_data->extruderTemperature = JSONobj["extruderTemperature"];
		coming_data->filamentDiameter = JSONobj["filamentDiameter"];
		coming_data->filamentLength = JSONobj["filamentLength"];
		
		// Stay here for debugging purposes.
		SERIAL_COMM.println(coming_data->scalarMotor1Speed);
		SERIAL_COMM.println(coming_data->scalarMotor2Speed);
		SERIAL_COMM.println(coming_data->mixerMotor1Speed);
		SERIAL_COMM.println(coming_data->extruderMotorSpeed);
		SERIAL_COMM.println(coming_data->pullerMotor1Speed);
		SERIAL_COMM.println(coming_data->collectorMotor1Speed);
		SERIAL_COMM.println(coming_data->scalingMotorsDuration);
		SERIAL_COMM.println(coming_data->mixerMotorsDuration);
		SERIAL_COMM.println(coming_data->extruderMotorsDuration);
		SERIAL_COMM.println(coming_data->mixerTemperature);
		SERIAL_COMM.println(coming_data->extruderTemperature);
		SERIAL_COMM.println(coming_data->filamentDiameter);
		SERIAL_COMM.println(coming_data->filamentLength);
	} 

	else if (event_name == "panic-halt-down") {
		// NOT IMPLEMENTED!
		SERIAL_COMM.println("SHUT DOWN!");
	}

	else {
		// Unrecognized events goes here.
		SERIAL_COMM.println("[IOc] Unrecognized event:");
		SERIAL_COMM.print(event_name);
	}
}
