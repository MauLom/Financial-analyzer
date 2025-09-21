# Financial-analyzer

A comprehensive financial tracking and analysis web application built with Node.js, Express, React, and MongoDB.

## Features

- Transaction tracking (income, expenses, investments)
- Project/investment management
- Financial analytics and insights
- Growth simulation
- **Real-time Market Signals**: Live market indices, economic indicators, and sector performance powered by Alpha Vantage API
- Customizable settings (inflation rates, cost of living)

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm
- MongoDB (local installation) or MongoDB Atlas account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MauLom/Financial-analyzer.git
   cd Financial-analyzer
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   npm run install-frontend
   ```

### Database Setup

This application uses MongoDB as its database. You have several options:

#### Option 1: Local MongoDB
Install MongoDB on your system:
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

#### Option 2: MongoDB Atlas (Cloud)
1. Sign up at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Get your connection string

#### Option 3: Docker
```bash
docker run --name mongodb -p 27017:27017 -d mongo:latest
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to configure your local environment:
   ```bash
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/financial_analyzer
   
   # For MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_analyzer
   
   # Backend Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend Configuration (for development)
   REACT_APP_API_URL=http://localhost:5000/api
   ```

   **Available Environment Variables:**
   - `MONGODB_URI`: MongoDB connection string (required)
   - `PORT`: Server port (default: 5000)
   - `NODE_ENV`: Node environment (development, production, test)
   - `REACT_APP_API_URL`: Frontend API base URL (default: http://localhost:5000/api)
   - `ALPHA_VANTAGE_API_KEY`: Alpha Vantage API key for market data (optional - falls back to demo data)

   **Alpha Vantage Integration:**
   To enable real-time market signals on the dashboard, get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key) and add it to your `.env` file:
   ```bash
   ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```
   Without an API key, the system displays demo financial data for testing purposes.

### Generate Sample Data

To populate your database with sample data for testing:

```bash
npm run generate-dummy-data
```

This will create sample transactions, projects, returns, and settings.

### Running the Application

#### Development Mode

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev-frontend
   ```

3. Open your browser and navigate to `http://localhost:3000`

#### Production Mode

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:5000`

## Database

The application uses MongoDB with Mongoose ODM for data storage. The database connection will be automatically established when you start the application. You can customize the database connection by setting the `MONGODB_URI` environment variable in your `.env` file.

### Collections

- **transactions**: User financial transactions (income, expenses, investments)
- **projects**: Investment projects and their details
- **projectreturns**: Returns/dividends from investment projects
- **settings**: Application configuration (inflation rates, cost of living)

## API Endpoints

The application provides RESTful API endpoints:

- `/health` - Health check
- `/api/transactions` - Transaction management
- `/api/projects` - Project/investment management  
- `/api/analytics` - Analytics and insights

For detailed API documentation, see the [MongoDB Migration Guide](MONGODB_MIGRATION.md).

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build the frontend for production
- `npm run generate-dummy-data` - Create sample data for testing
- `npm run validate-migration` - Validate MongoDB setup
- `npm run test-api` - Test all API endpoints

## Testing

Run the following commands to test your setup:

1. Validate the MongoDB migration: `npm run validate-migration`
2. Generate sample data: `npm run generate-dummy-data`
3. Test API endpoints: `npm run test-api`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

ISC