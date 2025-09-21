const { connectDB } = require('./mongodb');
const Transaction = require('./Transaction');
const Project = require('./Project');
const ProjectReturn = require('./ProjectReturn');
const Setting = require('./Setting');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

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
    console.error('Error initializing database:', err);
    throw err;
  }
};

module.exports = {
  initializeDatabase,
  Transaction,
  Project,
  ProjectReturn,
  Setting
};