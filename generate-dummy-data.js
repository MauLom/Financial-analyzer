require('dotenv').config();

const { connectDB } = require('./backend/models/mongodb');
const Transaction = require('./backend/models/Transaction');
const Project = require('./backend/models/Project');
const ProjectReturn = require('./backend/models/ProjectReturn');
const Setting = require('./backend/models/Setting');

const generateDummyData = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Transaction.deleteMany({});
    await ProjectReturn.deleteMany({});
    await Project.deleteMany({});
    await Setting.deleteMany({});
    console.log('Cleared existing data');

    // Generate dummy transactions
    const transactions = [
      // Income transactions
      { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'Salary', date: new Date('2024-01-01') },
      { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'Salary', date: new Date('2024-02-01') },
      { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'Salary', date: new Date('2024-03-01') },
      { type: 'income', amount: 1500, description: 'Freelance Project', category: 'Freelance', date: new Date('2024-01-15') },
      { type: 'income', amount: 800, description: 'Dividend Payment', category: 'Investment', date: new Date('2024-02-10') },

      // Expense transactions
      { type: 'expense', amount: 1200, description: 'Rent Payment', category: 'Housing', date: new Date('2024-01-01') },
      { type: 'expense', amount: 1200, description: 'Rent Payment', category: 'Housing', date: new Date('2024-02-01') },
      { type: 'expense', amount: 1200, description: 'Rent Payment', category: 'Housing', date: new Date('2024-03-01') },
      { type: 'expense', amount: 400, description: 'Groceries', category: 'Food', date: new Date('2024-01-05') },
      { type: 'expense', amount: 450, description: 'Groceries', category: 'Food', date: new Date('2024-02-05') },
      { type: 'expense', amount: 380, description: 'Groceries', category: 'Food', date: new Date('2024-03-05') },
      { type: 'expense', amount: 150, description: 'Utility Bills', category: 'Utilities', date: new Date('2024-01-10') },
      { type: 'expense', amount: 180, description: 'Utility Bills', category: 'Utilities', date: new Date('2024-02-10') },
      { type: 'expense', amount: 160, description: 'Utility Bills', category: 'Utilities', date: new Date('2024-03-10') },

      // Investment transactions
      { type: 'investment', amount: 2000, description: 'Stock Purchase - AAPL', category: 'Stocks', date: new Date('2024-01-20') },
      { type: 'investment', amount: 1500, description: 'ETF Purchase - SPY', category: 'ETF', date: new Date('2024-02-15') },
      { type: 'investment', amount: 1000, description: 'Crypto Purchase - BTC', category: 'Crypto', date: new Date('2024-03-01') },
    ];

    await Transaction.insertMany(transactions);
    console.log(`Created ${transactions.length} dummy transactions`);

    // Generate dummy projects
    const projects = [
      {
        name: 'Real Estate Investment - Rental Property',
        description: 'Duplex property for rental income',
        initial_investment: 50000,
        expected_return: 8.5,
        risk_level: 'medium',
        duration_months: 60,
        status: 'active'
      },
      {
        name: 'Tech Startup Investment',
        description: 'Series A investment in fintech startup',
        initial_investment: 25000,
        expected_return: 15.0,
        risk_level: 'high',
        duration_months: 36,
        status: 'active'
      },
      {
        name: 'Government Bonds Portfolio',
        description: '10-year treasury bonds',
        initial_investment: 15000,
        expected_return: 4.2,
        risk_level: 'low',
        duration_months: 120,
        status: 'active'
      },
      {
        name: 'S&P 500 Index Fund',
        description: 'Long-term market index investment',
        initial_investment: 30000,
        expected_return: 10.0,
        risk_level: 'medium',
        duration_months: 240,
        status: 'active'
      },
      {
        name: 'Cryptocurrency Portfolio',
        description: 'Diversified crypto investment',
        initial_investment: 10000,
        expected_return: 20.0,
        risk_level: 'high',
        duration_months: 24,
        status: 'completed'
      }
    ];

    const savedProjects = await Project.insertMany(projects);
    console.log(`Created ${savedProjects.length} dummy projects`);

    // Generate dummy project returns
    const projectReturns = [
      // Real Estate Investment returns
      { project_id: savedProjects[0]._id, return_amount: 2500, return_date: new Date('2024-01-31'), notes: 'Monthly rental income' },
      { project_id: savedProjects[0]._id, return_amount: 2500, return_date: new Date('2024-02-29'), notes: 'Monthly rental income' },
      { project_id: savedProjects[0]._id, return_amount: 2500, return_date: new Date('2024-03-31'), notes: 'Monthly rental income' },

      // Tech Startup returns
      { project_id: savedProjects[1]._id, return_amount: 1250, return_date: new Date('2024-02-15'), notes: 'Quarterly dividend' },

      // Government Bonds returns
      { project_id: savedProjects[2]._id, return_amount: 157.5, return_date: new Date('2024-01-15'), notes: 'Semi-annual interest' },
      { project_id: savedProjects[2]._id, return_amount: 157.5, return_date: new Date('2024-03-15'), notes: 'Semi-annual interest' },

      // S&P 500 returns
      { project_id: savedProjects[3]._id, return_amount: 750, return_date: new Date('2024-01-31'), notes: 'Monthly dividend distribution' },
      { project_id: savedProjects[3]._id, return_amount: 780, return_date: new Date('2024-02-29'), notes: 'Monthly dividend distribution' },
      { project_id: savedProjects[3]._id, return_amount: 720, return_date: new Date('2024-03-31'), notes: 'Monthly dividend distribution' },

      // Cryptocurrency returns (completed project)
      { project_id: savedProjects[4]._id, return_amount: 15000, return_date: new Date('2024-03-01'), notes: 'Portfolio liquidation - 50% gain' },
    ];

    await ProjectReturn.insertMany(projectReturns);
    console.log(`Created ${projectReturns.length} dummy project returns`);

    // Create default settings
    const settings = [
      { key: 'inflation_rate', value: '3.5' },
      { key: 'cost_of_living_increase', value: '2.8' }
    ];

    await Setting.insertMany(settings);
    console.log(`Created ${settings.length} default settings`);

    console.log('✅ Dummy data generation completed successfully!');
    console.log('\nSummary:');
    console.log(`- ${transactions.length} transactions created`);
    console.log(`- ${savedProjects.length} projects created`);
    console.log(`- ${projectReturns.length} project returns created`);
    console.log(`- ${settings.length} settings created`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    process.exit(1);
  }
};

// Run the script
generateDummyData();