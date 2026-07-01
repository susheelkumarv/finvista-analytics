import { Holding, PortfolioStats, ChartDataPoint } from '../types';

export interface ResolvedDividendInfo {
  annualDiv: number;
  dividendYield: number;
  payoutMonths: number[];
  frequency: 'Weekly' | 'Semi-Monthly' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  payoutPerDistribution: number;
  payoutsPerYear: number;
}

export function resolveHoldingDividends(h: Holding): ResolvedDividendInfo {
  let annualDiv = h.annualDividendPerShare || 0;
  let divYield = h.dividendYield || 0;

  const tickerUpper = h.ticker.toUpperCase();
  let frequency: 'Weekly' | 'Semi-Monthly' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' = h.payoutFrequency || 'Quarterly';
  let payoutPerDistribution = h.payoutPerDistribution || 0;
  let payoutsPerYear = 4;

  // Specific ticker defaults if dividend or schedule is specific
  if (tickerUpper.includes('EASY')) {
    // EASY.TO pays $0.31 semi-monthly (24 payouts per year) -> $0.31 * 24 = $7.44 / yr
    payoutPerDistribution = 0.31;
    frequency = 'Semi-Monthly';
    payoutsPerYear = 24;
    annualDiv = payoutPerDistribution * payoutsPerYear; // 7.44
    divYield = h.currentPrice > 0 ? (annualDiv / h.currentPrice) * 100 : 32.19;
  } else if (tickerUpper.includes('HHIS')) {
    // HHIS pays $0.27 monthly (12 payouts per year) -> $0.27 * 12 = $3.24 / yr
    payoutPerDistribution = 0.27;
    frequency = 'Monthly';
    payoutsPerYear = 12;
    annualDiv = payoutPerDistribution * payoutsPerYear; // 3.24
    divYield = h.currentPrice > 0 ? (annualDiv / h.currentPrice) * 100 : 26.02;
  } else if (tickerUpper.includes('MSTE')) {
    // MSTE pays $0.10 monthly (12 payouts per year) -> $0.10 * 12 = $1.20 / yr
    payoutPerDistribution = 0.10;
    frequency = 'Monthly';
    payoutsPerYear = 12;
    annualDiv = payoutPerDistribution * payoutsPerYear; // 1.20
    divYield = h.currentPrice > 0 ? (annualDiv / h.currentPrice) * 100 : 7.74;
  } else {
    // Determine frequency for other tickers
    const monthlyTickers = ["O", "JEPI", "JEPQ", "MAIN", "PFF", "AGNC", "SDIV", "SRET"];
    const isMonthly = monthlyTickers.some(t => tickerUpper.includes(t)) || (h.payoutMonths && h.payoutMonths.length === 12);
    const isWeekly = tickerUpper.includes("WEEK") || tickerUpper.includes("BKCC") || tickerUpper.includes("YMAX");

    if (isWeekly) {
      frequency = 'Weekly';
      payoutsPerYear = 52;
    } else if (isMonthly) {
      frequency = 'Monthly';
      payoutsPerYear = 12;
    } else if (h.payoutMonths && h.payoutMonths.length === 2) {
      frequency = 'Semi-Annual';
      payoutsPerYear = 2;
    } else if (h.payoutMonths && h.payoutMonths.length === 1) {
      frequency = 'Annual';
      payoutsPerYear = 1;
    } else {
      frequency = 'Quarterly';
      payoutsPerYear = 4;
    }

    if (annualDiv <= 0) {
      if (divYield > 0 && h.currentPrice > 0) {
        annualDiv = h.currentPrice * (divYield / 100);
      } else {
        const defaultYield = h.assetType === 'ETF' ? 4.8 : (h.assetType === 'REIT' ? 5.8 : 2.4);
        divYield = defaultYield;
        annualDiv = h.currentPrice > 0 ? h.currentPrice * (defaultYield / 100) : defaultYield;
      }
    } else if (divYield <= 0 && h.currentPrice > 0) {
      divYield = (annualDiv / h.currentPrice) * 100;
    }

    if (payoutPerDistribution <= 0 && payoutsPerYear > 0) {
      payoutPerDistribution = annualDiv / payoutsPerYear;
    }
  }

  // Resolve payout months
  let payoutM = h.payoutMonths || [];
  if (payoutM.length === 0) {
    if (frequency === 'Weekly' || frequency === 'Semi-Monthly' || frequency === 'Monthly') {
      payoutM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    } else if (frequency === 'Semi-Annual') {
      payoutM = [5, 11];
    } else if (frequency === 'Annual') {
      payoutM = [11];
    } else {
      payoutM = [2, 5, 8, 11]; // default quarterly
    }
  }

  return {
    annualDiv,
    dividendYield: divYield,
    payoutMonths: payoutM,
    frequency,
    payoutPerDistribution: parseFloat(payoutPerDistribution.toFixed(4)),
    payoutsPerYear
  };
}

