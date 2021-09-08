#include <machine_functions.h>

// These struct variables will hold the neccecary values.
MachineSettings_t* MachineSettings = new MachineSettings_t;
ActiveMachineData_t* ActiveMachineData = new ActiveMachineData_t;

void stop_machine() {
	// NOT IMPLEMENTED

	SERIAL_PC.print("[CMPLFX] Machine has stoped. ");
	SERIAL_PC.println(ActiveMachineData->extruderMotorSpeed);

	// NOT IMPLEMENTED
}

void update_machine() {
	// NOT IMPLEMENTED

	SERIAL_PC.print("[CMPLFX] Machine settings updated. ");
	SERIAL_PC.println(MachineSettings->filamentDiameter);
	
	// NOT IMPLEMENTED
}