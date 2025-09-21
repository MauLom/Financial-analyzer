const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/financial.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Remove existing database to start fresh
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing database file');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error creating database:', err);
  } else {
    console.log('Created new SQLite database for seeding');
    initializeAndSeedDatabase();
  }
});

function initializeAndSeedDatabase() {
  console.log('Initializing database schema...');
  
  db.serialize(() => {
    // Create transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'investment')),
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating transactions table:', err);
      else console.log('Created transactions table');
    });

    // Create projects table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        initial_investment REAL NOT NULL,
        expected_return REAL NOT NULL,
        risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
        duration_months INTEGER,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating projects table:', err);
      else console.log('Created projects table');
    });

    // Create project_returns table
    db.run(`
      CREATE TABLE IF NOT EXISTS project_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        return_amount REAL NOT NULL,
        return_date TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `, (err) => {
      if (err) console.error('Error creating project_returns table:', err);
      else console.log('Created project_returns table');
    });

    // Create settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating settings table:', err);
      else console.log('Created settings table');
      
      // Insert default settings
      db.run(`
        INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('inflation_rate', '3.5'),
        ('cost_of_living_increase', '2.8')
      `, (err) => {
        if (err) console.error('Error inserting default settings:', err);
        else console.log('Inserted default settings');
        
        // Now start seeding data
        seedDatabase();
      });
    });
  });
}

function seedDatabase() {
  console.log('Starting database seeding...');
  
  // Insert dummy transactions
  insertTransactions();
  
  // Insert dummy projects
  insertProjects();
  
  // Insert project returns after projects are created
  setTimeout(() => {
    insertProjectReturns();
  }, 1000);
}

function insertTransactions() {
  console.log('Inserting dummy transactions...');
  
  const transactions = [
    // Income transactions
    { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'salary', date: '2024-09-15' },
    { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'salary', date: '2024-08-15' },
    { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'salary', date: '2024-07-15' },
    { type: 'income', amount: 5000, description: 'Monthly Salary', category: 'salary', date: '2024-06-15' },
    { type: 'income', amount: 1200, description: 'Freelance Web Development', category: 'freelance', date: '2024-09-10' },
    { type: 'income', amount: 800, description: 'Consulting Fee', category: 'consulting', date: '2024-08-25' },
    { type: 'income', amount: 150, description: 'Dividend Payment', category: 'dividends', date: '2024-09-01' },
    { type: 'income', amount: 75, description: 'Interest from Savings', category: 'interest', date: '2024-08-30' },
    { type: 'income', amount: 300, description: 'Side Business Revenue', category: 'business', date: '2024-07-20' },
    
    // Expense transactions
    { type: 'expense', amount: 1200, description: 'Monthly Rent', category: 'housing', date: '2024-09-01' },
    { type: 'expense', amount: 1200, description: 'Monthly Rent', category: 'housing', date: '2024-08-01' },
    { type: 'expense', amount: 1200, description: 'Monthly Rent', category: 'housing', date: '2024-07-01' },
    { type: 'expense', amount: 350, description: 'Groceries', category: 'food', date: '2024-09-12' },
    { type: 'expense', amount: 89, description: 'Gas Bill', category: 'utilities', date: '2024-09-05' },
    { type: 'expense', amount: 125, description: 'Electric Bill', category: 'utilities', date: '2024-09-03' },
    { type: 'expense', amount: 65, description: 'Internet Bill', category: 'utilities', date: '2024-09-01' },
    { type: 'expense', amount: 45, description: 'Phone Bill', category: 'utilities', date: '2024-09-01' },
    { type: 'expense', amount: 89, description: 'Car Insurance', category: 'insurance', date: '2024-09-15' },
    { type: 'expense', amount: 250, description: 'Health Insurance', category: 'insurance', date: '2024-09-01' },
    { type: 'expense', amount: 75, description: 'Gas Station', category: 'transportation', date: '2024-09-08' },
    { type: 'expense', amount: 45, description: 'Restaurant Dinner', category: 'dining', date: '2024-09-14' },
    { type: 'expense', amount: 120, description: 'Clothing Purchase', category: 'shopping', date: '2024-08-28' },
    { type: 'expense', amount: 25, description: 'Coffee Shop', category: 'dining', date: '2024-09-16' },
    { type: 'expense', amount: 15, description: 'Netflix Subscription', category: 'entertainment', date: '2024-09-01' },
    { type: 'expense', amount: 10, description: 'Spotify Subscription', category: 'entertainment', date: '2024-09-01' },
    { type: 'expense', amount: 200, description: 'Gym Membership Annual', category: 'health', date: '2024-08-15' },
    { type: 'expense', amount: 85, description: 'Dental Cleaning', category: 'health', date: '2024-07-22' },
    
    // Investment transactions
    { type: 'investment', amount: 1000, description: 'S&P 500 Index Fund', category: 'stocks', date: '2024-09-01' },
    { type: 'investment', amount: 500, description: 'Tech Stock Portfolio', category: 'stocks', date: '2024-08-15' },
    { type: 'investment', amount: 2000, description: 'Real Estate Investment Trust', category: 'real_estate', date: '2024-07-10' },
    { type: 'investment', amount: 300, description: 'Cryptocurrency Purchase', category: 'crypto', date: '2024-08-05' },
    { type: 'investment', amount: 1500, description: 'Bond Fund Investment', category: 'bonds', date: '2024-06-20' },
    { type: 'investment', amount: 750, description: 'International Fund', category: 'international', date: '2024-07-01' },
    { type: 'investment', amount: 400, description: 'Emergency Fund Deposit', category: 'savings', date: '2024-09-10' },
  ];

  const stmt = db.prepare(`
    INSERT INTO transactions (type, amount, description, category, date)
    VALUES (?, ?, ?, ?, ?)
  `);

  transactions.forEach(transaction => {
    stmt.run([
      transaction.type,
      transaction.amount,
      transaction.description,
      transaction.category,
      transaction.date
    ]);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('Error inserting transactions:', err);
    } else {
      console.log(`Successfully inserted ${transactions.length} transactions`);
    }
  });
}

