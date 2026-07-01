import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { Holding } from '../types';
import { calculateDividendCalendar, MonthlyDividendPoint } from '../utils/calculations';
import { Calendar, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';

interface DividendCalendarProps {
  holdings: Holding[];
}

export default function DividendCalendar({ holdings }: DividendCalendarProps) {
  const calendarData = useMemo(() => calculateDividendCalendar(holdings), [holdings]);

  // Custom interactive tooltip to display estimated payout amount prominently on hover
  const CustomCalendarTooltip = ({ active, payload }: any) => {
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
            {monthName} Estimated Dividend
          </p>
        </div>
      );
    }
    return null;
  };

  const totalDividends = useMemo(() => {
    return calendarData.reduce((sum, item) => sum + item.amount, 0);
  }, [calendarData]);

  const monthlyAverage = useMemo(() => {
    return totalDividends / 12;
  }, [totalDividends]);

  const highestPayoutMonth = useMemo(() => {
    let max = { monthName: 'None', amount: 0 };
    calendarData.forEach(item => {
      if (item.amount > max.amount) {
        max = { monthName: item.monthName, amount: item.amount };
      }
    });
    return max;
  }, [calendarData]);

  // Extract a list of upcoming dividends sorted by size or ticker
  const allPayouts = useMemo(() => {
    const list: { ticker: string; monthName: string; amount: number }[] = [];
    calendarData.forEach(item => {
      item.tickers.forEach(t => {
        list.push({
          ticker: t.ticker,
          monthName: item.monthName,
          amount: t.amount
        });
      });
    });
    return list.sort((a, b) => b.amount - a.amount).slice(0, 8); // Top 8 payouts
  }, [calendarData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Chart Card */}
      <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Estimated Monthly Dividends
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Cashflow distribution across the 12-month calendar
          </p>
        </div>

        <div className="h-[230px]">
          {totalDividends === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 text-xs">
              <DollarSign className="w-12 h-12 stroke-1 mb-2 text-zinc-400" />
              Add dividend-paying holdings to plot cashflows.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calendarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.12} />
                <XAxis dataKey="monthName" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomCalendarTooltip />} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {calendarData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.amount > 0 ? '#4f46e5' : '#e4e4e7'}
                      className={entry.amount > 0 ? 'fill-indigo-600 dark:fill-indigo-500' : 'fill-gray-200 dark:fill-zinc-800'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Dividend Insights Column */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider text-xs border-b border-gray-100 dark:border-zinc-800/80 pb-2.5">
          Income Analytics
        </h3>

        {/* Insight metrics list */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800/60">
            <span className="block text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Monthly Average</span>
            <span className="text-sm font-mono font-bold text-gray-950 dark:text-zinc-100">{formatCurrency(monthlyAverage)}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800/60">
            <span className="block text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Peak Month</span>
            <span className="text-sm font-bold text-gray-950 dark:text-zinc-100 flex items-center gap-1">
              {highestPayoutMonth.monthName}
              {highestPayoutMonth.amount > 0 && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  (${highestPayoutMonth.amount.toFixed(0)})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Top payouts detail */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase">Top Income Components</h4>
          {allPayouts.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-zinc-500 py-4 text-center">No active dividend income.</p>
          ) : (
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {allPayouts.map((p, idx) => (
                <div
                  key={`${p.ticker}-${p.monthName}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-100/50 dark:border-zinc-850 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 dark:text-zinc-50 font-mono">{p.ticker}</span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 capitalize">in {p.monthName}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900 dark:text-zinc-200">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
