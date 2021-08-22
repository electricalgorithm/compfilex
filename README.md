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

[![Compfilex Demo 1.1 Video Link](https://img.youtube.com/vi/-NbN3ADiRs4/0.jpg)](https://www.youtube.com/watch?v=-NbN3ADiRs4)

**Features**
- Site name and description change in `config.env.js` file.
- Works with more then one user.
- RESTful API for microcontroller applications and Socket.io communication between front-end and back-end.
- Dynamic setting change on the front end.
- Saving current settings to a library, and use them later.

## Microcontroller

will be edited!

## Machine

All the model we have been designed is added to repository. However, it is not made from measurements -so, not for production. We're trying to make a machine from daily-life products, hang in there, it will come. Check SketchUp file for more detail perspective.

![Model Unmeasured Design 1](https://raw.githubusercontent.com/electricalgorithm/compfilex/main/assets/machine-model-1.png)

Also, basic scheme of electrical connections are given.
