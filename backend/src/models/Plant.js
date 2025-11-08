const mongoose = require('mongoose');


const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room: { type: String, required: true },
  wateringFrequency: { type: Number, required: true }, // days
  // lastWatered should be empty by default so newly-added plants are treated as "never watered"
  lastWatered: { type: Date },
  // Keep a history of watering events so the app can show a timeline later.
  // Each event records when it happened and whether fertilizer was applied.
  wateringHistory: [
    {
      date: { type: Date },
      fertilizer: { type: Boolean, default: false },
    },
  ],
    // Convenience fields for quick access to most recent timestamps
    lastFertilized: { type: Date },
    // Type of the plant (e.g., fern, succulent)
    plantType: { type: String },
    // Position of the plant in the room blueprint as percentages (0-100)
    position: {
      x: { type: Number },
      y: { type: Number },
    },
    // Notes about the plant (freeform entries)
    notes: [
      {
        text: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  imageUrl: String,
});

module.exports = mongoose.model("Plant", plantSchema);