export function calculatePortfolioStats(holdings: Holding[]): PortfolioStats {
  let totalValue = 0;
  let totalCost = 0;
  let dailyChange = 0;
  let prevTotalValue = 0;
  let annualDividendIncome = 0;

  holdings.forEach(h => {
    const value = h.shares * h.currentPrice;
    const cost = h.shares * h.avgCost;
    const prevValue = h.shares * h.prevClose;

    totalValue += value;
    totalCost += cost;
    prevTotalValue += prevValue;

    const { annualDiv } = resolveHoldingDividends(h);
    annualDividendIncome += h.shares * annualDiv;
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Daily change calculation
  // current daily change is: totalValue - prevTotalValue
  dailyChange = totalValue - prevTotalValue;
  const dailyChangePercent = prevTotalValue > 0 ? (dailyChange / prevTotalValue) * 100 : 0;

  const portfolioYield = totalValue > 0 ? (annualDividendIncome / totalValue) * 100 : 0;
  const yieldOnCost = totalCost > 0 ? (annualDividendIncome / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    dailyChange,
    dailyChangePercent,
    annualDividendIncome,
    portfolioYield,
    yieldOnCost
  };
}

export function calculateAllocationByAsset(holdings: Holding[]): ChartDataPoint[] {
  const map: Record<string, number> = {};
  let totalValue = 0;

  holdings.forEach(h => {
    const val = h.shares * h.currentPrice;
    totalValue += val;
    map[h.assetType] = (map[h.assetType] || 0) + val;
  });

  if (totalValue === 0) return [];

  return Object.keys(map).map(key => ({
    name: key,
    value: parseFloat(((map[key] / totalValue) * 100).toFixed(1))
  })).sort((a, b) => b.value - a.value);
}

export function calculateAllocationBySector(holdings: Holding[]): ChartDataPoint[] {
  const map: Record<string, number> = {};
  let totalValue = 0;

  holdings.forEach(h => {
    const val = h.shares * h.currentPrice;
    totalValue += val;
    const sector = h.sector || 'Uncategorized';
    map[sector] = (map[sector] || 0) + val;
  });

  if (totalValue === 0) return [];

  return Object.keys(map).map(key => ({
    name: key,
    value: parseFloat(((map[key] / totalValue) * 100).toFixed(1))
  })).sort((a, b) => b.value - a.value);
}

export function calculateAllocationByHolding(holdings: Holding[]): ChartDataPoint[] {
  let totalValue = 0;
  holdings.forEach(h => {
    totalValue += h.shares * h.currentPrice;
  });

  if (totalValue === 0) return [];

  return holdings.map(h => ({
    name: h.ticker,
    value: parseFloat((((h.shares * h.currentPrice) / totalValue) * 100).toFixed(1))
  })).sort((a, b) => b.value - a.value);
}

const MONTHS_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface MonthlyDividendPoint {
  monthName: string;
  amount: number;
  tickers: { ticker: string; amount: number }[];
}

export function calculateDividendCalendar(holdings: Holding[]): MonthlyDividendPoint[] {
  const calendar: MonthlyDividendPoint[] = MONTHS_NAMES.map(name => ({
    monthName: name,
    amount: 0,
    tickers: []
  }));

  holdings.forEach(h => {
    const { annualDiv, payoutMonths, frequency } = resolveHoldingDividends(h);

    if (annualDiv > 0 && payoutMonths.length > 0) {
      if (frequency === 'Semi-Monthly') {
        // Semi-monthly pays 2 times per month across 12 months (24 payouts)
        const monthlyAmount = (h.shares * annualDiv) / 12;
        payoutMonths.forEach(mIdx => {
          if (mIdx >= 0 && mIdx < 12) {
            calendar[mIdx].amount += monthlyAmount;
            calendar[mIdx].tickers.push({
              ticker: h.ticker,
              amount: parseFloat(monthlyAmount.toFixed(2))
            });
          }
        });
      } else {
        const paymentOccasions = payoutMonths.length;
        const payoutAmount = (h.shares * annualDiv) / paymentOccasions;

        payoutMonths.forEach(mIdx => {
          if (mIdx >= 0 && mIdx < 12) {
            calendar[mIdx].amount += payoutAmount;
            calendar[mIdx].tickers.push({
              ticker: h.ticker,
              amount: parseFloat(payoutAmount.toFixed(2))
            });
          }
        });
      }
    }
  });

  // Round amounts
  calendar.forEach(item => {
    item.amount = parseFloat(item.amount.toFixed(2));
  });

  return calendar;
}
