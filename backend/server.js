const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const transactionRoutes = require('./routes/transactions');
const projectRoutes = require('./routes/projects');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Financial Analyzer API is running' });
});

// Serve React app (only if build exists)
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (require('fs').existsSync(frontendBuildPath)) {
  app.get('/*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;