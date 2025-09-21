const express = require('express');
const router = express.Router();
const { Transaction } = require('../models/database-mongo');

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 100 } = req.query;
    
    let filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    const transactions = await Transaction.find(filter)
      .sort({ date: -1, created_at: -1 })
      .limit(parseInt(limit));
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single transaction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new transaction
router.post('/', async (req, res) => {
  try {
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

    const transaction = new Transaction({
      type,
      amount: parseFloat(amount),
      description,
      category: category || null,
      date: new Date(date)
    });

    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
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

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      {
        type,
        amount: parseFloat(amount),
        description,
        category: category || null,
        date: new Date(date)
      },
      { new: true }
    );

    if (!updatedTransaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTransaction = await Transaction.findByIdAndDelete(id);
    
    if (!deletedTransaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET transaction summary
router.get('/summary/totals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    const results = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const summary = {
      income: 0,
      expenses: 0,
      investments: 0,
      net: 0
    };
    
    results.forEach(row => {
      if (row._id === 'income') {
        summary.income = row.total_amount;
      } else if (row._id === 'expense') {
        summary.expenses = row.total_amount;
      } else if (row._id === 'investment') {
        summary.investments = row.total_amount;
      }
    });
    
    summary.net = summary.income - summary.expenses - summary.investments;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;