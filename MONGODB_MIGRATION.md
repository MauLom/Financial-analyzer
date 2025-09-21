# MongoDB Migration Guide


The Financial Analyzer application has been successfully migrated from SQLite to MongoDB. This document outlines the changes made and how to set up the application with MongoDB.

## Changes Made

### Backend Changes

1. **Database Configuration** (`backend/models/database.js`):
   - Replaced SQLite with MongoDB using Mongoose ODM
   - Created Mongoose schemas for all data models:
     - Users (authentication)
     - Transactions (income, expenses, investments)  
     - Projects (investment tracking)
     - Project Returns (project performance tracking)
     - Settings (application configuration)

2. **Authentication Routes** (`backend/routes/auth.js`):
   - Updated to use Mongoose models instead of SQLite queries
   - Enhanced user creation and authentication with MongoDB operations
   - Improved OAuth integration with MongoDB user lookups

3. **Transaction Routes** (`backend/routes/transactions.js`):
   - Converted all SQL queries to MongoDB operations using Mongoose
   - Added proper async/await error handling
   - Enhanced filtering and aggregation using MongoDB query language

4. **Project Routes** (`backend/routes/projects.js`):
   - Migrated project CRUD operations to MongoDB
   - Updated project returns tracking with MongoDB relationships
   - Improved project rankings using MongoDB aggregation pipeline

5. **Analytics Routes** (`backend/routes/analytics.js`):
   - Converted complex SQL queries to MongoDB aggregation pipelines
   - Enhanced financial overview calculations
   - Improved monthly trends and category breakdowns with MongoDB operations

### Database Schema

The MongoDB schema maintains the same logical structure as the previous SQLite database:

- **Users Collection**: User authentication and profile information
- **Transactions Collection**: Financial transactions with user relationships
- **Projects Collection**: Investment projects with user ownership
- **Project Returns Collection**: Performance tracking for projects
- **Settings Collection**: Application configuration

## Setup Instructions

### 1. Install Dependencies

The application now uses `mongoose` instead of `sqlite3`:

```bash
npm install mongoose
npm uninstall sqlite3
```

### 2. MongoDB Configuration

Set the MongoDB connection string in your environment variables:

```bash
# Local MongoDB instance
MONGODB_URI=mongodb://localhost:27017/financial_analyzer

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_analyzer

# MongoDB with authentication
MONGODB_URI=mongodb://username:password@host:port/financial_analyzer
```

### 3. Start MongoDB

For local development, ensure MongoDB is running:

```bash
# Using MongoDB Community Edition
mongod

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Application

```bash
npm start
```

## Data Migration

If you have existing SQLite data that needs to be migrated to MongoDB, you would need to:

1. Export data from SQLite
2. Transform the data to match MongoDB document structure
3. Import the data into MongoDB collections

## Benefits of MongoDB Migration

1. **Scalability**: Better horizontal scaling capabilities
2. **Flexibility**: Schema flexibility for future feature additions
3. **Performance**: Improved query performance with proper indexing
4. **Aggregation**: Powerful aggregation pipeline for analytics
5. **Cloud Ready**: Easy deployment to cloud MongoDB services like Atlas

## MongoDB Features Used

- **Mongoose ODM**: Object Document Mapping for Node.js
- **Schema Validation**: Built-in data validation
- **Aggregation Pipeline**: Complex data analysis and reporting
- **Indexing**: Automatic and custom indexes for performance
- **Relationships**: Document references between collections

The migration maintains full backward compatibility with the existing API while providing the scalability and flexibility benefits of MongoDB.
=======
This document explains the MongoDB migration from SQLite and how to set up and use the new database system.

## Migration Overview

The Financial Analyzer has been successfully migrated from SQLite to MongoDB using Mongoose ODM. This provides better scalability, flexibility, and modern database features.

### What Changed

- **Database**: SQLite → MongoDB
- **ORM**: sqlite3 → Mongoose
- **Schema**: SQL tables → MongoDB collections with Mongoose schemas
- **Queries**: SQL queries → MongoDB queries and aggregation pipelines

## Database Schema

### Collections

1. **transactions**
   - `_id`: ObjectId (auto-generated)
   - `type`: String (income, expense, investment)
   - `amount`: Number
   - `description`: String
   - `category`: String (optional)
   - `date`: Date
   - `created_at`: Date (auto-generated)

2. **projects**
   - `_id`: ObjectId (auto-generated)
   - `name`: String
   - `description`: String (optional)
   - `initial_investment`: Number
   - `expected_return`: Number
   - `risk_level`: String (low, medium, high)
   - `duration_months`: Number (optional)
   - `status`: String (active, completed, cancelled)
   - `created_at`: Date (auto-generated)

3. **projectreturns**
   - `_id`: ObjectId (auto-generated)
   - `project_id`: ObjectId (references projects)
   - `return_amount`: Number
   - `return_date`: Date
   - `notes`: String (optional)
   - `created_at`: Date (auto-generated)

4. **settings**
   - `_id`: ObjectId (auto-generated)
   - `key`: String (unique)
   - `value`: String
   - `updated_at`: Date (auto-generated)

## Setup Instructions

### 1. MongoDB Installation

Choose one of the following options:

#### Option A: Local MongoDB
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb/brew/mongodb-community  # macOS
```

