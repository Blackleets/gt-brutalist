import { scanAethrixPools, fetchSpotlightTokens, fetchTrendingPairs, AethrixPool } from '../lib/aethrix';
import { calculateArbitrageOpportunities, calculateUnifiedScore } from '../lib/engineCore';

let executionParams = { slippage: '0.5', bribePriority: 'MID' };
let latestKolSignals: { tokenAddress: string; timestamp: number }[] = [];
let latestSmartMoneyActivity: Record<string, { lastInteraction: number }> = {};

self.onmessage = async (e) => {
    const { action, params, kolSignals, smartMoneyActivity } = e.data;

    if (action === 'updateUIState') {
        if (params) executionParams = params;
        if (kolSignals) latestKolSignals = kolSignals;
        if (smartMoneyActivity) latestSmartMoneyActivity = smartMoneyActivity;
    }

    if (action === 'start') {
        const execute = async () => {
            try {
                // Fetch from multiple real sources to ensure high density of real data
                const [solResponse, bscResponse, spotlightPools, trendingPools] = await Promise.all([
                    scanAethrixPools("solana"),
                    scanAethrixPools("bsc"),
                    fetchSpotlightTokens(),
                    fetchTrendingPairs()
                ]);

                // Combine and Deduplicate by pair address to prevent UI flickering
                const rawPools = [
                    ...(solResponse.pools || []),
                    ...(bscResponse.pools || []),
                    ...spotlightPools,
                    ...trendingPools
                ];

                const uniquePoolsMap = new Map<string, AethrixPool>();
                rawPools.forEach(pool => {
                    if (!uniquePoolsMap.has(pool.id)) {
                        // Strict Filtering: Real data quality check
                        const hasReliableLiquidity = pool.liquidityUsd >= 100000;
                        const hasActiveVolume = pool.volume24hUsd >= 50000;
                        const hasValidPrice = pool.priceUsd > 0;

                        if (hasReliableLiquidity && hasActiveVolume && hasValidPrice) {
                            uniquePoolsMap.set(pool.id, pool);
                        }
                    }
                });

                const allPools = Array.from(uniquePoolsMap.values());

                // Perform Background Fusion & Alpha Scoring
                allPools.forEach(pool => {
                    const { score, insights } = calculateUnifiedScore(pool, latestSmartMoneyActivity, latestKolSignals);
                    pool.score = score;
                    pool.alphaScore = score;
                    pool.alphaReasons = insights;
                });

                // Sort by score or volume and limit to top 50
                const finalPools = allPools
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .slice(0, 50);

                // Perform Background Arbitrage Detection
                const arbResult = calculateArbitrageOpportunities(finalPools, executionParams);

                self.postMessage({
                    type: 'DATA_FUSED',
                    pools: finalPools,
                    arbOpportunities: arbResult.opportunities,
                    arbRejected: arbResult.rejected,
                    arbWatchlist: arbResult.watchlist,
                    arbRealProfits: arbResult.realProfits,
                    arbHunterSignals: arbResult.hunterSignals,
                    solMode: solResponse.mode,
                    bscMode: bscResponse.mode,
                    timestamp: Date.now()
                });
            } catch (err) {
                console.error("DEX_SCAN_FAILED", err);
                self.postMessage({ type: 'ERROR', error: 'DEX_SCAN_FAILED' });
            }
        };

        execute();
        // Run every 10 seconds to maintain fresh data without overloading API
        setInterval(execute, 10000);
    }
};
