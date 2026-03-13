import { scanAethrixPools, fetchSpotlightTokens } from '../lib/aethrix';
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
                const [solResponse, bscResponse, spotlightPools] = await Promise.all([
                    scanAethrixPools("solana"),
                    scanAethrixPools("bsc"),
                    fetchSpotlightTokens()
                ]);

                const allPools = [
                    ...(solResponse.pools || []),
                    ...(bscResponse.pools || []),
                    ...spotlightPools
                ];

                // Perform Background Fusion & Alpha Scoring
                allPools.forEach(pool => {
                    const { score, insights } = calculateUnifiedScore(pool, latestSmartMoneyActivity, latestKolSignals);
                    pool.score = score;
                    pool.alphaScore = score;
                    pool.alphaReasons = insights;
                });

                // Perform Background Arbitrage Detection
                const arbResult = calculateArbitrageOpportunities(allPools, executionParams);

                self.postMessage({
                    type: 'DATA_FUSED',
                    pools: allPools,
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
        setInterval(execute, 10000);
    }
};
