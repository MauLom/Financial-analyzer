// API Testing Script for MongoDB Migration
// Run this script after starting the server with a MongoDB connection

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testAPI = async () => {
  console.log('🧪 Testing Financial Analyzer API with MongoDB...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);

    // Test 2: Get All Transactions (should be empty initially)
    console.log('\n2. Testing transactions endpoint...');
    const transactionsResponse = await axios.get(`${BASE_URL}/api/transactions`);
    console.log(`✅ Transactions endpoint: ${transactionsResponse.data.length} transactions found`);

    // Test 3: Create a Transaction
    console.log('\n3. Testing create transaction...');
    const newTransaction = {
      type: 'income',
      amount: 2500,
      description: 'API Test Transaction',
      category: 'Testing',
      date: new Date().toISOString().split('T')[0]
    };

    const createTransactionResponse = await axios.post(`${BASE_URL}/api/transactions`, newTransaction);
    console.log('✅ Transaction created:', createTransactionResponse.data._id);

    // Test 4: Get All Projects
    console.log('\n4. Testing projects endpoint...');
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`);
    console.log(`✅ Projects endpoint: ${projectsResponse.data.length} projects found`);

    // Test 5: Create a Project
    console.log('\n5. Testing create project...');
    const newProject = {
      name: 'API Test Project',
      description: 'A project created via API test',
      initial_investment: 10000,
      expected_return: 7.5,
      risk_level: 'medium',
      duration_months: 24
    };

    const createProjectResponse = await axios.post(`${BASE_URL}/api/projects`, newProject);
    console.log('✅ Project created:', createProjectResponse.data._id);

    // Test 6: Analytics Overview
    console.log('\n6. Testing analytics overview...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/analytics/overview?months=12`);
    console.log('✅ Analytics overview:', {
      transactionSummary: analyticsResponse.data.transaction_summary,
      projectSummary: analyticsResponse.data.project_summary
    });

    // Test 7: Transaction Summary
    console.log('\n7. Testing transaction summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/api/transactions/summary/totals`);
    console.log('✅ Transaction summary:', summaryResponse.data);

    // Test 8: Monthly Trends
    console.log('\n8. Testing monthly trends...');
    const trendsResponse = await axios.get(`${BASE_URL}/api/analytics/trends/monthly?months=6`);
    console.log(`✅ Monthly trends: ${trendsResponse.data.length} months of data`);

    // Test 9: Category Breakdown
    console.log('\n9. Testing category breakdown...');
    const categoryResponse = await axios.get(`${BASE_URL}/api/analytics/breakdown/categories?type=income&months=12`);
    console.log(`✅ Category breakdown: ${categoryResponse.data.length} categories`);

    // Test 10: Settings
    console.log('\n10. Testing settings...');
    const settingsResponse = await axios.get(`${BASE_URL}/api/analytics/settings`);
    console.log('✅ Settings:', settingsResponse.data);

    console.log('\n🎉 All API tests completed successfully!');
    console.log('🔥 MongoDB migration is working correctly!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure to:');
      console.log('1. Start MongoDB instance');
      console.log('2. Set MONGODB_URI in .env file'); 
      console.log('3. Run: npm run generate-dummy-data');
      console.log('4. Start server: npm start');
      console.log('5. Then run this test script');
    }
  }
};

// Only run if axios is available (needs to be installed)
if (require.resolve('axios')) {
  testAPI();
} else {
  console.log('❌ axios not found. Install with: npm install axios');
  console.log('This script will test all API endpoints once the server is running with MongoDB.');
}