import { Holding } from '../types';
import { resolveHoldingDividends } from './calculations';

export function generateLocalPortfolioInsights(holdings: Holding[]): string {
  if (!holdings || holdings.length === 0) {
    return "No holdings found in portfolio. Add stocks or ETFs to analyze.";
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.shares * (h.avgCost || h.currentPrice)), 0);

  let totalAnnualIncome = 0;
  const sectorValues: Record<string, number> = {};
  const monthlyPayers: string[] = [];

  holdings.forEach(h => {
    const value = h.shares * h.currentPrice;
    const { annualDiv, frequency } = resolveHoldingDividends(h);
    const income = h.shares * annualDiv;
    totalAnnualIncome += income;

    // Sector breakdown
    const sec = h.sector || 'Uncategorized';
    sectorValues[sec] = (sectorValues[sec] || 0) + value;

    // Frequency
    if (frequency === 'Monthly' || frequency === 'Semi-Monthly' || frequency === 'Weekly') {
      monthlyPayers.push(h.ticker);
    }
  });

  const portfolioYield = totalValue > 0 ? (totalAnnualIncome / totalValue) * 100 : 0;
  const yieldOnCost = totalCost > 0 ? (totalAnnualIncome / totalCost) * 100 : 0;
  const monthlyEstIncome = totalAnnualIncome / 12;

  // Find top sector
  let topSector = 'Diversified';
  let topSectorVal = 0;
  Object.entries(sectorValues).forEach(([sec, val]) => {
    if (val > topSectorVal) {
      topSectorVal = val;
      topSector = sec;
    }
  });

  const topSectorPct = totalValue > 0 ? ((topSectorVal / totalValue) * 100).toFixed(1) : '0';

  // Format currency helpers
  const fmt = (num: number) => `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isHighConcentration = parseFloat(topSectorPct) > 35;
  const isHighYield = portfolioYield > 5.5;

  let adviceRecommendation = "";
  if (isHighConcentration) {
    adviceRecommendation = `Your exposure to **${topSector}** represents **${topSectorPct}%** of total portfolio assets. Consider deploying fresh capital or dividend reinvestments into secondary sectors (such as Healthcare or Consumer Staples) to buffer against industry drawdowns.`;
  } else if (isHighYield) {
    adviceRecommendation = `Your portfolio boasts a high current dividend yield of **${portfolioYield.toFixed(2)}%**. Ensure dividend safety by monitoring payout ratios for high-yield assets, and consider balancing with dividend aristocrats offering strong 5-year dividend CAGR.`;
  } else {
    adviceRecommendation = `Your portfolio maintains balanced sector exposure across **${Object.keys(sectorValues).length} sectors**. To accelerate passive income growth, consider systematically reinvesting monthly dividend distributions into compounding dividend growth ETFs or REITs.`;
  }

  const monthlyPayersText = monthlyPayers.length > 0
    ? `**High Cash-Flow Assets**: You hold **${monthlyPayers.length} frequent payer(s)** (${monthlyPayers.slice(0, 4).join(', ')}${monthlyPayers.length > 4 ? ', ...' : ''}) providing recurring cash flow for monthly reinvestment.`
    : `**Payout Frequency**: Most of your assets distribute dividends quarterly. Consider adding a monthly payer (such as Realty Income - O or JEPI) to smooth monthly cash flows.`;

  return `### 📊 Portfolio Allocation & Concentration Analysis
* **Total Portfolio Value**: **${fmt(totalValue)}** across **${holdings.length} position(s)** with an average yield of **${portfolioYield.toFixed(2)}%**.
* **Primary Concentration**: **${topSector}** is your largest sector weighting at **${topSectorPct}%** (${fmt(topSectorVal)}).
* **Diversification Status**: ${isHighConcentration ? 'Higher concentration detected in ' + topSector + '.' : 'Healthy diversification spread across multiple market sectors.'}

### 💵 Passive Income & Cash Flow Metrics
* **Projected Annual Income**: **${fmt(totalAnnualIncome)} / year** (~**${fmt(monthlyEstIncome)} / month**).
* **Effective Yield on Cost**: Your Yield on Cost stands at **${yieldOnCost.toFixed(2)}%** relative to invested capital.
* ${monthlyPayersText}

### 💡 Strategic Advisor Recommendations
* **Actionable Insight**: ${adviceRecommendation}
* **Compounding Tip**: Enabling automatic DRIP (Dividend Reinvestment Plan) on your highest-yielding positions can compound your share count exponentially over a 3-5 year investment horizon.`;
}
