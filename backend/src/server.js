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
// Room model removed: using a single blueprint and plant.position instead

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
    // Normalize returned documents so front-end doesn't see misleading convenience fields
    const normalize = (p) => {
      const obj = p.toObject ? p.toObject() : { ...p };
      obj.wateringHistory = obj.wateringHistory || [];
      // If there's no watering history, treat lastWatered/lastFertilized as absent
      if (!obj.wateringHistory.length) {
        delete obj.lastWatered;
        delete obj.lastFertilized;
      }
      return obj;
    };
    res.json(plants.map(normalize));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single plant by id
app.get("/api/plants/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });
    const obj = plant.toObject ? plant.toObject() : { ...plant };
    obj.wateringHistory = obj.wateringHistory || [];
    if (!obj.wateringHistory.length) {
      delete obj.lastWatered;
      delete obj.lastFertilized;
    }
    res.json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rooms removed: single blueprint approach — plants carry a `room` string if needed

// Create a new plant
app.post("/api/plants", async (req, res) => {
  try {
    // Only accept allowed fields to avoid accidental timestamp defaults from previous schema versions.
    const payload = {
      name: req.body.name,
      room: req.body.room,
      wateringFrequency: req.body.wateringFrequency,
      plantType: req.body.plantType,
      position: req.body.position,
      imageUrl: req.body.imageUrl,
      notes: req.body.notes || [],
    };
    const plant = new Plant(payload);

    // Ensure we don't set lastWatered/lastFertilized unless explicitly provided
    if (req.body.lastWatered) plant.lastWatered = req.body.lastWatered;
    if (req.body.lastFertilized) plant.lastFertilized = req.body.lastFertilized;

    await plant.save();

    // Defensive fix: if wateringHistory is empty but lastWatered was somehow set (leftover DB/schema defaults), clear it.
    if ((!plant.wateringHistory || plant.wateringHistory.length === 0) && plant.lastWatered) {
      plant.lastWatered = undefined;
      plant.lastFertilized = undefined;
      await plant.save();
    }

    res.status(201).json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a plant
app.put("/api/plants/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Plant not found' });

    // Debug logging to help trace why position updates might fail
    console.log(`PUT /api/plants/${req.params.id} body:`, req.body);

    // Apply updates safely: merge provided fields onto the existing document
    // This avoids replacing arrays/objects unintentionally and ensures Mongoose
    // casting/validation runs on save.
    const updates = req.body || {};
    Object.keys(updates).forEach((key) => {
      plant[key] = updates[key];
    });

    console.log(`Saving plant ${plant._id} with updates.`);
    await plant.save();
    console.log(`Saved plant ${plant._id}`);
    res.json(plant);
  } catch (err) {
    console.error('Error updating plant:', err);
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


    // support sending { fertilizer: true, date: '2025-11-03T12:00' } in the request body
    const { fertilizer, date } = req.body || {};

    const now = new Date();
    // If user provided a date (for backfilling history), use it; otherwise use now
    const eventDate = date ? new Date(date) : now;

    // Ensure wateringHistory exists and push new event
    plant.wateringHistory = plant.wateringHistory || [];
    plant.wateringHistory.push({ date: eventDate, fertilizer: !!fertilizer });

    // Update convenience fields too (set to the event date)
    plant.lastWatered = eventDate;
    if (fertilizer) {
      plant.lastFertilized = eventDate;
    }

    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add a freeform note to a plant
app.post("/api/plants/:id/notes", async (req, res) => {
  try {
    const { text, date } = req.body || {};
    if (!text) return res.status(400).json({ error: "Note text is required" });

    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    const noteDate = date ? new Date(date) : new Date();
    plant.notes = plant.notes || [];
    plant.notes.push({ text, date: noteDate });
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
