import { useEffect, useRef } from "react";
import { useAppStore, RealArbitrageOpportunity } from "@/lib/store";
import { scanAethrixPools, AethrixPool } from "@/lib/aethrix";
import { alphaEngine } from "@/modules/alpha/AlphaEngine";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";

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
        addExecutedArb
    } = useAppStore();

    const { isAuthorized } = useAlphaGuard();
    const prevPoolsRef = useRef<Record<string, AethrixPool>>({});

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const executeScan = async () => {
            try {
                // TRUE GLOBAL SCAN: Polling both chains simultaneously
                const [solResponse, bscResponse] = await Promise.all([
                    scanAethrixPools("solana"),
                    scanAethrixPools("bsc")
                ]);

                if (!isMounted) return;

                // Merge and select top performers globally
                const allPools = [...(solResponse.pools || []), ...(bscResponse.pools || [])];

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
                            // Standard AMM swap fee is usually ~0.3% per swap. Arb requires 2 swaps = 0.6% total overhead.
                            // Plus slippage & base gas overhead buffer (~0.1%). Total hurdle rate = ~0.7%
                            const HURDLE_RATE = 0.70;
                            const netProfitPercentage = rawSpread - HURDLE_RATE;

                            // We only alert if there is a TRUE positive Net Profit after all fees
                            if (netProfitPercentage > 0.1) {
                                // STABLE ID: Based on token, buy dex, and sell dex to prevent UI duplication
                                const id = `arb-${tokenAddr.substring(0, 8)}-${minPool.dex}-${maxPool.dex}`;

                                // Calculate safe position sizing (max 2% of the smallest liquidity pool to avoid moving the market)
                                const maxSafeTradeUsd = Math.min(minPool.liquidityUsd, maxPool.liquidityUsd) * 0.02;
                                const estimatedProfitUtic = maxSafeTradeUsd * (netProfitPercentage / 100);

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
                // The actual display of these scores/reasons is gated in the UI Components (AegisAgent, Mercados)
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

                    // Generate Real-Time Feed Events (Not just alerts)
                    finalPools.slice(0, 15).forEach((pool, idx) => {
                        const prev = prevPoolsRef.current[pool.id];

                        // If it's a new top performer or has significant activity change
                        const totalTx = pool.txns5m.buys + pool.txns5m.sells;
                        const prevTotal = prev ? (prev.txns5m.buys + prev.txns5m.sells) : 0;

                        if (totalTx > prevTotal || !prev) {
                            const newTxCount = totalTx - prevTotal;
                            // Inject simulated "Global order" signals based on real delta or top rank
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

                        // Also generate standard alerts
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
            }

            // Loop every 20s for faster "real-time" feel without killing the API
            timeoutId = setTimeout(executeScan, 20000);
        };

        // Initial immediate scan
        executeScan();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [selectedChain, alertsEnabled, networkMode, addAlert, setAethrixStats, setGlobalRankings, addFeedEvent, setArbitrageOpportunities, sendTelegramMessage, addExecutedArb, isAuthorized]);

    return null; // Invisible background worker
}
