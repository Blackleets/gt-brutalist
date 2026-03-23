import { AethrixPool } from './aethrix';
import { RealArbitrageOpportunity, ExecutedArb, HunterSignal } from './store';

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
        reason: "cross_chain_mismatch" | "unrealistic_spread" | "stale_quote" | "low_liquidity" | "excessive_slippage" | "insufficient_net_profit" | "major_asset_suspicious_spread" | "fee_impact_too_high" | "ambiguous_token_mapping" | "uncertain_execution_conditions";
        profit: number;
        liquidity: number;
        timestamp: number;
    }[];
    watchlist: RealArbitrageOpportunity[];
    realProfits: ExecutedArb[];
    hunterSignals: HunterSignal[];
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
    const watchlist: RealArbitrageOpportunity[] = [];
    const rejected: ArbitrageEngineResult['rejected'] = [];
    const tokenGroups = new Map<string, AethrixPool[]>();

    const SIMULATED_TRADE_SIZE = 1000; 
    const MIN_LIQUIDITY = 100000;       

    const MAJOR_ASSETS = ["SOL", "BNB", "ETH", "BTC", "USDC", "USDT"];

    allPools.forEach(p => {
        const addr = p.baseToken.address;
        if (p.liquidityUsd >= 5000) { 
            if (!tokenGroups.has(addr)) tokenGroups.set(addr, []);
            tokenGroups.get(addr)!.push(p);
        }
    });

    tokenGroups.forEach((pools, tokenAddr) => {
        if (pools.length < 2) return;

        const sorted = [...pools].sort((a, b) => a.priceUsd - b.priceUsd);
        const minPool = sorted[0];
        const maxPool = sorted[sorted.length - 1];

        if (minPool.dex === maxPool.dex || minPool.priceUsd <= 0 || maxPool.priceUsd <= 0) return;

        const arbId = `arb-${tokenAddr.substring(0, 8)}-${minPool.dex}-${maxPool.dex}`;

        // 0. Ambiguous Token Protection (Security Layer)
        if (minPool.baseToken.symbol !== maxPool.baseToken.symbol) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "ambiguous_token_mapping",
                profit: 0,
                liquidity: 0,
                timestamp: Date.now()
            });
            return;
        }

        // 1. Cross-Chain Protection: Reject spreads across different chains (Safe Mode Priority)
        // Ensure chain(buyDEX) == chain(sellDEX)
        if (minPool.chain !== maxPool.chain) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "cross_chain_mismatch",
                profit: ((maxPool.priceUsd / minPool.priceUsd) - 1) * 100,
                liquidity: Math.min(minPool.liquidityUsd, maxPool.liquidityUsd),
                timestamp: Date.now()
            });
            return;
        }

        // 2. Major Asset Protection: > 5% spread on majors is usually a data error/stale quote
        const spread = ((maxPool.priceUsd / minPool.priceUsd) - 1) * 100;
        if (MAJOR_ASSETS.includes(minPool.baseToken.symbol.toUpperCase()) && spread > 5.0) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "major_asset_suspicious_spread",
                profit: spread,
                liquidity: Math.min(minPool.liquidityUsd, maxPool.liquidityUsd),
                timestamp: Date.now()
            });
            return;
        }

        // 3. Spread Gate
        if (spread < 0.8 || spread > 50.0 || isNaN(spread)) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: isNaN(spread) ? "uncertain_execution_conditions" : "unrealistic_spread",
                profit: isNaN(spread) ? 0 : spread,
                liquidity: Math.min(minPool.liquidityUsd, maxPool.liquidityUsd),
                timestamp: Date.now()
            });
            return;
        }

        // 4. Liquidity Verification
        if (minPool.liquidityUsd < MIN_LIQUIDITY || maxPool.liquidityUsd < MIN_LIQUIDITY) {

            // ... (keep potentialArb creation)
            const potentialArb = {
                id: arbId,
                token: minPool.baseToken.symbol,
                quoteToken: minPool.quoteToken.symbol,
                path: `${minPool.dex} ➔ ${maxPool.dex}`,
                buyExchange: minPool.dex,
                sellExchange: maxPool.dex,
                buyPrice: minPool.priceUsd,
                sellPrice: maxPool.priceUsd,
                buyChain: minPool.chain.toUpperCase(),
                sellChain: maxPool.chain.toUpperCase(),
                profit: Number(spread.toFixed(2)),
                estimatedProfitUtic: 0,
                simulatedSize: SIMULATED_TRADE_SIZE,
                liquidityLevel: Math.floor(Math.min(minPool.liquidityUsd, maxPool.liquidityUsd)),
                netProfitAfterFees: 0,
                timeLeft: 60,
                confidence: "LOW" as const,
                status: "ACTIVE" as const,
                classification: "WATCHLIST" as const
            };
            watchlist.push(potentialArb);
            
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "low_liquidity",
                profit: spread,
                liquidity: Math.min(minPool.liquidityUsd, maxPool.liquidityUsd),
                timestamp: Date.now()
            });
            return;
        }

        // 5. Multi-Size Executable Quote Validation ($500, $1000)
        // Ensure trade size can be executed without major price impact
        const VALIDATION_SIZES = [500, 1000];
        let passesAllSizes = true;
        let finalNetProfitROI = 0;
        let finalNetProfitUsd = 0;
        let finalExecutionBuyPrice = 0;
        let finalExecutionSellPrice = 0;

        for (const size of VALIDATION_SIZES) {
            const bSlippage = size / (minPool.liquidityUsd / 2);
            const sSlippage = size / (maxPool.liquidityUsd / 2);
            
            if (bSlippage > 0.05 || sSlippage > 0.05) {
                passesAllSizes = false;
                break;
            }

            const eBuyPrice = minPool.priceUsd * (1 + bSlippage);
            const eSellPrice = maxPool.priceUsd * (1 - sSlippage);
            const bribeFactor = executionParams.bribePriority === "ULTRA" ? 5 : executionParams.bribePriority === "HIGH" ? 2 : 1;
            const nFeeUsd = minPool.chain === "solana" ? (0.01 * bribeFactor) : (0.40 * bribeFactor);

            const tBought = size / eBuyPrice;
            const gSellOutput = tBought * eSellPrice;
            const sFeesUsd = (size * 0.003) + (gSellOutput * 0.003);
            const nProfitUsd = (gSellOutput - size) - sFeesUsd - nFeeUsd;
            
            const totalSlippagePct = (bSlippage + sSlippage) * 100;
            const feePct = ((sFeesUsd + nFeeUsd) / size) * 100;
            const realProfitPct = spread - feePct - totalSlippagePct;

            if (realProfitPct < 0.5) {
                passesAllSizes = false;
                break;
            }

            if (size === 1000) {
                finalNetProfitROI = realProfitPct;
                finalNetProfitUsd = nProfitUsd;
                finalExecutionBuyPrice = eBuyPrice;
                finalExecutionSellPrice = eSellPrice;
            }
        }

        if (!passesAllSizes) {
            rejected.push({
                id: arbId,
                token: minPool.baseToken.symbol,
                reason: "excessive_slippage",
                profit: spread,
                liquidity: minPool.liquidityUsd,
                timestamp: Date.now()
            });
            return;
        }

        // 8. Final Verified Opportunity
        opportunities.push({
            id: arbId,
            token: minPool.baseToken.symbol,
            quoteToken: minPool.quoteToken.symbol,
            path: `${minPool.dex} ➔ ${maxPool.dex}`,
            buyExchange: minPool.dex,
            sellExchange: maxPool.dex,
            buyPrice: finalExecutionBuyPrice,
            sellPrice: finalExecutionSellPrice,
            buyChain: minPool.chain.toUpperCase(),
            sellChain: maxPool.chain.toUpperCase(),
            profit: Number(finalNetProfitROI.toFixed(4)),
            estimatedProfitUtic: Number(finalNetProfitUsd.toFixed(2)),
            simulatedSize: 1000,
            liquidityLevel: Math.floor(Math.min(minPool.liquidityUsd, maxPool.liquidityUsd)),
            netProfitAfterFees: Number(finalNetProfitUsd.toFixed(2)),
            timeLeft: 30,
            confidence: finalNetProfitROI > 5 ? "HIGH" : "MEDIUM",
            status: "ACTIVE",
            classification: "VERIFIED"
        });
    });

    // 9. Real Profit Detection (On-Chain Pattern Simulation)
    // REMOVED INVALID DATA (fake executions). Only real trades should be exposed.
    const realProfits: ExecutedArb[] = [];
    const hunterSignals: HunterSignal[] = [];

    return { opportunities, rejected, watchlist, realProfits, hunterSignals };
}
