const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', userSchema);