import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function NetworkTerminal() {
    const { networkMode, setNetworkMode, smartMoneyActivity, globalRankings } = useAppStore();
    const [primeOnly, setPrimeOnly] = useState(false);
    const engineState = globalRankings.length > 0 ? "success" : networkMode ? "loading" : "empty";

    if (!networkMode) return null;

    const filteredRankings = primeOnly
        ? globalRankings.filter(p => p.zone === "PRIME")
        : globalRankings;

    const getZoneColor = (zone: string) => {
        switch (zone) {
            case "PRIME": return "text-[#00ff41] border-[#00ff41]";
            case "VOLATILE": return "text-yellow-400 border-yellow-400";
            case "DANGER": return "text-red-500 border-red-500";
            default: return "text-blue-400 border-blue-400";
        }
    };

    return (
        <section className="px-4 md:px-16 py-8 md:py-10 bg-black text-white border-y-4 border-black relative z-50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 md:mb-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-[#00ff41] animate-pulse shrink-0"></div>
                    <h2 className="text-2xl xs:text-3xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
                        VYTRONIX NETWORK ACTIVE
                    </h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={() => setPrimeOnly(!primeOnly)}
                        className={`border-2 px-4 py-2 font-black uppercase text-[10px] md:text-sm transition-all ${primeOnly ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-white/20 text-white/50 hover:border-white hover:text-white'}`}
                    >
                        [ {primeOnly ? 'PRIME ONLY ACTIVE' : 'FILTER: PRIME ONLY'} ]
                    </button>
                    <button
                        onClick={() => setNetworkMode(false)}
                        className="border-2 border-white px-4 py-2 hover:bg-white hover:text-black font-black uppercase text-[10px] md:text-sm transition-none"
                    >
                        EXIT NETWORK MODE [X]
                    </button>
                </div>
            </div>

            <div className="border-4 border-white overflow-hidden bg-white/5 backdrop-blur-md">
                {(engineState === "success" || globalRankings.length > 0) && (
                    <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b-4 border-white bg-white text-black font-black uppercase text-xs">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-3">Verified Pair / Chain</div>
                        <div className="col-span-1">Price</div>
                        <div className="col-span-1">Liq</div>
                        <div className="col-span-1">Vol 24H</div>
                        <div className="col-span-1">Score</div>
                        <div className="col-span-2">Threat Matrix</div>
                        <div className="col-span-2 text-right">Activity / Status</div>
                    </div>
                )}

                <div className="divide-y-2 divide-white/20">
                    <AnimatePresence mode="popLayout">
                        {(engineState === "success" || globalRankings.length > 0) && filteredRankings.map((pool, index) => {
                            const hasSmartMoney = !!smartMoneyActivity[pool.baseToken.address];
                            const smActivity = smartMoneyActivity[pool.baseToken.address];
                            const isMomentum = pool.priceChange5m > 15;
                            const zoneColor = getZoneColor(pool.zone);

                            let confidenceColor = "text-gray-500";
                            if (pool.score > 75) confidenceColor = "text-[#00ff41]";
                            else if (pool.score >= 50) confidenceColor = "text-yellow-400";

                            return (
                                <motion.div
                                    key={`${pool.chain}-${pool.id}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative p-4 lg:p-4 hover:bg-white/10 transition-colors group ${pool.zone === 'PRIME' ? 'border-l-4 border-l-[#00ff41]' : pool.zone === 'DANGER' ? 'border-l-4 border-l-red-500' : ''}`}
                                >
                                    {/* Desktop Row */}
                                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-1 text-2xl font-black opacity-30 group-hover:opacity-100 transition-opacity">
                                            #{index + 1}
                                        </div>
                                        <div className="col-span-3">
                                            <div className="font-black text-lg">{pool.baseToken.symbol} / {pool.quoteToken.symbol}</div>
                                            <div className="text-[0.65rem] opacity-60 flex flex-col gap-0.5 mt-1 font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1 border border-current ${pool.chain === 'solana' ? 'text-purple-400' : 'text-yellow-500'}`}>
                                                        {pool.chain.toUpperCase()}
                                                    </span>
                                                    <span className="truncate">{pool.pairAddress}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 font-mono font-black text-sm">
                                            ${pool.priceUsd < 0.01 ? pool.priceUsd.toFixed(8) : pool.priceUsd.toFixed(3)}
                                        </div>
                                        <div className="col-span-1 font-mono text-xs opacity-80">
                                            {formatCurrency(pool.liquidityUsd)}
                                        </div>
                                        <div className="col-span-1 font-mono text-xs opacity-80">
                                            {formatCurrency(pool.volume24hUsd)}
                                        </div>
                                        <div className={`col-span-1 text-3xl font-black italic ${confidenceColor}`}>
                                            {pool.score}
                                        </div>
                                        <div className="col-span-2">
                                            <div className={`inline-block border-2 px-2 py-0.5 text-[0.6rem] font-black tracking-widest ${zoneColor}`}>
                                                {pool.zone} ZONE
                                            </div>
                                            <div className="text-[0.6rem] opacity-50 mt-1 font-mono uppercase">Risk Score: {pool.riskScore}</div>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2 flex-wrap">
                                            {hasSmartMoney && (
                                                <div className="bg-[#00ff41] text-black px-2 py-1 text-[0.6rem] font-black uppercase flex items-center gap-1 skew-x-[-12deg]">
                                                    <ShieldCheck size={10} />
                                                    SM {smActivity?.walletCount}
                                                </div>
                                            )}
                                            {isMomentum && (
                                                <div className="bg-white text-black px-2 py-1 text-[0.6rem] font-black uppercase flex items-center gap-1 skew-x-[-12deg]">
                                                    <Zap size={10} fill="currentColor" />
                                                    HOT
                                                </div>
                                            )}
                                            <div className="border border-white/30 px-2 py-1 text-[0.6rem] font-black uppercase flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                                <Activity size={10} />
                                                {pool.txns5m.buys + pool.txns5m.sells} TX
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Card */}
                                    <div className="lg:hidden space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl font-black italic opacity-30">#{index + 1}</span>
                                                    <span className={`px-1 border text-[8px] font-black uppercase ${pool.chain === 'solana' ? 'text-purple-400 border-purple-400' : 'text-yellow-500 border-yellow-500'}`}>
                                                        {pool.chain}
                                                    </span>
                                                </div>
                                                <div className="font-black text-xl leading-none">{pool.baseToken.symbol} / {pool.quoteToken.symbol}</div>
                                                <div className="text-[8px] opacity-40 font-mono truncate max-w-[150px] mt-1">{pool.pairAddress}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-4xl font-black italic leading-none ${confidenceColor}`}>{pool.score}</div>
                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Score</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10">
                                            <div>
                                                <div className="text-[8px] font-black text-gray-500 uppercase">Price</div>
                                                <div className="font-mono font-black text-xs truncate">
                                                    ${pool.priceUsd < 0.01 ? pool.priceUsd.toFixed(6) : pool.priceUsd.toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-black text-gray-500 uppercase">Liq</div>
                                                <div className="font-mono font-black text-xs">{formatCurrency(pool.liquidityUsd)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-black text-gray-500 uppercase">Vol 24H</div>
                                                <div className="font-mono font-black text-xs">{formatCurrency(pool.volume24hUsd)}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className={`inline-block border-2 px-2 py-0.5 text-[0.5rem] font-black tracking-widest ${zoneColor}`}>
                                                    {pool.zone} ZONE
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {hasSmartMoney && (
                                                    <div className="bg-[#00ff41] text-black px-1.5 py-0.5 text-[0.5rem] font-black uppercase flex items-center gap-1">
                                                        <ShieldCheck size={8} />
                                                        SM
                                                    </div>
                                                )}
                                                {isMomentum && (
                                                    <div className="bg-white text-black px-1.5 py-0.5 text-[0.5rem] font-black uppercase flex items-center gap-1">
                                                        <Zap size={8} fill="currentColor" />
                                                        HOT
                                                    </div>
                                                )}
                                                <div className="border border-white/30 px-1.5 py-0.5 text-[0.5rem] font-black uppercase flex items-center gap-1">
                                                    <Activity size={8} />
                                                    {pool.txns5m.buys + pool.txns5m.sells} TX
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {engineState === "loading" && globalRankings.length === 0 && (
                        <div className="p-12 md:p-24 text-center">
                            <Zap className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 animate-spin text-[#00ff41]" />
                            <div className="text-xl md:text-3xl font-black uppercase text-white">Aethrix Scanning Engine...</div>
                        </div>
                    )}

                    {engineState === "empty" && globalRankings.length === 0 && (
                        <div className="p-12 md:p-24 text-center">
                            <div className="text-xl md:text-3xl font-black text-white uppercase mb-4 italic">
                                NO QUALIFIED MARKETS FOUND
                            </div>
                            <div className="text-[10px] md:text-sm opacity-50 font-black uppercase tracking-widest">
                                ADJUST FILTERS – NO ASSETS MEET CONVICTION THRESHOLD
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-between text-[8px] md:text-[0.65rem] font-black uppercase opacity-40 gap-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div>Status: Synchronized</div>
                    <div>Source: Verified DexHub</div>
                    <div>Confidence threshold: 50+</div>
                </div>
                <div>Global Scan Cycle: 30s</div>
            </div>
        </section>
    );
}

