//---------------------------------------------------------
//API
//---------------------------------------------------------

//Import
import express from "express"; //Framework for networking
import mongoose from "mongoose";
import cors from "cors"; //"Cross-Origin Resource Sharing" allow access so it can accept frontend requests
import path from "path"; //module to work with file paths
import dotenv from "dotenv"; //allows to load evviroment variables from .env file into process.env
import { fileURLToPath } from "url";

import Character from "./character.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
dotenv.config({ path: path.resolve(dirname, "../../.env") });

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
