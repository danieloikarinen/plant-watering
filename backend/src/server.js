const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
const Plant = require("./models/Plant"); // make sure Plant.js exists

// Load the .env that lives in the backend folder so starting node from the repo root still works
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const PASSWORD = process.env.APP_PASSWORD;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple shared password authentication
app.use((req, res, next) => {
  if (!PASSWORD) return next(); // no password set, allow all
  const headerPass = req.headers["x-app-password"];
  if (headerPass === PASSWORD) return next();
  return res.status(401).json({ error: "Unauthorized" });
});

// Test route
app.get("/", (req, res) => {
  res.send("🌿 Plant Watering Tracker Backend is running!");
});

// CRUD routes

// Get all plants
app.get("/api/plants", async (req, res) => {
  try {
    const plants = await Plant.find();
    res.json(plants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new plant
app.post("/api/plants", async (req, res) => {
  try {
    const plant = new Plant(req.body);
    await plant.save();
    res.status(201).json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a plant
app.put("/api/plants/:id", async (req, res) => {
  try {
    const updated = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a plant
app.delete("/api/plants/:id", async (req, res) => {
  try {
    await Plant.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark as watered
app.post("/api/plants/:id/water", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    plant.lastWatered = new Date();
    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Connect to MongoDB and start server
// Support both MONGO_URI and MONGODB_URI env names (the .env in this repo uses MONGODB_URI)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MongoDB connection error: MONGO_URI / MONGODB_URI is not set');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
