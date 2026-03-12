import { AethrixPool } from './aethrix';
import { RealArbitrageOpportunity } from './store';

export interface UnifiedScoreResult {
    score: number;
    insights: string[];
}

/**
 * UNIFIED SIGNAL FUSION ENGINE
 * Combines DEX, Social (KOL), and Whale (Smart Money) signals into a single Alpha Score.
 */
export function calculateUnifiedScore(
    pool: AethrixPool,
    smartMoneyActivity: Record<string, { lastInteraction: number }>,
    kolSignals: { tokenAddress: string; timestamp: number }[]
): UnifiedScoreResult {
    let score = 0;
    const insights: string[] = [];

    // 1. DEX liquidity spike (+40) - Heuristic for rapid growth
    if (pool.liquidityUsd > 10000 && pool.priceChange5m > 15) {
        score += 40;
        insights.push("DEX_LIQUIDITY_SURGE");
    } else if (pool.score > 70) {
        score += 25;
        insights.push("DEX_MOMENTUM_STRENGTH");
    }

    // 2. Smart money buy (+30) - Cross-reference with Smart Money Radar
    const smart = smartMoneyActivity[pool.baseToken.address];
    if (smart && (Date.now() - (smart.lastInteraction || 0) < 1200000)) { // 20 mins
        score += 30;
        insights.push("SMART_MONEY_INFLOW");
    }

    // 3. KOL mention (+20) - Cross-reference with Social Index
    const kol = kolSignals.find(s => s.tokenAddress === pool.baseToken.address);
    if (kol && (Date.now() - (kol.timestamp || 0) < 7200000)) { // 2 hours
        score += 20;
        insights.push("SOCIAL_KOL_ALPHA");
    }

    // 4. Volume anomaly (+10) - High turnover relative to liq
    if (pool.volume24hUsd > pool.liquidityUsd * 2.5) {
        score += 10;
        insights.push("VOLUME_ANOMALY");
    }

    return { score, insights };
}

/**
 * REAL-TIME ARBITRAGE ENGINE (VERIFIED V2)
 * Compares prices across multiple DEXs with strict trade simulation and liquidity requirements.
 */
export interface ArbitrageEngineResult {
    opportunities: RealArbitrageOpportunity[];
    rejected: {
        id: string;
        token: string;
        reason: "LOW_LIQUIDITY" | "HIGH_SLIPPAGE" | "STALE_QUOTE" | "INSUFFICIENT_PROFIT" | "FEE_IMPACT_TOO_HIGH";
        profit: number;
        liquidity: number;
        timestamp: number;
    }[];
}

/**
 * REAL-TIME ARBITRAGE ENGINE (VERIFIED V3 - EXECUTABLE)
 * Performs strict multi-stage validation: Slippage Simulation -> Fee Deduction -> Net ROI Verification.
 */
