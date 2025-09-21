const { connectDB } = require('./mongodb');
const User = require('./User');
const Transaction = require('./Transaction');
const Project = require('./Project');
const ProjectReturn = require('./ProjectReturn');
const Setting = require('./Setting');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Check if we're actually connected before trying to insert data
    if (require('./mongodb').mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, skipping database initialization');
      return;
    }

    // Insert default settings if they don't exist
    await Setting.findOneAndUpdate(
      { key: 'inflation_rate' },
      { key: 'inflation_rate', value: '3.5' },
      { upsert: true, new: true }
    );

    await Setting.findOneAndUpdate(
      { key: 'cost_of_living_increase' },
      { key: 'cost_of_living_increase', value: '2.8' },
      { upsert: true, new: true }
    );

    console.log('Default settings initialized');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    if (process.env.NODE_ENV !== 'development') {
      throw err;
    } else {
      console.log('Continuing without database initialization in development mode');
    }
  }
};

module.exports = {
  initializeDatabase,
  User,
  Transaction,
  Project,
  ProjectReturn,
  Setting
};