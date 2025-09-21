# Financial Analyzer

Financial Analyzer is a full-stack web application for personal financial management, investment tracking, and growth simulation. Built with Node.js/Express backend, React/TypeScript frontend, and SQLite database.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build Process
- Install backend dependencies: `npm install` (takes ~1-2 seconds)
- Install frontend dependencies: `cd frontend && npm install` (takes ~11 seconds)
- Build for production: `npm run build` -- takes ~24 seconds. NEVER CANCEL. Set timeout to 90+ seconds.
- The build process compiles the React app into `frontend/build/` directory

### Development Workflow
- Start backend server: `npm start` (runs on port 5000)
- Start frontend dev server: `cd frontend && npm start` (runs on port 3000)
- The backend serves both API endpoints and production frontend build if available
- Database is automatically initialized on first run (SQLite at `backend/data/financial.db`)

### Production Deployment
- Build the frontend first: `npm run build` 
- Start production server: `npm start`
- The backend serves both API (`/api/*`) and static frontend files from port 5000
- Access the application at http://localhost:5000 in production mode

## Validation

### Manual Testing Requirements
- ALWAYS run through at least one complete end-to-end scenario after making changes
- Test the simulation feature: navigate to `/simulator`, enter investment parameters, and run simulation
- Verify API functionality by testing the simulation endpoint: 
  ```bash
  curl -X POST http://localhost:5000/api/analytics/simulate/growth \
    -H "Content-Type: application/json" \
    -d '{"initial_amount": 10000, "monthly_investment": 1000, "annual_return_rate": 7, "years": 10, "inflation_rate": 3.5}'
  ```
- Check database functionality by verifying server starts without errors
- Test both development and production modes

### Testing Limitations
- Frontend tests are currently broken due to Jest/axios ESM module compatibility issues
- DO NOT run `npm test` in frontend - it will fail with module import errors
- Focus on manual testing and API validation instead
- The test command `cd frontend && npm test` fails due to axios ESM import issues

### Build Validation
- Build time is consistently ~24 seconds - if it takes much longer, investigate
- Production build creates optimized bundle (~166KB main JS, ~5KB CSS)
- Verify the backend can serve the built frontend correctly

## Common Tasks

### Repository Structure
```
.
├── README.md
├── package.json          # Backend dependencies and scripts
├── backend/
│   ├── server.js         # Express server entry point
│   ├── models/
│   │   └── database.js   # SQLite database setup and initialization
│   └── routes/           # API routes
│       ├── analytics.js  # Financial analytics and simulation APIs
│       ├── projects.js   # Investment project management
│       └── transactions.js # Financial transaction tracking
└── frontend/
    ├── package.json      # Frontend dependencies and React scripts
    ├── public/           # Static assets
    └── src/
        ├── App.tsx       # Main React application component
        ├── pages/        # Page components (Dashboard, Simulator, etc.)
        ├── services/     # API service layer
        ├── components/   # Reusable UI components
        └── utils/        # Utility functions
```

### Key Scripts (Root Level)
- `npm start` - Start production server (port 5000)
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build frontend for production
- `npm run install-frontend` - Install frontend dependencies
- `npm run dev-frontend` - Start frontend dev server

### Key Scripts (Frontend)
- `npm start` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm test` - Run tests (currently broken - DO NOT USE)

### Database Notes
- SQLite database at `backend/data/financial.db`
- Automatically created and initialized on first server start
- Tables: transactions, projects, project_returns, settings
- No manual database setup required

### API Endpoints
- `GET /health` - Health check endpoint
- `POST /api/analytics/simulate/growth` - Investment growth simulation
- `GET /api/analytics/overview` - Financial overview dashboard data
- Transaction, project, and analytics endpoints under `/api/*`

### Key Technologies
- Backend: Node.js, Express, SQLite3, CORS
- Frontend: React 19, TypeScript, Tailwind CSS, Chart.js, React Router
- Development: Nodemon (backend), React Scripts (frontend)

### Environment Requirements
- Node.js (tested with v20.19.5)
- No additional system dependencies required
- Database and data directories are auto-created

### Frontend Development Notes
- Uses Create React App with TypeScript template
- Tailwind CSS for styling
- Chart.js with react-chartjs-2 for data visualization
- React Router for navigation
- Axios for API communication (causes test issues)

### Common Validation Commands
```bash
# Check backend health
curl http://localhost:5000/health

# Test simulation API
curl -X POST http://localhost:5000/api/analytics/simulate/growth \
  -H "Content-Type: application/json" \
  -d '{"initial_amount": 10000, "monthly_investment": 1000, "annual_return_rate": 7, "years": 10}'

# Build and serve production
npm run build && npm start
```

### Important Notes
- NEVER run frontend tests - they will fail due to configuration issues
- Always test changes manually through the web interface
- Build process is fast (~24 seconds) - longer times indicate problems
- Database is auto-created - no manual setup needed
- Production and development servers use different ports (5000 vs 3000)
- Backend automatically serves frontend build if available

### Troubleshooting
- If server won't start, check if database directory exists and is writable
- If frontend build fails, ensure all dependencies are installed
- If API calls fail, verify backend server is running on port 5000
- Frontend dev server proxy issues can be resolved by ensuring backend is running first