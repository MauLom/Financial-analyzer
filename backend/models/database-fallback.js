// Fallback database implementation that tries MongoDB first, then uses mock
let databaseImplementation = null;
let initializationPromise = null;

const initializeDatabase = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      // Try MongoDB first
      const mongoImplementation = require('./database-mongo');
      await mongoImplementation.initializeDatabase();
      databaseImplementation = mongoImplementation;
      console.log('Using MongoDB database');
      return databaseImplementation;
    } catch (error) {
      console.log('MongoDB failed, falling back to mock database:', error.message);
      
      // Fall back to mock implementation
      const mockImplementation = require('./mongodb-mock');
      await mockImplementation.connectDB();
      
      // Create mock models with proper mongoose interface
      databaseImplementation = {
        initializeDatabase: async () => console.log('Mock database initialized'),
        User: mockImplementation.mongoose.model('User'),
        Transaction: mockImplementation.mongoose.model('Transaction'),
        Project: mockImplementation.mongoose.model('Project'),
        ProjectReturn: mockImplementation.mongoose.model('ProjectReturn'),
        Setting: mockImplementation.mongoose.model('Setting')
      };
      console.log('Using mock database for testing');
      return databaseImplementation;
    }
  })();
  
  return initializationPromise;
};

// Initialize immediately
initializeDatabase();

module.exports = {
  initializeDatabase,
  
  get User() {
    if (!databaseImplementation) {
      console.warn('Database implementation not ready, creating temporary fallback');
      // Return a temporary fallback that will work
      return require('./mongodb-mock').mongoose.model('User');
    }
    return databaseImplementation.User;
  },
  
  get Transaction() {
    if (!databaseImplementation) {
      console.warn('Database implementation not ready, creating temporary fallback');
      // Return a temporary fallback that will work
      return require('./mongodb-mock').mongoose.model('Transaction');
    }
    return databaseImplementation.Transaction;
  },
  
  get Project() {
    if (!databaseImplementation) {
      console.warn('Database implementation not ready, creating temporary fallback');
      return require('./mongodb-mock').mongoose.model('Project');
    }
    return databaseImplementation.Project;
  },
  
  get ProjectReturn() {
    if (!databaseImplementation) {
      console.warn('Database implementation not ready, creating temporary fallback');
      return require('./mongodb-mock').mongoose.model('ProjectReturn');
    }
    return databaseImplementation.ProjectReturn;
  },
  
  get Setting() {
    if (!databaseImplementation) {
      console.warn('Database implementation not ready, creating temporary fallback');
      return require('./mongodb-mock').mongoose.model('Setting');
    }
    return databaseImplementation.Setting;
  }
};