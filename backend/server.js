const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initializeDatabase } = require('./models/database-mongo');
const transactionRoutes = require('./routes/transactions');
const projectRoutes = require('./routes/projects');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
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
  app.use(express.static(frontendBuildPath));
  
  // Handle React routing, send all non-API routes to index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  app.get('/transactions', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  app.get('/projects', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  app.get('/analytics', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  app.get('/simulator', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  app.get('/settings', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err.message);
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  } else {
    console.log('Starting server anyway in development mode...');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without database)`);
    });
  }
});

module.exports = app;