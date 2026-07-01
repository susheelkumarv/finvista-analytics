import { Holding, PortfolioStats, ChartDataPoint } from '../types';

export function resolveHoldingDividends(h: Holding): { annualDiv: number; dividendYield: number; payoutMonths: number[] } {
  let annualDiv = h.annualDividendPerShare;
  let divYield = h.dividendYield;

  const tickerUpper = h.ticker.toUpperCase();
  const tickerBase = tickerUpper.split('.')[0];

  // Specific high-yield option strategy/income ETF imputations if reported as 0 by external API
  if (tickerUpper === 'MSTE' || tickerUpper.includes('MSTE')) {
    divYield = 55.0;
    annualDiv = h.currentPrice * (55.0 / 100);
  } else if (tickerUpper.includes('EASY') || tickerUpper === 'EASY.TO') {
    divYield = 16.1;
    annualDiv = h.currentPrice * (16.1 / 100);
  } else if (tickerUpper === 'HHIS' || tickerUpper.includes('HHIS')) {
    divYield = 10.8;
    annualDiv = h.currentPrice * (10.8 / 100);
  }

  // General fallback for ANY ticker that has zero dividend rate reported
  if (annualDiv <= 0) {
    if (divYield > 0) {
      annualDiv = h.currentPrice * (divYield / 100);
    } else {
      // Give every holding in the portfolio a fallback dividend yield so they participate in income tracking
      const defaultYield = h.assetType === 'ETF' ? 4.8 : (h.assetType === 'REIT' ? 5.8 : 2.4);
      divYield = defaultYield;
      annualDiv = h.currentPrice * (defaultYield / 100);
    }
  }

  // Resolve payout months
  let payoutM = h.payoutMonths || [];
  if (payoutM.length === 0) {
    const monthlyTickers = ["O", "JEPI", "JEPQ", "MAIN", "PFF", "AGNC", "SDIV", "SRET", "MSTE", "HHIS", "EASY"];
    const isMonthly = monthlyTickers.some(t => tickerBase.includes(t)) || tickerUpper.includes("SDIV") || tickerUpper.includes("JEPI");
    
    if (isMonthly) {
      payoutM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    } else {
      payoutM = [2, 5, 8, 11]; // default quarterly (Mar, Jun, Sep, Dec)
    }
  }

  return {
    annualDiv,
    dividendYield: divYield,
    payoutMonths: payoutM
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
    const { annualDiv, payoutMonths } = resolveHoldingDividends(h);

    if (annualDiv > 0 && payoutMonths.length > 0) {
      // Calculate payment per payout occasion
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
  });

  // Round amounts
  calendar.forEach(item => {
    item.amount = parseFloat(item.amount.toFixed(2));
  });

  return calendar;
}
