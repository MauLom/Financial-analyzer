const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET financial overview
router.get('/overview', (req, res) => {
  const { months = 12 } = req.query;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Get transaction summary
  const transactionQuery = `
    SELECT 
      type,
      SUM(amount) as total_amount,
      COUNT(*) as count
    FROM transactions 
    WHERE date >= ?
    GROUP BY type
  `;

  db.all(transactionQuery, [startDateStr], (err, transactionData) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Get project summary
    const projectQuery = `
      SELECT 
        COUNT(*) as total_projects,
        SUM(initial_investment) as total_invested,
        AVG(expected_return) as avg_expected_return,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects
      FROM projects
    `;

    db.get(projectQuery, [], (err, projectData) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get total returns
      const returnsQuery = `
        SELECT SUM(return_amount) as total_returns
        FROM project_returns pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.return_date >= ?
      `;

      db.get(returnsQuery, [startDateStr], (err, returnsData) => {
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

        transactionData.forEach(row => {
          if (row.type === 'income') {
            summary.income = row.total_amount;
          } else if (row.type === 'expense') {
            summary.expenses = row.total_amount;
          } else if (row.type === 'investment') {
            summary.investments = row.total_amount;
          }
        });

        summary.net = summary.income - summary.expenses - summary.investments;

        res.json({
          period_months: parseInt(months),
          transaction_summary: summary,
          project_summary: {
            total_projects: projectData.total_projects || 0,
            total_invested: projectData.total_invested || 0,
            avg_expected_return: projectData.avg_expected_return || 0,
            active_projects: projectData.active_projects || 0,
            completed_projects: projectData.completed_projects || 0,
            total_returns: returnsData.total_returns || 0
          }
        });
      });
    });
  });
});

