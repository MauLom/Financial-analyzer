const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('Connected to MongoDB database');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    } else {
      console.log('Continuing in development mode without MongoDB...');
    }
  }
};

module.exports = { connectDB, mongoose };