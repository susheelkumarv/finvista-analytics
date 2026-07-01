import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Holding } from '../types';
import { calculateDividendCalendar, MonthlyDividendPoint, resolveHoldingDividends } from '../utils/calculations';
import { Calendar, DollarSign, TrendingUp, Table, Award, Percent, Layers, BarChart3, ListCollapse } from 'lucide-react';

interface DividendAnalyticsProps {
  holdings: Holding[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CHART_COLORS = [
  '#059669', // Emerald 600
  '#2563eb', // Blue 600
  '#4f46e5', // Indigo 600
  '#0891b2', // Cyan 600
  '#db2777', // Pink 600
  '#7c3aed', // Violet 600
  '#ea580c', // Orange 600
  '#ca8a04', // Yellow 600
];

export default function DividendAnalytics({ holdings }: DividendAnalyticsProps) {
  // Tooltip component to show ticker symbol and name along with projected payout
  const CustomMonthTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const ticker = data.name;
      const amount = data.value;
      const holding = holdings.find(h => h.ticker === ticker);
      const name = holding?.name || 'Unknown';

      return (
        <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-extrabold text-zinc-100">{ticker}</p>
          <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">{name}</p>
          <div className="pt-1.5 mt-1.5 border-t border-zinc-800/80 space-y-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Projected Payout</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip component for YTD monthly bar chart
  const CustomYTDTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const monthName = data.monthName;
      const amount = data.amount;

      return (
        <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-indigo-400 font-mono text-sm">
            ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mt-0.5">
            {monthName} Received
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine current month index dynamically (e.g. 6 for July in 2026-07)
  const currentMonthIdx = useMemo(() => {
    return new Date().getMonth();
  }, []);

  const currentMonthName = MONTH_NAMES[currentMonthIdx];

  // Get calendar data
  const calendarData = useMemo(() => calculateDividendCalendar(holdings), [holdings]);

  // 1. Current Month Projection Calculations
  const currentMonthProjected = useMemo(() => {
    const currentMonthPoint = calendarData[currentMonthIdx];
    if (!currentMonthPoint) return { total: 0, tickers: [] };

    const total = currentMonthPoint.amount;
    
    // Get tickers and enrich them with holding name, shares, and distribution rate/frequency
    const tickersBreakdown = currentMonthPoint.tickers.map(t => {
      const holding = holdings.find(h => h.ticker === t.ticker);
      let distRate = 0;
      let frequency = 'N/A';
      if (holding) {
        const { annualDiv, payoutMonths } = resolveHoldingDividends(holding);
        const len = payoutMonths.length;
        if (len > 0) {
          distRate = annualDiv / len;
          if (len === 12) {
            frequency = 'Monthly';
          } else if (len === 24) {
            frequency = 'Semi-Monthly';
          } else if (len === 4) {
            frequency = 'Quarterly';
          } else if (len === 2) {
            frequency = 'Semi-Annual';
          } else if (len === 1) {
            frequency = 'Annual';
          } else {
            frequency = `${len}x / Yr`;
          }
        }
      }

      return {
        ticker: t.ticker,
        name: holding?.name || 'Unknown',
        shares: holding?.shares || 0,
        amount: t.amount,
        distRate,
        frequency,
        percentage: total > 0 ? (t.amount / total) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount);

    return {
      total,
      tickers: tickersBreakdown
    };
  }, [calendarData, holdings, currentMonthIdx]);

  // 2. YTD (Year To Date) Dividends Earned So Far (up to current month inclusive or exclusive?)
  // Let's show months up to current month (e.g., Jan through June, or including July if desired).
  // Standard YTD represents accumulated dividends from Jan up to current date.
  // We will calculate for months 0 to currentMonthIdx.
  const ytdAnalytics = useMemo(() => {
    let totalYTDAccumulated = 0;
    const monthlyPoints: { monthName: string; amount: number; index: number }[] = [];
    const tickerContributions: Record<string, number> = {};

    for (let mIdx = 0; mIdx <= currentMonthIdx; mIdx++) {
      const point = calendarData[mIdx];
      if (point) {
        totalYTDAccumulated += point.amount;
        monthlyPoints.push({
          monthName: point.monthName,
          amount: point.amount,
          index: mIdx
        });

        // Track ticker level accumulated for YTD
        point.tickers.forEach(t => {
          tickerContributions[t.ticker] = (tickerContributions[t.ticker] || 0) + t.amount;
        });
      }
    }

    const tickerYTDList = Object.keys(tickerContributions).map(ticker => {
      const holding = holdings.find(h => h.ticker === ticker);
      const amount = parseFloat(tickerContributions[ticker].toFixed(2));
      return {
        ticker,
        name: holding?.name || 'Unknown',
        amount,
        percentage: totalYTDAccumulated > 0 ? (amount / totalYTDAccumulated) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount);

    return {
      total: parseFloat(totalYTDAccumulated.toFixed(2)),
      monthlyPoints,
      tickerBreakdown: tickerYTDList
    };
  }, [calendarData, holdings, currentMonthIdx]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const chartDataCurrentMonth = useMemo(() => {
    return currentMonthProjected.tickers.map(t => ({
      name: t.ticker,
      value: parseFloat(t.amount.toFixed(2))
    }));
  }, [currentMonthProjected]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Current Month Dividend Projection */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                Active Projection
              </span>
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">
                {currentMonthName} 2026
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-1 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-500" />
              Current Month Dividend Cash Flow
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Projected dividends expected to hit your account this month
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 min-w-[200px] text-right">
            <span className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Total Month Cash Flow
            </span>
            <span className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(currentMonthProjected.total)}
            </span>
          </div>
        </div>

        {currentMonthProjected.total === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 text-xs">
            <DollarSign className="w-12 h-12 stroke-1 mb-2 text-zinc-400" />
            No dividend payouts scheduled for {currentMonthName} in your current portfolio.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            {/* Left: Beautiful Donut Chart of Current Month Break down */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 self-start">
                Payout Share
              </span>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataCurrentMonth}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartDataCurrentMonth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomMonthTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Table showing exact tickers breakdown */}
            <div className="lg:col-span-3 space-y-3">
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                Ticker Breakdown
              </span>
              <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-950 text-gray-400 dark:text-zinc-500 font-semibold border-b border-gray-100 dark:border-zinc-800">
                      <th className="p-3">Ticker</th>
                      <th className="p-3">Holding Name</th>
                      <th className="p-3 text-right">Shares</th>
                      <th className="p-3 text-right">Distribution</th>
                      <th className="p-3 text-right font-mono">Month Payout</th>
                      <th className="p-3 text-right">% of Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthProjected.tickers.map((t, index) => (
                      <tr 
                        key={t.ticker}
                        className="border-b border-gray-50 dark:border-zinc-850 hover:bg-gray-50/50 dark:hover:bg-zinc-850/30 transition-all"
                      >
                        <td className="p-3 font-bold font-mono text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          {t.ticker}
                        </td>
                        <td className="p-3 text-gray-500 dark:text-zinc-400 max-w-[140px] truncate">{t.name}</td>
                        <td className="p-3 text-right text-gray-600 dark:text-zinc-300 font-semibold">{t.shares}</td>
                        <td className="p-3 text-right">
                          <span className="font-mono text-gray-900 dark:text-zinc-100 font-bold block">
                            {formatCurrency(t.distRate)}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-zinc-500 block">
                            {t.frequency}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(t.amount)}</td>
                        <td className="p-3 text-right font-mono text-gray-400 dark:text-zinc-500">{t.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: YTD Month-wise Dividends Earned So Far */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
                Historical Analysis
              </span>
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">
                January - {currentMonthName} 2026
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-1 flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
              YTD Month-wise Dividends Earned
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Cumulative historical dividend income earned across calendar months year-to-date
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 min-w-[200px] text-right">
            <span className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Total YTD Dividends
            </span>
            <span className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(ytdAnalytics.total)}
            </span>
          </div>
        </div>

        {ytdAnalytics.total === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 text-xs">
            <DollarSign className="w-12 h-12 stroke-1 mb-2 text-zinc-400" />
            No YTD dividend payments recorded. Make sure your active holdings have dividend distribution details.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Month-wise YTD Income Chart */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                YTD Monthly Income Timeline
              </span>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ytdAnalytics.monthlyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.12} />
                    <XAxis dataKey="monthName" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip content={<CustomYTDTooltip />} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {ytdAnalytics.monthlyPoints.map((entry, index) => (
                        <Cell 
                          key={`cell-ytd-${index}`} 
                          fill={entry.amount > 0 ? '#6366f1' : '#e4e4e7'}
                          className={entry.amount > 0 ? 'fill-indigo-600 dark:fill-indigo-500' : 'fill-gray-200 dark:fill-zinc-800'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* YTD breakdown by Tickers */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                YTD Contribution Breakdown
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ytdAnalytics.tickerBreakdown.map((t, index) => (
                  <div 
                    key={t.ticker}
                    className="p-4 bg-gray-50/50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-850/80 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-950 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                        <span className="font-bold text-xs font-mono">{t.ticker}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                          {t.name}
                        </span>
                        <span className="block text-[10px] text-gray-400 dark:text-zinc-500">
                          {t.percentage.toFixed(1)}% of YTD Total
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-gray-950 dark:text-zinc-100 pl-2 shrink-0">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
