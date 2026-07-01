import { Holding, Transaction } from '../types';

export const INITIAL_HOLDINGS: Holding[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    shares: 15,
    avgCost: 172.50,
    currentPrice: 214.30,
    prevClose: 212.10,
    dividendYield: 0.47,
    annualDividendPerShare: 1.00,
    payoutMonths: [1, 4, 7, 10], // Feb, May, Aug, Nov
    assetType: 'Stock',
    sector: 'Technology'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 8,
    avgCost: 385.00,
    currentPrice: 418.20,
    prevClose: 421.50,
    dividendYield: 0.72,
    annualDividendPerShare: 3.00,
    payoutMonths: [2, 5, 8, 11], // Mar, Jun, Sep, Dec
    assetType: 'Stock',
    sector: 'Technology'
  },
  {
    ticker: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    shares: 55,
    avgCost: 74.20,
    currentPrice: 81.15,
    prevClose: 80.80,
    dividendYield: 3.42,
    annualDividendPerShare: 2.77,
    payoutMonths: [2, 5, 8, 11], // Mar, Jun, Sep, Dec
    assetType: 'ETF',
    sector: 'Diversified'
  },
  {
    ticker: 'O',
    name: 'Realty Income Corp. (REIT)',
    shares: 60,
    avgCost: 52.80,
    currentPrice: 57.45,
    prevClose: 57.10,
    dividendYield: 5.48,
    annualDividendPerShare: 3.15,
    payoutMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Monthly dividend!
    assetType: 'REIT',
    sector: 'Real Estate'
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    shares: 12,
    avgCost: 220.00,
    currentPrice: 197.80,
    prevClose: 194.50,
    dividendYield: 0,
    annualDividendPerShare: 0,
    payoutMonths: [],
    assetType: 'Stock',
    sector: 'Consumer Cyclical'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    ticker: 'AAPL',
    type: 'BUY',
    shares: 10,
    price: 165.00,
    date: '2026-01-15',
    notes: 'Initial position'
  },
  {
    id: 'tx-2',
    ticker: 'AAPL',
    type: 'BUY',
    shares: 5,
    price: 187.50,
    date: '2026-03-10',
    notes: 'Bought on pullback'
  },
  {
    id: 'tx-3',
    ticker: 'MSFT',
    type: 'BUY',
    shares: 8,
    price: 385.00,
    date: '2026-02-05',
    notes: 'Core tech allocation'
  },
  {
    id: 'tx-4',
    ticker: 'SCHD',
    type: 'BUY',
    shares: 55,
    price: 74.20,
    date: '2026-02-18',
    notes: 'Dividend core growth ETF'
  },
  {
    id: 'tx-5',
    ticker: 'O',
    type: 'BUY',
    shares: 60,
    price: 52.80,
    date: '2026-03-22',
    notes: 'Monthly income REIT'
  },
  {
    id: 'tx-6',
    ticker: 'TSLA',
    type: 'BUY',
    shares: 12,
    price: 220.00,
    date: '2026-04-05',
    notes: 'Growth vehicle'
  }
];
