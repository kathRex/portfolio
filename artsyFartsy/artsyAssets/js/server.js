//---------------------------------------------------------
//API
//---------------------------------------------------------

//Import
const express = require("express"); //Framework for networking
const mongoose = require("mongoose");
const cors = require("cors"); //"Cross-Origin Resource Sharing" allow access so it can accept frontend requests
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const Character = require("./character");

//Create server instance
const app = express();
//Middleware
app.use(cors());
//Checks if data is in json format, makes it readable
app.use(express.json());

// DB connection
mongoose.connect(process.env.MONGO_URI);

//Route: Get character from cloud and send back as json
//req contains incoming data from user
//res contains methods (like .json or .send) I need to send data back to the user
app.get("/api/character", async (req, res) => {
  try {
    //Find document with this name
    const character = await Character.findOne({ name: "Cavalluccia Mireth" });
    if (!character) return res.status(404).send("Charakter nicht gefunden");
    //If found send data as json object
    res.json(character);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = 3000;
//Callback function, run code if server started
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

//Endpoint: Update specific character field
app.patch("/api/character/update", async (req, res) => {
  try {
    //Extract field name and new value from lythos.js
    const { field, value } = req.body;
    //Dynamically update the field
    const updateCharacter = await Character.findOneAndUpdate(
      { name: "Cavalluccia Mireth" }, //Find character
      { $set: { [field]: value } }, //Updatate specific field
      { new: true }, //Return updated document
    );
    res.json(updateCharacter);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
