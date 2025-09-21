const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// GET all projects (user-specific)
router.get('/', authenticateToken, (req, res) => {
  const { status, risk_level } = req.query;
  const userId = req.user.id;
  
  let query = 'SELECT * FROM projects WHERE user_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (risk_level) {
    query += ' AND risk_level = ?';
    params.push(risk_level);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single project with returns (user-specific)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [id, userId], (err, project) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get project returns
    db.all('SELECT * FROM project_returns WHERE project_id = ? ORDER BY return_date DESC', [id], (err, returns) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      project.returns = returns;
      project.total_returns = returns.reduce((sum, ret) => sum + ret.return_amount, 0);
      project.actual_return_rate = project.initial_investment > 0 
        ? ((project.total_returns / project.initial_investment) * 100).toFixed(2)
        : 0;
      
      res.json(project);
    });
  });
});

// POST new project (user-specific)
router.post('/', authenticateToken, (req, res) => {
  const { name, description, initial_investment, expected_return, risk_level, duration_months } = req.body;
  const userId = req.user.id;
  
  if (!name || !initial_investment || !expected_return) {
    res.status(400).json({ error: 'Missing required fields: name, initial_investment, expected_return' });
    return;
  }

  if (isNaN(initial_investment) || initial_investment <= 0) {
    res.status(400).json({ error: 'Initial investment must be a positive number' });
    return;
  }

  if (isNaN(expected_return)) {
    res.status(400).json({ error: 'Expected return must be a number' });
    return;
  }

  if (risk_level && !['low', 'medium', 'high'].includes(risk_level)) {
    res.status(400).json({ error: 'Risk level must be low, medium, or high' });
    return;
  }

  const query = `
    INSERT INTO projects (user_id, name, description, initial_investment, expected_return, risk_level, duration_months)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [userId, name, description || null, initial_investment, expected_return, risk_level || null, duration_months || null], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Return the created project
    db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(row);
    });
  });
});

// PUT update project (user-specific)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, initial_investment, expected_return, risk_level, duration_months, status } = req.body;
  const userId = req.user.id;
  
  if (!name || !initial_investment || !expected_return) {
    res.status(400).json({ error: 'Missing required fields: name, initial_investment, expected_return' });
    return;
  }

  if (isNaN(initial_investment) || initial_investment <= 0) {
    res.status(400).json({ error: 'Initial investment must be a positive number' });
    return;
  }

  if (isNaN(expected_return)) {
    res.status(400).json({ error: 'Expected return must be a number' });
    return;
  }

  if (risk_level && !['low', 'medium', 'high'].includes(risk_level)) {
    res.status(400).json({ error: 'Risk level must be low, medium, or high' });
    return;
  }

  if (status && !['active', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Status must be active, completed, or cancelled' });
    return;
  }

  const query = `
    UPDATE projects 
    SET name = ?, description = ?, initial_investment = ?, expected_return = ?, 
        risk_level = ?, duration_months = ?, status = ?
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [name, description || null, initial_investment, expected_return, 
                 risk_level || null, duration_months || null, status || 'active', id, userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Return the updated project
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });
});

// DELETE project (user-specific)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // First verify the project belongs to the user
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [id, userId], (err, project) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Delete project returns first
    db.run('DELETE FROM project_returns WHERE project_id = ?', [id], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Then delete the project
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        res.json({ message: 'Project deleted successfully' });
      });
    });
  });
});

// POST add project return (user-specific)
router.post('/:id/returns', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { return_amount, return_date, notes } = req.body;
  const userId = req.user.id;
  
  if (!return_amount || !return_date) {
    res.status(400).json({ error: 'Missing required fields: return_amount, return_date' });
    return;
  }

  if (isNaN(return_amount)) {
    res.status(400).json({ error: 'Return amount must be a number' });
    return;
  }

  // Check if project exists and belongs to user
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [id, userId], (err, project) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const query = `
      INSERT INTO project_returns (project_id, return_amount, return_date, notes)
      VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [id, return_amount, return_date, notes || null], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Return the created return entry
      db.get('SELECT * FROM project_returns WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(row);
      });
    });
  });
});

// GET project rankings (user-specific)
router.get('/rankings/best', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      p.*,
      COALESCE(SUM(pr.return_amount), 0) as total_returns,
      CASE 
        WHEN p.initial_investment > 0 
        THEN (COALESCE(SUM(pr.return_amount), 0) / p.initial_investment * 100)
        ELSE 0 
      END as actual_return_rate,
      COUNT(pr.id) as return_count
    FROM projects p
    LEFT JOIN project_returns pr ON p.id = pr.project_id
    WHERE p.status = 'active' AND p.user_id = ?
    GROUP BY p.id
    ORDER BY actual_return_rate DESC, expected_return DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;