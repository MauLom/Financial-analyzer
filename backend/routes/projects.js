const express = require('express');
const router = express.Router();

const { Project, ProjectReturn } = require('../models/database-mongo');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET all projects (user-specific)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, risk_level } = req.query;
    const userId = req.user.id;
    
    let filter = { user_id: userId };

    if (status) {
      filter.status = status;
    }

    if (risk_level) {
      filter.risk_level = risk_level;
    }

    const projects = await Project.find(filter).sort({ created_at: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single project with returns (user-specific)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const project = await Project.findOne({ _id: id, user_id: userId }).lean();

    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project returns

    const returns = await ProjectReturn.find({ project_id: id })
      .sort({ return_date: -1 });

    
    project.returns = returns;
    project.total_returns = returns.reduce((sum, ret) => sum + ret.return_amount, 0);
    project.actual_return_rate = project.initial_investment > 0 
      ? ((project.total_returns / project.initial_investment) * 100).toFixed(2)
      : 0;
    
    res.json(project);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new project (user-specific)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, initial_investment, expected_return, risk_level, duration_months } = req.body;
    const userId = req.user.id;
    
    if (!name || !initial_investment || !expected_return) {
      return res.status(400).json({ error: 'Missing required fields: name, initial_investment, expected_return' });
    }

    if (isNaN(initial_investment) || initial_investment <= 0) {
      return res.status(400).json({ error: 'Initial investment must be a positive number' });
    }

    if (isNaN(expected_return)) {
      return res.status(400).json({ error: 'Expected return must be a number' });
    }

    if (risk_level && !['low', 'medium', 'high'].includes(risk_level)) {
      return res.status(400).json({ error: 'Risk level must be low, medium, or high' });
    }

    const projectData = {
      user_id: userId,
      name,
      description: description || undefined,
      initial_investment: parseFloat(initial_investment),
      expected_return: parseFloat(expected_return),
      risk_level: risk_level || undefined,
      duration_months: duration_months ? parseInt(duration_months) : undefined
    };
    
    const newProject = await Project.create(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update project (user-specific)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, initial_investment, expected_return, risk_level, duration_months, status } = req.body;
    const userId = req.user.id;
    
    if (!name || !initial_investment || !expected_return) {
      return res.status(400).json({ error: 'Missing required fields: name, initial_investment, expected_return' });
    }

    if (isNaN(initial_investment) || initial_investment <= 0) {
      return res.status(400).json({ error: 'Initial investment must be a positive number' });
    }

    if (isNaN(expected_return)) {
      return res.status(400).json({ error: 'Expected return must be a number' });
    }

    if (risk_level && !['low', 'medium', 'high'].includes(risk_level)) {
      return res.status(400).json({ error: 'Risk level must be low, medium, or high' });
    }

    if (status && !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active, completed, or cancelled' });
    }

    const updateData = {
      name,
      description: description || undefined,
      initial_investment: parseFloat(initial_investment),
      expected_return: parseFloat(expected_return),
      risk_level: risk_level || undefined,
      duration_months: duration_months ? parseInt(duration_months) : undefined,
      status: status || 'active'
    };
    
    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, user_id: userId },
      updateData,
      { new: true }
    );
    
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE project (user-specific)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // First verify the project belongs to the user
    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete project returns first
    await ProjectReturn.deleteMany({ project_id: id });
    
    // Then delete the project
    await Project.findByIdAndDelete(id);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add project return (user-specific)
router.post('/:id/returns', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { return_amount, return_date, notes } = req.body;
    const userId = req.user.id;
    
    if (!return_amount || !return_date) {
      return res.status(400).json({ error: 'Missing required fields: return_amount, return_date' });
    }

    if (isNaN(return_amount)) {
      return res.status(400).json({ error: 'Return amount must be a number' });
    }

    // Check if project exists and belongs to user
    const project = await Project.findOne({ _id: id, user_id: userId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }


    const returnData = {
      project_id: id,
      return_amount: parseFloat(return_amount),
      return_date: new Date(return_date),
      notes: notes || undefined
    };
    
    const newReturn = await ProjectReturn.create(returnData);
    res.status(201).json(newReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET project rankings (user-specific)
router.get('/rankings/best', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const projects = await Project.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId), status: 'active' } },

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
          }
        }
      },

      { $sort: { actual_return_rate: -1, expected_return: -1 } }
    ]);

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });

  }
});

module.exports = router;