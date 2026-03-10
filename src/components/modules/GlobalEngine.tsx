import { useEffect, useRef } from "react";
import { useAppStore, RealArbitrageOpportunity } from "@/lib/store";
import { AethrixPool } from "@/lib/aethrix";

export function GlobalEngine() {
    const {
        setAethrixStats,
        alertsEnabled,
        addAlert,
        setGlobalRankings,
        addFeedEvent,
        setArbitrageOpportunities,
        sendTelegramMessage,
        addKOLSignal,
        globalRankings,
        executionParams,
        smartMoneyActivity,
        kolSignals
    } = useAppStore();

    const dexWorkerRef = useRef<Worker | null>(null);
    const kolWorkerRef = useRef<Worker | null>(null);
    const smWorkerRef = useRef<Worker | null>(null);
    const lastUnifiedBroadcastRef = useRef<Record<string, number>>({});
    const lastArbBroadcastRef = useRef<Record<string, number>>({});
    const lastSurgeBroadcastRef = useRef<Record<string, number>>({});
    const lastGlobalAlertTickRef = useRef<number>(0);
    const prevPoolsRef = useRef<Record<string, AethrixPool>>({});

    // Initialize Workers
    useEffect(() => {
        // 1. DEX & FUSION WORKER
        const dexWorker = new Worker(new URL('../../workers/dexWorker.ts', import.meta.url), { type: 'module' });
        dexWorker.onmessage = (e) => {
            const { type, pools, arbOpportunities, solMode, bscMode, error } = e.data;

            if (type === 'DATA_FUSED') {
                // Update Rankings
                setGlobalRankings(pools.slice(0, 100));

                // Update Stats
                const maxAlphaScore = Math.max(...pools.map((p: AethrixPool) => p.score || 0));
                const highConfidence = pools.filter((p: AethrixPool) => (((p.score || 0) / Math.max(1, maxAlphaScore)) * 100) > 75).length;

                setAethrixStats({
                    activeSignals: pools.length,
                    highConfidence,
                    momentumSpikes: pools.filter((p: AethrixPool) => (p.priceChange5m || 0) > 25).length,
                    apiMode: (solMode === "Live" || bscMode === "Live") ? "Live" : "Error",
                    scanningChain: "GLOBAL",
                    autoRefresh: true
                });

                // Arbitrage Verification & Telegram Broadcasting
                if (arbOpportunities && arbOpportunities.length > 0) {
                    setArbitrageOpportunities(arbOpportunities);

                    arbOpportunities.forEach((arb: RealArbitrageOpportunity) => {
                        const now = Date.now();
                        const lastBroadcast = lastArbBroadcastRef.current[arb.id] || 0;

                        // Threshold Gate (Already filtered by worker, but double checks here for safety)
                        if (arb.profit > 1.0 && (now - lastBroadcast > 600000)) { // 10 min cooldown per arb path
                            if (sendTelegramMessage) {
                                const tgMsg = `✅ *VERIFIED ARBITRAGE*\n` +
                                    `━━━━━━━━━━━━━━━━━━━━\n` +
                                    `💰 *NET PROFIT: +${arb.profit}% ROI*\n` +
                                    `💎 Token: *${arb.token}*\n\n` +
                                    `⚡ Simulated Trade: *$${arb.simulatedSize}*\n` +
                                    `🌊 Liquidity Level: *$${(arb.liquidityLevel / 1000).toFixed(1)}K*\n` +
                                    `💵 Net Profit: *+$${arb.netProfitAfterFees}*\n\n` +
                                    `📥 Buy: \`${arb.buyExchange}\` (${arb.buyChain})\n` +
                                    `📤 Sell: \`${arb.sellExchange}\` (${arb.sellChain})\n` +
                                    `━━━━━━━━━━━━━━━━━━━━\n` +
                                    `🔗 [EXECUTE_UPLINK](https://vytronix.io)`;

                                sendTelegramMessage(tgMsg);
                                lastArbBroadcastRef.current[arb.id] = now;
                            }
                        }
                    });
                }

                // Broadcast High-Score Signals (> 60)
                // Prioritize best signals first
                const sortedPools = [...pools].sort((a, b) => (b.score || 0) - (a.score || 0));

                sortedPools.forEach((pool: AethrixPool) => {
                    const unifiedScore = pool.score || 0;
                    if (unifiedScore > 60) {
                        const now = Date.now();
                        const lastBroadcast = lastUnifiedBroadcastRef.current[pool.baseToken.address] || 0;

                        if (now - lastBroadcast > 600000) { // 10 min cooldown
                            const tier = unifiedScore > 80 ? "ULTRA SIGNAL" : "HIGH SIGNAL";

                            if (sendTelegramMessage) {
                                const tgMsg = `🚨 *${tier} DETECTED*\n` +
                                    `━━━━━━━━━━━━━━━━━━━━\n` +
                                    `💎 Token: *${pool.baseToken.symbol}*\n` +
                                    `🎯 Unified Score: *${unifiedScore}/100*\n` +
                                    `📊 Insights: ${pool.alphaReasons?.join(" | ")}\n\n` +
                                    `🌊 Liquidity: $${(pool.liquidityUsd / 1000).toFixed(1)}K\n` +
                                    `━━━━━━━━━━━━━━━━━━━━\n` +
                                    `🔗 [EXECUTE_UPLINK](https://vytronix.io)`;
                                sendTelegramMessage(tgMsg);
                            }

                            addFeedEvent({
                                id: `fused-${pool.id}-${now}`,
                                chain: pool.chain.toUpperCase(),
                                type: "BUY DOMINANCE",
                                metricValue: `${tier}: ${unifiedScore}`,
                                tokenSymbol: pool.baseToken.symbol,
                                time: now,
                                isPositive: true
                            });

                            if (now - lastGlobalAlertTickRef.current > 10000) { // Global throttle: 10s between ANY alerts
                                addAlert({
                                    tokenId: pool.id,
                                    tokenSymbol: pool.baseToken.symbol,
                                    message: `${tier} (SCORE: ${unifiedScore})`,
                                    type: "SCORE_SURGE"
                                });
                                lastGlobalAlertTickRef.current = now;
                            }

                            lastUnifiedBroadcastRef.current[pool.baseToken.address] = now;
                        }
                    }

                    // Feed Logic for Surge Alerts (De-duplicated & Cooldown)
                    const prev = prevPoolsRef.current[pool.id];
                    if (alertsEnabled && prev && (pool.score - (prev.score || 0)) >= 15) {
                        const now = Date.now();
                        const lastSurge = lastSurgeBroadcastRef.current[pool.baseToken.address] || 0;

                        if (now - lastSurge > 1200000) { // 20 min cooldown for momentum spikes
                            if (now - lastGlobalAlertTickRef.current > 10000) {
                                addAlert({
                                    tokenId: pool.id,
                                    tokenSymbol: pool.baseToken.symbol,
                                    message: `MOMENTUM SURGE: +${pool.score - (prev.score || 0)} PTS`,
                                    type: "MOMENTUM_SPIKE"
                                });
                                lastGlobalAlertTickRef.current = now;
                            }
                            lastSurgeBroadcastRef.current[pool.baseToken.address] = now;
                        }
                    }
                });

                // Snapshots
                const snapshots: Record<string, AethrixPool> = {};
                pools.forEach((p: AethrixPool) => snapshots[p.id] = p);
                prevPoolsRef.current = snapshots;
            }

            if (error) console.error("Worker Error:", error);
        };
        dexWorker.postMessage({ action: 'start' });
        dexWorkerRef.current = dexWorker;

        // 2. KOL INTELLIGENCE WORKER
        const kolWorker = new Worker(new URL('../../workers/kolWorker.ts', import.meta.url), { type: 'module' });
        kolWorker.onmessage = (e) => {
            const { type, signals } = e.data;
            if (type === 'KOL_DATA' && signals) {
                signals.forEach((signal: { id: string; tokenSymbol: string; kols: string[]; impactScore: number }) => {
                    addKOLSignal(signal as any); // Cast for store compatibility
                    addFeedEvent({
                        id: `kol-${signal.id}`,
                        chain: "GLOBAL",
                        type: "ORDER_EXECUTION",
                        metricValue: `SOCIAL PULSE: @${signal.kols[0]}`,
                        tokenSymbol: signal.tokenSymbol,
                        time: Date.now(),
                        isPositive: true
                    });
                });
            }
        };
        kolWorker.postMessage({ action: 'start' });
        kolWorkerRef.current = kolWorker;

        // 3. SMART MONEY TRACKER WORKER
        const smWorker = new Worker(new URL('../../workers/smartMoneyWorker.ts', import.meta.url), { type: 'module' });
        smWorker.onmessage = (e) => {
            const { type, status } = e.data;
            if (type === 'SMART_MONEY_HEARTBEAT') {
                // Tracking worker health
                console.debug("SmartMoney Worker Status:", status);
            }
        };
        smWorker.postMessage({ action: 'start' });
        smWorkerRef.current = smWorker;

        return () => {
            dexWorker.terminate();
            kolWorker.terminate();
            smWorker.terminate();
        };
    }, [addAlert, addFeedEvent, addKOLSignal, alertsEnabled, sendTelegramMessage, setAethrixStats, setArbitrageOpportunities, setGlobalRankings]); // Run once on mount

    // Sync Store State to Workers (Parameters and Sub-Signals)
    useEffect(() => {
        if (dexWorkerRef.current) {
            dexWorkerRef.current.postMessage({
                action: 'updateUIState',
                params: executionParams,
                kolSignals,
                smartMoneyActivity
            });
        }
        if (kolWorkerRef.current) {
            kolWorkerRef.current.postMessage({
                action: 'updateRankings',
                rankings: globalRankings
            });
        }
    }, [executionParams, kolSignals, smartMoneyActivity, globalRankings]);

    return null;
}
