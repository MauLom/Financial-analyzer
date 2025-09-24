// Fallback database implementation that tries MongoDB first, then uses mock
let databaseImplementation;

const initializeDatabase = async () => {
  try {
    // Try MongoDB first
    const mongoImplementation = require('./database-mongo');
    await mongoImplementation.initializeDatabase();
    databaseImplementation = mongoImplementation;
    console.log('Using MongoDB database');
    return;
  } catch (error) {
    console.log('MongoDB failed, falling back to mock database:', error.message);
    
    // Fall back to mock implementation
    const mockImplementation = require('./mongodb-mock');
    await mockImplementation.connectDB();
    
    // Create mock models
    databaseImplementation = {
      initializeDatabase: async () => console.log('Mock database initialized'),
      User: mockImplementation.mongoose.model('User'),
      Transaction: mockImplementation.mongoose.model('Transaction'),
      Project: mockImplementation.mongoose.model('Project'),
      ProjectReturn: mockImplementation.mongoose.model('ProjectReturn'),
      Setting: mockImplementation.mongoose.model('Setting')
    };
    console.log('Using mock database for testing');
  }
};

// Initialize immediately
let initPromise = initializeDatabase();

module.exports = {
  async initializeDatabase() {
    return initPromise;
  },
  
  get User() {
    return databaseImplementation?.User;
  },
  
  get Transaction() {
    return databaseImplementation?.Transaction;
  },
  
  get Project() {
    return databaseImplementation?.Project;
  },
  
  get ProjectReturn() {
    return databaseImplementation?.ProjectReturn;
  },
  
  get Setting() {
    return databaseImplementation?.Setting;
  }
};