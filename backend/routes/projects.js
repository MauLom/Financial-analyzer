const express = require('express');
const router = express.Router();
const { Project, ProjectReturn } = require('../models/database-mongo');

// GET all projects
router.get('/', async (req, res) => {
  try {
    const { status, risk_level } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (risk_level) {
      filter.risk_level = risk_level;
    }
    
    const projects = await Project.find(filter).sort({ created_at: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project with returns
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findById(id).lean();
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get project returns
    const returns = await ProjectReturn.find({ project_id: id }).sort({ return_date: -1 });
    
    project.returns = returns;
    project.total_returns = returns.reduce((sum, ret) => sum + ret.return_amount, 0);
    project.actual_return_rate = project.initial_investment > 0 
      ? ((project.total_returns / project.initial_investment) * 100).toFixed(2)
      : 0;
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new project
router.post('/', async (req, res) => {
  try {
    const { name, description, initial_investment, expected_return, risk_level, duration_months } = req.body;
    
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

    const project = new Project({
      name,
      description: description || null,
      initial_investment: parseFloat(initial_investment),
      expected_return: parseFloat(expected_return),
      risk_level: risk_level || null,
      duration_months: duration_months ? parseInt(duration_months) : null
    });

    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, initial_investment, expected_return, risk_level, duration_months, status } = req.body;
    
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

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        name,
        description: description || null,
        initial_investment: parseFloat(initial_investment),
        expected_return: parseFloat(expected_return),
        risk_level: risk_level || null,
        duration_months: duration_months ? parseInt(duration_months) : null,
        status: status || 'active'
      },
      { new: true }
    );

    if (!updatedProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete project returns first
    await ProjectReturn.deleteMany({ project_id: id });
    
    // Then delete the project
    const deletedProject = await Project.findByIdAndDelete(id);
    
    if (!deletedProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add project return
router.post('/:id/returns', async (req, res) => {
  try {
    const { id } = req.params;
    const { return_amount, return_date, notes } = req.body;
    
    if (!return_amount || !return_date) {
      res.status(400).json({ error: 'Missing required fields: return_amount, return_date' });
      return;
    }

    if (isNaN(return_amount)) {
      res.status(400).json({ error: 'Return amount must be a number' });
      return;
    }

    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const projectReturn = new ProjectReturn({
      project_id: id,
      return_amount: parseFloat(return_amount),
      return_date: new Date(return_date),
      notes: notes || null
    });

    const savedReturn = await projectReturn.save();
    res.status(201).json(savedReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET project rankings
router.get('/rankings/best', async (req, res) => {
  try {
    const rankings = await Project.aggregate([
      { $match: { status: 'active' } },
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
      {
        $sort: { actual_return_rate: -1, expected_return: -1 }
      }
    ]);

    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;