import axios from 'axios';
import {
  Transaction,
  Project,
  ProjectReturn,
  TransactionSummary,
  MonthlyTrend,
  CategoryBreakdown,
  GrowthSimulation,
  FinancialOverview,
  InvestmentInsights,
  Settings,
  User,
  AuthResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.5:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    username: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResponse> =>
    api.post('/auth/register', data).then(res => res.data),

  login: (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> =>
    api.post('/auth/login', data).then(res => res.data),

  getMe: (): Promise<{ user: User }> =>
    api.get('/auth/me').then(res => res.data),
};

// Transaction API
export const transactionApi = {
  getAll: (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Transaction[]> =>
    api.get('/transactions', { params }).then(res => res.data),

  getById: (id: number): Promise<Transaction> =>
    api.get(`/transactions/${id}`).then(res => res.data),

  create: (transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> =>
    api.post('/transactions', transaction).then(res => res.data),

  update: (id: number, transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> =>
    api.put(`/transactions/${id}`, transaction).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/transactions/${id}`).then(() => {}),

  getSummary: (params?: { startDate?: string; endDate?: string }): Promise<TransactionSummary> =>
    api.get('/transactions/summary/totals', { params }).then(res => res.data),
};

// Project API
export const projectApi = {
  getAll: (params?: { status?: string; risk_level?: string }): Promise<Project[]> =>
    api.get('/projects', { params }).then(res => res.data),

  getById: (id: number): Promise<Project> =>
    api.get(`/projects/${id}`).then(res => res.data),

  create: (project: Omit<Project, 'id' | 'created_at' | 'status' | 'returns' | 'total_returns' | 'actual_return_rate'>): Promise<Project> =>
    api.post('/projects', project).then(res => res.data),

  update: (id: number, project: Omit<Project, 'id' | 'created_at' | 'returns' | 'total_returns' | 'actual_return_rate'>): Promise<Project> =>
    api.put(`/projects/${id}`, project).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/projects/${id}`).then(() => {}),

  addReturn: (id: number, returnData: Omit<ProjectReturn, 'id' | 'project_id'>): Promise<ProjectReturn> =>
    api.post(`/projects/${id}/returns`, returnData).then(res => res.data),

  getBestProjects: (): Promise<Project[]> =>
    api.get('/projects/rankings/best').then(res => res.data),
};

// Analytics API
export const analyticsApi = {
  getOverview: (months?: number): Promise<FinancialOverview> =>
    api.get('/analytics/overview', { params: { months } }).then(res => res.data),

  getMonthlyTrends: (months?: number): Promise<MonthlyTrend[]> =>
    api.get('/analytics/trends/monthly', { params: { months } }).then(res => res.data),

  getCategoryBreakdown: (type: string = 'expense', months?: number): Promise<CategoryBreakdown[]> =>
    api.get('/analytics/breakdown/categories', { params: { type, months } }).then(res => res.data),

  simulateGrowth: (params: {
    initial_amount?: number;
    monthly_investment?: number;
    annual_return_rate?: number;
    years?: number;
    inflation_rate?: number;
  }): Promise<GrowthSimulation> =>
    api.post('/analytics/simulate/growth', params).then(res => res.data),

  getInvestmentInsights: (): Promise<InvestmentInsights> =>
    api.get('/analytics/insights/investments').then(res => res.data),

  getSettings: (): Promise<Settings> =>
    api.get('/analytics/settings').then(res => res.data),

  updateSettings: (settings: Partial<Settings>): Promise<Settings> =>
    api.put('/analytics/settings', settings).then(res => res.data),
};

export default api;