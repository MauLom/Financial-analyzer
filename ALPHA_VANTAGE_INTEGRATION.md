# Alpha Vantage Financial Signals Integration

This document describes the Alpha Vantage API integration for displaying financial market signals on the Financial Analyzer dashboard.

## Overview

The integration adds real-time financial market data to the dashboard, providing users with:
- Major market indices (SPY, QQQ, IWM)
- Economic indicators (Inflation Rate, Federal Funds Rate, Unemployment Rate)
- Sector performance data

## Features

### Market Indices
- **SPY** - S&P 500 ETF
- **QQQ** - NASDAQ-100 ETF  
- **IWM** - Russell 2000 ETF

Each index displays:
- Current price
- Daily change (amount and percentage)
- Trading volume
- Previous close
- Color-coded change indicators (green/red)

### Economic Indicators
- Inflation Rate
- Federal Funds Rate
- Unemployment Rate

Each indicator shows the current value and last update date.

### Sector Performance
Top performing sectors with percentage changes, limited to top 5 sectors.

## Configuration

### Environment Variables
Add your Alpha Vantage API key to your `.env` file:

```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

Get your free API key at: https://www.alphavantage.co/support/#api-key

### Demo Mode
If no API key is configured, the system falls back to demo data to showcase the functionality.

## API Endpoints

### Backend Routes
- `GET /api/analytics/market/indices` - Market indices data
- `GET /api/analytics/market/economic-indicators` - Economic indicators
- `GET /api/analytics/market/sectors` - Sector performance
- `GET /api/analytics/market/demo` - Demo data for testing

### Frontend Integration
The `MarketSignals` component automatically:
1. Attempts to fetch real data from Alpha Vantage
2. Falls back to demo data if real data is unavailable
3. Displays appropriate error messages
4. Shows loading states during data fetching

## Implementation Details

### Backend Service
- `AlphaVantageService` handles API calls with proper error handling
- Timeout protection (10 seconds per request)
- Graceful fallback when API is unavailable

### Frontend Component
- `MarketSignals` React component with responsive grid layout
- Automatic data refresh on component mount
- Error handling with user-friendly messages
- Loading states and empty state handling

### Error Handling
- Network timeouts
- Invalid API responses
- Missing API key scenarios
- Rate limiting (Alpha Vantage has 5 calls/minute for free tier)

## Usage

The MarketSignals component is automatically included in the Dashboard page. No additional configuration is required once the API key is set.

## Rate Limiting

Alpha Vantage free tier limits:
- 5 API calls per minute
- 500 API calls per day

The component makes up to 3 concurrent API calls on load, so it's within the rate limits for normal usage.

## Troubleshooting

### No Data Displayed
1. Check if `ALPHA_VANTAGE_API_KEY` is set in `.env`
2. Verify API key is valid at Alpha Vantage
3. Check browser console for error messages
4. Ensure server has internet access

### Demo Data Always Shows
- API key is invalid or missing
- Alpha Vantage API is down
- Rate limits exceeded

### Error Messages
The component shows contextual error messages to help diagnose issues:
- "Alpha Vantage API key not configured"
- "Unable to load market data. Check API configuration."
- "No market data available at the moment."