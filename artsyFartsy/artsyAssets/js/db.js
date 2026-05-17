//---------------------------------------------------------
//Database Connection Helper
//---------------------------------------------------------
//.env contains sensitive data so it's save.
//This finds the .env file, read content and inject them
require("dotenv").config();
const mongoose = require("mongoose");

//This is the same as async function connectDB(){...}
const connectDB = async () => {
  try {
    //Wait for DB to connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error: ", err.message);
    //If db connection fails, don't keep server running
    //(0) Task finished
    //(1) Crashed, shutting down
    process.exit(1);
  }
};
