require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT;

const mongoose = require("mongoose");

const MONGO = process.env.MONGODB;

mongoose.connect(`${MONGO}/twosense`);

const db = mongoose.connection;

const log = console.log;
db.once("open", () => log(`Connected: ${MONGO}`));
app.listen(PORT, () => log(`TwoSense Server on Port: ${PORT}`));