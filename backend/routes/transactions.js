const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// GET all transactions (user-specific)
router.get('/', authenticateToken, (req, res) => {
  const { type, category, startDate, endDate, limit = 100 } = req.query;
  const userId = req.user.id;
  
  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [userId];

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

// GET single transaction (user-specific)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
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

// POST new transaction (user-specific)
router.post('/', authenticateToken, (req, res) => {
  const { type, amount, description, category, date } = req.body;
  const userId = req.user.id;
  
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
    INSERT INTO transactions (user_id, type, amount, description, category, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [userId, type, amount, description, category || null, date], function(err) {
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

// PUT update transaction (user-specific)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type, amount, description, category, date } = req.body;
  const userId = req.user.id;
  
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
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [type, amount, description, category || null, date, id, userId], function(err) {
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

// DELETE transaction (user-specific)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId], function(err) {
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

// GET transaction summary (user-specific)
router.get('/summary/totals', authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;
  
  let query = `
    SELECT 
      type,
      SUM(amount) as total_amount,
      COUNT(*) as count
    FROM transactions 
    WHERE user_id = ?
  `;
  const params = [userId];

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