export function calculateArbitrageOpportunities(
    allPools: AethrixPool[],
    executionParams: { slippage: string; bribePriority: string }
): ArbitrageEngineResult {
    const opportunities: RealArbitrageOpportunity[] = [];
    const rejected: ArbitrageEngineResult['rejected'] = [];
    const tokenGroups = new Map<string, AethrixPool[]>();

    const SIMULATED_TRADE_SIZE = 1000; // $1,000 standard validation size
    const MIN_LIQUIDITY = 20000;       // $20,000 floor for executable depth
    const MIN_NET_ROI = 1.0;            // 1% Net profit floor after ALL costs

    // 1. Group pools by token and filter by base liquidity
    allPools.forEach(p => {
        const addr = p.baseToken.address;
        if (p.liquidityUsd >= 5000) { // Preliminary filter
            if (!tokenGroups.has(addr)) tokenGroups.set(addr, []);
            tokenGroups.get(addr)!.push(p);
        }
    });

    tokenGroups.forEach((pools, tokenAddr) => {
        if (pools.length < 2) return;

        // Sort pools by price to find best spread
        const sorted = [...pools].sort((a, b) => a.priceUsd - b.priceUsd);
        const minPool = sorted[0];
        const maxPool = sorted[sorted.length - 1];

        if (minPool.dex === maxPool.dex || minPool.priceUsd <= 0 || maxPool.priceUsd <= 0) return;

        const arbId = `arb-${tokenAddr.substring(0, 8)}-${minPool.dex}-${maxPool.dex}`;

        // 2. Liquidity Verification
        if (minPool.liquidityUsd < MIN_LIQUIDITY || maxPool.liquidityUsd < MIN_LIQUIDITY) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "LOW_LIQUIDITY",
                profit: 0,
                liquidity: Math.min(minPool.liquidityUsd, maxPool.liquidityUsd),
                timestamp: Date.now()
            });
            return;
        }

        // 3. Precise Slippage Simulation (Conservative Estimate)
        // We assume each side of the pool has liquidity/2. 
        const buySlippage = SIMULATED_TRADE_SIZE / (minPool.liquidityUsd / 2);
        const sellSlippage = SIMULATED_TRADE_SIZE / (maxPool.liquidityUsd / 2);

        if (buySlippage > 0.05 || sellSlippage > 0.05) { // Discard if slippage > 5% on either side
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "HIGH_SLIPPAGE",
                profit: 0,
                liquidity: minPool.liquidityUsd,
                timestamp: Date.now()
            });
            return;
        }

        const executionBuyPrice = minPool.priceUsd * (1 + buySlippage);
        const executionSellPrice = maxPool.priceUsd * (1 - sellSlippage);

        // 4. Multi-leg Fee Deduction
        const bribeFactor = executionParams.bribePriority === "ULTRA" ? 5 : executionParams.bribePriority === "HIGH" ? 2 : 1;
        const networkFeeUsd = minPool.chain === "solana" ? (0.01 * bribeFactor) : (0.40 * bribeFactor);

        // Profit Formula: net_profit = (Tokens * SellPrice) - BuyCost - Fees
        const tokensBought = SIMULATED_TRADE_SIZE / executionBuyPrice;
        const grossSellOutput = tokensBought * executionSellPrice;
        const swapFeesUsd = (SIMULATED_TRADE_SIZE * 0.003) + (grossSellOutput * 0.003);
        const netProfitUsd = (grossSellOutput - SIMULATED_TRADE_SIZE) - swapFeesUsd - networkFeeUsd;
        const netProfitROI = (netProfitUsd / SIMULATED_TRADE_SIZE) * 100;

        // 5. Verification Gate
        if (netProfitROI < MIN_NET_ROI) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: netProfitROI < 0 ? "FEE_IMPACT_TOO_HIGH" : "INSUFFICIENT_PROFIT",
                profit: netProfitROI,
                liquidity: minPool.liquidityUsd,
                timestamp: Date.now()
            });
            return;
        }

        // 6. Final Verified Opportunity
        opportunities.push({
            id: arbId,
            token: minPool.baseToken.symbol,
            quoteToken: minPool.quoteToken.symbol,
            path: `${minPool.dex} ➔ ${maxPool.dex}`,
            buyExchange: minPool.dex,
            sellExchange: maxPool.dex,
            buyPrice: executionBuyPrice,
            sellPrice: executionSellPrice,
            buyChain: minPool.chain.toUpperCase(),
            sellChain: maxPool.chain.toUpperCase(),
            profit: Number(netProfitROI.toFixed(4)), // High precision for net
            estimatedProfitUtic: Number(netProfitUsd.toFixed(2)),
            simulatedSize: SIMULATED_TRADE_SIZE,
            liquidityLevel: Math.floor(Math.min(minPool.liquidityUsd, maxPool.liquidityUsd)),
            netProfitAfterFees: Number(netProfitUsd.toFixed(2)),
            timeLeft: 30, // Hardcoded for verified status
            confidence: netProfitROI > 5 ? "HIGH" : "MEDIUM",
            status: "ACTIVE"
        });
    });

    return { opportunities, rejected };
}
