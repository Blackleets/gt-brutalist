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
export function calculateArbitrageOpportunities(
    allPools: AethrixPool[],
    executionParams: { slippage: string; bribePriority: string }
): RealArbitrageOpportunity[] {
    const arbOpportunities: RealArbitrageOpportunity[] = [];
    const tokenGroups = new Map<string, AethrixPool[]>();

    const SIMULATED_TRADE_SIZE = 1000; // $1,000 Simulation
    const MIN_LIQUIDITY = 20000;       // $20,000 minimum

    allPools.forEach(p => {
        const addr = p.baseToken.address;
        // Liquidity Rule: Ignore pools below $20,000
        if (p.liquidityUsd >= MIN_LIQUIDITY && p.volume24hUsd > 1000) {
            if (!tokenGroups.has(addr)) tokenGroups.set(addr, []);
            tokenGroups.get(addr)!.push(p);
        }
    });

    tokenGroups.forEach((pools, tokenAddr) => {
        if (pools.length > 1) {
            let minPool = pools[0];
            let maxPool = pools[0];

            pools.forEach(p => {
                if (p.priceUsd < minPool.priceUsd) minPool = p;
                if (p.priceUsd > maxPool.priceUsd) maxPool = p;
            });

            if (minPool.dex !== maxPool.dex && minPool.priceUsd > 0 && maxPool.priceUsd > 0) {
                // Liquidity Verification: Ensure both pools satisfy minimum
                if (minPool.liquidityUsd < MIN_LIQUIDITY || maxPool.liquidityUsd < MIN_LIQUIDITY) return;

                // 1. Trade Simulation & Slippage Calculation
                // Rule: slippage = trade_size / pool_liquidity
                const buySlippage = SIMULATED_TRADE_SIZE / minPool.liquidityUsd;
                const sellSlippage = SIMULATED_TRADE_SIZE / maxPool.liquidityUsd;

                // 2. Slippage Execution
                const executionBuyPrice = minPool.priceUsd * (1 + buySlippage);
                const executionSellPrice = maxPool.priceUsd * (1 - sellSlippage);

                // 3. Fee Deduction
                // Rule: Subtract estimated DEX fees (~0.3% per leg = 0.6% total)
                const DEX_FEE_TOTAL = 0.006; // 0.6% total for two swaps

                const bribeFactor = executionParams.bribePriority === "ULTRA" ? 5 : executionParams.bribePriority === "HIGH" ? 2 : 1;
                const gasCostUsd = minPool.chain === "solana" ? (0.01 * bribeFactor) : (0.40 * bribeFactor);

                // 4. Net Profit Calculation (Executable Version)
                // net_profit = sell_price_after_slippage - buy_price_after_slippage - fees
                const tradeReturnUsd = SIMULATED_TRADE_SIZE * (executionSellPrice / executionBuyPrice);
                const grossProfitUsd = tradeReturnUsd - SIMULATED_TRADE_SIZE;

                const swapFeesUsd = SIMULATED_TRADE_SIZE * DEX_FEE_TOTAL;
                const netProfitUsd = grossProfitUsd - swapFeesUsd - gasCostUsd;
                const netProfitROI = (netProfitUsd / SIMULATED_TRADE_SIZE) * 100;

                // 5. Verification Gate: Only > 1% Net Profit
                if (netProfitROI > 1.0) {
                    const id = `arb-${tokenAddr.substring(0, 8)}-${minPool.dex}-${maxPool.dex}`;

                    arbOpportunities.push({
                        id,
                        token: minPool.baseToken.symbol,
                        quoteToken: minPool.quoteToken.symbol,
                        path: `${minPool.dex} ➔ ${maxPool.dex}`,
                        buyExchange: minPool.dex,
                        sellExchange: maxPool.dex,
                        buyPrice: executionBuyPrice,
                        sellPrice: executionSellPrice,
                        buyChain: minPool.chain.toUpperCase(),
                        sellChain: maxPool.chain.toUpperCase(),
                        profit: Number(netProfitROI.toFixed(2)),
                        estimatedProfitUtic: Number(netProfitUsd.toFixed(2)),
                        simulatedSize: SIMULATED_TRADE_SIZE,
                        liquidityLevel: Math.floor(Math.min(minPool.liquidityUsd, maxPool.liquidityUsd)),
                        netProfitAfterFees: Number(netProfitUsd.toFixed(2)),
                        timeLeft: Math.floor(Math.random() * 20) + 20,
                        confidence: netProfitROI > 3 ? "HIGH" : "MEDIUM",
                        status: "ACTIVE"
                    });
                }
            }
        }
    });

    return arbOpportunities;
}
