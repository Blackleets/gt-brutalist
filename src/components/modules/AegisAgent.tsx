import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Radar, Target, Lock, Activity, Cpu } from "lucide-react";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";
import { translations } from "@/lib/translations";
import { audio } from "@/lib/audio";
import { AethrixPool } from "@/lib/aethrix";
import { getTokenLogo } from "@/lib/tokenLogos";
import { formatCurrency } from "@/lib/utils";

type AgentState = "IDLE" | "SCANNING" | "ANALYZING" | "READY" | "EXECUTED";

export function AegisAgent() {
    const { globalRankings, wallet, selectedChain, positionSnapshots, executeSwap, addSystemLog, language, audioEnabled, executionParams, networkMode } = useAppStore();
    const { canAccessAlpha } = useAlphaGuard();
    const t = translations[language];

    // Sync audio engine with store state
    useEffect(() => {
        audio.toggle(audioEnabled);
    }, [audioEnabled]);

    const [agentState, setAgentState] = useState<AgentState>("IDLE");
    const [logs, setLogs] = useState<string[]>([]);
    const [currentTarget, setCurrentTarget] = useState<AethrixPool | null>(null);
    const [riskProfile, setRiskProfile] = useState<"CONSERVATIVE" | "BALANCED" | "AGGRESSIVE">("BALANCED");

    // Sync state with Network Mode
    useEffect(() => {
        if (networkMode) {
            setAgentState("SCANNING");
            // Note: addLog uses state, so we must be careful with initial logs
            setLogs(prev => [...prev.slice(-4), `[${new Date().toISOString().split('T')[1].slice(0, 8)}] AUTO_MODE_INIT: Scanning Tactical Sectors...`]);
        } else {
            setAgentState("IDLE");
            setCurrentTarget(null);
            setLogs([]);
        }
    }, [networkMode]);

    // Persistent radar pings for stability and purity
    const [radarPings] = useState(() => [...Array(5)].map(() => ({
        top: 20 + Math.random() * 60,
        left: 20 + Math.random() * 60,
        delay: Math.random() * 2
    })));

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-4), `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`]);
        addSystemLog(`AEGIS: ${msg}`, msg.includes("ERR") ? "error" : "info");
        audio.blip();
    };

    const runAnalysisCycle = () => {
        if (globalRankings.length === 0) {
            addLog(t.aegis_log_no_feed);
            audio.error();
            return;
        }

        audio.click();
        setAgentState("SCANNING");
        addLog(t.aegis_log_scanning);
        addLog(t.aegis_log_scanning_pools.replace("{count}", globalRankings.length.toString()).replace("{chain}", selectedChain.toUpperCase()));

        setTimeout(() => {
            const validTargets = globalRankings.filter(token =>
                token.chain === selectedChain &&
                !positionSnapshots[token.baseToken.address] &&
                token.liquidityUsd > 1000
            );

            const potentialTargets = validTargets.sort((a, b) => b.score - a.score);
            const topTarget = potentialTargets.length > 0
                ? potentialTargets[Math.floor(Math.random() * Math.min(3, potentialTargets.length))]
                : (globalRankings[0] || null);

            if (!topTarget) {
                addLog(t.aegis_log_no_targets.replace("{chain}", selectedChain.toUpperCase()));
                audio.error();
                setAgentState("IDLE");
                return;
            }

            setCurrentTarget(topTarget);
            setAgentState("ANALYZING");
            audio.alert();
            addLog(t.aegis_log_opp_id.replace("{token}", topTarget.baseToken.symbol).replace("{chain}", topTarget.chain.toUpperCase()));
            addLog(t.aegis_log_analyzing_liq.replace("{val}", topTarget.liquidityUsd.toLocaleString()));

            setTimeout(() => {
                const threshold = riskProfile === "CONSERVATIVE" ? 70 : riskProfile === "BALANCED" ? 50 : 30;

                if (topTarget.score >= threshold) {
                    addLog(t.aegis_log_strat_val.replace("{score}", topTarget.score.toString()));
                    addLog(t.aegis_log_risk_ready.replace("{risk}", t[`aegis_risk_${riskProfile.toLowerCase() as "conservative" | "balanced" | "aggressive"}`]));
                    audio.success();
                    setAgentState("READY");
                } else {
                    addLog(t.aegis_log_momentum_low.replace("{score}", topTarget.score.toString()).replace("{threshold}", threshold.toString()));
                    addLog(t.aegis_log_resuming_patrol);
                    audio.error();
                    setTimeout(() => {
                        setAgentState("IDLE");
                        setCurrentTarget(null);
                        setLogs([]);
                    }, 4000);
                }
            }, 3000);
        }, 3000);
    };

    const handleExecute = async () => {
        if (!currentTarget || !wallet.connected) return;
        audio.success();
        try {
            if (!wallet.isWatchOnly && (wallet.providerType === "solana" || wallet.providerType === "evm")) {
                addLog(t.aegis_log_req_sig.replace("{token}", currentTarget.baseToken.symbol));
                setAgentState("EXECUTED");

                const hash = await executeSwap({
                    fromToken: selectedChain === "solana" ? "SOL" : "BNB",
                    toToken: currentTarget.baseToken.symbol,
                    fromAmount: 0.1,
                    toAmount: (0.1 * (selectedChain === "solana" ? 145 : 600)) / currentTarget.priceUsd,
                    chain: selectedChain === "solana" ? "SOL" : "BSC",
                    slippage: executionParams.slippage,
                    bribe: executionParams.bribePriority === "CUSTOM" ? executionParams.customBribe : (executionParams.bribePriority === "STANDARD" ? "0.0001" : executionParams.bribePriority === "HIGH" ? "0.005" : "0.025")
                });

                addSystemLog(`AEGIS EXECUTION SUCCESS: ${currentTarget.baseToken.symbol} | Hash: ${hash.slice(0, 10)}...`, "success");
                addLog(t.aegis_log_confirmed.replace("{hash}", `${hash.slice(0, 8)}...${hash.slice(-8)}`));
            } else {
                addLog(t.aegis_log_sim_mode || "SIMULATION MODE ACTIVE");
                setAgentState("READY");
                setTimeout(() => setAgentState("IDLE"), 2000);
            }
        } catch (e) {
            addLog(`${t.aegis_log_exec_failed || "EXECUTION FAILED"}: ${e instanceof Error ? e.message : 'Unknown'}`);
            audio.error();
            setAgentState("READY");
        }
    };

    return (
        <div className="relative z-10 bg-zinc-50 border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch h-full">

                {/* Sentinel Visualizer Section */}
                <div className="flex-grow border-4 border-black bg-white shadow-[8px_8px_0_rgba(0,0,0,1)] relative overflow-hidden min-h-[400px]">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.05)_0%,transparent_70%)]" />
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

                    {/* Header Header */}
                    <div className="border-b-4 border-black p-4 flex justify-between items-center bg-zinc-50 relative z-20">
                        <div className="flex items-center gap-3">
                            <Shield className="text-black" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Vytronix :: Sentinel AEGIS-1</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${agentState === "IDLE" ? "bg-zinc-300" : "bg-[#00ff41] animate-pulse"}`} />
                            <span className="text-xs font-black uppercase tracking-widest">{agentState}</span>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center h-[calc(100%-68px)] relative z-20">
                        {/* Radar Component */}
                        <div className="relative w-64 h-64 md:w-80 md:h-80">
                            {/* Outer Rings */}
                            <div className="absolute inset-0 border-2 border-dashed border-black/20 rounded-full" />
                            <div className="absolute inset-4 border border-black/10 rounded-full" />
                            <div className="absolute inset-12 border border-black/5 rounded-full" />

                            {/* Scanning Pulse */}
                            {agentState !== "IDLE" && (
                                <motion.div
                                    className="absolute inset-0 border-4 border-[#00ff41] rounded-full opacity-0"
                                    animate={{ scale: [0.8, 1.2], opacity: [0.5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                />
                            )}

                            {/* Radar Line */}
                            <motion.div
                                className="absolute top-1/2 left-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent to-[#00ff41] origin-left"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Center Icon */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-4 rounded-full shadow-[4px_4px_0_#00ff41]">
                                {agentState === "READY" ? <Target className="text-[#00ff41] animate-pulse" size={40} /> : <Radar className="text-[#00ff41]" size={40} />}
                            </div>

                            {/* Target Pings */}
                            <AnimatePresence>
                                {agentState !== "IDLE" && (
                                    <>
                                        {radarPings.map((ping, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }}
                                                transition={{ duration: 3, repeat: Infinity, delay: ping.delay }}
                                                className="absolute w-2 h-2 bg-red-500 rounded-full"
                                                style={{
                                                    top: `${ping.top}%`,
                                                    left: `${ping.left}%`
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status Message */}
                        <div className="mt-8 text-center max-w-sm">
                            <h3 className="text-xl font-black uppercase italic mb-2">
                                {agentState === "IDLE" ? "System in Sentry Mode" :
                                    agentState === "SCANNING" ? "Sweeping Tactical Sectors..." :
                                        agentState === "ANALYZING" ? `Locking Target: ${currentTarget?.baseToken.symbol}` :
                                            agentState === "READY" ? "EXECUTION AUTHORIZED" : "STRIKE CONFIRMED"}
                            </h3>
                            <div className="flex gap-1 justify-center">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className={`w-1 h-3 ${i < logs.length * 4 ? 'bg-[#00ff41]' : 'bg-zinc-200'}`} />
                                ))}
                            </div>
                        </div>

                        {/* TARGET PROFILE CARD - NEW */}
                        <AnimatePresence>
                            {(agentState === "ANALYZING" || agentState === "READY" || agentState === "EXECUTED") && currentTarget && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-8 left-8 right-8 bg-black border-4 border-black shadow-[8px_8px_0_#00ff41] p-4 z-30 flex items-center gap-6"
                                >
                                    <div className="w-20 h-20 border-4 border-[#00ff41] bg-zinc-900 shrink-0 overflow-hidden group">
                                        <img
                                            src={getTokenLogo(currentTarget.baseToken.symbol, currentTarget.baseToken.logoUrl)}
                                            alt={currentTarget.baseToken.symbol}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl font-black text-white leading-none uppercase">{currentTarget.baseToken.symbol}</span>
                                            <span className="text-[10px] font-bold bg-[#00ff41] text-black px-1.5 py-0.5 leading-none">{currentTarget.zone}</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-white/40 mb-3 truncate">CA: {currentTarget.baseToken.address}</div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Price_USD</div>
                                                <div className="text-sm font-black text-[#00ff41]">${currentTarget.priceUsd.toFixed(6)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Liquidity_Pool</div>
                                                <div className="text-sm font-black text-white">{formatCurrency(currentTarget.liquidityUsd)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end shrink-0 border-l-2 border-white/10 pl-6">
                                        <div className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Alpha_Score</div>
                                        <div className={`text-4xl font-black italic leading-none ${canAccessAlpha ? "text-[#00ff41]" : "text-zinc-700 blur-[4px] select-none"}`}>
                                            {canAccessAlpha ? currentTarget.score : "???"}
                                        </div>
                                        <div className="text-[8px] font-black text-white/30 mt-1 uppercase">
                                            {canAccessAlpha ? "Confidence_Rating" : "Premium_Only"}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Controls & Logs Panel */}
                <div className="lg:w-96 flex flex-col gap-6">
                    {/* Log Terminal */}
                    <div className="flex-grow border-4 border-black bg-black text-[#00ff41] p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] font-mono text-xs overflow-hidden relative">
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-50">
                            <Activity size={10} />
                            <span>LIVE FEED</span>
                        </div>
                        <div className="flex flex-col gap-1 uppercase">
                            {logs.length === 0 ? (
                                <p className="opacity-30">Waiting for instructions...</p>
                            ) : (
                                logs.map((log, i) => (
                                    <motion.p
                                        key={i}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className={log.includes("ERR") ? "text-red-500 font-black" : ""}
                                    >
                                        {log}
                                    </motion.p>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Operational Controls */}
                    <div className="border-4 border-black p-6 bg-[#00ff41] shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col gap-6">
                        <div>
                            <p className="font-black uppercase text-[10px] tracking-widest mb-3 opacity-70 flex items-center gap-2">
                                <Cpu size={12} /> Target Risk Profile
                            </p>
                            <div className="flex gap-2">
                                {["CONSERVATIVE", "BALANCED", "AGGRESSIVE"].map((profile) => (
                                    <button
                                        key={profile}
                                        onClick={() => {
                                            setRiskProfile(profile as "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE");
                                            audio.click();
                                        }}
                                        className={`flex-1 py-2 text-[10px] font-black border-2 border-black transition-all ${riskProfile === profile
                                            ? "bg-black text-[#00ff41] -translate-y-1 shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
                                            : "bg-white/50 text-black hover:bg-white"
                                            }`}
                                    >
                                        {profile.slice(0, 4)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {agentState === "IDLE" ? (
                                <button
                                    onClick={runAnalysisCycle}
                                    className="w-full bg-black text-white py-4 font-black uppercase text-lg border-2 border-black shadow-[6px_6px_0_rgba(0,0,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Radar className="group-hover:animate-spin" />
                                    Launch Sentinel
                                </button>
                            ) : agentState === "READY" ? (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleExecute}
                                        disabled={!wallet.connected}
                                        className="w-full bg-red-600 text-white py-5 font-black uppercase text-xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] hover:bg-red-700 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 animate-pulse"
                                    >
                                        <Lock size={24} />
                                        Strike Pattern
                                    </button>
                                    {!wallet.connected && (
                                        <p className="text-[10px] font-black text-black/60 text-center uppercase">Awaiting Wallet Signature to Authorize Strike</p>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full bg-white/30 border-2 border-black/20 text-black/50 py-4 text-center font-black uppercase italic animate-pulse">
                                    {agentState}...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
