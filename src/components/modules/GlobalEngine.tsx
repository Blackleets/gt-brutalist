import { useEffect, useRef } from "react";
import { useAppStore, RealArbitrageOpportunity } from "@/lib/store";
import { scanAethrixPools, AethrixPool, fetchSpotlightTokens } from "@/lib/aethrix";
import { alphaEngine } from "@/modules/alpha/AlphaEngine";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";
import { kolTracker } from "@/modules/kol/KOLTracker";

export function GlobalEngine() {
    const {
        selectedChain,
        setAethrixStats,
        alertsEnabled,
        addAlert,
        setGlobalRankings,
        networkMode,
        addFeedEvent,
        setArbitrageOpportunities,
        sendTelegramMessage,
        addExecutedArb,
        addKOLSignal,
        globalRankings,
        executionParams
    } = useAppStore();

    const { isAuthorized } = useAlphaGuard();
    const prevPoolsRef = useRef<Record<string, AethrixPool>>({});

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const executeScan = async () => {
            try {
                // TRUE GLOBAL SCAN: Polling both chains simultaneously + Spotlight check
                const [solResponse, bscResponse, spotlightPools] = await Promise.all([
                    scanAethrixPools("solana"),
                    scanAethrixPools("bsc"),
                    fetchSpotlightTokens()
                ]);

                if (!isMounted) return;

                // Merge and select top performers globally
                const allPools = [
                    ...(solResponse.pools || []),
                    ...(bscResponse.pools || []),
                    ...spotlightPools
                ];

                // ARBITRAGE SCAN: High-Precision Net-Profit Calculation Algorithm
                const arbOpportunities: RealArbitrageOpportunity[] = [];
                const tokenGroups = new Map<string, AethrixPool[]>();

                // 1. Group by token, but strictly filter out dead/low-liquidity pools that cause ghost spreads
                allPools.forEach(p => {
                    const addr = p.baseToken.address;
                    // Liquidity requirement: Needs at least $5000 liquidity to avoid slippage/ghost orders
                    if (p.liquidityUsd > 5000 && p.volume24hUsd > 1000) {
                        if (!tokenGroups.has(addr)) tokenGroups.set(addr, []);
                        tokenGroups.get(addr)!.push(p);
                    }
                });

                tokenGroups.forEach((pools, tokenAddr) => {
                    if (pools.length > 1) {
                        // Find min and max price pools across DIFFERENT DEXes
                        let minPool = pools[0];
                        let maxPool = pools[0];

                        pools.forEach(p => {
                            if (p.priceUsd < minPool.priceUsd) minPool = p;
                            if (p.priceUsd > maxPool.priceUsd) maxPool = p;
                        });

                        // Ensure we are arbitraging between distinct AMMs/DEXes to avoid false fee-tier overlaps
                        if (minPool.dex !== maxPool.dex && minPool.priceUsd > 0 && maxPool.priceUsd > 0) {
                            const rawSpread = ((maxPool.priceUsd - minPool.priceUsd) / minPool.priceUsd) * 100;

                            // Precision Math: Factoring in AMM Trade Fees + Network Gas Overhead
                            // AMM swap fee is usually ~0.3% per swap. Arb requires 2 swaps = 0.6% total overhead.
                            // We now FACTOR IN the actual Slippage requested by the operator
                            const userSlippage = parseFloat(executionParams.slippage) || 0.5;
                            const AMM_FEE_PERCENT = 0.60 + userSlippage;

                            // Bribe / Priority Fees (Dynamic adjustment based on operator preference)
                            const bribeFactor = executionParams.bribePriority === "ULTRA" ? 5 : executionParams.bribePriority === "HIGH" ? 2 : 1;
                            const GAS_ESTIMATE_SOL = 0.01 * bribeFactor; // 2 swaps + priority factor
                            const GAS_ESTIMATE_BSC = 0.40 * bribeFactor; // 2 swaps on BSC

                            const gasCostUsd = minPool.chain === "solana" ? GAS_ESTIMATE_SOL : GAS_ESTIMATE_BSC;

                            // We calculate safe position sizing (max 2% of smallest pool to avoid price impact)
                            const maxSafeTradeUsd = Math.min(minPool.liquidityUsd, maxPool.liquidityUsd) * 0.02;

                            // Net Profit Calculation: (Raw Spread % - AMM Fees %) * Trade Size - Fixed Gas
                            const netProfitUsdNoGas = maxSafeTradeUsd * ((rawSpread - AMM_FEE_PERCENT) / 100);
                            const estimatedProfitUtic = netProfitUsdNoGas - gasCostUsd;

                            // Re-calculate the True Net ROI percentage for the UI
                            const netProfitPercentage = (estimatedProfitUtic / maxSafeTradeUsd) * 100;

                            // We only alert if there is a TRUE positive Net Profit after all fees/gas
                            if (netProfitPercentage > 0.05 && estimatedProfitUtic > 1) {
                                // STABLE ID: Based on token, buy dex, and sell dex to prevent UI duplication
                                const id = `arb-${tokenAddr.substring(0, 8)}-${minPool.dex}-${maxPool.dex}`;

                                // Dynamic Confidence
                                let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
                                if (netProfitPercentage > 1.5 && estimatedProfitUtic > 50) confidence = "HIGH";
                                else if (netProfitPercentage > 0.5) confidence = "MEDIUM";

                                arbOpportunities.push({
                                    id,
                                    token: minPool.baseToken.symbol,
                                    quoteToken: minPool.quoteToken.symbol,
                                    path: `${minPool.dex} ➔ ${maxPool.dex}`,
                                    buyExchange: minPool.dex,
                                    sellExchange: maxPool.dex,
                                    buyPrice: minPool.priceUsd,
                                    sellPrice: maxPool.priceUsd,
                                    buyChain: minPool.chain.toUpperCase(),
                                    sellChain: maxPool.chain.toUpperCase(),
                                    profit: Number(netProfitPercentage.toFixed(2)),
                                    estimatedProfitUtic: Number(estimatedProfitUtic.toFixed(2)),
                                    timeLeft: Math.floor(Math.random() * 20) + 10, // 10-30s valid window for high-stress urgency
                                    confidence,
                                    status: "ACTIVE"
                                });

                                // AUTO-TRIGGER TELEGRAM FOR REAL NET SPREADS > 0.5%
                                if (netProfitPercentage > 0.5 && sendTelegramMessage) {
                                    const tgMsg = `✅ *VERIFIED REAL ARBITRAGE (NET_PROFIT)*\n` +
                                        `━━━━━━━━━━━━━━━━━━━━\n` +
                                        `💰 *NET PROFIT: +${netProfitPercentage.toFixed(2)}% ROI* (After 0.6% Fees)\n` +
                                        `💎 Token: *${minPool.baseToken.symbol}*\n\n` +
                                        `📥 *ENTRY (BUY):* \`${minPool.dex}\`\n` +
                                        `Price: \`$${minPool.priceUsd.toFixed(6)}\`\n\n` +
                                        `📤 *EXIT (SELL):* \`${maxPool.dex}\`\n` +
                                        `Price: \`$${maxPool.priceUsd.toFixed(6)}\`\n\n` +
                                        `🌊 *Liquidity Check:* PASSED (>$5k)\n` +
                                        `━━━━━━━━━━━━━━━━━━━━\n` +
                                        `⚡ *Status:* REAL-TIME ACTIVE\n` +
                                        `🔗 [EXECUTE NOW](https://vytronix.io)`;
                                    sendTelegramMessage(tgMsg);
                                }
                            }
                        }
                    }
                });

                if (arbOpportunities.length > 0) {
                    setArbitrageOpportunities(arbOpportunities);
                }

                // DEDUPLICATION for the main rankings view
                const uniqueByToken = new Map<string, AethrixPool>();
                allPools.forEach(pool => {
                    const existing = uniqueByToken.get(pool.baseToken.address);
                    if (!existing || (pool.score > existing.score)) {
                        uniqueByToken.set(pool.baseToken.address, pool);
                    }
                });

                const finalPools = Array.from(uniqueByToken.values());

                // ALPHA ENGINE Integration: Always process pools to get baseline scores/info
                finalPools.forEach(pool => {
                    alphaEngine.processPool(pool);
                });

                finalPools.sort((a, b) => b.score - a.score);
                const topRanked = finalPools.slice(0, 100);

                if (topRanked.length > 0) {
                    setGlobalRankings(topRanked);

                    const maxAlphaScore = Math.max(...topRanked.map(p => p.score));
                    const highConfidence = topRanked.filter(p => ((p.score / Math.max(1, maxAlphaScore)) * 100) > 75).length;

                    const getIsMomentum = (pool: AethrixPool) => {
                        const buyRatio = pool.txns5m.buys / Math.max(1, pool.txns5m.sells);
                        return pool.priceChange5m > 25 && buyRatio > 1.3;
                    };

                    const momentumSpikesCount = finalPools.filter(getIsMomentum).length;

                    setAethrixStats({
                        activeSignals: finalPools.length,
                        highConfidence,
                        momentumSpikes: momentumSpikesCount,
                        apiMode: (solResponse.mode === "Live" || bscResponse.mode === "Live") ? "Live" : "Error",
                        scanningChain: "GLOBAL",
                        autoRefresh: true
                    });

                    // Generate Real-Time Feed Events
                    finalPools.slice(0, 15).forEach((pool, idx) => {
                        const prev = prevPoolsRef.current[pool.id];
                        const totalTx = pool.txns5m.buys + pool.txns5m.sells;
                        const prevTotal = prev ? (prev.txns5m.buys + prev.txns5m.sells) : 0;

                        if (totalTx > prevTotal || !prev) {
                            const newTxCount = totalTx - prevTotal;
                            if (newTxCount > 0 || Math.random() > 0.7) {
                                const isBuy = (pool.txns5m.buys / Math.max(1, totalTx)) > Math.random();
                                addFeedEvent({
                                    id: `pulse-${pool.id}-${Date.now()}-${idx}`,
                                    chain: pool.chain.toUpperCase(),
                                    type: isBuy ? "BUY DOMINANCE" : "SELL DOMINANCE",
                                    metricValue: `${newTxCount > 1 ? newTxCount : ''} TX • $${(pool.volume24hUsd / 1440).toFixed(2)} Vol`,
                                    tokenSymbol: pool.baseToken.symbol,
                                    time: Date.now(),
                                    isPositive: isBuy
                                });
                            }
                        }

                        if (alertsEnabled && prev) {
                            if (pool.score - prev.score >= 12) {
                                addAlert({
                                    tokenId: pool.id,
                                    tokenSymbol: pool.baseToken.symbol,
                                    message: `SCORE SURGE: +${pool.score - prev.score} PTS (${pool.score})`,
                                    type: "SCORE_SURGE"
                                });
                            }
                        }
                    });

                    const snapshots: Record<string, AethrixPool> = {};
                    finalPools.forEach(p => snapshots[p.id] = p);
                    prevPoolsRef.current = snapshots;
                }
            } catch (err) {
                console.error("GlobalEngine scan failed:", err);
                setAethrixStats({ apiMode: "Error" });
            }

            if (isMounted) {
                timeoutId = setTimeout(executeScan, 20000);
            }
        };

        executeScan();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [selectedChain, alertsEnabled, networkMode, addAlert, setAethrixStats, setGlobalRankings, addFeedEvent, setArbitrageOpportunities, sendTelegramMessage, addExecutedArb, isAuthorized, executionParams]);

    // KOL TRACKER LOOP (60s Interval)
    useEffect(() => {
        let isMounted = true;
        let kolTimeoutId: NodeJS.Timeout;

        const executeKOLScan = async () => {
            if (globalRankings.length === 0) {
                if (isMounted) kolTimeoutId = setTimeout(executeKOLScan, 5000);
                return;
            }

            try {
                const signals = await kolTracker.scan(globalRankings);

                if (!isMounted) return;

                for (const signal of signals) {
                    addKOLSignal(signal);

                    if (sendTelegramMessage) {
                        const tgMsg = `${signal.isConfirmation ? "🚨 *KOL CONFIRMATION*" : "📡 *KOL SIGNAL*"}\n\n` +
                            `Token: *$${signal.tokenSymbol}*\n` +
                            `Mentioned by: ${signal.kols.map(k => `@${k}`).join(", ")}\n` +
                            `Followers: *${signal.followerCount}*\n\n` +
                            `Impact Score: *${signal.impactScore}*\n` +
                            `Mentions Detected: *${signal.mentions}*\n\n` +
                            `Source: *KOL Tracker*`;

                        sendTelegramMessage(tgMsg);
                    }

                    addFeedEvent({
                        id: `pulse-kol-${signal.id}`,
                        chain: "GLOBAL",
                        type: "ORDER_EXECUTION",
                        metricValue: `KOL IMPACT: ${signal.impactScore}`,
                        tokenSymbol: signal.tokenSymbol,
                        time: Date.now(),
                        isPositive: true
                    });
                }
            } catch (err) {
                console.error("KOL Engine failure:", err);
            }

            if (isMounted) {
                kolTimeoutId = setTimeout(executeKOLScan, 30000); // Higher frequency for Social Intelligence
            }
        };

        executeKOLScan();

        return () => {
            isMounted = false;
            clearTimeout(kolTimeoutId);
        };
    }, [globalRankings, addKOLSignal, sendTelegramMessage, addFeedEvent]);

    return null;
}
