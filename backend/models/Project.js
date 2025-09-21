const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  initial_investment: {
    type: Number,
    required: true,
    min: 0
  },
  expected_return: {
    type: Number,
    required: true
  },
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: null
  },
  duration_months: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Project', projectSchema);