function insertProjects() {
  console.log('Inserting dummy projects...');
  
  const projects = [
    {
      name: 'Real Estate Development Fund',
      description: 'Investment in commercial real estate development in downtown area. Expected high returns with moderate risk.',
      initial_investment: 25000,
      expected_return: 15.5,
      risk_level: 'medium',
      duration_months: 24,
      status: 'active'
    },
    {
      name: 'Tech Startup Equity',
      description: 'Seed investment in AI-powered fintech startup. High risk, high reward potential.',
      initial_investment: 10000,
      expected_return: 35.0,
      risk_level: 'high',
      duration_months: 60,
      status: 'active'
    },
    {
      name: 'Government Bond Portfolio',
      description: 'Conservative investment in government treasury bonds. Low risk, stable returns.',
      initial_investment: 15000,
      expected_return: 4.2,
      risk_level: 'low',
      duration_months: 36,
      status: 'active'
    },
    {
      name: 'Blue Chip Dividend Stocks',
      description: 'Investment in established companies with consistent dividend payments.',
      initial_investment: 8000,
      expected_return: 8.5,
      risk_level: 'low',
      duration_months: 12,
      status: 'completed'
    },
    {
      name: 'Renewable Energy Fund',
      description: 'Investment in solar and wind energy projects. Growing sector with good long-term prospects.',
      initial_investment: 12000,
      expected_return: 12.3,
      risk_level: 'medium',
      duration_months: 18,
      status: 'active'
    },
    {
      name: 'International Emerging Markets',
      description: 'Diversified fund focusing on emerging market economies. Higher volatility but growth potential.',
      initial_investment: 6000,
      expected_return: 18.7,
      risk_level: 'high',
      duration_months: 30,
      status: 'cancelled'
    },
    {
      name: 'Cryptocurrency Mining Investment',
      description: 'Investment in Bitcoin and Ethereum mining operations. High volatility and regulatory risks.',
      initial_investment: 5000,
      expected_return: 45.0,
      risk_level: 'high',
      duration_months: 12,
      status: 'active'
    },
    {
      name: 'Municipal Bond Fund',
      description: 'Tax-free municipal bonds from AAA-rated cities. Very safe with modest returns.',
      initial_investment: 20000,
      expected_return: 3.8,
      risk_level: 'low',
      duration_months: 48,
      status: 'active'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO projects (name, description, initial_investment, expected_return, risk_level, duration_months, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  projects.forEach(project => {
    stmt.run([
      project.name,
      project.description,
      project.initial_investment,
      project.expected_return,
      project.risk_level,
      project.duration_months,
      project.status
    ]);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('Error inserting projects:', err);
    } else {
      console.log(`Successfully inserted ${projects.length} projects`);
    }
  });
}

function insertProjectReturns() {
  console.log('Inserting project returns...');
  
  // Get project IDs to create returns for
  db.all('SELECT id, name, status FROM projects', (err, projects) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return;
    }

    const projectReturns = [];

    projects.forEach(project => {
      if (project.status === 'completed' || project.status === 'active') {
        switch (project.name) {
          case 'Blue Chip Dividend Stocks':
            // Completed project with full returns
            projectReturns.push(
              { project_id: project.id, return_amount: 200, return_date: '2024-04-15', notes: 'Quarterly dividend payment' },
              { project_id: project.id, return_amount: 220, return_date: '2024-07-15', notes: 'Quarterly dividend payment' },
              { project_id: project.id, return_amount: 8680, return_date: '2024-09-01', notes: 'Final return - project completed' }
            );
            break;
          case 'Real Estate Development Fund':
            // Active project with some returns
            projectReturns.push(
              { project_id: project.id, return_amount: 1250, return_date: '2024-06-30', notes: 'Quarterly distribution' },
              { project_id: project.id, return_amount: 1180, return_date: '2024-09-30', notes: 'Quarterly distribution' }
            );
            break;
          case 'Tech Startup Equity':
            // No returns yet - early stage
            break;
          case 'Government Bond Portfolio':
            projectReturns.push(
              { project_id: project.id, return_amount: 157, return_date: '2024-03-31', notes: 'Quarterly interest payment' },
              { project_id: project.id, return_amount: 158, return_date: '2024-06-30', notes: 'Quarterly interest payment' },
              { project_id: project.id, return_amount: 160, return_date: '2024-09-30', notes: 'Quarterly interest payment' }
            );
            break;
          case 'Renewable Energy Fund':
            projectReturns.push(
              { project_id: project.id, return_amount: 420, return_date: '2024-08-15', notes: 'Semi-annual distribution' }
            );
            break;
          case 'Cryptocurrency Mining Investment':
            projectReturns.push(
              { project_id: project.id, return_amount: 890, return_date: '2024-07-01', notes: 'Mining rewards - Q2' },
              { project_id: project.id, return_amount: 1250, return_date: '2024-08-01', notes: 'Mining rewards - July (bull run)' },
              { project_id: project.id, return_amount: 680, return_date: '2024-09-01', notes: 'Mining rewards - August' }
            );
            break;
          case 'Municipal Bond Fund':
            projectReturns.push(
              { project_id: project.id, return_amount: 190, return_date: '2024-06-30', notes: 'Semi-annual interest' }
            );
            break;
        }
      }
    });

    if (projectReturns.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO project_returns (project_id, return_amount, return_date, notes)
        VALUES (?, ?, ?, ?)
      `);

      projectReturns.forEach(returnData => {
        stmt.run([
          returnData.project_id,
          returnData.return_amount,
          returnData.return_date,
          returnData.notes
        ]);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error inserting project returns:', err);
        } else {
          console.log(`Successfully inserted ${projectReturns.length} project returns`);
          console.log('\n=== Database seeding completed successfully! ===');
          displaySummary();
        }
      });
    } else {
      console.log('No project returns to insert');
      console.log('\n=== Database seeding completed successfully! ===');
      displaySummary();
    }
  });
}

function displaySummary() {
  console.log('\n--- Database Summary ---');
  
  // Count transactions
  db.get('SELECT COUNT(*) as count FROM transactions', (err, row) => {
    if (!err) console.log(`Total transactions: ${row.count}`);
  });
  
  // Count projects
  db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
    if (!err) console.log(`Total projects: ${row.count}`);
  });
  
  // Count project returns
  db.get('SELECT COUNT(*) as count FROM project_returns', (err, row) => {
    if (!err) {
      console.log(`Total project returns: ${row.count}`);
      console.log('\nYour database is now ready for testing!');
      db.close();
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});