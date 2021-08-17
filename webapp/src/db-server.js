// Call secret variables.
const config = require("./config.env.js");
const mongoose = require("mongoose");

// Information about the database server.
let username = config.DB_USERNAME
let pass = config.DB_PASSWORD
let serverAddr = config.DB_SERVERADDR
let dbName = config.DB_NAME

// Connection to the database-as-a-service provider.
mongoose.connect(`mongodb+srv://${username}:${pass}@${serverAddr}/${dbName}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
    .then((res) => {
        console.log("MongoDB connection established.")
    });
