import React, { useState } from 'react';
import { Holding, TickerInfo } from '../types';
import { Search, Loader2, Plus, Trash2, X, AlertCircle, ShoppingCart } from 'lucide-react';
import { resolveHoldingDividends } from '../utils/calculations';

interface HoldingsTableProps {
  holdings: Holding[];
  onAddHolding: (holding: Holding) => void;
  onRemoveHolding: (ticker: string) => void;
  onAdjustShares: (ticker: string, sharesChange: number, price: number) => void;
  renderMode?: 'holdings' | 'transactions';
}

export default function HoldingsTable({ holdings, onAddHolding, onRemoveHolding, onAdjustShares, renderMode }: HoldingsTableProps) {
  // Search states
  const [searchTicker, setSearchTicker] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<TickerInfo | null>(null);
  const [searchError, setSearchError] = useState('');
  
  // Transaction addition states
  const [inputShares, setInputShares] = useState<number>(10);
  const [inputPrice, setInputPrice] = useState<number>(0);

  // Quick Action modal states
  const [adjustingTicker, setAdjustingTicker] = useState<string | null>(null);
  const [adjustSharesChange, setAdjustSharesChange] = useState<number>(5);
  const [adjustPrice, setAdjustPrice] = useState<number>(0);

  const totalValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = searchTicker.toUpperCase().trim();
    if (!ticker) return;

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const response = await fetch(`/api/quote/${ticker}`);
      if (!response.ok) {
        throw new Error('Ticker lookup failed');
      }
      const data = await response.json();
      setSearchResult(data);
      setInputPrice(data.price);
    } catch (err) {
      console.error(err);
      setSearchError('Failed to retrieve market data. Ticker might be invalid or unavailable.');
    } finally {
      setSearching(false);
    }
  };

  const submitAddHolding = () => {
    if (!searchResult || inputShares <= 0 || inputPrice <= 0) return;

    const newHolding: Holding = {
      ticker: searchResult.ticker,
      name: searchResult.name,
      shares: inputShares,
      avgCost: inputPrice,
      currentPrice: searchResult.price,
      prevClose: searchResult.prevClose || (searchResult.price * 0.99),
      dividendYield: searchResult.dividendYield,
      annualDividendPerShare: searchResult.annualDividendPerShare,
      payoutMonths: searchResult.payoutMonths || [],
      assetType: searchResult.assetType,
      sector: searchResult.sector
    };

    onAddHolding(newHolding);
    // Reset states
    setSearchResult(null);
    setSearchTicker('');
  };

  const handleAdjustSharesSubmit = (type: 'BUY' | 'SELL') => {
    if (!adjustingTicker) return;
    const change = type === 'BUY' ? adjustSharesChange : -adjustSharesChange;
    onAdjustShares(adjustingTicker, change, adjustPrice);
    setAdjustingTicker(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Ticker Search & Transaction Loader */}
      {(!renderMode || renderMode === 'transactions') && (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-500" />
            Add Transaction / Search Assets
          </h3>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="ticker-search-input"
                type="text"
                placeholder="Enter stock/ETF ticker (e.g. AAPL, TD.TO, ENB.TO, SCHD, O, KO, TSLA)..."
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
            <button
              id="ticker-search-btn"
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {searchError}
            </div>
          )}

          {searchResult && (
            <div className="mt-4 p-5 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/80 space-y-4 animate-fadeIn">
              {/* Asset Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3.5 border-b border-gray-200/50 dark:border-zinc-800/50">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                    {searchResult.assetType} • {searchResult.sector}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
                    {searchResult.ticker}
                    <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{searchResult.name}</span>
                  </h4>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-lg font-mono font-bold text-gray-950 dark:text-zinc-50">
                    {formatCurrency(searchResult.price)}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    Div Yield: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{searchResult.dividendYield}%</span> (${searchResult.annualDividendPerShare.toFixed(2)}/yr)
                  </p>
                </div>
              </div>

              {/* Quick Purchase Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Number of Shares</label>
                  <input
                    id="add-shares-input"
                    type="number"
                    min="0.01"
                    step="any"
                    value={inputShares}
                    onChange={(e) => setInputShares(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Average Purchase Price ($)</label>
                  <input
                    id="add-price-input"
                    type="number"
                    min="0.01"
                    step="any"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    id="confirm-add-btn"
                    onClick={submitAddHolding}
                    className="flex-1 py-2 px-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Portfolio
                  </button>
                  <button
                    id="cancel-add-btn"
                    onClick={() => setSearchResult(null)}
                    className="p-2 bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Holdings Table */}
      {(!renderMode || renderMode === 'holdings') && (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Holdings & Allocations ({holdings.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Actual positions, capital gains, and yield summary
            </p>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-zinc-500">
            <AlertCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-zinc-400" />
            <p className="text-sm">No holdings in your portfolio. Use search above to add your stocks or ETFs!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-2">Ticker / Name</th>
                  <th className="py-3.5 px-2">Asset Type</th>
                  <th className="py-3.5 px-2">Weight</th>
                  <th className="py-3.5 px-2 text-right">Shares</th>
                  <th className="py-3.5 px-2 text-right">Avg Cost</th>
                  <th className="py-3.5 px-2 text-right">Current Price</th>
                  <th className="py-3.5 px-2 text-right">Position Value</th>
                  <th className="py-3.5 px-2 text-right">Gain / Loss</th>
                  <th className="py-3.5 px-2 text-right">Div Yield</th>
                  <th className="py-3.5 px-2 text-right">Est. Annual Div</th>
                  <th className="py-3.5 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-850 text-sm">
                {holdings.map((h) => {
                  const val = h.shares * h.currentPrice;
                  const cost = h.shares * h.avgCost;
                  const gain = val - cost;
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
                  const weight = totalValue > 0 ? (val / totalValue) * 100 : 0;
                  const isGainPositive = gain >= 0;

                  const { annualDiv, dividendYield: resolvedYield } = resolveHoldingDividends(h);

                  return (
                    <tr key={h.ticker} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-gray-900 dark:text-zinc-50 font-mono">
                          {h.ticker}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400 truncate max-w-[140px]">
                          {h.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-xs">
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                          {h.assetType}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-xs font-bold text-gray-700 dark:text-zinc-300">
                        {weight.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-medium">
                        {h.shares.toFixed(2).replace(/\.00$/, '')}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-gray-600 dark:text-zinc-400">
                        {formatCurrency(h.avgCost)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-gray-900 dark:text-zinc-100 font-bold">
                        {formatCurrency(h.currentPrice)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-bold text-gray-900 dark:text-zinc-50">
                        {formatCurrency(val)}
                      </td>
                      <td className={`py-3.5 px-2 text-right font-mono font-bold ${
                        isGainPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        <div>{isGainPositive ? '+' : ''}{formatCurrency(gain)}</div>
                        <div className="text-[10px]">{isGainPositive ? '▲' : '▼'} {gainPct.toFixed(1)}%</div>
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {resolvedYield.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-gray-900 dark:text-zinc-100 font-semibold">
                        {formatCurrency(h.shares * annualDiv)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`action-adjust-${h.ticker}`}
                            title="Add/Sell Shares"
                            onClick={() => {
                              setAdjustingTicker(h.ticker);
                              setAdjustPrice(h.currentPrice);
                              setAdjustSharesChange(5);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-500/10 dark:text-zinc-400 rounded-lg cursor-pointer transition-all"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button
                            id={`action-remove-${h.ticker}`}
                            title="Delete Position"
                            onClick={() => onRemoveHolding(h.ticker)}
                            className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-zinc-400 rounded-lg cursor-pointer transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Adjust Position dialog/drawer */}
      {adjustingTicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
              <h4 className="font-bold text-gray-900 dark:text-zinc-50">
                Adjust Position: <span className="text-emerald-500">{adjustingTicker}</span>
              </h4>
              <button
                onClick={() => setAdjustingTicker(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-zinc-400">Share Amount</label>
                <input
                  id="adjust-shares-amount"
                  type="number"
                  min="0.01"
                  step="any"
                  value={adjustSharesChange}
                  onChange={(e) => setAdjustSharesChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-zinc-400">Executed Price ($)</label>
                <input
                  id="adjust-shares-price"
                  type="number"
                  min="0.01"
                  step="any"
                  value={adjustPrice}
                  onChange={(e) => setAdjustPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="adjust-buy-btn"
                onClick={() => handleAdjustSharesSubmit('BUY')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
              >
                BUY (Add Shares)
              </button>
              <button
                id="adjust-sell-btn"
                onClick={() => handleAdjustSharesSubmit('SELL')}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
              >
                SELL (Reduce Shares)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
