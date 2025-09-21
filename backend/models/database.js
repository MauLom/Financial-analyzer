const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/financial.db');

// Create data directory if it doesn't exist
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create transactions table
  db.serialize(() => {
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
    `);

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
    `);

    // Create project_returns table for tracking actual returns
    db.run(`
      CREATE TABLE IF NOT EXISTS project_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        return_amount REAL NOT NULL,
        return_date TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);

    // Create settings table for inflation, cost of living, etc.
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings
    db.run(`
      INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('inflation_rate', '3.5'),
      ('cost_of_living_increase', '2.8')
    `);
  });
}

module.exports = db;