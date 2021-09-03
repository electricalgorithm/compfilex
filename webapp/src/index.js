const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const config = require("./config.env.js");
const ejs = require("ejs");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const socketHandler = require("./routes/socketHandler");

// Creating app and Socket
const app = express();
const httpServer = require("http").Server(app)
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Application Settings
app.set("view engine", "ejs")
app.set('views', path.join(__dirname, './views'))
const PORT = config.PORT || 3000;

const store = new MongoDBSession({
    uri: `mongodb+srv://${config.DB_USERNAME}:${config.DB_PASSWORD}@${config.DB_SERVERADDR}/${config.DB_NAME}`,
    collection: config.DB_SESSIONS_COLLECTION
});


// Middlewares
app.use(cors({
    origin: "*"
}))
app.use(bodyParser.json());
app.use((req, res, next) => {
    console.log(`${new Date().toString()} -> ${req.method} ${req.originalUrl}`);
    next();
})

var sessionMiddleware = session({
    secret: "QhGVD3UFL2f3YfSSyQcIpcwAOoRTuzIU",
    resave: false,
    saveUninitialized: false,
    store: store,
    unset: "destroy"
})

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware)

// Routes
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
})

let appRoutes = require("./routes/appRoutes");
let tempRoute = require("./routes/temperature");
let motorRoute = require("./routes/motor");
let filamentRoute = require("./routes/filament");
let allRoute = require("./routes/all");
let userRoute = require("./routes/user");
app.use(appRoutes);
app.use(tempRoute);
app.use(motorRoute);
app.use(filamentRoute);
app.use(allRoute);
app.use(userRoute);

// Use public folder as serving root.
app.use(express.static("public"));

// Showing 404 message if couldn't found the page.
app.use((req, res, next) => {
    res.status(404).render("404", {
        site_name: config.SITE_NAME,
        site_description: config.SITE_DESCRPTION,
        page_name: "Page Not Found",
        page_url: req.originalUrl,
        req_auth: req.session.isAuth,
        user_name: req.session.user_name,
        current_year: (new Date).getFullYear()
    })
});

// Socket.io Connection Handling
// Rooms will be used to make calls to all the same users which has different socket IDs.
// Every username will be a room. If MCU connects, it will check its own machine ID.
io.on("connection", socket => socketHandler(socket, io))

httpServer.listen(PORT, () => console.info(`Server has started on ${PORT}`));