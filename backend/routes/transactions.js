const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET all transactions
router.get('/', (req, res) => {
  const { type, category, startDate, endDate, limit = 100 } = req.query;
  
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single transaction
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json(row);
  });
});

// POST new transaction
router.post('/', (req, res) => {
  const { type, amount, description, category, date } = req.body;
  
  if (!type || !amount || !description || !date) {
    res.status(400).json({ error: 'Missing required fields: type, amount, description, date' });
    return;
  }

  if (!['income', 'expense', 'investment'].includes(type)) {
    res.status(400).json({ error: 'Type must be income, expense, or investment' });
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Amount must be a positive number' });
    return;
  }

  const query = `
    INSERT INTO transactions (type, amount, description, category, date)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [type, amount, description, category || null, date], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Return the created transaction
    db.get('SELECT * FROM transactions WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(row);
    });
  });
});

// PUT update transaction
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { type, amount, description, category, date } = req.body;
  
  if (!type || !amount || !description || !date) {
    res.status(400).json({ error: 'Missing required fields: type, amount, description, date' });
    return;
  }

  if (!['income', 'expense', 'investment'].includes(type)) {
    res.status(400).json({ error: 'Type must be income, expense, or investment' });
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Amount must be a positive number' });
    return;
  }

  const query = `
    UPDATE transactions 
    SET type = ?, amount = ?, description = ?, category = ?, date = ?
    WHERE id = ?
  `;
  
  db.run(query, [type, amount, description, category || null, date, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    // Return the updated transaction
    db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });
});

// DELETE transaction
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  });
});

// GET transaction summary
router.get('/summary/totals', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `
    SELECT 
      type,
      SUM(amount) as total_amount,
      COUNT(*) as count
    FROM transactions 
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY type';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const summary = {
      income: 0,
      expenses: 0,
      investments: 0,
      net: 0
    };
    
    rows.forEach(row => {
      if (row.type === 'income') {
        summary.income = row.total_amount;
      } else if (row.type === 'expense') {
        summary.expenses = row.total_amount;
      } else if (row.type === 'investment') {
        summary.investments = row.total_amount;
      }
    });
    
    summary.net = summary.income - summary.expenses - summary.investments;
    res.json(summary);
  });
});

module.exports = router;