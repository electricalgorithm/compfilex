/*
 * == COMPFILEX MCU on Arduino ==
 * ver: 0.0.2 (First_Successfull_Try)
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

// Includes for the wireless communication.
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WebSocketsClient.h>
#include <SocketIOclient.h>

// Includes for data manipulation.
#include <ArduinoJson.h>

// Global Variables and Configs
const char* ssID = "SSID_HERE";
const char* networkPass = "SSID_PASS_HERE";
const char* serverIP = "SERVER_IP_HERE";
const uint16_t serverPORT = 3525; // Check server port.
const char* mcuID = "MCU_UNIQUE_ID_HERE";
unsigned long int timeOld = 0;

SocketIOclient socketIO;
#define SERIAL Serial
#define WAIT_MS 5000


void socketIOEventHandler(socketIOmessageType_t type, uint8_t * payload, size_t length);

void setup() {
  SERIAL.begin(115200);
  // SERIAL.setDebugOutput(true);
  
  // Connection to the WiFi network.
  WiFi.begin(ssID, networkPass);
  SERIAL.printf("\nCompfilex searching your WiFi and will try to connect it! Please wait.\n");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    SERIAL.print("*");
  }
  
  SERIAL.printf("\nConnected to %s.\n", ssID);

  // Connecting Socket.io server.
  socketIO.setExtraHeaders("conntype: MCU-arduino");
  socketIO.begin(serverIP, serverPORT, "/socket.io/?EIO=4");
  socketIO.onEvent(socketIOEventHandler);
}

void loop() {
  socketIO.loop();

  if (millis() > timeOld + WAIT_MS) {
    timeOld = millis();
    // creat JSON message for Socket.IO (event)
    DynamicJsonDocument doc(4096);
    JsonArray array = doc.to<JsonArray>();
  
    // add event name
    // Hint: socket.on('event_name', ....
    array.add("send_data");
  
    // add payload (parameters) for the event
    JsonObject settings = array.createNestedObject();
    settings["mcuID"] = mcuID;
    settings["extruderTemperature1"] = (uint8_t) random(255);
    settings["extruderTemperature2"] = (uint8_t) random(255);
    settings["mixerTemperature1"] = (uint8_t) random(255);
    settings["mixerTemperature2"] = (uint8_t) random(255);
  
    // JSON to String (serializion)
    String output;
    serializeJson(doc, output);
  
    // Send event
    socketIO.sendEVENT(output);
  
    // Print JSON for debugging
    SERIAL.println(output);
  }
}

void socketIOEventHandler(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch (type) {
        case sIOtype_DISCONNECT:
            SERIAL.printf("[IOc] Disconnected!\n");
            break;
        case sIOtype_CONNECT:
            SERIAL.printf("[IOc] Connected to url: %s\n", payload);

            // join default namespace (no auto join in Socket.IO V3)
            socketIO.send(sIOtype_CONNECT, "/");
            break;
        case sIOtype_EVENT:
            SERIAL.printf("[IOc] get event: %s\n", payload);
            break;
        case sIOtype_ACK:
            SERIAL.printf("[IOc] get ack: %u\n", length);
            hexdump(payload, length);
            break;
        case sIOtype_ERROR:
            SERIAL.printf("[IOc] get error: %u\n", length);
            hexdump(payload, length);
            break;
        case sIOtype_BINARY_EVENT:
            SERIAL.printf("[IOc] get binary: %u\n", length);
            hexdump(payload, length);
            break;
        case sIOtype_BINARY_ACK:
            SERIAL.printf("[IOc] get binary ack: %u\n", length);
            hexdump(payload, length);
            break;
    }
}
