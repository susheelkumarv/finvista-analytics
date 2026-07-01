export type AssetType = 'Stock' | 'ETF' | 'REIT' | 'Crypto' | 'Cash' | 'Other';

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  prevClose: number; // For daily change calculation
  dividendYield: number; // as percentage, e.g. 3.2 for 3.2%
  annualDividendPerShare: number; // Dollar amount per share per year
  payoutMonths: number[]; // Months of payout (0 = Jan, 1 = Feb, ..., 11 = Dec)
  assetType: AssetType;
  sector: string;
}

export interface Transaction {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: string; // ISO string YYYY-MM-DD
  notes?: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  annualDividendIncome: number;
  portfolioYield: number; // Dividend yield based on current value
  yieldOnCost: number; // Dividend yield based on cost
}

export interface TickerInfo {
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  dividendYield: number;
  annualDividendPerShare: number;
  payoutMonths: number[];
  sector: string;
  assetType: AssetType;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
