const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors")
const config = require("./config.env.js")
const MongoDBSession = require("connect-mongodb-session")(session);

const app = express();
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
    console.log(`${new Date().toString()} -> ${req.originalUrl}`);
    next();
})
app.use(session({
    secret: "QhGVD3UFL2f3YfSSyQcIpcwAOoRTuzIU",
    resave: false,
    saveUninitialized: false,
    store: store,
    unset: "destroy"
}))

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
})

// Routes
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
    res.status(404).sendFile(path.join(__dirname, "../public/404.html"))
});

app.listen(PORT, () => console.info(`Server has started on ${PORT}`));