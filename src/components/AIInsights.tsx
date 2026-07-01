import { useState, useEffect } from 'react';
import { Holding } from '../types';
import { Sparkles, Loader2, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { generateLocalPortfolioInsights } from '../utils/aiInsightGenerator';

interface AIInsightsProps {
  holdings: Holding[];
}

export default function AIInsights({ holdings }: AIInsightsProps) {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [tipsIndex, setTipsIndex] = useState(0);

  const loadingTips = [
    "Analyzing sector allocation ratios...",
    "Scanning dividend growth and cash flow yields...",
    "Cross-referencing historical ticker payout calendars...",
    "Grounding suggestions in current market metrics...",
    "Formulating optimal diversification balance rules..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setTipsIndex((prev) => (prev + 1) % loadingTips.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const generateInsights = async () => {
    if (holdings.length === 0) {
      setError("Please add at least one stock or ETF holding to generate AI insights.");
      return;
    }

    setLoading(true);
    setError('');
    setInsight('');

    try {
      const response = await fetch('/api/portfolio/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.insight) {
          setInsight(data.insight);
          return;
        }
      }
      // If server returned non-ok or empty insight (e.g. Netlify static hosting), fallback gracefully to local generator
      const localInsight = generateLocalPortfolioInsights(holdings);
      setInsight(localInsight);
    } catch (err) {
      console.warn("Backend insight fetch failed or offline; generating client-side portfolio analysis:", err);
      // Seamless fallback for Netlify and offline deployment environments
      const localInsight = generateLocalPortfolioInsights(holdings);
      setInsight(localInsight);
    } finally {
      setLoading(false);
    }
  };

  // Safe minimal Markdown parser to render styled insights without installing heavy packages
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Headings
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-gray-900 dark:text-zinc-50 mt-4 mb-2 flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
            {trimmed.replace('###', '').trim()}
          </h4>
        );
      }
      if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-gray-950 dark:text-zinc-50 mt-5 mb-2 border-b border-gray-100 dark:border-zinc-800/80 pb-1">
            {trimmed.replace(/^#+\s*/, '')}
          </h3>
        );
      }

      // Bullet points
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const content = trimmed.replace(/^[\*\-]\s*/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-gray-600 dark:text-zinc-300 leading-relaxed mb-2">
            {parseBoldText(content)}
          </li>
        );
      }

      // Standard text line
      return (
        <p key={idx} className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed mb-2">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // Basic bold parser helper (**text** -> <strong>text</strong>)
  const parseBoldText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-gray-950 dark:text-zinc-50">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-emerald-50/50 dark:from-zinc-950 dark:to-zinc-900 border border-indigo-100/40 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
            FinVista AI Advisor
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Get personalized smart insights and sector rebalancing recommendations
          </p>
        </div>

        <button
          id="ai-generate-insights-btn"
          onClick={generateInsights}
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Compiling...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate AI Insights
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="p-8 flex flex-col items-center justify-center space-y-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs rounded-xl border border-gray-100 dark:border-zinc-800 animate-pulse">
          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{loadingTips[tipsIndex]}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">This takes about 5 seconds</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {insight && !loading && (
        <div className="p-5 bg-white dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-850 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-zinc-850">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Advisor Report</span>
          </div>
          <div className="prose prose-sm dark:prose-invert">
            {renderMarkdown(insight)}
          </div>
        </div>
      )}

      {!insight && !loading && !error && (
        <div className="text-center py-4 text-gray-400 dark:text-zinc-500 text-xs">
          Click the button above to run AI diagnostic recommendations on your allocations.
        </div>
      )}
    </div>
  );
}
