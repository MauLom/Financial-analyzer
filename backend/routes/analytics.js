const express = require('express');
const router = express.Router();
const { Transaction, Project, ProjectReturn, Setting } = require('../models/database-mongo');

// GET financial overview
router.get('/overview', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get transaction summary
    const transactionData = await Transaction.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get project summary
    const projectData = await Project.aggregate([
      {
        $group: {
          _id: null,
          total_projects: { $sum: 1 },
          total_invested: { $sum: '$initial_investment' },
          avg_expected_return: { $avg: '$expected_return' },
          active_projects: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completed_projects: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total returns
    const returnsData = await ProjectReturn.aggregate([
      {
        $group: {
          _id: null,
          total_returns: { $sum: '$return_amount' }
        }
      }
    ]);

    const summary = {
      income: 0,
      expenses: 0,
      investments: 0
    };

    transactionData.forEach(row => {
      if (row._id === 'income') {
        summary.income = row.total_amount;
      } else if (row._id === 'expense') {
        summary.expenses = row.total_amount;
      } else if (row._id === 'investment') {
        summary.investments = row.total_amount;
      }
    });

    summary.net = summary.income - summary.expenses - summary.investments;

    const projectSummary = projectData[0] || {
      total_projects: 0,
      total_invested: 0,
      avg_expected_return: 0,
      active_projects: 0,
      completed_projects: 0
    };

    res.json({
      period_months: parseInt(months),
      transaction_summary: summary,
      project_summary: {
        total_projects: projectSummary.total_projects,
        total_invested: projectSummary.total_invested,
        avg_expected_return: projectSummary.avg_expected_return,
        active_projects: projectSummary.active_projects,
        completed_projects: projectSummary.completed_projects,
        total_returns: returnsData[0]?.total_returns || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET monthly trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyData = await Transaction.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
            type: '$type'
          },
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.month': -1, '_id.type': 1 }
      }
    ]);

    // Group by month
    const groupedData = {};
    monthlyData.forEach(row => {
      const month = row._id.month;
      if (!groupedData[month]) {
        groupedData[month] = {
          month: month,
          income: 0,
          expenses: 0,
          investments: 0,
          net: 0
        };
      }

      if (row._id.type === 'income') {
        groupedData[month].income = row.total_amount;
      } else if (row._id.type === 'expense') {
        groupedData[month].expenses = row.total_amount;
      } else if (row._id.type === 'investment') {
        groupedData[month].investments = row.total_amount;
      }
    });

    // Calculate net for each month
    Object.values(groupedData).forEach(month => {
      month.net = month.income - month.expenses - month.investments;
    });

    res.json(Object.values(groupedData).sort((a, b) => a.month.localeCompare(b.month)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET category breakdown
router.get('/breakdown/categories', async (req, res) => {
  try {
    const { type = 'expense', months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const categories = await Transaction.aggregate([
      { 
        $match: { 
          type: type, 
          date: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Uncategorized'] },
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 },
          avg_amount: { $avg: '$amount' }
        }
      },
      {
        $sort: { total_amount: -1 }
      },
      {
        $project: {
          category: '$_id',
          total_amount: 1,
          count: 1,
          avg_amount: 1,
          _id: 0
        }
      }
    ]);

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
router.get('/insights/investments', async (req, res) => {
  try {
    const projects = await Project.aggregate([
      {
        $lookup: {
          from: 'projectreturns',
          localField: '_id',
          foreignField: 'project_id',
          as: 'returns'
        }
      },
      {
        $addFields: {
          total_returns: { $sum: '$returns.return_amount' },
          return_count: { $size: '$returns' },
          actual_return_rate: {
            $cond: {
              if: { $gt: ['$initial_investment', 0] },
              then: {
                $multiply: [
                  { $divide: [{ $sum: '$returns.return_amount' }, '$initial_investment'] },
                  100
                ]
              },
              else: 0
            }
          },
          performance_ratio: {
            $cond: {
              if: { $and: [{ $gt: ['$expected_return', 0] }, { $gt: ['$initial_investment', 0] }] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $multiply: [
                          { $divide: [{ $sum: '$returns.return_amount' }, '$initial_investment'] },
                          100
                        ]
                      },
                      '$expected_return'
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { performance_ratio: -1 }
      }
    ]);

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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find({});
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update settings
router.put('/settings', async (req, res) => {
  try {
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
    
    // Update each setting
    for (const [key, value] of updates) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }
    
    // Return updated settings
    const settings = await Setting.find({});
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;