#### Option B: MongoDB Atlas (Cloud)
1. Sign up at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Get your connection string

#### Option C: Docker
```bash
docker run --name mongodb -p 27017:27017 -d mongo:latest
```

### 2. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection details:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/financial_analyzer

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_analyzer

# Server Configuration
PORT=5000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Generate Sample Data

```bash
npm run generate-dummy-data
```

This will create sample transactions, projects, returns, and settings to test the application.

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Available Scripts

- `npm run validate-migration` - Validate the MongoDB migration setup
- `npm run generate-dummy-data` - Create sample data for testing
- `npm run test-api` - Test all API endpoints (requires running server)
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload

## API Endpoints

All existing API endpoints remain the same. The migration is backward-compatible.

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary/totals` - Get transaction summary

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id` - Get project with returns
- `POST /api/projects/:id/returns` - Add project return
- `GET /api/projects/rankings/best` - Get project rankings

### Analytics
- `GET /api/analytics/overview` - Financial overview
- `GET /api/analytics/trends/monthly` - Monthly trends
- `GET /api/analytics/breakdown/categories` - Category breakdown
- `POST /api/analytics/simulate/growth` - Growth simulation
- `GET /api/analytics/insights/investments` - Investment insights
- `GET /api/analytics/settings` - Get settings
- `PUT /api/analytics/settings` - Update settings

## Migration Benefits

### Performance
- Better query performance with MongoDB indexing
- Horizontal scaling capabilities
- Optimized aggregation pipelines

### Flexibility
- Schema flexibility for future features
- Rich data types (embedded documents, arrays)
- No rigid table structure

### Modern Features
- Built-in data validation with Mongoose
- Middleware support for hooks
- Better error handling and connection management

## Troubleshooting

### Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Test connection
npm run validate-migration
```

### Port Conflicts
If port 27017 is in use, modify the MONGODB_URI in your `.env` file.

### Data Migration
To migrate existing SQLite data to MongoDB:

1. Export data from SQLite
2. Transform to MongoDB format
3. Import using the dummy data generator as a template

### Performance Tuning
```javascript
// Add indexes for frequently queried fields
db.transactions.createIndex({ "date": -1, "type": 1 });
db.projects.createIndex({ "status": 1, "risk_level": 1 });
```

## Development Notes

### Mongoose vs SQLite Differences

| SQLite | MongoDB/Mongoose |
|--------|-----------------|
| `db.run()` | `model.save()` |
| `db.get()` | `model.findOne()` |
| `db.all()` | `model.find()` |
| SQL JOINs | `$lookup` aggregation |
| `WHERE` clauses | Query objects |
| `GROUP BY` | `$group` aggregation |

### Query Examples

```javascript
// SQLite (old)
db.all("SELECT * FROM transactions WHERE type = ? ORDER BY date DESC", ['income'], callback);

// MongoDB (new)
Transaction.find({ type: 'income' }).sort({ date: -1 });
```

### Aggregation Examples

```javascript
// Complex aggregation for project rankings
Project.aggregate([
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
      total_returns: { $sum: '$returns.return_amount' }
    }
  }
]);
```

## Support

If you encounter issues:

1. Run `npm run validate-migration` to check setup
2. Check MongoDB connection and service status
3. Verify environment variables in `.env`
4. Review server logs for specific error messages

The migration maintains full compatibility with the existing frontend and API structure.

