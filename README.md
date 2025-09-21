# Financial-analyzer

A comprehensive financial tracking and analysis web application built with Node.js, Express, React, and SQLite.

## Features

- Transaction tracking (income, expenses, investments)
- Project/investment management
- Financial analytics and insights
- Growth simulation
- Customizable settings (inflation rates, cost of living)

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm

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

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to configure your local environment:
   ```bash
   # Backend Configuration
   PORT=5000
   DB_PATH=./backend/data/financial.db
   NODE_ENV=development
   
   # Frontend Configuration (for development)
   REACT_APP_API_URL=http://localhost:5000/api
   ```

   **Available Environment Variables:**
   - `PORT`: Server port (default: 5000)
   - `DB_PATH`: SQLite database file path (default: ./backend/data/financial.db)
   - `NODE_ENV`: Node environment (development, production, test)
   - `REACT_APP_API_URL`: Frontend API base URL (default: http://localhost:5000/api)

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

The application uses SQLite for data storage. The database file will be automatically created when you first run the application. You can customize the database location by setting the `DB_PATH` environment variable in your `.env` file.

## API Endpoints

The application provides RESTful API endpoints:

- `/health` - Health check
- `/api/transactions` - Transaction management
- `/api/projects` - Project/investment management  
- `/api/analytics` - Analytics and insights

## Testing

Currently, the application doesn't have automated tests configured. This is a known area for improvement.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

ISC