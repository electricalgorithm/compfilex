# compfilex

This project aims to build a machine to make composite filament within given rate of materials. There are three sub-projects in it.

**Server and Web Panel**: Controls machine through a graphical user interface. Control panel chose to be in web-based because of the cross-platform advantage.

**Microcontroller Application**: Executes orders send via web application, aka "brain of the machine". For a start, Arduino Mega will be used as main MCU, and ESP-01 will be used as WIFI MCU. Afterwards, I may try to implement main MCU to mbed or MicroPython libraries.

**Mechanical Machine**: Does the stuff. There are four parts of it:

* Scalar System, in order to scale materials with using motor's speeds.
* Mixer System, heats and mixes the materials given.
* Extrusion System, also heats and compress mixed stuff, and outputs a filament.
* Puller System, pulls filament for radius correction.
* Collector System, as name suggests, it collects the filament produced.



## Server (and Web Panel) Design

Server is the brain of the system. It is a middle-man in communication, a bridge to the database, and calculator (instruction maker) for the MCU. Main flow is like this: MCUs will only send the data, then client-side (the user who access to control panel) decide what to do, and send the new decision to server. Server will send the necessary information to the MCU, and it will change its GPIOs. **Server can be used for more then one user and more then one machine.**

##### Features

- [x] Changeable site name and description.

- [x] Multi-user and multi-machine support. (Note: works with one machine per user now)

- [x] Client-side rendering with [Socket.io](https://socket.io/). It enable us to change data dynamically.

- [x] Server-side rendering with [Embedded Javascript (EJS)](https://ejs.co/).

- [ ] RESTful API for future application development. (Working on it as a side project, not fully implemented.)

- [x] Socket.io API implementation for both client-side and MCU side.

- [x] Machine settings change on client-side web panel. (Changing options can be improved for user experience.)

- [x] Active (changing) data rendering immediately after a data comes from MCU.

- [x] "Saved Settings" page (or database) per user, to save their current settings, and perform them again later.

- [x] A page must be created to show users their MCU Unique ID.

- [x] Start and Stop button must be implemented. They both send setting details to the MCU.

  

##### Right Way to Create `config.env.js` File

```js
/*
* CONFIG file for Compfilex
* The file must be in the root folder.
* Check out GitHub page for more information.
* https://github.com/electricalgorithm/compfilex
*/

const config = {
    // For example, "Compfilex"
    // I suggest you to not use long sentences for description.
    SITE_NAME: "YOUR_SITE_NAME_HERE",
    SITE_DESCRPTION: "YOUR_SITE_DESCRIPTION_HERE",
    
    // Port you wanted to use on server.
    PORT: 3525,
    
    // Salt for hashing user passwords.
    USER_HASH_SALT: `YOUR_HASH_SALT_HERE`,
    
    // Database details, it must be MongoDB database.
    // You can use MongoDB Atlas for free.
    DB_USERNAME: "DB_USERNAME_HERE",
    DB_PASSWORD: "DB_PASSWORD_HERE",
    DB_SERVERADDR: "DATABASE_SERVER_ADDRESS",
    DB_NAME: "DB_NAME",
    
    DB_SESSIONS_COLLECTION: "SES_COLLECTION_NAME" // Collection name for storing sessions in the given database.
}

module.exports = config;
```


##### Videos on YouTube

* Control Panel Early Showcase (23.08.2021): https://www.youtube.com/watch?v=-NbN3ADiRs4
* Communication between MCU and Server, with Client-Side Rendering (04.09.2021): https://www.youtube.com/watch?v=0adJoKZSHKA



## Embedded System Design

Main microcontroller will be Arduino Mega in the project. To establish the connection between main MCU and NodeJS server, we use ESP-01 SoC and Socket.io (WebSocket) protocol. It is not fully implemented, yet.

##### Features

- [x] Server connection with using [Socket.io](https://socket.io/) (a special kind of WebSocket) protocol and [Links2004's arduinoWebSockets](https://github.com/Links2004/arduinoWebSockets) library.
- [x] Data sending/receiving from ESP-01 to NodeJS server.
- [x] Data sending/receiving from NodeJS to ESP-01.
- [x] Data sending protocol creation, and implementing between *Arduino Mega* (main MCU) and *ESP-01* (WIFI MCU).
- [ ] Run-time configurable *WIFI SSID*, *WIFI password*, *server address*, *server port*, and *MCU unique ID*.
- [ ] GPIO Handling on Arduino Mega side.
  - [ ] Temperatures' data
  - [ ] Motors driving
  - [ ] Motors' data
  - [ ] Filament diameter system data
  - [ ] Relay driving for heaters



##### Communication Map

![Communication Model Map 1](https://raw.githubusercontent.com/electricalgorithm/compfilex/main/assets/communication-model-1.png)



## Mechanical Design

All the model we have been designed is added to repository. However, it is not made from measurements -- not for production. We're trying to make a machine from daily-life products, hang in there, it will come. Check SketchUp file for more detail perspective.

![Model Unmeasured Design 1](https://raw.githubusercontent.com/electricalgorithm/compfilex/main/assets/machine-model-1.png)

Also, basic scheme of electrical connections are given.
