import { useEffect, useRef } from "react";
import { useAppStore, RealArbitrageOpportunity, ExecutedArb, HunterSignal, Hunter } from "@/lib/store";
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
        kolSignals,
        setMarketSentiment,
        addSystemLog,
        telegramEnabled,
        executedArbs,
        addExecutedArb,
        setHunters,
        addHunterSignal,
        adminConfig,
        networkMode
    } = useAppStore();

    const dexWorkerRef = useRef<Worker | null>(null);
    const kolWorkerRef = useRef<Worker | null>(null);
    const smWorkerRef = useRef<Worker | null>(null);
    const lastUnifiedBroadcastRef = useRef<Record<string, number>>({});
    const lastArbBroadcastRef = useRef<Record<string, { time: number; profit: number }>>({});
    const processedHunterHashesRef = useRef<Set<string>>(new Set());
    const prevPoolsRef = useRef<Record<string, AethrixPool>>({});
    const lastGlobalBroadcastRef = useRef<number>(0);
    const kolSignalsRef = useRef(kolSignals);
    const sentimentRef = useRef<number>(50);
    const adminConfigRef = useRef(adminConfig);

    // Reset global cooldown when telegram is enabled to ensure immediate transmission of the first signal
    useEffect(() => {
        if (telegramEnabled) {
            lastGlobalBroadcastRef.current = 0;
        }
    }, [telegramEnabled]);

    // Update refs when store changes
    useEffect(() => {
        kolSignalsRef.current = kolSignals;
    }, [kolSignals]);

    useEffect(() => {
        adminConfigRef.current = adminConfig;
    }, [adminConfig]);

    // Initialize Workers (Controlled by NetworkMode)
    useEffect(() => {
        if (!networkMode) return;

        // 1. DEX & FUSION WORKER
        const dexWorker = new Worker(new URL('../../workers/dexWorker.ts', import.meta.url), { type: 'module' });
        dexWorker.onmessage = (e) => {
            const { type } = e.data;

            if (type === 'DATA_FUSED') {
                const { pools, arbOpportunities, arbRejected, arbWatchlist, arbRealProfits, arbHunterSignals, solMode, bscMode } = e.data;

                // Update Rankings
                setGlobalRankings(pools.slice(0, 100));

                // Update Stats
                const maxAlphaScore = Math.max(...pools.map((p: AethrixPool) => p.score || 0));
                const highConfidenceCount = pools.filter((p: AethrixPool) => (((p.score || 0) / Math.max(1, maxAlphaScore)) * 100) > 75).length;

                setAethrixStats({
                    activeSignals: pools.length,
                    highConfidence: highConfidenceCount,
                    momentumSpikes: pools.filter((p: AethrixPool) => (p.priceChange5m || 0) > 25).length,
                    apiMode: (solMode === "Live" || bscMode === "Live") ? "Live" : "Error",
                    scanningChain: "GLOBAL",
                    autoRefresh: true
                });

                // Log internal rejections to system history
                if (arbRejected && arbRejected.length > 0) {
                    arbRejected.forEach((rej: { token: string; reason: string; profit: number }) => {
                        addSystemLog(`ARB_REJECTED: ${rej.token} | ${rej.reason} (Spread: ${rej.profit.toFixed(2)}%)`, "warning");
                    });
                }

                // Arbitrage Verification & Telegram Broadcasting (SAFE MODE ACTIVE)
                if (arbOpportunities && arbOpportunities.length > 0) {
                    const dashboardEntries = [...arbOpportunities.slice(0, 3), ...(arbWatchlist || []).slice(0, 2)];
                    setArbitrageOpportunities(dashboardEntries);

                    const PUB_BROADCAST_ENABLED = true; 

                    arbOpportunities.forEach((arb: RealArbitrageOpportunity) => {
                        const now = Date.now();
                        const lastBroadcast = lastArbBroadcastRef.current[arb.token] || { time: 0, profit: 0 };

                        const timeDiff = now - lastBroadcast.time;
                        const globalTimeDiff = now - lastGlobalBroadcastRef.current;
                        
                        const isProfitExplosion = arb.profit > (lastBroadcast.profit * 1.2);
                        // Global cooldown ensures no spam across the group, while token-specific cooldown (min 15m) keeps diversity
                        const isGlobalCooldownOver = globalTimeDiff > (adminConfigRef.current.signalInterval * 1000);
                        const isTokenCooldownOver = timeDiff > 900000; 

                        const isFresh = (now - (e.data.timestamp || 0)) < 30000;

                        if (arb.profit >= 0.5 && (isGlobalCooldownOver || isProfitExplosion) && isTokenCooldownOver && isFresh && arb.classification === "VERIFIED") {
                            if (sendTelegramMessage && PUB_BROADCAST_ENABLED && telegramEnabled) {
                                const calculatedSpread = (((arb.sellPrice / arb.buyPrice) - 1) * 100).toFixed(2);
                                const tgMsg = 
                                    `⚡ EXECUTABLE ARBITRAGE\n\n` +
                                    `Token: ${arb.token}\n\n` +
                                    `Buy → ${arb.buyExchange} (${arb.buyChain})\n` +
                                    `Sell → ${arb.sellExchange} (${arb.sellChain})\n\n` +
                                    `Spread: ${calculatedSpread}%\n` +
                                    `Real Profit: ${arb.profit}%\n\n` +
                                    `Liquidity: $${arb.liquidityLevel.toLocaleString()}\n\n` +
                                    `🧠 Vytronix Insight:\n` +
                                    `Executable same-chain arbitrage detected with sufficient liquidity.\n\n` +
                                    `⚠ Execution:\n` +
                                    `Low slippage, fast execution required`;

                                sendTelegramMessage(tgMsg, "https://vytronix.io/vytronix-bot.jpg");
                                lastArbBroadcastRef.current[arb.token] = { time: now, profit: arb.profit };
                                lastGlobalBroadcastRef.current = now;
                                addSystemLog(`VERIFIED_ARB: ${arb.token} (+${arb.profit}%) Dispatched to Telegram`, "success");
                                
                                addFeedEvent({
                                    id: `arb-${arb.token}-${now}`,
                                    chain: arb.buyChain.toUpperCase(),
                                    type: "OPPORTUNITY_DETECTED",
                                    metricValue: `ARB_DETECTED: ${arb.profit}% SPREAD`,
                                    tokenSymbol: arb.token,
                                    time: now,
                                    isPositive: true
                                });
                            }
                        }
                    });
                }

                // HUNTER TRACKING & REPUTATION (BNB CHAIN)
                if (arbHunterSignals && arbHunterSignals.length > 0) {
                    const signals = arbHunterSignals as HunterSignal[];
                    signals.forEach(sig => {
                        if (!processedHunterHashesRef.current.has(sig.hash)) {
                            processedHunterHashesRef.current.add(sig.hash);
                            addHunterSignal(sig);

                            // PROFIT_DETECTED_SIGNAL: Real executed trades observed on-chain
                            // Policy: Respect global broadcast interval
                            const now = Date.now();
                            if (telegramEnabled && (now - lastGlobalBroadcastRef.current > (adminConfigRef.current.signalInterval * 1000))) {
                                const partialAddr = `${sig.hunter.substring(0, 6)}...${sig.hunter.slice(-4)}`;
                                const explorerLink = sig.hunter.startsWith('0x') 
                                    ? `https://bscscan.com/tx/${sig.hash}` 
                                    : `https://solscan.io/tx/${sig.hash}`;

                                const profitMsg = 
                                    `⚡ EXECUTABLE ARBITRAGE\n` +
                                    `━━━━━━━━━━━━━━━━\n\n` +
                                    `🐋 Wallet: ${partialAddr}\n\n` +
                                    `💎 Token: ${sig.token}\n\n` +
                                    `🛒 Bought on: ${sig.buyDex}\n` +
                                    `💸 Sold on: ${sig.sellDex}\n\n` +
                                    `📦 Trade Size: $${sig.sizeUsd.toLocaleString()}\n` +
                                    `📈 Profit: +$${sig.profitUsd.toLocaleString()}\n\n` +
                                    `🔗 Verify Transaction\n` +
                                    `${explorerLink}\n\n` +
                                    `━━━━━━━━━━━━━━━━\n` +
                                    `⚡ Detected by Vytronix Engine`;

                                sendTelegramMessage(profitMsg, "https://vytronix.io/vytronix-bot.jpg");
                                lastGlobalBroadcastRef.current = now;
                                addSystemLog(`PROFIT_DETECTED_SIGNAL: ${sig.token} capture by ${partialAddr} broadcasted`, "success");
                            }

                            addFeedEvent({
                                id: `hunter-${sig.hash}`,
                                chain: sig.buyDex.includes('Sol') ? 'SOLANA' : 'BSC',
                                type: "OPPORTUNITY_DETECTED",
                                metricValue: `HUNTER_EXE: +$${sig.profitUsd.toLocaleString()}`,
                                tokenSymbol: sig.token,
                                time: Date.now(),
                                isPositive: true
                            });

                            // Update Hunter Reputation & Tiering
                            setHunters((prev: Hunter[]) => {
                                const hIdx = prev.findIndex(h => h.address === sig.hunter);
                                if (hIdx >= 0) {
                                    const next = [...prev];
                                    const h = { ...next[hIdx] };
                                    h.trades += 1;
                                    h.lastActive = Date.now();
                                    h.avgProfit = (h.avgProfit * (h.trades - 1) + sig.profitPct) / h.trades;
                                    h.score = Math.min(100, h.score + 1.5);
                                    if (h.score > 92) h.tier = "High Frequency Hunter";
                                    else if (h.score > 82) h.tier = "Elite Hunter";
                                    next[hIdx] = h;
                                    return next;
                                }
                                return [...prev, {
                                    address: sig.hunter,
                                    alias: `H_${sig.hunter.slice(-4)}`,
                                    score: 75,
                                    trades: 1,
                                    avgProfit: sig.profitPct,
                                    consistency: 85,
                                    speed: "0.8s",
                                    tier: "Hunter",
                                    lastActive: Date.now()
                                } as Hunter];
                            });

                            // Sync Reputation
                            addSystemLog(`HUNTER_ALPHA: Verified trade by ${sig.hunter.substring(0, 6)}... on BNB`, "success");
                        }
                    });
                }

                // REAL PROFIT DETECTION & BROADCASTING
                if (arbRealProfits && arbRealProfits.length > 0) {
                    const realProfitsList = arbRealProfits as ExecutedArb[];
                    
                    realProfitsList.forEach(profit => {
                        const alreadyExists = executedArbs.some(a => a.hash === profit.hash);
                        if (!alreadyExists) {
                            addExecutedArb(profit);
                            
                            // Emit PROFIT_DETECTED_SIGNAL for validated real trades
                            const now = Date.now();
                            if (sendTelegramMessage && telegramEnabled && (now - lastGlobalBroadcastRef.current > (adminConfigRef.current.signalInterval * 1000))) {
                                const partialAddr = `${profit.wallet.substring(0, 6)}...${profit.wallet.substring(profit.wallet.length - 4)}`;
                                const explorerLink = profit.wallet.startsWith('0x') 
                                    ? `https://bscscan.com/tx/${profit.hash}` 
                                    : `https://solscan.io/tx/${profit.hash}`;
                                
                                const profitMsg = 
                                    `⚡ EXECUTABLE ARBITRAGE\n` +
                                    `━━━━━━━━━━━━━━━━\n\n` +
                                    `🐋 Wallet: ${partialAddr}\n\n` +
                                    `💎 Token: ${profit.token}\n\n` +
                                    `🛒 Bought on: ${profit.dexFrom}\n` +
                                    `💸 Sold on: ${profit.dexTo}\n\n` +
                                    `📦 Trade Size: $${profit.sizeUsd.toFixed(2)}\n` +
                                    `📈 Profit: +$${profit.profitUsd.toFixed(2)}\n\n` +
                                    `🔗 Verify Transaction\n` +
                                    `${explorerLink}\n\n` +
                                    `━━━━━━━━━━━━━━━━\n` +
                                    `⚡ Detected by Vytronix Engine`;

                                sendTelegramMessage(profitMsg, "https://vytronix.io/vytronix-bot.jpg");
                                lastGlobalBroadcastRef.current = now;
                                addSystemLog(`PROFIT_DETECTED_SIGNAL: ${profit.token} captured by ${partialAddr} broadcasted`, "success");
                            }
                        }
                    });
                }

                // Broadcast High-Score Signals (> 60)
                const sortedPools = [...pools].sort((a, b) => (b.score || 0) - (a.score || 0));

                sortedPools.forEach((pool: AethrixPool) => {
                    const unifiedScore = pool.score || 0;
                    if (unifiedScore > 60) {
                        const now = Date.now();
                        // Removed VYTRONIX NEURAL HIT (AI score-based alerts)
                        lastUnifiedBroadcastRef.current[pool.baseToken.address] = now;
                    }
                });

                // Neural Sentiment Calculation
                const currentKols = kolSignalsRef.current || [];
                const kolIntensity = currentKols.reduce((acc: number, s) => acc + s.impactScore, 0) / 10;
                const alphaIntensity = pools.filter((p: AethrixPool) => (p.score || 0) > 85).length * 4;
                const momentumIntensity = pools.reduce((acc: number, p: AethrixPool) => acc + (p.priceChange5m || 0), 0) / Math.max(1, pools.length);

                const rawSentiment = 50 + kolIntensity + alphaIntensity + (momentumIntensity * 1.5);
                const targetSentiment = Math.min(100, Math.max(0, Math.round(rawSentiment)));
                const smoothed = (sentimentRef.current * 0.95) + (targetSentiment * 0.05);
                sentimentRef.current = smoothed;
                setMarketSentiment(Math.round(smoothed));

                const snapshots: Record<string, AethrixPool> = {};
                pools.forEach((p: AethrixPool) => snapshots[p.id] = p);
                prevPoolsRef.current = snapshots;
            }
        };
        dexWorker.postMessage({ action: 'start' });
        dexWorkerRef.current = dexWorker;

        // 2. KOL INTELLIGENCE WORKER
        const kolWorker = new Worker(new URL('../../workers/kolWorker.ts', import.meta.url), { type: 'module' });
        kolWorker.onmessage = (e) => {
            const { type, signals } = e.data;
            if (type === 'KOL_DATA' && signals) {
                signals.forEach((signal: { id: string, tokenSymbol: string, impactScore: number, kols: string[], mentions?: number, isConfirmation?: boolean, followerCount?: string, tokenAddress?: string }) => {
                    addKOLSignal({
                        id: signal.id,
                        tokenSymbol: signal.tokenSymbol,
                        impactScore: signal.impactScore,
                        kols: signal.kols,
                        timestamp: Date.now(),
                        mentions: signal.mentions || 1,
                        isConfirmation: signal.isConfirmation || false,
                        followerCount: signal.followerCount || "Unknown",
                        tokenAddress: signal.tokenAddress || "0x00...fused"
                    });
                    addFeedEvent({
                        id: `kol-${signal.id}`,
                        chain: "GLOBAL",
                        type: "OPPORTUNITY_DETECTED",
                        metricValue: `SOCIAL_PULSE: @${signal.kols[0]}`,
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
    }, [addAlert, addFeedEvent, addKOLSignal, addSystemLog, alertsEnabled, sendTelegramMessage, setAethrixStats, setArbitrageOpportunities, setGlobalRankings, setMarketSentiment, addExecutedArb, executedArbs, telegramEnabled, addHunterSignal, setHunters, networkMode]);

    // Sync KOL worker with current market rankings
    useEffect(() => {
        if (kolWorkerRef.current && globalRankings.length > 0) {
            kolWorkerRef.current.postMessage({ action: 'updateRankings', rankings: globalRankings });
        }
    }, [globalRankings]);

    // Sync Store State to Workers
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
