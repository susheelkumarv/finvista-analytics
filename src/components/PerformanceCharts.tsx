import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { Holding } from '../types';
import {
  calculateAllocationByAsset,
  calculateAllocationBySector,
  calculateAllocationByHolding
} from '../utils/calculations';
import { PieChart as PieIcon, LineChart as ChartIcon, RefreshCw } from 'lucide-react';

interface PerformanceChartsProps {
  holdings: Holding[];
  annualDividendIncome: number;
  totalValue: number;
  forceTab?: 'allocation' | 'projections';
}

// Gorgeous modern colors for dark/light dashboard themes
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

export default function PerformanceCharts({ holdings, annualDividendIncome, totalValue, forceTab }: PerformanceChartsProps) {
  const [activeTabState, setActiveTab] = useState<'allocation' | 'projections'>('allocation');
  const activeTab = forceTab || activeTabState;

  const [allocationSubTab, setAllocationSubTab] = useState<'holdings' | 'sectors' | 'assets'>('holdings');
  
  // Custom interactive tooltip showing ticker names on hover for all allocation types
  const CustomAllocationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const name = data.name;
      const value = data.value;

      // Resolve matching ticker names depending on sub-tab
      let tickersLabel = '';
      if (allocationSubTab === 'holdings') {
        tickersLabel = name;
      } else if (allocationSubTab === 'sectors') {
        const matching = holdings.filter(h => (h.sector || 'Uncategorized') === name);
        tickersLabel = matching.map(h => h.ticker).join(', ');
      } else if (allocationSubTab === 'assets') {
        const matching = holdings.filter(h => h.assetType === name);
        tickersLabel = matching.map(h => h.ticker).join(', ');
      }

      return (
        <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]">
          <p className="font-extrabold text-zinc-100 flex items-center justify-between gap-2 border-b border-zinc-800 pb-1 capitalize">
            <span>{allocationSubTab === 'holdings' ? 'Holding' : allocationSubTab === 'sectors' ? 'Sector' : 'Asset Class'}</span>
            <span className="text-zinc-400 font-normal">{name}</span>
          </p>
          {tickersLabel && (
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Tickers</span>
              <p className="font-mono text-emerald-400 text-xs font-semibold">{tickersLabel}</p>
            </div>
          )}
          <div className="space-y-0.5 pt-1 border-t border-zinc-800/50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Allocation Weight</span>
            <p className="font-mono text-zinc-100 text-xs font-bold">{value.toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Projection variables
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [expectedGrowth, setExpectedGrowth] = useState<number>(7); // Annual capital growth %
  const [reinvestDividends, setReinvestDividends] = useState<boolean>(true);

  // Compute allocation data
  const assetAllocation = useMemo(() => calculateAllocationByAsset(holdings), [holdings]);
  const sectorAllocation = useMemo(() => calculateAllocationBySector(holdings), [holdings]);
  const holdingAllocation = useMemo(() => calculateAllocationByHolding(holdings), [holdings]);

  // Compute projection data over 10 years
  const projectionData = useMemo(() => {
    const data = [];
    let currentVal = totalValue || 5000; // default to $5k if empty portfolio
    let annualDivRate = totalValue > 0 ? (annualDividendIncome / totalValue) : 0.035; // default 3.5% yield

    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        data.push({
          year: `Year ${year}`,
          value: Math.round(currentVal),
          dividend: Math.round(currentVal * annualDivRate)
        });
        continue;
      }

      // 12 monthly contributions and growth compounding monthly
      for (let month = 0; month < 12; month++) {
        // Compound capital appreciation (e.g. 7% / 12)
        currentVal = currentVal * (1 + (expectedGrowth / 100) / 12);
        // Add monthly contribution
        currentVal += monthlyContribution;
        
        // Add monthly dividend distribution and compound if checked
        const monthlyDivPayout = (currentVal * annualDivRate) / 12;
        if (reinvestDividends) {
          currentVal += monthlyDivPayout;
        }
      }

      data.push({
        year: `Year ${year}`,
        value: Math.round(currentVal),
        dividend: Math.round(currentVal * annualDivRate)
      });
    }
    return data;
  }, [totalValue, annualDividendIncome, monthlyContribution, expectedGrowth, reinvestDividends]);

  const activeAllocationData = useMemo(() => {
    switch (allocationSubTab) {
      case 'assets': return assetAllocation;
      case 'sectors': return sectorAllocation;
      case 'holdings': return holdingAllocation;
    }
  }, [allocationSubTab, assetAllocation, sectorAllocation, holdingAllocation]);

  const formatCurrencyAbbrev = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xs">
      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            {forceTab === 'allocation' 
              ? 'Diversification Weights' 
              : forceTab === 'projections' 
                ? 'Compounding & Growth Projection' 
                : 'Analytics Studio'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
            {forceTab === 'allocation' 
              ? 'Interactive breakdown of asset types, industry sectors, and ticker weights' 
              : forceTab === 'projections' 
                ? 'Interactive projection of wealth growth and compounded dividend reinvestment' 
                : 'Interactive allocations and wealth projections'}
          </p>
        </div>

        {!forceTab && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-zinc-950 rounded-xl">
            <button
              id="chart-tab-allocation"
              onClick={() => setActiveTab('allocation')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'allocation'
                  ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              Allocation Weighting
            </button>
            <button
              id="chart-tab-projections"
              onClick={() => setActiveTab('projections')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'projections'
                  ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              <ChartIcon className="w-4 h-4" />
              Dividend Projection
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Render */}
      {activeTab === 'allocation' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-zinc-800/50">
            {['holdings', 'sectors', 'assets'].map((tab) => (
              <button
                id={`alloc-sub-tab-${tab}`}
                key={tab}
                onClick={() => setAllocationSubTab(tab as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all ${
                  allocationSubTab === tab
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {/* Chart Area */}
            <div className="md:col-span-3 h-[280px]">
              {activeAllocationData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500">
                  <PieIcon className="w-12 h-12 stroke-1 mb-2" />
                  <p className="text-xs">No assets in portfolio</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {activeAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomAllocationTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Allocation Legend Details */}
            <div className="md:col-span-2 space-y-3 max-h-[280px] overflow-y-auto pr-2">
              <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Distribution Detail
              </h3>
              {activeAllocationData.length === 0 ? (
                <p className="text-xs text-gray-400">Add stock holdings to calculate asset diversification ratios.</p>
              ) : (
                activeAllocationData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100">
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Dividend compounding projection chart
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Projection Controls */}
            <div className="lg:col-span-1 p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/60 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider pb-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                Compounding Inputs
              </h3>

              {/* Monthly Contribution Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Monthly Deposit</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">${monthlyContribution}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-gray-200 dark:bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* expectedGrowth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-zinc-400">Annual Appreciation</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{expectedGrowth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={expectedGrowth}
                  onChange={(e) => setExpectedGrowth(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-gray-200 dark:bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* DRIP checkbox */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500 dark:text-zinc-400">Reinvest Dividends (DRIP)</span>
                <button
                  onClick={() => setReinvestDividends(!reinvestDividends)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    reinvestDividends ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      reinvestDividends ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800/80 text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                🚀 By compounding returns with monthly contributions, you build a snowball effect that accelerates dividend payouts exponentially.
              </div>
            </div>

            {/* Projection Area Chart */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400 font-medium">
                <span>Value Milestone at Year 10: <b className="font-mono text-gray-900 dark:text-zinc-50 text-sm">${projectionData[10]?.value.toLocaleString()}</b></span>
                <span>Annual Cashflow: <b className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">${projectionData[10]?.dividend.toLocaleString()}</b></span>
              </div>
              
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="projDiv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.12} />
                    <XAxis dataKey="year" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={formatCurrencyAbbrev}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        color: '#f4f4f5'
                      }}
                      formatter={(value, name) => [
                        `$${value.toLocaleString()}`,
                        name === 'value' ? 'Portfolio Value' : 'Est. Annual Dividends'
                      ]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#projVal)" />
                    <Area type="monotone" dataKey="dividend" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#projDiv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
