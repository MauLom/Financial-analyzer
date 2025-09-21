const axios = require('axios');

class AlphaVantageService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }

  // Get major market indices
  async getMarketIndices() {
    try {
      const symbols = ['SPY', 'QQQ', 'IWM']; // S&P 500, NASDAQ, Russell 2000
      const results = await Promise.all(
        symbols.map(symbol => this.getQuote(symbol))
      );

      return results.filter(result => result !== null);
    } catch (error) {
      console.error('Error fetching market indices:', error);
      throw new Error('Failed to fetch market indices');
    }
  }

  // Get a single stock/ETF quote
  async getQuote(symbol) {
    try {
      if (!this.apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        console.warn(`No data received for symbol: ${symbol}`);
        return null;
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'].replace('%', ''),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']),
        lastUpdated: quote['07. latest trading day']
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      return null;
    }
  }

  // Get economic indicators
  async getEconomicIndicators() {
    try {
      if (!this.apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      const indicators = [
        { function: 'INFLATION', name: 'Inflation Rate' },
        { function: 'FEDERAL_FUNDS_RATE', name: 'Federal Funds Rate' },
        { function: 'UNEMPLOYMENT', name: 'Unemployment Rate' }
      ];

      const results = await Promise.all(
        indicators.map(async (indicator) => {
          try {
            const response = await axios.get(this.baseUrl, {
              params: {
                function: indicator.function,
                apikey: this.apiKey
              },
              timeout: 10000
            });

            const data = response.data.data;
            if (!data || data.length === 0) {
              return null;
            }

            const latest = data[0];
            return {
              name: indicator.name,
              value: parseFloat(latest.value),
              date: latest.date
            };
          } catch (error) {
            console.error(`Error fetching ${indicator.name}:`, error.message);
            return null;
          }
        })
      );

      return results.filter(result => result !== null);
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      throw new Error('Failed to fetch economic indicators');
    }
  }

  // Get sector performance
  async getSectorPerformance() {
    try {
      if (!this.apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'SECTOR',
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const sectorData = response.data['Rank A: Real-Time Performance'];
      if (!sectorData) {
        return [];
      }

      return Object.entries(sectorData).map(([sector, performance]) => ({
        sector: sector.replace(/\s+/g, ' ').trim(),
        performance: parseFloat(performance.replace('%', ''))
      })).slice(0, 5); // Top 5 sectors
    } catch (error) {
      console.error('Error fetching sector performance:', error);
      return [];
    }
  }
}

module.exports = new AlphaVantageService();