const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const { Transaction } = require('../models/database-fallback');
const { authenticateToken } = require('../middleware/auth');

// Mock user for testing (remove in production)
const mockUser = { id: 'test-user-123' };

// Temporary middleware to bypass auth for testing
const testAuthMiddleware = process.env.NODE_ENV === 'test' ? 
  (req, res, next) => { req.user = mockUser; next(); } : 
  authenticateToken;

// Configure multer for file uploads
const upload = multer({ 
  dest: '/tmp/', 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET all transactions (user-specific)
router.get('/', testAuthMiddleware, async (req, res) => {
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

// GET CSV template for transactions
router.get('/template', (req, res) => {
  const csvHeaders = 'type,amount,description,category,date\n';
  const sampleData = [
    'income,5000,Monthly Salary,Salary,2024-01-15',
    'expense,150,Grocery Shopping,Food,2024-01-16',
    'expense,80,Gas Station,Transportation,2024-01-17',
    'investment,2000,Stock Purchase - AAPL,Stocks,2024-01-18',
    'income,500,Freelance Work,Freelance,2024-01-19'
  ].join('\n');

  const csvContent = csvHeaders + sampleData;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transaction_template.csv"');
  res.send(csvContent);
});

// GET single transaction (user-specific)
router.get('/:id', testAuthMiddleware, async (req, res) => {
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
router.post('/', testAuthMiddleware, async (req, res) => {
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
router.put('/:id', testAuthMiddleware, async (req, res) => {
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
router.delete('/:id', testAuthMiddleware, async (req, res) => {
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

// POST CSV file upload for bulk transactions
router.post('/upload-csv', testAuthMiddleware, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const userId = req.user.id;
    const filePath = req.file.path;
    const transactions = [];
    const errors = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      let rowIndex = 0;
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowIndex++;
          
          // Normalize column names (case-insensitive)
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });

          const { type, amount, description, category, date } = normalizedRow;
          
          // Validate required fields
          if (!type || !amount || !description || !date) {
            errors.push({
              row: rowIndex,
              error: 'Missing required fields: type, amount, description, date',
              data: normalizedRow
            });
            return;
          }

          // Validate type
          const normalizedType = type.toLowerCase().trim();
          if (!['income', 'expense', 'investment'].includes(normalizedType)) {
            errors.push({
              row: rowIndex,
              error: 'Type must be income, expense, or investment',
              data: normalizedRow
            });
            return;
          }

          // Validate amount
          const numericAmount = parseFloat(amount);
          if (isNaN(numericAmount) || numericAmount <= 0) {
            errors.push({
              row: rowIndex,
              error: 'Amount must be a positive number',
              data: normalizedRow
            });
            return;
          }

          // Validate date
          const transactionDate = new Date(date);
          if (isNaN(transactionDate.getTime())) {
            errors.push({
              row: rowIndex,
              error: 'Invalid date format (use YYYY-MM-DD)',
              data: normalizedRow
            });
            return;
          }

          transactions.push({
            user_id: userId,
            type: normalizedType,
            amount: numericAmount,
            description: description.trim(),
            category: category ? category.trim() : undefined,
            date: transactionDate
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (transactions.length === 0) {
      return res.status(400).json({ 
        error: 'No valid transactions found in CSV file',
        errors,
        validCount: 0,
        errorCount: errors.length
      });
    }

    // If there are errors but also valid transactions, allow partial import
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Some transactions failed validation',
        errors,
        validCount: transactions.length,
        errorCount: errors.length,
        message: `${transactions.length} valid transactions found, ${errors.length} errors`
      });
    }

    // Insert all valid transactions
    const createdTransactions = await Transaction.insertMany(transactions);
    
    res.status(201).json({
      message: `Successfully imported ${createdTransactions.length} transactions from CSV`,
      count: createdTransactions.length,
      transactions: createdTransactions
    });
    
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// POST bulk transactions (user-specific)
router.post('/bulk', testAuthMiddleware, async (req, res) => {
  try {
    const { transactions } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Transactions array is required and cannot be empty' });
    }

    if (transactions.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 transactions allowed per bulk import' });
    }

    const errors = [];
    const validTransactions = [];

    // Validate each transaction
    transactions.forEach((transaction, index) => {
      const { type, amount, description, category, date } = transaction;
      
      if (!type || !amount || !description || !date) {
        errors.push({
          row: index + 1,
          error: 'Missing required fields: type, amount, description, date'
        });
        return;
      }

      if (!['income', 'expense', 'investment'].includes(type)) {
        errors.push({
          row: index + 1,
          error: 'Type must be income, expense, or investment'
        });
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        errors.push({
          row: index + 1,
          error: 'Amount must be a positive number'
        });
        return;
      }

      // Validate date format
      const transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        errors.push({
          row: index + 1,
          error: 'Invalid date format'
        });
        return;
      }

      validTransactions.push({
        user_id: userId,
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        category: category ? category.trim() : undefined,
        date: transactionDate
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed for some transactions',
        errors,
        validCount: validTransactions.length,
        errorCount: errors.length
      });
    }

    // Insert all valid transactions
    const createdTransactions = await Transaction.insertMany(validTransactions);
    
    res.status(201).json({
      message: `Successfully created ${createdTransactions.length} transactions`,
      count: createdTransactions.length,
      transactions: createdTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET transaction summary (user-specific)
router.get('/summary/totals', testAuthMiddleware, async (req, res) => {
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