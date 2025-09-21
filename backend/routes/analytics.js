const express = require('express');
const router = express.Router();

const { Transaction, Project, ProjectReturn, Settings } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET financial overview (user-specific)
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const userId = req.user.id;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get transaction summary

    const transactionSummary = await Transaction.aggregate([
      { 
        $match: { 
          user_id: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },

      {
        $group: {
          _id: '$type',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get project summary

    const projectSummary = await Project.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },

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


    // Get total returns from project returns
    const totalReturns = await ProjectReturn.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $match: {
          'project.user_id': new mongoose.Types.ObjectId(userId),
          return_date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total_returns: { $sum: '$return_amount' }
        }
      }
    ]);

    // Format transaction summary
    const formattedTransactionSummary = {
      income: 0,
      expenses: 0,
      investments: 0,
      net: 0
    };

    transactionSummary.forEach(item => {
      if (item._id === 'income') {
        formattedTransactionSummary.income = item.total_amount;
      } else if (item._id === 'expense') {
        formattedTransactionSummary.expenses = item.total_amount;
      } else if (item._id === 'investment') {
        formattedTransactionSummary.investments = item.total_amount;
      }
    });

    formattedTransactionSummary.net = 
      formattedTransactionSummary.income - 
      formattedTransactionSummary.expenses - 
      formattedTransactionSummary.investments;

    // Format project summary
    const formattedProjectSummary = projectSummary.length > 0 ? {
      total_projects: projectSummary[0].total_projects || 0,
      total_invested: projectSummary[0].total_invested || 0,
      avg_expected_return: projectSummary[0].avg_expected_return || 0,
      active_projects: projectSummary[0].active_projects || 0,
      completed_projects: projectSummary[0].completed_projects || 0,
      total_returns: totalReturns.length > 0 ? totalReturns[0].total_returns : 0
    } : {
      total_projects: 0,
      total_invested: 0,
      avg_expected_return: 0,
      active_projects: 0,
      completed_projects: 0,
      total_returns: 0
    };

    res.json({
      period_months: parseInt(months),
      transaction_summary: formattedTransactionSummary,
      project_summary: formattedProjectSummary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET monthly trends (user-specific)
router.get('/trends/monthly', authenticateToken, async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const userId = req.user.id;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await Transaction.aggregate([
      { 
        $match: { 
          user_id: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total_amount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total_amount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total_amount', 0]
            }
          },
          investments: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'investment'] }, '$total_amount', 0]
            }
          }
        }
      },
      {
        $addFields: {
          net: { $subtract: [{ $subtract: ['$income', '$expenses'] }, '$investments'] },
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]}
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);


    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET category breakdown (user-specific)
router.get('/breakdown/categories', authenticateToken, async (req, res) => {
  try {
    const { type = 'expense', months = 12 } = req.query;
    const userId = req.user.id;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const breakdown = await Transaction.aggregate([
      { 
        $match: { 
          user_id: new mongoose.Types.ObjectId(userId),
          type: type,
          date: { $gte: startDate },
          category: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$category',
          total_amount: { $sum: '$amount' },
          count: { $sum: 1 },
          avg_amount: { $avg: '$amount' }
        }
      },
      {
        $project: {
          category: '$_id',
          total_amount: 1,
          count: 1,
          avg_amount: { $round: ['$avg_amount', 2] }
        }
      },
      { $sort: { total_amount: -1 } }
    ]);

    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST growth simulation
router.post('/simulate/growth', (req, res) => {
  try {
    const {
      initial_amount = 1000,
      monthly_investment = 100,
      annual_return_rate = 7,
      years = 10,
      inflation_rate = 3
    } = req.body;

    const months = years * 12;
    const monthly_return_rate = annual_return_rate / 100 / 12;
    const monthly_inflation_rate = inflation_rate / 100 / 12;

    let nominal_value = initial_amount;
    let total_invested = initial_amount;
    const simulation = [];

    for (let month = 1; month <= months; month++) {
      // Add monthly investment
      nominal_value += monthly_investment;
      total_invested += monthly_investment;
      
      // Apply return
      nominal_value *= (1 + monthly_return_rate);
      
      // Calculate real value (adjusted for inflation)
      const real_value = nominal_value / Math.pow(1 + monthly_inflation_rate, month);
      
      const gains = nominal_value - total_invested;
      const return_rate = total_invested > 0 ? (gains / total_invested) * 100 : 0;

      if (month % 12 === 0 || month === months) {
        simulation.push({
          month,
          year: Math.ceil(month / 12),
          nominal_value: Math.round(nominal_value * 100) / 100,
          real_value: Math.round(real_value * 100) / 100,
          total_invested,
          gains: Math.round(gains * 100) / 100,
          return_rate: Math.round(return_rate * 100) / 100
        });
      }
    }

    const final_simulation = simulation[simulation.length - 1];
    
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
        final_nominal_value: final_simulation.nominal_value,
        final_real_value: final_simulation.real_value,
        total_invested: final_simulation.total_invested,
        total_gains: final_simulation.gains,
        final_return_rate: final_simulation.return_rate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET investment insights (user-specific)
router.get('/insights/investments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all projects with their returns
    const projects = await Project.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },

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

          }
        }
      }
    ]);

    if (projects.length === 0) {
      return res.json({
        best_performing: [],
        underperforming: [],
        high_risk_high_return: [],
        diversification_score: 0,
        total_portfolio_value: 0,
        avg_portfolio_return: 0
      });
    }


    // Sort projects by performance
    const sortedProjects = projects.sort((a, b) => b.actual_return_rate - a.actual_return_rate);


    // Get best performing (top 3 or all if less than 3)
    const best_performing = sortedProjects.slice(0, Math.min(3, projects.length));

    // Get underperforming (actual return < expected return)
    const underperforming = projects.filter(p => p.actual_return_rate < p.expected_return);


    // Get high risk, high return projects
    const high_risk_high_return = projects.filter(p => 
      p.risk_level === 'high' && p.actual_return_rate > p.expected_return
    );

    // Calculate diversification score
    const riskLevels = { low: 0, medium: 0, high: 0 };
    projects.forEach(p => {
      if (p.risk_level) riskLevels[p.risk_level]++;
    });

    const diversificationFactors = [
      riskLevels.low / projects.length,
      riskLevels.medium / projects.length,
      riskLevels.high / projects.length
    ].filter(factor => factor > 0);

    const diversification_score = Math.round((diversificationFactors.length / 3) * 100);

    // Calculate portfolio metrics
    const total_portfolio_value = projects.reduce((sum, p) => sum + p.initial_investment + p.total_returns, 0);
    const avg_portfolio_return = projects.length > 0 
      ? projects.reduce((sum, p) => sum + p.actual_return_rate, 0) / projects.length
      : 0;

    res.json({
      best_performing,
      underperforming,
      high_risk_high_return,
      diversification_score,
      total_portfolio_value: Math.round(total_portfolio_value * 100) / 100,
      avg_portfolio_return: Math.round(avg_portfolio_return * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET settings
router.get('/settings', async (req, res) => {
  try {

    const settings = await Settings.find({});

    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);

  } catch (error) {
    res.status(500).json({ error: error.message });

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

      return res.status(400).json({ error: 'No settings to update' });
    }
    
    // Update settings
    await Promise.all(updates.map(([key, value]) =>
      Settings.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      )
    ));
    
    // Return updated settings
    const allSettings = await Settings.find({});
    const settingsObj = {};
    allSettings.forEach(setting => {

      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);

  } catch (error) {
    res.status(500).json({ error: error.message });

  }
});

module.exports = router;