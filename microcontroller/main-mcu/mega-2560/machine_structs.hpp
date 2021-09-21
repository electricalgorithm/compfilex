#ifndef MACHINE_STRUCTS
#define MACHINE_STRUCTS

#include <Arduino.h>

typedef struct sMachineSettings {
	// 0 = STOP, 1 = START
	uint8_t status;

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

} MachineSettings_t;


typedef struct sActiveMachineData {
	volatile float mixerTemperature1;
	volatile float mixerTemperature2;
	volatile float extruderTemperature1;
	volatile float extruderTemperature2;

	volatile float radiusMeterActive1;
	volatile float radiusMeterActive2;

	volatile float pullerMotor1Speed;
	volatile float collectorMotor1Speed;
	volatile float scalarMotor1Speed;
	volatile float scalarMotor2Speed;
	volatile float mixerMotor1Speed;
	volatile float extruderMotorSpeed;

	volatile uint16_t pullerCycleCount;
	volatile uint16_t collectorCycleCount;
	
    volatile bool extruderHeater1;
	volatile bool extruderHeater2;
	volatile bool mixerHeater;

} ActiveMachineData_t;

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

typedef struct network_data_struct {
	char mcuID[16]; // 15 + \0
	char ssid[100];
	char pass[100];
	char serverAddress[100];
	uint16_t serverPort;
} NetworkDetails_t;

#endif