// GET monthly trends
router.get('/trends/monthly', (req, res) => {
  const { months = 12 } = req.query;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total_amount,
      COUNT(*) as count
    FROM transactions 
    WHERE date >= ?
    GROUP BY strftime('%Y-%m', date), type
    ORDER BY month DESC, type
  `;

  db.all(query, [startDateStr], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Group by month
    const monthlyData = {};
    rows.forEach(row => {
      if (!monthlyData[row.month]) {
        monthlyData[row.month] = {
          month: row.month,
          income: 0,
          expenses: 0,
          investments: 0,
          net: 0
        };
      }
      monthlyData[row.month][row.type === 'expense' ? 'expenses' : row.type] = row.total_amount;
    });

    // Calculate net for each month
    Object.values(monthlyData).forEach(month => {
      month.net = month.income - month.expenses - month.investments;
    });

    res.json(Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)));
  });
});

// GET category breakdown
router.get('/breakdown/categories', (req, res) => {
  const { type = 'expense', months = 12 } = req.query;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  const query = `
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      SUM(amount) as total_amount,
      COUNT(*) as count,
      AVG(amount) as avg_amount
    FROM transactions 
    WHERE type = ? AND date >= ?
    GROUP BY category
    ORDER BY total_amount DESC
  `;

  db.all(query, [type, startDateStr], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST simulate capital growth
router.post('/simulate/growth', (req, res) => {
  const { 
    initial_amount = 0, 
    monthly_investment = 0, 
    annual_return_rate = 7, 
    years = 10,
    inflation_rate = 3.5 
  } = req.body;

  if (isNaN(initial_amount) || isNaN(monthly_investment) || isNaN(annual_return_rate) || isNaN(years)) {
    res.status(400).json({ error: 'All parameters must be valid numbers' });
    return;
  }

  const monthlyReturnRate = annual_return_rate / 100 / 12;
  const monthlyInflationRate = inflation_rate / 100 / 12;
  const totalMonths = years * 12;
  const simulation = [];

  let currentAmount = parseFloat(initial_amount);
  let totalInvested = parseFloat(initial_amount);
  let realValue = parseFloat(initial_amount);

  for (let month = 0; month <= totalMonths; month++) {
    if (month > 0) {
      // Add monthly investment
      currentAmount += parseFloat(monthly_investment);
      totalInvested += parseFloat(monthly_investment);
      
      // Apply growth
      currentAmount *= (1 + monthlyReturnRate);
      
      // Calculate real value (adjusted for inflation)
      realValue = currentAmount / Math.pow(1 + monthlyInflationRate, month);
    }

    simulation.push({
      month,
      year: Math.floor(month / 12),
      nominal_value: Math.round(currentAmount * 100) / 100,
      real_value: Math.round(realValue * 100) / 100,
      total_invested: Math.round(totalInvested * 100) / 100,
      gains: Math.round((currentAmount - totalInvested) * 100) / 100,
      return_rate: totalInvested > 0 ? Math.round(((currentAmount - totalInvested) / totalInvested * 100) * 100) / 100 : 0
    });
  }

  res.json({
    parameters: {
      initial_amount,
      monthly_investment,
      annual_return_rate,
      years,
      inflation_rate
    },
    simulation,
    summary: {
      final_nominal_value: simulation[simulation.length - 1].nominal_value,
      final_real_value: simulation[simulation.length - 1].real_value,
      total_invested: simulation[simulation.length - 1].total_invested,
      total_gains: simulation[simulation.length - 1].gains,
      final_return_rate: simulation[simulation.length - 1].return_rate
    }
  });
});

// GET investment insights
router.get('/insights/investments', (req, res) => {
  const query = `
    SELECT 
      p.*,
      COALESCE(SUM(pr.return_amount), 0) as total_returns,
      CASE 
        WHEN p.initial_investment > 0 
        THEN (COALESCE(SUM(pr.return_amount), 0) / p.initial_investment * 100)
        ELSE 0 
      END as actual_return_rate,
      COUNT(pr.id) as return_count,
      CASE 
        WHEN p.expected_return > 0 AND p.initial_investment > 0
        THEN ((COALESCE(SUM(pr.return_amount), 0) / p.initial_investment * 100) / p.expected_return * 100)
        ELSE 0
      END as performance_ratio
    FROM projects p
    LEFT JOIN project_returns pr ON p.id = pr.project_id
    GROUP BY p.id
    ORDER BY performance_ratio DESC
  `;

  db.all(query, [], (err, projects) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Calculate insights
    const insights = {
      best_performing: projects.filter(p => p.performance_ratio > 100).slice(0, 5),
      underperforming: projects.filter(p => p.performance_ratio > 0 && p.performance_ratio < 80).slice(0, 5),
      high_risk_high_return: projects.filter(p => p.risk_level === 'high' && p.expected_return > 10),
      diversification_score: calculateDiversificationScore(projects),
      total_portfolio_value: projects.reduce((sum, p) => sum + p.initial_investment + (p.total_returns || 0), 0),
      avg_portfolio_return: projects.length > 0 ? 
        projects.reduce((sum, p) => sum + (p.actual_return_rate || 0), 0) / projects.length : 0
    };

    res.json(insights);
  });
});

function calculateDiversificationScore(projects) {
  if (projects.length === 0) return 0;
  
  const riskLevels = { low: 0, medium: 0, high: 0 };
  projects.forEach(p => {
    if (p.risk_level) riskLevels[p.risk_level]++;
  });
  
  const totalProjects = projects.length;
  const diversificationFactors = [
    riskLevels.low / totalProjects,
    riskLevels.medium / totalProjects,
    riskLevels.high / totalProjects
  ].filter(factor => factor > 0);
  
  // Higher score for more even distribution across risk levels
  return Math.round((diversificationFactors.length / 3) * 100);
}

// GET settings
router.get('/settings', (req, res) => {
  db.all('SELECT * FROM settings', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  });
});

// PUT update settings
router.put('/settings', (req, res) => {
  const { inflation_rate, cost_of_living_increase } = req.body;
  
  const updates = [];
  if (inflation_rate !== undefined) {
    updates.push(['inflation_rate', inflation_rate]);
  }
  if (cost_of_living_increase !== undefined) {
    updates.push(['cost_of_living_increase', cost_of_living_increase]);
  }
  
  if (updates.length === 0) {
    res.status(400).json({ error: 'No settings to update' });
    return;
  }
  
  let completed = 0;
  let hasError = false;
  
  updates.forEach(([key, value]) => {
    db.run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key], (err) => {
      if (err && !hasError) {
        hasError = true;
        res.status(500).json({ error: err.message });
        return;
      }
      
      completed++;
      if (completed === updates.length && !hasError) {
        // Return updated settings
        db.all('SELECT * FROM settings', [], (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          const settings = {};
          rows.forEach(row => {
            settings[row.key] = row.value;
          });
          
          res.json(settings);
        });
      }
    });
  });
});

module.exports = router;