import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import { FinancialOverview } from '../types';
import { formatCurrency, formatPercentage } from '../utils/format';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(12);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getOverview(selectedPeriod);
        setOverview(data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const { transaction_summary: summary, project_summary: projects, changes } = overview;

  const formatChange = (changePercent: number) => {
    if (Math.abs(changePercent) < 0.01) return '0.0%';
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };

  const stats = [
    {
      name: t('dashboard.totalIncome'),
      value: formatCurrency(summary.income),
      icon: TrendingUp,
      change: formatChange(changes.income),
      changeType: changes.income >= 0 ? 'positive' : 'negative',
      color: 'text-green-600 bg-green-50',
    },
    {
      name: t('dashboard.totalExpenses'),
      value: formatCurrency(summary.expenses),
      icon: TrendingDown,
      change: formatChange(changes.expenses),
      changeType: changes.expenses <= 0 ? 'positive' : 'negative', // Lower expenses are positive
      color: 'text-red-600 bg-red-50',
    },
    {
      name: t('dashboard.netWorth'),
      value: formatCurrency(summary.net),
      icon: DollarSign,
      change: formatChange(changes.net),
      changeType: changes.net >= 0 ? 'positive' : 'negative',
      color: summary.net >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
    },
    {
      name: t('dashboard.totalInvestments'),
      value: formatCurrency(summary.investments),
      icon: PieChart,
      change: formatChange(changes.investments),
      changeType: changes.investments >= 0 ? 'positive' : 'negative',
      color: 'text-blue-600 bg-blue-50',
    },
  ];

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('dashboard.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboard.overview').replace('{{months}}', overview.period_months.toString())}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center justify-center p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className="flex items-center text-sm">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`ml-1 ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Summary */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.projectsOverview')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('dashboard.activeProjects')}</span>
              <span className="font-medium">{projects.active_projects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('dashboard.totalInvested')}</span>
              <span className="font-medium">{formatCurrency(projects.total_invested)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Returns</span>
              <span className="font-medium text-green-600">
                {formatCurrency(projects.total_returns)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('dashboard.avgExpectedReturn')}</span>
              <span className="font-medium">
                {formatPercentage(projects.avg_expected_return)}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {t('dashboard.viewProjects')}
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.quickActions')}</h3>
          <div className="space-y-3">
            <Link
              to="/transactions"
              className="block w-full px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{t('dashboard.addTransaction')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.addTransactionDesc')}</div>
            </Link>
            <Link
              to="/projects"
              className="block w-full px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{t('dashboard.createProject')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.createProjectDesc')}</div>
            </Link>
            <Link
              to="/simulator"
              className="block w-full px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{t('dashboard.growthSimulator')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.growthSimulatorDesc')}</div>
            </Link>
            <Link
              to="/analytics"
              className="block w-full px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{t('dashboard.viewAnalytics')}</div>
              <div className="text-xs text-gray-500">{t('dashboard.viewAnalyticsDesc')}</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;