import { TrendingUp, TrendingDown, DollarSign, Calendar, Flame, Percent } from 'lucide-react';
import { PortfolioStats } from '../types';

interface StatsCardsProps {
  stats: PortfolioStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const isGainPositive = stats.totalGainLoss >= 0;
  const isDailyPositive = stats.dailyChange >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const cards = [
    {
      id: "stat-total-value",
      title: "Portfolio Value",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      subText: `Cost Base: ${formatCurrency(stats.totalCost)}`,
      subColor: "text-gray-500 dark:text-zinc-400"
    },
    {
      id: "stat-total-gain",
      title: "Unrealized Gain / Loss",
      value: (isGainPositive ? "+" : "") + formatCurrency(stats.totalGainLoss),
      icon: isGainPositive ? TrendingUp : TrendingDown,
      color: isGainPositive
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      subText: `${isGainPositive ? "▲" : "▼"} ${stats.totalGainLossPercent.toFixed(2)}% (All-time)`,
      subColor: isGainPositive ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"
    },
    {
      id: "stat-daily-change",
      title: "Daily Performance",
      value: (isDailyPositive ? "+" : "") + formatCurrency(stats.dailyChange),
      icon: isDailyPositive ? TrendingUp : TrendingDown,
      color: isDailyPositive
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      subText: `${isDailyPositive ? "▲" : "▼"} ${stats.dailyChangePercent.toFixed(2)}% (Today)`,
      subColor: isDailyPositive ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"
    },
    {
      id: "stat-dividend-income",
      title: "Annual Dividend Income",
      value: formatCurrency(stats.annualDividendIncome),
      icon: Calendar,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      subText: `Yield: ${stats.portfolioYield.toFixed(2)}% | YoC: ${stats.yieldOnCost.toFixed(2)}%`,
      subColor: "text-indigo-600 dark:text-indigo-400 font-medium"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            id={card.id}
            key={card.title}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-zinc-50 mb-1">
                {card.value}
              </h3>
              <p className={`text-xs ${card.subColor}`}>
                {card.subText}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
