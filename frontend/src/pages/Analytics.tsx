import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Target } from 'lucide-react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { analyticsApi } from '../services/api';
import { MonthlyTrend, CategoryBreakdown, InvestmentInsights } from '../types';
import { formatCurrency, formatPercentage, generateChartColors } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics: React.FC = () => {
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryBreakdown[]>([]);
  const [insights, setInsights] = useState<InvestmentInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(12);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [trends, expenseCats, , investmentInsights] = await Promise.all([
          analyticsApi.getMonthlyTrends(selectedPeriod),
          analyticsApi.getCategoryBreakdown('expense', selectedPeriod),
          analyticsApi.getCategoryBreakdown('income', selectedPeriod),
          analyticsApi.getInvestmentInsights(),
        ]);

        setMonthlyTrends(trends);
        setExpenseCategories(expenseCats);
        setInsights(investmentInsights);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod]);

  const monthlyTrendData = {
    labels: monthlyTrends.map(trend => trend.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map(trend => trend.income),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map(trend => trend.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Investments',
        data: monthlyTrends.map(trend => trend.investments),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const netWorthData = {
    labels: monthlyTrends.map(trend => trend.month),
    datasets: [
      {
        label: 'Net Worth',
        data: monthlyTrends.map(trend => trend.net),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const expensePieData = {
    labels: expenseCategories.map(cat => cat.category),
    datasets: [
      {
        data: expenseCategories.map(cat => cat.total_amount),
        backgroundColor: generateChartColors(expenseCategories.length),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y || context.parsed);
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

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            <BarChart3 className="inline h-8 w-8 mr-2" />
            Analytics & Insights
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed analysis of your financial data and investment performance
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Investment Insights Summary */}
      {insights && (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Portfolio Value
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(insights.total_portfolio_value)}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Avg Portfolio Return
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-green-600">
                {formatPercentage(insights.avg_portfolio_return)}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Best Performers
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-blue-600">
                {insights.best_performing.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Diversification Score
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-indigo-600">
                {insights.diversification_score}/100
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <TrendingUp className="inline h-5 w-5 mr-2" />
            Monthly Trends
          </h3>
          <div className="chart-container">
            <Bar data={monthlyTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Net Worth Trend */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Net Worth Trend
          </h3>
          <div className="chart-container">
            <Line data={netWorthData} options={{
              ...chartOptions,
              scales: {
                y: {
                  beginAtZero: false,
                  ticks: {
                    callback: function(value: any) {
                      return formatCurrency(value);
                    }
                  }
                }
              }
            }} />
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <PieChart className="inline h-5 w-5 mr-2" />
            Expense Categories
          </h3>
          <div className="chart-container">
            {expenseCategories.length > 0 ? (
              <Pie data={expensePieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">No expense data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Expense Categories Table */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Expense Categories
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Category
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Amount
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenseCategories.slice(0, 8).map((category) => (
                  <tr key={category.category}>
                    <td className="py-2 text-sm text-gray-900">
                      {category.category}
                    </td>
                    <td className="py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(category.total_amount)}
                    </td>
                    <td className="py-2 text-sm text-gray-500 text-right">
                      {category.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenseCategories.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No expense categories found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Performance */}
      {insights && insights.best_performing.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Target className="inline h-5 w-5 mr-2" />
            Best Performing Projects
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Project
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Investment
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Returns
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Rate
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {insights.best_performing.slice(0, 5).map((project) => (
                  <tr key={project.id}>
                    <td className="py-3 text-sm text-gray-900">
                      {project.name}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(project.initial_investment)}
                    </td>
                    <td className="py-3 text-sm text-green-600 text-right">
                      {formatCurrency(project.total_returns || 0)}
                    </td>
                    <td className="py-3 text-sm text-green-600 text-right">
                      {project.actual_return_rate ? formatPercentage(parseFloat(project.actual_return_rate)) : 'N/A'}
                    </td>
                    <td className="py-3 text-sm text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Outperforming
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;