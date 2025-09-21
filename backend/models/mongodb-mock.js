// Simple in-memory mock for testing without MongoDB
const mockDB = {
  users: [],
  transactions: [],
  projects: [],
  projectReturns: [],
  settings: [
    { key: 'inflation_rate', value: '3.5' },
    { key: 'cost_of_living_increase', value: '2.8' },
    { 
      key: 'categories', 
      value: JSON.stringify([
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
        'Healthcare', 'Education', 'Travel', 'Salary', 'Freelance', 'Investment',
        'Business', 'Gift', 'Other'
      ])
    }
  ]
};

const connectDB = async () => {
  console.log('Connected to mock MongoDB database (for testing)');
  return true;
};

const mockModel = (name) => {
  const collectionName = name.toLowerCase();
  let collection = mockDB[collectionName + 's'] || mockDB[collectionName];
  
  return {
    find: (query = {}) => {
      console.log(`Mock find for ${name}:`, collection);
      return Promise.resolve(collection || []);
    },
    findOne: (query = {}) => {
      const result = (collection || []).find(item => 
        Object.keys(query).every(key => item[key] === query[key])
      );
      return Promise.resolve(result || null);
    },
    findOneAndUpdate: (query, update, options) => {
      if (!collection) collection = [];
      
      const existingIndex = collection.findIndex(item => 
        Object.keys(query).every(key => item[key] === query[key])
      );
      
      if (existingIndex !== -1) {
        // Update existing
        collection[existingIndex] = { ...collection[existingIndex], ...update };
        return Promise.resolve(collection[existingIndex]);
      } else if (options && options.upsert) {
        // Create new
        const newItem = { ...query, ...update, _id: Date.now().toString() };
        collection.push(newItem);
        return Promise.resolve(newItem);
      }
      
      return Promise.resolve(null);
    },
    create: (data) => {
      if (!collection) collection = [];
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