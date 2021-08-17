# compfilex

This project aims to build a machine to make composite filament within given rate of materials. There are three sub-projects in it:

* **Web application**: Controls machine through a graphical user interface. Control panel chose to be in web-based because of the cross-platform advantage.
* **Microcontroller application**: Executes orders send via web application, aka "brain of the machine". For a start, Arduino Mega will be used. Afterwards, one may choose to use 32-bit microcontrollers.
* **Machine itself**: Does the stuff. There are four parts of it:
  * Scaler System, in order to scale materials with using motor's speeds.
  * Mixer System, heats and mixes the materials given.
  * Extrusion System, also heats and compress mixed stuff, and outputs a filament.
  * Puller System, pulls filament for radius correction.
  * Collector System, as name suggests, it collects the filament produced.



## Web Application

![Web App Working Demo](https://github.com/electricalgorithm/compfilex/raw/main/assets/webapp_1.gif)

## Microcontroller

will be edited!

## Machine

will be edited!
