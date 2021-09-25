#ifndef MACHINE_FUNCTIONS
#define MACHINE_FUNCTIONS

#include <Arduino.h>
#include <machine_structs.hpp>

#define SERIAL_PC  Serial

void stop_machine();
void start_machine();
void update_machine();
bool get_machine_status();

/*!
 *  @name get_temperature
 *  @param system_no (0) for mixer system, (1) for extruder system.
 *  @param device_no (1) for first sensor, (2) for second sensor.
 *  @returns Temperature as Celcius degree or NaN.
 */
float get_temperature(uint8_t system_no, uint8_t device_no);
/*
 * get_current_radius(uint8_t):
 * Parameters:
 *  1. (1) for first sensor, (2) for second sensor.
 * Returns: float
 */
double get_current_radius(uint8_t);
/*
 * get_motor_speed(uint8_t, uint8_t):
 * Parameters:
 *  1. (0) for scaling system, (1) for mixer system, 
 *     (2) for extruder system, (3) for puller system,
 *     and (4) for collector system.
 *  2. For scaling system, choose {1, 2}. For others {1}.
 * Returns: double
 */
uint16_t get_motor_speed(uint8_t, uint8_t);
/*
 * get_cycle_count(uint8_t):
 * Parameters:
 *  1. (0) for puller system, (1) for collector system.
 * Returns: uint16_t
 */
uint16_t get_cycle_count(uint8_t);
/*
 * get_heater_status():
 * Parameters: None
 * Returns: WILL BE EDITED
 */ 
uint8_t get_heater_status();
/*
 * get_remaining_duration():
 * Parameters:
 *  1. (0) for scaling system, (1) for mixer system, 
 *     and (2) for extruder system.
 * Returns: uint32_t
 */
uint32_t get_remaining_duration(uint8_t);

#endif
