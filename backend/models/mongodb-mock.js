// Simple in-memory mock for testing without MongoDB
const mockDB = {
  users: [],
  transactions: [],
  projects: [],
  projectReturns: [],
  settings: [
    { key: 'inflation_rate', value: '3.5' },
    { key: 'cost_of_living_increase', value: '2.8' }
  ]
};

const connectDB = async () => {
  console.log('Connected to mock MongoDB database (for testing)');
  return true;
};

const mockModel = (name) => {
  const collection = mockDB[name.toLowerCase() + 's'] || mockDB[name.toLowerCase()];
  
  return {
    find: (query = {}) => {
      return Promise.resolve(collection || []);
    },
    findOne: (query = {}) => {
      return Promise.resolve((collection || [])[0] || null);
    },
    findOneAndUpdate: (query, update, options) => {
      if (options && options.upsert) {
        const existing = collection.find(item => item.key === query.key);
        if (!existing) {
          collection.push(update);
        }
      }
      return Promise.resolve(update);
    },
    create: (data) => {
      const item = { ...data, _id: Date.now().toString() };
      collection.push(item);
      return Promise.resolve(item);
    }
  };
};

module.exports = { 
  connectDB, 
  mongoose: { 
    connect: connectDB,
    model: mockModel,
    Schema: class MockSchema {
      constructor() {}
    },
    Types: {
      ObjectId: (id) => id
    }
  }
};