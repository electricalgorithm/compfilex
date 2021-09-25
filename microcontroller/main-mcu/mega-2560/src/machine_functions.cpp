#include <machine_functions.hpp>
#include <max6675.h>

/* 
 * Thermocouple Initilization with using MAX6675 SPI Communication Chip
 * Abbravtions:
 * - SCK: Clock Signal
 * - MISO: Master-in Slave-out Pin
 * - x_CS: x'th Chip Select Pin
 * 
 * Un-comment after connection of the MAX6675's into the pins.
 * Don't forget to un-comment inside of get_temperature() too. 
 */
const uint8_t thermocouple_SCK = 22;
const uint8_t thermocouple_MISO = 24;
const uint8_t thermocouple00_CS = 23;
// const uint8_t thermocouple01_CS = 25;
// const uint8_t thermocouple10_CS = 26;
// const uint8_t thermocouple11_CS = 27
MAX6675 thermocouple00(thermocouple_SCK, thermocouple00_CS, thermocouple_MISO);
// MAX6675 thermocouple01(thermocouple_SCK, thermocouple01_CS, thermocouple_MISO);
// MAX6675 thermocouple10(thermocouple_SCK, thermocouple10_CS, thermocouple_MISO);
// MAX6675 thermocouple11(thermocouple_SCK, thermocouple11_CS, thermocouple_MISO);
/* -------------------------------------------------------------------------------- */

// These struct variables will hold the neccecary values.
MachineSettings_t* MachineSettings = new MachineSettings_t;
ActiveMachineData_t* ActiveMachineData = new ActiveMachineData_t;

void stop_machine() {
	// NOT IMPLEMENTED

	SERIAL_PC.println("[CMPLFX] Machine has stoped. ");

	// NOT IMPLEMENTED
}

void start_machine() {
	// NOT IMPLEMENTED

	SERIAL_PC.println("[CMPLFX] Machine has started. ");

	// NOT IMPLEMENTED
}

void update_machine() {
	// NOT IMPLEMENTED
	if (MachineSettings->status) {
		start_machine();
	}

	SERIAL_PC.print("[CMPLFX] Machine settings updated. extruderMotorSpeed: ");
	SERIAL_PC.println(MachineSettings->extruderMotorSpeed);
	
	// NOT IMPLEMENTED
}

bool get_machine_status() {
	return true;
}

float get_temperature(uint8_t system_no, uint8_t device_no) {
	switch (system_no) {
		case 0:
			if (device_no == 0) return thermocouple00.readCelsius();
			// if (device_no == 1) return thermocouple01.readCelsius();
			break;
		
		case 1:
			// if (device_no == 0) return thermocouple10.readCelsius();
			// if (device_no == 1) return thermocouple11.readCelsius();
			break;
		
		default:
			return NAN;
	}

	return 22.5;
}

double get_current_radius(uint8_t) {
	return 1.15;
}

uint16_t get_motor_speed(uint8_t, uint8_t) {
	return 120;
}

uint16_t get_cycle_count(uint8_t) {
	return 543;
}

uint8_t get_heater_status() {
	return 0b00010101;
}

uint32_t get_remaining_duration(uint8_t) {
	return 42056;
}