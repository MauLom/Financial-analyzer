export interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  description: string;
  category?: string;
  date: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  initial_investment: number;
  expected_return: number;
  risk_level?: 'low' | 'medium' | 'high';
  duration_months?: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  returns?: ProjectReturn[];
  total_returns?: number;
  actual_return_rate?: string;
}

export interface ProjectReturn {
  id: number;
  project_id: number;
  return_amount: number;
  return_date: string;
  notes?: string;
}

export interface TransactionSummary {
  income: number;
  expenses: number;
  investments: number;
  net: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  investments: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  total_amount: number;
  count: number;
  avg_amount: number;
}

export interface GrowthSimulation {
  parameters: {
    initial_amount: number;
    monthly_investment: number;
    annual_return_rate: number;
    years: number;
    inflation_rate: number;
  };
  simulation: {
    month: number;
    year: number;
    nominal_value: number;
    real_value: number;
    total_invested: number;
    gains: number;
    return_rate: number;
  }[];
  summary: {
    final_nominal_value: number;
    final_real_value: number;
    total_invested: number;
    total_gains: number;
    final_return_rate: number;
  };
}

export interface FinancialOverview {
  period_months: number;
  transaction_summary: TransactionSummary;
  project_summary: {
    total_projects: number;
    total_invested: number;
    avg_expected_return: number;
    active_projects: number;
    completed_projects: number;
    total_returns: number;
  };
}

export interface InvestmentInsights {
  best_performing: Project[];
  underperforming: Project[];
  high_risk_high_return: Project[];
  diversification_score: number;
  total_portfolio_value: number;
  avg_portfolio_return: number;
}

export interface Settings {
  inflation_rate: string;
  cost_of_living_increase: string;
}