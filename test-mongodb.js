const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, mongoose } = require('./backend/models/mongodb');
const { Transaction, Project, ProjectReturn, Setting } = require('./backend/models/database-mongo');

const testMongoDB = async () => {
  let mongoServer;

  try {
    // Start MongoDB Memory Server
    console.log('Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Update connection URI
    process.env.MONGODB_URI = mongoUri;
    console.log('MongoDB Memory Server started:', mongoUri);

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Test creating a transaction
    const testTransaction = new Transaction({
      type: 'income',
      amount: 1000,
      description: 'Test transaction',
      category: 'Test',
      date: new Date()
    });

    const savedTransaction = await testTransaction.save();
    console.log('✅ Transaction created:', savedTransaction._id);

    // Test creating a project
    const testProject = new Project({
      name: 'Test Project',
      description: 'A test investment project',
      initial_investment: 5000,
      expected_return: 8.5,
      risk_level: 'medium',
      duration_months: 12,
      status: 'active'
    });

    const savedProject = await testProject.save();
    console.log('✅ Project created:', savedProject._id);

    // Test creating a project return
    const testReturn = new ProjectReturn({
      project_id: savedProject._id,
      return_amount: 250,
      return_date: new Date(),
      notes: 'Test return'
    });

    const savedReturn = await testReturn.save();
    console.log('✅ Project return created:', savedReturn._id);

    // Test creating settings
    const testSetting = new Setting({
      key: 'test_setting',
      value: '42'
    });

    const savedSetting = await testSetting.save();
    console.log('✅ Setting created:', savedSetting.key);

    // Test querying
    const transactions = await Transaction.find({});
    const projects = await Project.find({});
    const returns = await ProjectReturn.find({});
    const settings = await Setting.find({});

    console.log('\n📊 Database Contents:');
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Project Returns: ${returns.length}`);
    console.log(`- Settings: ${settings.length}`);

    // Test aggregation query
    const transactionSummary = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Transaction Summary:', transactionSummary);

    console.log('\n✅ All MongoDB tests passed!');

  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
  } finally {
    // Cleanup
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      console.log('MongoDB Memory Server stopped');
    }

    process.exit(0);
  }
};

// Run the test
testMongoDB();