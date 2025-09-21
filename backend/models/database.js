const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_analyzer';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB database');
})
.catch((err) => {
  console.error('Error connecting to database:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  password_hash: { 
    type: String 
  },
  provider: { 
    type: String, 
    default: 'local',
    enum: ['local', 'google', 'github']
  },
  provider_id: { 
    type: String 
  },
  first_name: { 
    type: String,
    trim: true 
  },
  last_name: { 
    type: String,
    trim: true 
  },
  avatar_url: { 
    type: String 
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['income', 'expense', 'investment']
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String,
    trim: true 
  },
  date: { 
    type: Date, 
    required: true 
  }
}, {
  timestamps: { 
    createdAt: 'created_at' 
  }
});

// Project Schema
const projectSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
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
    enum: ['low', 'medium', 'high']
  },
  duration_months: { 
    type: Number,
    min: 1
  },
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'completed', 'cancelled']
  }
}, {
  timestamps: { 
    createdAt: 'created_at' 
  }
});

// Project Return Schema
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
    trim: true 
  }
});

// Settings Schema  
const settingsSchema = new mongoose.Schema({
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
  timestamps: { 
    updatedAt: 'updated_at' 
  }
});

// Create models
const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Project = mongoose.model('Project', projectSchema);
const ProjectReturn = mongoose.model('ProjectReturn', projectReturnSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// Initialize default settings
const initializeSettings = async () => {
  try {
    const existingSettings = await Settings.find({});
    if (existingSettings.length === 0) {
      await Settings.create([
        { key: 'inflation_rate', value: '3.5' },
        { key: 'cost_of_living_increase', value: '2.8' }
      ]);
      console.log('Default settings initialized');
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

// Initialize settings on connection
initializeSettings();

module.exports = {
  User,
  Transaction,
  Project,
  ProjectReturn,
  Settings,
  mongoose
};