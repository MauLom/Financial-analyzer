import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { MarketIndex, EconomicIndicator, SectorPerformance } from '../types';
import { formatCurrency, formatPercentage } from '../utils/format';

interface MarketSignalsProps {
  className?: string;
}

const MarketSignals: React.FC<MarketSignalsProps> = ({ className = '' }) => {
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicator[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch real data first
        const [indices, indicators, sectors] = await Promise.all([
          analyticsApi.getMarketIndices().catch(() => []),
          analyticsApi.getEconomicIndicators().catch(() => []),
          analyticsApi.getSectorPerformance().catch(() => []),
        ]);

        // If all are empty, try to fetch demo data
        if (indices.length === 0 && indicators.length === 0 && sectors.length === 0) {
          try {
            const demoResponse = await fetch('/api/analytics/market/demo');
            if (demoResponse.ok) {
              const demoData = await demoResponse.json();
              setMarketIndices(demoData.indices || []);
              setEconomicIndicators(demoData.economicIndicators || []);
              setSectorPerformance(demoData.sectorPerformance || []);
            } else {
              setMarketIndices([]);
              setEconomicIndicators([]);
              setSectorPerformance([]);
            }
          } catch (demoError) {
            console.warn('Demo data also unavailable:', demoError);
            setMarketIndices([]);
            setEconomicIndicators([]);
            setSectorPerformance([]);
          }
        } else {
          setMarketIndices(indices);
          setEconomicIndicators(indicators);
          setSectorPerformance(sectors);
        }
      } catch (err) {
        console.error('Failed to fetch market data:', err);
        setError('Unable to load market data. Check API configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Market Data Unavailable</h3>
              <p className="text-sm text-yellow-700 mt-1">{error}</p>
              <p className="text-xs text-yellow-600 mt-2">
                Configure ALPHA_VANTAGE_API_KEY in your environment to enable market signals.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Signals</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market Indices */}
        {marketIndices.map((index) => (
          <div key={index.symbol} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {index.symbol}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(index.price)}
                </p>
              </div>
              <div className={`flex items-center ${
                index.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {index.change >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(parseFloat(index.changePercent))}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Change: {formatCurrency(index.change)}
            </div>
          </div>
        ))}

        {/* Economic Indicators */}
        {economicIndicators.map((indicator, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 tracking-wide">
                  {indicator.name}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(indicator.value)}
                </p>
              </div>
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              As of {new Date(indicator.date).toLocaleDateString()}
            </div>
          </div>
        ))}

        {/* Top Sector Performance */}
        {sectorPerformance.slice(0, 3).map((sector, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 tracking-wide">
                  {sector.sector}
                </h3>
                <p className={`text-2xl font-bold ${
                  sector.performance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(sector.performance)}
                </p>
              </div>
              <div className={`${
                sector.performance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {sector.performance >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Sector Performance
            </div>
          </div>
        ))}
      </div>

      {/* Show message if no data available */}
      {marketIndices.length === 0 && economicIndicators.length === 0 && sectorPerformance.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No market data available at the moment.</p>
          <p className="text-sm text-gray-400 mt-1">
            Check your API configuration and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketSignals;