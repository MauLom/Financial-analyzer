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