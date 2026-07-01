import { useState, useEffect, useMemo } from 'react';
import { Holding } from './types';
import { INITIAL_HOLDINGS } from './data/mockAssets';
import { calculatePortfolioStats } from './utils/calculations';
import ThemeToggle from './components/ThemeToggle';
import StatsCards from './components/StatsCards';
import PerformanceCharts from './components/PerformanceCharts';
import HoldingsTable from './components/HoldingsTable';
import DividendCalendar from './components/DividendCalendar';
import DividendAnalytics from './components/DividendAnalytics';
import AIInsights from './components/AIInsights';
import Login from './components/Login';
import { TrendingUp, Info, Sparkles, LineChart, LogOut, User, RefreshCw } from 'lucide-react';
import finvistaLogo from './assets/images/finvista_logo_large_1782926988817.jpg';

export default function App() {
  // Dark/Light mode state loaded from localStorage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('portfolio_dark_mode');
    return saved ? saved === 'true' : true; // Default to dark mode for a sleek visual feel
  });

  // Authentication state
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('finvista_auth_email');
  });

  // Holdings state loaded from localStorage, defaulting to high quality mock portfolio
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('portfolio_holdings');
    return saved ? JSON.parse(saved) : INITIAL_HOLDINGS;
  });

  // State to track if real-time synchronization is running
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Sync holdings updates to localStorage
  const saveHoldings = (updatedHoldings: Holding[]) => {
    setHoldings(updatedHoldings);
    localStorage.setItem('portfolio_holdings', JSON.stringify(updatedHoldings));
  };

  const handleSyncQuotes = async (currentHoldings = holdings) => {
    if (currentHoldings.length === 0) return;
    setIsSyncing(true);
    try {
      const updated = await Promise.all(
        currentHoldings.map(async (holding) => {
          try {
            const res = await fetch(`/api/quote/${encodeURIComponent(holding.ticker)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.price > 0) {
                return {
                  ...holding,
                  name: data.name || holding.name,
                  currentPrice: data.price,
                  prevClose: data.prevClose || holding.prevClose,
                  dividendYield: typeof data.dividendYield === 'number' ? data.dividendYield : holding.dividendYield,
                  annualDividendPerShare: typeof data.annualDividendPerShare === 'number' ? data.annualDividendPerShare : holding.annualDividendPerShare,
                  payoutMonths: Array.isArray(data.payoutMonths) ? data.payoutMonths : holding.payoutMonths,
                  sector: data.sector || holding.sector,
                  assetType: data.assetType || holding.assetType
                };
              }
            }
          } catch (err) {
            console.warn(`Failed to sync quote for ${holding.ticker}:`, err);
          }
          return holding;
        })
      );
      saveHoldings(updated);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Failed to sync portfolio quotes:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync ticker prices and dividends on login/load
  useEffect(() => {
    if (userEmail && holdings.length > 0) {
      handleSyncQuotes(holdings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Top level menu navigation states
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'analytics' | 'portfolio'>('dashboard');
  const [analyticsSubMenu, setAnalyticsSubMenu] = useState<'dividends' | 'diversification'>('dividends');
  const [portfolioSubMenu, setPortfolioSubMenu] = useState<'holdings' | 'transactions'>('holdings');

  // Apply dark class to body element for tailwind selectors
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('portfolio_dark_mode', String(darkMode));
  }, [darkMode]);

  // Add a new position or merge into existing position
  const handleAddHolding = (newHolding: Holding) => {
    const existingIndex = holdings.findIndex(h => h.ticker === newHolding.ticker);
    
    if (existingIndex > -1) {
      // Merge with weighted average price calculation
      const existing = holdings[existingIndex];
      const combinedShares = existing.shares + newHolding.shares;
      const weightedAvgCost = ((existing.shares * existing.avgCost) + (newHolding.shares * newHolding.avgCost)) / combinedShares;
      
      const updated = [...holdings];
      updated[existingIndex] = {
        ...existing,
        shares: combinedShares,
        avgCost: parseFloat(weightedAvgCost.toFixed(2)),
        currentPrice: newHolding.currentPrice, // update current price with latest lookup
        prevClose: newHolding.prevClose
      };
      saveHoldings(updated);
    } else {
      // Append brand new asset
      saveHoldings([...holdings, newHolding]);
    }
  };

  // Remove a position entirely
  const handleRemoveHolding = (ticker: string) => {
    const updated = holdings.filter(h => h.ticker !== ticker);
    saveHoldings(updated);
  };

  // Adjust position size (BUY / SELL shares)
  const handleAdjustShares = (ticker: string, sharesChange: number, price: number) => {
    const existingIndex = holdings.findIndex(h => h.ticker === ticker);
    if (existingIndex === -1) return;

    const existing = holdings[existingIndex];
    const newShares = existing.shares + sharesChange;

    if (newShares <= 0) {
      // Remove asset if sold down to zero or less
      handleRemoveHolding(ticker);
    } else {
      const updated = [...holdings];
      let newAvgCost = existing.avgCost;

      if (sharesChange > 0) {
        // Recalculate average cost only on buys
        newAvgCost = ((existing.shares * existing.avgCost) + (sharesChange * price)) / newShares;
      }

      updated[existingIndex] = {
        ...existing,
        shares: newShares,
        avgCost: parseFloat(newAvgCost.toFixed(2)),
        currentPrice: price // assume execution was at current price
      };
      saveHoldings(updated);
    }
  };

  // Compute stats dynamically
  const stats = useMemo(() => calculatePortfolioStats(holdings), [holdings]);

  if (!userEmail) {
    return (
      <Login 
        logoUrl={finvistaLogo} 
        onLoginSuccess={(email) => {
          setUserEmail(email);
          sessionStorage.setItem('finvista_auth_email', email);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen theme-transition bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
      
      {/* Sleek Top Banner Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-850 px-4 py-2 sm:py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center">
              <img
                src={finvistaLogo}
                alt="FinVista Analytics"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain rounded-xl shadow-xs dark:shadow-none transition-all duration-300 hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* User Profile / Logout / Theme Toggle on mobile */}
            <div className="md:hidden flex items-center gap-1.5">
              <button
                onClick={() => handleSyncQuotes()}
                disabled={isSyncing}
                className={`p-1.5 text-gray-500 hover:text-emerald-500 dark:text-zinc-400 dark:hover:text-emerald-400 rounded-lg cursor-pointer hover:bg-emerald-500/10 transition-colors ${isSyncing ? 'animate-spin text-emerald-500' : ''}`}
                title="Sync Real-time Quotes"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                id="logout-btn-mobile"
                onClick={() => {
                  setUserEmail(null);
                  sessionStorage.removeItem('finvista_auth_email');
                }}
                className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg cursor-pointer hover:bg-rose-500/10 transition-colors"
                title="Logout Profile"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            </div>
          </div>

          {/* Top Level Menus */}
          <div className="flex items-center gap-1 bg-gray-100/60 dark:bg-zinc-950/60 p-1.5 rounded-2xl border border-gray-100 dark:border-zinc-850/60 w-full md:w-auto justify-center">
            <button
              id="menu-tab-dashboard"
              onClick={() => setActiveMenu('dashboard')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Dashboard
            </button>
            <button
              id="menu-tab-analytics"
              onClick={() => setActiveMenu('analytics')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeMenu === 'analytics'
                  ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Analytics
            </button>
            <button
              id="menu-tab-portfolio"
              onClick={() => setActiveMenu('portfolio')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeMenu === 'portfolio'
                  ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              Portfolio
            </button>
          </div>

          {/* User Profile Info & Theme Toggle on larger devices */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {lastSyncedAt && (
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                Synced {lastSyncedAt}
              </span>
            )}
            <button
              onClick={() => handleSyncQuotes()}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 rounded-xl text-xs font-semibold cursor-pointer transition-all text-gray-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 ${isSyncing ? 'opacity-80' : ''}`}
              title="Sync Portfolio Real-time Quotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Prices'}</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 rounded-xl">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 font-mono">
                {userEmail}
              </span>
            </div>
            <button
              id="logout-btn-desktop"
              onClick={() => {
                setUserEmail(null);
                sessionStorage.removeItem('finvista_auth_email');
              }}
              className="p-2 text-gray-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-all"
              title="Logout Profile"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-800" />
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Sub menu selector (if on Analytics or Portfolio) */}
        {(activeMenu === 'analytics' || activeMenu === 'portfolio') && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl gap-3 shadow-xs">
            <div className="text-center sm:text-left">
              <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                {activeMenu === 'analytics' ? 'Analytics Studio' : 'Portfolio Explorer'}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                {activeMenu === 'analytics' 
                  ? 'Deconstruct dividend cash flows, compounding models, and diversification weights.' 
                  : 'Manage active holdings, update average share costs, and search real-time ticker quotes.'}
              </p>
            </div>

            {activeMenu === 'analytics' && (
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-zinc-950/60 rounded-xl border border-gray-100 dark:border-zinc-850">
                <button
                  id="sub-tab-dividends"
                  onClick={() => setAnalyticsSubMenu('dividends')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    analyticsSubMenu === 'dividends'
                      ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Dividends
                </button>
                <button
                  id="sub-tab-diversification"
                  onClick={() => setAnalyticsSubMenu('diversification')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    analyticsSubMenu === 'diversification'
                      ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Diversification
                </button>
              </div>
            )}

            {activeMenu === 'portfolio' && (
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-zinc-950/60 rounded-xl border border-gray-100 dark:border-zinc-850">
                <button
                  id="sub-tab-holdings"
                  onClick={() => setPortfolioSubMenu('holdings')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    portfolioSubMenu === 'holdings'
                      ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Holdings
                </button>
                <button
                  id="sub-tab-transactions"
                  onClick={() => setPortfolioSubMenu('transactions')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    portfolioSubMenu === 'transactions'
                      ? 'bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Transactions
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Content */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Portfolio Statistics Cards */}
            <StatsCards stats={stats} />

            {/* Grid Area: Charts and Smart Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <PerformanceCharts
                  holdings={holdings}
                  annualDividendIncome={stats.annualDividendIncome}
                  totalValue={stats.totalValue}
                />
              </div>
              <div className="lg:col-span-2">
                <AIInsights holdings={holdings} />
              </div>
            </div>
          </div>
        )}

        {/* Analytics - Dividends Content */}
        {activeMenu === 'analytics' && analyticsSubMenu === 'dividends' && (
          <div className="space-y-6 animate-fadeIn">
            <DividendAnalytics holdings={holdings} />
            <DividendCalendar holdings={holdings} />
          </div>
        )}

        {/* Analytics - Diversification Content */}
        {activeMenu === 'analytics' && analyticsSubMenu === 'diversification' && (
          <div className="space-y-6 animate-fadeIn">
            <PerformanceCharts
              holdings={holdings}
              annualDividendIncome={stats.annualDividendIncome}
              totalValue={stats.totalValue}
              forceTab="allocation"
            />
          </div>
        )}

        {/* Portfolio - Holdings Content */}
        {activeMenu === 'portfolio' && portfolioSubMenu === 'holdings' && (
          <div className="space-y-6 animate-fadeIn">
            <HoldingsTable
              holdings={holdings}
              onAddHolding={handleAddHolding}
              onRemoveHolding={handleRemoveHolding}
              onAdjustShares={handleAdjustShares}
              renderMode="holdings"
            />
          </div>
        )}

        {/* Portfolio - Transactions Content */}
        {activeMenu === 'portfolio' && portfolioSubMenu === 'transactions' && (
          <div className="space-y-6 animate-fadeIn">
            <HoldingsTable
              holdings={holdings}
              onAddHolding={handleAddHolding}
              onRemoveHolding={handleRemoveHolding}
              onAdjustShares={handleAdjustShares}
              renderMode="transactions"
            />
          </div>
        )}

      </main>

      {/* Humble professional Footer */}
      <footer className="border-t border-gray-100 dark:border-zinc-850 py-5 text-center mt-10 text-[10px] text-gray-400 dark:text-zinc-500 font-mono tracking-wider">
        <p>FinVista Investment Portfolio Tracker © 2026 • Compounding Engine v1.2</p>
        <p className="mt-1 text-[9px] text-gray-300 dark:text-zinc-600">Please review and adjust generated dividend calendars or ticker estimates relative to actual brokerage distributions.</p>
      </footer>
      
    </div>
  );
}
