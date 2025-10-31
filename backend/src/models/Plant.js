const mongoose = require('mongoose');


const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room: { type: String, required: true },
  wateringFrequency: { type: Number, required: true }, // days
  lastWatered: { type: Date, default: Date.now },
  imageUrl: String,
});

module.exports = mongoose.model("Plant", plantSchema);
