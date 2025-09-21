const mongoose = require('mongoose');

const projectReturnSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  return_amount: {
    type: Number,
    required: true
  },
  return_date: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('ProjectReturn', projectReturnSchema);