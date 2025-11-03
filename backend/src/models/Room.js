const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  // Optional blueprint image URL (user can upload/host their blueprint and paste URL)
  blueprintUrl: { type: String },
});

module.exports = mongoose.model('Room', roomSchema);
