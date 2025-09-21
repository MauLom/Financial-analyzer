const express = require('express');
const router = express.Router();
const { Transaction } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// GET all transactions (user-specific)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 100 } = req.query;
    const userId = req.user.id;
    
    let filter = { user_id: userId };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1, created_at: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single transaction (user-specific)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const transaction = await Transaction.findOne({ _id: id, user_id: userId });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new transaction (user-specific)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;
    const userId = req.user.id;
    
    if (!type || !amount || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields: type, amount, description, date' });
    }

    if (!['income', 'expense', 'investment'].includes(type)) {
      return res.status(400).json({ error: 'Type must be income, expense, or investment' });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const transactionData = {
      user_id: userId,
      type,
      amount: parseFloat(amount),
      description,
      category: category || undefined,
      date: new Date(date)
    };
    
    const newTransaction = await Transaction.create(transactionData);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update transaction (user-specific)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, description, category, date } = req.body;
    const userId = req.user.id;
    
    if (!type || !amount || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields: type, amount, description, date' });
    }

    if (!['income', 'expense', 'investment'].includes(type)) {
      return res.status(400).json({ error: 'Type must be income, expense, or investment' });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const updateData = {
      type,
      amount: parseFloat(amount),
      description,
      category: category || undefined,
      date: new Date(date)
    };
    
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, user_id: userId },
      updateData,
      { new: true }
    );
    
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE transaction (user-specific)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const deletedTransaction = await Transaction.findOneAndDelete({ 
      _id: id, 
      user_id: userId 
    });
    
    if (!deletedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET transaction summary (user-specific)
router.get('/summary/totals', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    let matchFilter = { user_id: userId };
    
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate);
      if (endDate) matchFilter.date.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = summary.map(item => ({
      type: item._id,
      total_amount: item.total_amount,
      count: item.count
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;