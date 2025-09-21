const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  }
}, {
  timestamps: { updatedAt: 'updated_at', createdAt: false }
});

module.exports = mongoose.model('Setting', settingSchema);