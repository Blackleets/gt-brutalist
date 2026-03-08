import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { fetchSpotlightTokens, AethrixPool } from "@/lib/aethrix";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ShieldCheck, Activity, X, Share2, AlertTriangle, Zap } from "lucide-react";
import { getTokenLogo } from "@/lib/tokenLogos";
import { formatCurrency } from "@/lib/utils";

export function MarketSpotlight() {
    const { smartMoneyActivity, networkMode, globalRankings } = useAppStore();
    const [allPools, setAllPools] = useState<AethrixPool[]>([]);
    const [displayPools, setDisplayPools] = useState<AethrixPool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedPool, setSelectedPool] = useState<AethrixPool | null>(null);
    const [rotationIndex, setRotationIndex] = useState(0);

    const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    const refreshMarketData = async () => {
        if (networkMode) return; // Don't fetch if in network mode

        try {
            const pools = await fetchSpotlightTokens();
            if (pools.length === 0) throw new Error("No qualified tokens found");

            // Take top 9 for the spotlight rotation
            const top9 = pools.slice(0, 9);
            setAllPools(top9);
            setError(false);

            if (loading) {
                setDisplayPools(top9.slice(0, 3));
                setLoading(false);
            }
        } catch (e) {
            console.error("Market Spotlight Refresh Failed:", e);
            if (allPools.length === 0) setError(true);
        } finally {
            if (loading) setLoading(false);
        }
    };

    // SYNC WITH NETWORK MODE GLOBAL RANKING
    useEffect(() => {
        if (networkMode && globalRankings.length > 0) {
            setAllPools(globalRankings); // Use full top 10 from network mode
            setError(false);
            if (loading) setLoading(false);
        }
    }, [networkMode, globalRankings, loading]);

    // Rotation Logic (Every 25 seconds)
    useEffect(() => {
        if (allPools.length > 0) {
            rotationTimerRef.current = setInterval(() => {
                const maxRotation = Math.min(allPools.length, networkMode ? 10 : 9);
                setRotationIndex((prev) => (prev + 3) >= maxRotation ? 0 : prev + 3);
            }, 25000);
        }
        return () => {
            if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
        };
    }, [allPools.length, networkMode]);

    // Data Refresh Logic (Every 60 seconds - only if not in network mode)
    useEffect(() => {
        if (!networkMode) {
            refreshMarketData();
            refreshTimerRef.current = setInterval(refreshMarketData, 60000);
        }
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [networkMode]);

    // Update displayPools when rotationIndex or allPools changes
    useEffect(() => {
        if (allPools.length > 0) {
            const start = rotationIndex;
            const end = start + 3;
            setDisplayPools(allPools.slice(start, end));
        }
    }, [rotationIndex, allPools]);

    if (error && allPools.length === 0 && !networkMode) {
        return (
            <div className="border-4 border-black p-12 text-center bg-gray-50 uppercase font-black">
                <div className="text-red-600 mb-2 text-2xl tracking-tighter">LIVE MARKET DATA UNAVAILABLE</div>
                <div className="text-sm opacity-50">API Handshake Interrupted or Liquidity Thresholds Not Met</div>
            </div>
        );
    }

    const getZoneColor = (zone: string) => {
        switch (zone) {
            case "PRIME": return "text-[#00ff41] border-[#00ff41]";
            case "VOLATILE": return "text-yellow-400 border-yellow-400";
            case "DANGER": return "text-red-500 border-red-500";
            default: return "text-blue-400 border-blue-400";
        }
    };

    return (
        <div className="relative">
            {networkMode && (
                <div className="absolute -top-10 right-0 flex items-center gap-2 bg-[#00ff41] text-black px-2 py-0.5 text-[0.6rem] font-black uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] border border-black z-10">
                    <Share2 size={10} />
                    NETWORK SYNCED
                </div>
            )}
            <div className="grid md:grid-cols-3 gap-6">
                <AnimatePresence mode="wait">
                    {(loading && displayPools.length === 0) ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-64 border-4 border-black bg-white/50 animate-pulse" />
                        ))
                    ) : (
                        displayPools.map((pool, idx) => {
                            const isPositive = (pool.priceChange24h || 0) >= 0;
                            const hasSmartMoney = !!smartMoneyActivity[pool.baseToken.address];
                            const zoneColor = getZoneColor(pool.zone);

                            return (
                                <motion.div
                                    key={`${pool.id}-${rotationIndex}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                                    onClick={() => setSelectedPool(pool)}
                                    className="cursor-pointer"
                                >
                                    <Card className={`rounded-none border-4 border-black bg-white shadow-none h-full relative overflow-hidden group hover:bg-gray-50 transition-colors ${pool.zone === 'PRIME' ? 'ring-2 ring-[#00ff41]' : ''}`}>
                                        <div className={`absolute top-0 left-0 w-full h-1 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <CardContent className="p-8 relative z-20">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="w-10 h-10 border-2 border-black bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                                                            {(() => {
                                                                const logo = getTokenLogo(pool.baseToken.symbol, pool.baseToken.logoUrl);
                                                                return logo ? (
                                                                    <img
                                                                        src={logo}
                                                                        alt={pool.baseToken.symbol}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Zap size={20} className="text-zinc-300" />
                                                                );
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-2xl font-black uppercase tracking-tight leading-none group-hover:text-black transition-colors">{pool.baseToken.symbol}/{pool.quoteToken.symbol}</div>
                                                                <div className={`text-[0.6rem] font-black uppercase border-2 px-2 py-0.5 ${zoneColor}`}>
                                                                    {pool.zone}
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter opacity-70 truncate max-w-[150px] mt-1">
                                                                {pool.chain} :: {pool.id.slice(0, 10)}...
                                                            </div>
                                                            {pool.alphaReason && (
                                                                <div className="mt-1 bg-black text-[#00ff41] text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest border border-[#00ff41]/20 inline-block">
                                                                    {pool.alphaReason.replace(/_/g, " ")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {hasSmartMoney && (
                                                    <div className="bg-[#00ff41] text-black px-2 py-1 text-[0.6rem] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                        <ShieldCheck size={12} />
                                                        SMART
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-end gap-3 mb-8">
                                                <span className="text-4xl font-black tracking-tighter leading-none">
                                                    ${pool.priceUsd < 0.01 ? pool.priceUsd.toFixed(8) : pool.priceUsd.toFixed(4)}
                                                </span>
                                                <span className={`text-lg font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPositive ? '↑' : '↓'}{Math.abs(pool.priceChange24h || 0).toFixed(1)}%
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 border-t-2 border-dashed border-gray-200 pt-6">
                                                <div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquidity</div>
                                                    <div className="text-lg font-black">
                                                        {formatCurrency(pool.liquidityUsd)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</div>
                                                    <div className="text-lg font-black flex items-center gap-2">
                                                        {pool.score} <span className={`w-2 h-2 rounded-full ${pool.score > 70 ? 'bg-[#00ff41]' : 'bg-yellow-400'}`}></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* MODAL OVERLAY */}
            <AnimatePresence>
                {selectedPool && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white border-4 md:border-8 border-black w-full max-w-2xl relative shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setSelectedPool(null)}
                                className="absolute -top-4 -right-4 bg-red-600 text-white p-3 border-4 border-black hover:bg-black transition-colors z-50"
                                title="Close Details"
                            >
                                <X size={24} strokeWidth={4} />
                            </button>

                            <div className="p-4 md:p-10">
                                <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-6 md:mb-10 border-b-2 md:border-b-4 border-black pb-4 md:pb-6">
                                    <div className="w-12 h-12 md:w-20 md:h-20 border-2 md:border-4 border-black bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)]">
                                        {(() => {
                                            const logo = getTokenLogo(selectedPool.baseToken.symbol, selectedPool.baseToken.logoUrl);
                                            return logo ? (
                                                <img
                                                    src={logo}
                                                    alt={selectedPool.baseToken.symbol}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (<Zap size={40} className="text-zinc-300" />);
                                        })()}
                                    </div>
                                    <div className="px-3 md:px-6 py-1.5 md:py-3 bg-black text-[#00ff41] font-black text-xl md:text-4xl uppercase tracking-tighter">
                                        {selectedPool.baseToken.symbol} / {selectedPool.quoteToken.symbol}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-gray-400 font-black uppercase tracking-widest text-[0.5rem] md:text-[0.6rem]">Infrastructure Layer</div>
                                        <div className={`font-black uppercase text-sm md:text-xl flex items-center gap-2 ${getZoneColor(selectedPool.zone).split(' ')[0]}`}>
                                            {selectedPool.zone} ZONE :: {selectedPool.chain}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="bg-black text-white p-3 md:p-4 border-2 md:border-4 border-black">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#00ff41]">Threat Matrix Assessment</div>
                                                <AlertTriangle size={14} className="text-[#00ff41]" />
                                            </div>
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="text-3xl md:text-5xl font-black italic">{selectedPool.riskScore}</div>
                                                <div className="flex-1">
                                                    <div className="text-[0.5rem] font-black uppercase opacity-60">Risk Index Status</div>
                                                    <div className={`text-xs font-black uppercase ${selectedPool.riskScore > 60 ? 'text-red-500' : selectedPool.riskScore > 30 ? 'text-yellow-400' : 'text-[#00ff41]'}`}>
                                                        {selectedPool.riskScore > 60 ? 'CRITICAL RISK' : selectedPool.riskScore > 30 ? 'ELEVATED RISK' : 'NOMINAL RISK'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/20 h-1.5 mt-4">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${selectedPool.riskScore}%` }}
                                                    className={`h-full ${selectedPool.riskScore > 60 ? 'bg-red-500' : selectedPool.riskScore > 30 ? 'bg-yellow-400' : 'bg-[#00ff41]'}`}
                                                ></motion.div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-black text-gray-400 uppercase mb-2">Base Token Mint</div>
                                            <div className="font-mono text-[10px] md:text-xs break-all font-bold bg-gray-100 p-2 md:p-3 border-2 border-black">
                                                {selectedPool.baseToken.address}
                                            </div>
                                        </div>

                                        <div className="flex flex-col xs:flex-row gap-4 md:gap-8 pt-4 border-t-2 border-gray-100">
                                            <div>
                                                <div className="text-xs font-black text-gray-400 uppercase mb-1">Index Price</div>
                                                <div className="text-2xl md:text-3xl font-black">${selectedPool.priceUsd < 0.01 ? selectedPool.priceUsd.toFixed(8) : selectedPool.priceUsd.toFixed(4)}</div>
                                            </div>
                                            <div className="text-right ml-auto">
                                                <div className="text-xs font-black text-gray-400 uppercase mb-1">Alpha Score</div>
                                                <div className="text-2xl md:text-3xl font-black text-black">
                                                    {selectedPool.score} <span className="text-[10px] text-gray-400">PTS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 md:space-y-6 bg-gray-50 border-2 md:border-4 border-black p-4 md:p-6 relative">
                                        <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">5M Delta</div>
                                                <div className={`text-base md:text-xl font-black ${selectedPool.priceChange5m >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedPool.priceChange5m >= 0 ? '↑' : '↓'}{Math.abs(selectedPool.priceChange5m)}%
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">24H Delta</div>
                                                <div className={`text-base md:text-xl font-black ${(selectedPool.priceChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {(selectedPool.priceChange24h || 0) >= 0 ? '↑' : '↓'}{Math.abs(selectedPool.priceChange24h || 0)}%
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Liquidity Depth</div>
                                                <div className="text-base md:text-xl font-black">{formatCurrency(selectedPool.liquidityUsd)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">24H Volume</div>
                                                <div className="text-base md:text-xl font-black">{formatCurrency(selectedPool.volume24hUsd)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-tighter mb-1">5M Activity Trace</div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 bg-gray-200 h-2 flex">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(selectedPool.txns5m.buys / Math.max(1, selectedPool.txns5m.buys + selectedPool.txns5m.sells)) * 100}%` }}
                                                            className="bg-green-500 h-full"
                                                        />
                                                    </div>
                                                    <div className="text-xs font-black font-mono">
                                                        {selectedPool.txns5m.buys + selectedPool.txns5m.sells} TXS
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 mt-4 border-t-2 border-black/10 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Activity size={16} className="text-black" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-black">Telemetry Active</span>
                                            </div>
                                            {smartMoneyActivity[selectedPool.baseToken.address] && (
                                                <div className="bg-[#00ff41] text-black px-2 py-1 text-[0.6rem] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0_rgba(0,0,0,1)] border border-black">
                                                    <ShieldCheck size={12} />
                                                    SMART MONEY SIGNAL
                                                </div>
                                            )}
                                        </div>

                                        <a
                                            href={`https://dexscreener.com/${selectedPool.chain}/${selectedPool.pairAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center bg-black text-[#00ff41] font-black uppercase py-3 md:py-4 hover:bg-white hover:text-black border-2 md:border-4 border-black transition-all flex items-center justify-center gap-2 mt-4 shadow-[4px_4px_0_rgba(0,0,0,1)]"
                                        >
                                            View Terminal Link
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
