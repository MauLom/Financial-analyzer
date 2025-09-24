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
  
  // Ensure collection exists
  if (!collection) {
    collection = [];
    if (mockDB[collectionName + 's']) {
      mockDB[collectionName + 's'] = collection;
    } else {
      mockDB[collectionName] = collection;
    }
  }
  
  return {
    find: (query = {}) => {
      console.log(`Mock find for ${name}:`, query, 'Collection size:', collection.length);
      
      // Filter results based on query
      let results = collection.filter(item => {
        return Object.keys(query).every(key => {
          if (key === 'date' && query[key] && typeof query[key] === 'object') {
            // Handle date range queries
            const itemDate = new Date(item[key]);
            if (query[key].$gte && itemDate < new Date(query[key].$gte)) return false;
            if (query[key].$lte && itemDate > new Date(query[key].$lte)) return false;
            return true;
          }
          return item[key] === query[key];
        });
      });
      
      return {
        sort: (sortObj) => {
          // Simple sort implementation
          if (sortObj.date === -1) {
            results.sort((a, b) => new Date(b.date) - new Date(a.date));
          }
          return {
            limit: (limitNum) => {
              const limited = results.slice(0, limitNum);
              console.log(`Mock find returning ${limited.length} results`);
              return Promise.resolve(limited);
            }
          };
        }
      };
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
      console.log(`Mock create for ${name}:`, data);
      const item = { ...data, _id: Date.now().toString(), created_at: new Date() };
      collection.push(item);
      console.log(`Mock created item, collection now has ${collection.length} items`);
      return Promise.resolve(item);
    },
    insertMany: (dataArray) => {
      console.log(`Mock insertMany for ${name}:`, dataArray.length, 'items');
      const items = dataArray.map((data, index) => ({
        ...data, 
        _id: (Date.now() + index).toString(),
        created_at: new Date()
      }));
      collection.push(...items);
      console.log(`Mock inserted ${items.length} items, collection now has ${collection.length} items`);
      return Promise.resolve(items);
    },
    aggregate: (pipeline) => {
      // Simple mock aggregation - just return empty array for now
      return Promise.resolve([]);
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