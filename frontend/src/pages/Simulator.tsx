import React, { useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { analyticsApi } from '../services/api';
import { GrowthSimulation } from '../types';
import { formatCurrency, formatPercentage } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Simulator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<GrowthSimulation | null>(null);
  
  const [formData, setFormData] = useState({
    initial_amount: '10000',
    monthly_investment: '1000',
    annual_return_rate: '7',
    years: '10',
    inflation_rate: '3.5',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const params = {
        initial_amount: parseFloat(formData.initial_amount),
        monthly_investment: parseFloat(formData.monthly_investment),
        annual_return_rate: parseFloat(formData.annual_return_rate),
        years: parseFloat(formData.years),
        inflation_rate: parseFloat(formData.inflation_rate),
      };

      const result = await analyticsApi.simulateGrowth(params);
      setSimulation(result);
    } catch (err) {
      setError('Failed to run simulation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const chartData = simulation ? {
    labels: simulation.simulation.filter((_, index) => index % 12 === 0).map(point => `Year ${point.year}`),
    datasets: [
      {
        label: 'Nominal Value',
        data: simulation.simulation.filter((_, index) => index % 12 === 0).map(point => point.nominal_value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Real Value (Inflation Adjusted)',
        data: simulation.simulation.filter((_, index) => index % 12 === 0).map(point => point.real_value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Total Invested',
        data: simulation.simulation.filter((_, index) => index % 12 === 0).map(point => point.total_invested),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Investment Growth Simulation',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    },
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            <Calculator className="inline h-8 w-8 mr-2" />
            Investment Growth Simulator
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Simulate how your investments could grow over time with regular contributions
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Simulation Parameters</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Initial Investment Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_amount}
                  onChange={(e) => handleInputChange('initial_amount', e.target.value)}
                  className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monthly Investment
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_investment}
                  onChange={(e) => handleInputChange('monthly_investment', e.target.value)}
                  className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Annual Return Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.annual_return_rate}
                onChange={(e) => handleInputChange('annual_return_rate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Period (Years)
              </label>
              <input
                type="number"
                value={formData.years}
                onChange={(e) => handleInputChange('years', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="1"
                max="50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Inflation Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.inflation_rate}
                onChange={(e) => handleInputChange('inflation_rate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="loading-spinner w-4 h-4 mr-2"></div>
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {simulation ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Final Value
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {formatCurrency(simulation.summary.final_nominal_value)}
                    </dd>
                    <div className="mt-2 text-sm text-gray-600">
                      {formatCurrency(simulation.summary.final_real_value)} after inflation
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Gains
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-green-600">
                      {formatCurrency(simulation.summary.total_gains)}
                    </dd>
                    <div className="mt-2 text-sm text-gray-600">
                      {formatPercentage(simulation.summary.final_return_rate)} return
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Invested
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-blue-600">
                      {formatCurrency(simulation.summary.total_invested)}
                    </dd>
                    <div className="mt-2 text-sm text-gray-600">
                      Over {simulation.parameters.years} years
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="chart-container">
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </div>
              </div>

              {/* Parameters Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Simulation Parameters</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Initial Amount:</span>
                    <span className="ml-2">{formatCurrency(simulation.parameters.initial_amount)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Monthly Investment:</span>
                    <span className="ml-2">{formatCurrency(simulation.parameters.monthly_investment)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Annual Return:</span>
                    <span className="ml-2">{formatPercentage(simulation.parameters.annual_return_rate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time Period:</span>
                    <span className="ml-2">{simulation.parameters.years} years</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Inflation Rate:</span>
                    <span className="ml-2">{formatPercentage(simulation.parameters.inflation_rate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-12">
                <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No simulation yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your investment parameters and run a simulation to see potential growth.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;