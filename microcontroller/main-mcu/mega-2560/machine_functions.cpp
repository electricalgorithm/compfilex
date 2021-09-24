#include <machine_functions.hpp>

// These struct variables will hold the neccecary values.
MachineSettings_t* MachineSettings = new MachineSettings_t;
ActiveMachineData_t* ActiveMachineData = new ActiveMachineData_t;

void stop_machine() {
	// NOT IMPLEMENTED

	SERIAL_PC.print("[CMPLFX] Machine has stoped. ");

	// NOT IMPLEMENTED
}

void update_machine() {
	// NOT IMPLEMENTED

	SERIAL_PC.print("[CMPLFX] Machine settings updated. extruderMotorSpeed: ");
	SERIAL_PC.println(MachineSettings->extruderMotorSpeed);
	
	// NOT IMPLEMENTED
}

bool get_machine_status() {
	return true;
}


float get_temperature(uint8_t, uint8_t) {
	return 214.5;
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