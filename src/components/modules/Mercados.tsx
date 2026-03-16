import { useState, useCallback, memo } from "react";
import { useAppStore } from "@/lib/store";
import { AethrixPool } from "@/lib/aethrix";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
    Zap,
    ShieldCheck,
    TrendingUp,
    TrendingDown,
    Lock,
    RefreshCw,
    X,
    Crosshair,
    ShieldAlert,
    Activity,
    Search
} from "lucide-react";
import { getTokenLogo } from "@/lib/tokenLogos";
import { formatCurrency } from "@/lib/utils";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";
import { translations } from "@/lib/translations";

// --- SUB-COMPONENT: ALPHA DECK CARD ---

interface AlphaCardProps {
    pool: AethrixPool;
    onSwipe: (dir: "left" | "right") => void;
    isTop: boolean;
    isAuthorized: boolean;
    onSnipe: (pool: AethrixPool) => void;
}

const AlphaCard = memo(({ pool, onSwipe, isTop, isAuthorized, onSnipe }: AlphaCardProps) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const heartOpacity = useTransform(x, [50, 150], [0, 1]);
    const crossOpacity = useTransform(x, [-150, -50], [1, 0]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.x > 150) {
            onSwipe("right");
        } else if (info.offset.x < -150) {
            onSwipe("left");
        }
    };

    const isPositive = (pool.priceChange24h || 0) >= 0;
    const { smartMoneyActivity } = useAppStore();
    const hasSmartMoney = !!smartMoneyActivity[pool.baseToken.address];

    return (
        <motion.div
            style={{ x, rotate, opacity, zIndex: isTop ? 50 : 0 }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex items-center justify-center p-2 md:p-4 touch-none"
        >
            <div className={`w-full max-w-[340px] md:max-w-sm aspect-[3/4] bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden flex flex-col ${!isTop ? 'scale-95 translate-y-4 opacity-40 pointer-events-none' : ''}`}>
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                {/* Visual Indicators for swipes */}
                <motion.div style={{ opacity: heartOpacity }} className="absolute top-10 right-10 z-50 bg-[#00ff41] text-black border-4 border-black px-4 py-2 font-black text-2xl rotate-12 pointer-events-none shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    SNIPE
                </motion.div>
                <motion.div style={{ opacity: crossOpacity }} className="absolute top-10 left-10 z-50 bg-red-600 text-white border-4 border-black px-4 py-2 font-black text-2xl -rotate-12 pointer-events-none shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    SKIP
                </motion.div>

                {/* Header Background */}
                <div className={`absolute top-0 left-0 w-full h-32 opacity-10 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="absolute top-0 left-0 w-full h-1 bg-black" />

                {/* Top Section */}
                <div className="p-4 md:p-6 relative z-10 flex-1">
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-black bg-zinc-100 flex items-center justify-center overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white">
                                {(() => {
                                    const logo = getTokenLogo(pool.baseToken.symbol, pool.baseToken.logoUrl);
                                    return logo ? (
                                        <img src={logo} alt={pool.baseToken.symbol} className="w-full h-full object-cover" />
                                    ) : (
                                        <Zap size={20} className="text-zinc-300" />
                                    );
                                })()}
                            </div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none italic">{pool.baseToken.symbol}</h3>
                                <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 opacity-60">
                                    {pool.chain} :: {pool.dex}
                                </p>
                            </div>
                        </div>
                        {hasSmartMoney && (
                            <div className="bg-[#00ff41] text-black px-2 py-1 text-[8px] md:text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                SMART
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">Market valuation</div>
                            <div className="text-5xl font-black tracking-tighter flex items-center gap-2">
                                ${pool.priceUsd < 0.0001 ? pool.priceUsd.toFixed(8) : pool.priceUsd.toFixed(4)}
                            </div>
                            <div className={`flex items-center gap-2 font-black text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {isPositive ? '+' : ''}{pool.priceChange24h?.toFixed(2)}%
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-50 p-3 border-2 border-black relative group/stat overflow-hidden uppercase">
                                <div className="absolute top-0 right-0 w-2 h-2 bg-black opacity-10" />
                                <div className="text-[9px] font-black text-gray-400 mb-1 flex items-center gap-1">
                                    <Activity size={10} /> Liquidity
                                </div>
                                <div className="text-sm font-black italic">{formatCurrency(pool.liquidityUsd)}</div>
                            </div>
                            <div className="bg-zinc-50 p-3 border-2 border-black relative group/stat overflow-hidden uppercase">
                                <div className="absolute top-0 right-0 w-2 h-2 bg-black opacity-10" />
                                <div className="text-[9px] font-black text-gray-400 mb-1 flex items-center gap-1">
                                    <TrendingUp size={10} /> Vol (24H)
                                </div>
                                <div className="text-sm font-black italic">{formatCurrency(pool.volume24hUsd)}</div>
                            </div>
                        </div>

                        {/* ALPHA GATED AREA */}
                        <div className="relative overflow-hidden group">
                            <div className="bg-black text-[#00ff41] p-4 border-4 border-black">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em]">Alpha Engine Signal</div>
                                    <ShieldCheck size={14} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className={!isAuthorized ? "blur-md select-none pointer-events-none" : ""}>
                                        <div className="text-3xl font-black italic leading-none">
                                            {isAuthorized ? `${pool.score}` : "???"} <span className="text-xs">PTS</span>
                                        </div>
                                        <div className="text-[9px] font-black uppercase mt-1 opacity-60">Confidence Level: {pool.zone}</div>
                                    </div>

                                    {!isAuthorized ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#00ff41] border-dashed animate-spin flex items-center justify-center mb-1">
                                                <Lock size={10} />
                                            </div>
                                            <span className="text-[7px] md:text-[8px] font-black uppercase text-[#00ff41]">Secure</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <div className="text-2xl md:text-3xl font-black italic tracking-tighter text-[#00ff41]">
                                                {pool.score}%
                                            </div>
                                            <div className="text-[8px] md:text-[9px] font-black uppercase opacity-60">High Conf.</div>
                                        </div>
                                    )}
                                </div>

                                {/* ALPHA REASONS (DYNAMIC) - Only if authorized */}
                                {isAuthorized && pool.alphaReasons && pool.alphaReasons.length > 0 && (
                                    <div className="mt-2 md:mt-4 p-1.5 md:p-2 bg-[#00ff4110] border border-[#00ff41] border-dashed">
                                        <div className="text-[7px] md:text-[8px] font-black uppercase text-[#00ff41] mb-1 opacity-80 flex items-center gap-1">
                                            <Zap size={8} className="animate-pulse" />
                                            Insights
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {pool.alphaReasons.slice(0, 2).map((reason, idx) => (
                                                <div key={idx} className="bg-[#00ff41] text-black px-1 py-0.5 text-[6px] md:text-[7px] font-black uppercase leading-none truncate max-w-[80px] md:max-w-none">
                                                    {reason}
                                                </div>
                                            ))}
                                            {pool.alphaReasons.length > 2 && <span className="text-[6px] font-black text-[#00ff41] opacity-50">+MORE</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 bg-white/10 h-1.5 w-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: isAuthorized ? `${pool.score}%` : '15%' }}
                                        className="h-full bg-[#00ff41]"
                                    />
                                </div>
                            </div>
                            {!isAuthorized && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <button className="bg-[#00ff41] text-black text-[10px] font-black px-3 py-1.5 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] animate-bounce">
                                        VERIFY WALLET FOR ALPHA
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-zinc-50 border-t-2 border-black grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onSwipe("left")}
                        className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-black hover:bg-red-50 transition-colors font-black text-xs uppercase"
                    >
                        <X size={14} /> Discard
                    </button>
                    <button
                        onClick={() => onSnipe(pool)}
                        className="flex items-center justify-center gap-2 py-3 bg-black text-[#00ff41] border-2 border-black hover:bg-zinc-800 transition-colors font-black text-xs uppercase"
                    >
                        <Crosshair size={14} /> Sniper
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

// --- MAIN COMPONENT: MERCADOS ---

export function Mercados() {
    const { globalRankings, setActiveViewId, setPrefilledSwap, language, triggerGlobalSync, aethrixStats, marketSentiment } = useAppStore();
    const t = translations[language];
    const { isAuthorized } = useAlphaGuard();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        await triggerGlobalSync();
        setCurrentIndex(0);
        setIsRefreshing(false);
    }, [triggerGlobalSync]);

    const activePools = globalRankings;

    const handleSwipe = useCallback((dir: "left" | "right") => {
        if (dir === "right" && activePools[currentIndex]) {
            // Right swipe could auto-snipe or save to favorites
            // For now, just advance
        }
        setCurrentIndex(prev => prev + 1);
    }, [activePools, currentIndex]);

    const handleSnipe = useCallback((pool: AethrixPool) => {
        setPrefilledSwap({
            fromSymbol: pool.chain === 'solana' ? 'SOL' : 'BNB',
            toSymbol: pool.baseToken.symbol,
            amount: 0.1
        });
        setActiveViewId("COMMAND_CENTER"); // Direct to swap terminal
        // OR Aegis Agent? The user mentioned Aegis Agent in previous steps.
        // Let's stick to the flow established in previous summaries: Aegis Agent
        setActiveViewId("HOME");
        // We scroll or show the Aegis section. This UI usually handles view switching via activeViewId.
    }, [setActiveViewId, setPrefilledSwap]);

    const pool = activePools[currentIndex];
    const nextPool = activePools[currentIndex + 1];

    if (globalRankings.length === 0 && aethrixStats.apiMode === "Live") {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center">
                <RefreshCw size={48} className="animate-spin mb-4 text-[#00ff41]" />
                <div className="text-3xl font-black uppercase italic tracking-tighter">Syncing Alpha Streams...</div>
                <div className="text-xs font-bold text-gray-500 uppercase mt-2">Connecting to Vytronix Telemetry Nodes</div>
            </div>
        );
    }

    if (aethrixStats.apiMode === "Error") {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="bg-red-600 text-white px-4 py-2 font-black uppercase mb-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    CRITICAL ERROR
                </div>
                <div className="text-3xl font-black uppercase italic tracking-tighter">Connectivity error. Retrying...</div>
                <button
                    onClick={refreshData}
                    className="mt-6 bg-black text-[#00ff41] px-8 py-4 border-4 border-black font-black uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                    Reconnect Uplink
                </button>
            </div>
        );
    }

    return (
        <div id="mercados-section" className="border-4 border-black p-6 md:p-8 relative overflow-hidden bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* Left Side: Copy and Controls */}
                <div className="lg:w-1/2 space-y-8 relative z-10">
                    <div>
                        <div className="bg-black text-[#00ff41] px-4 py-1.5 text-xs font-black uppercase tracking-[0.3em] inline-flex items-center gap-2 mb-4 border-l-4 border-[#00ff41]">
                            <Search size={14} /> Alpha Engine Scanner
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-5xl xl:text-6xl font-black uppercase leading-[0.9] tracking-tighter mb-6 italic group break-words">
                            SWIPE FOR<br />
                            <span className="text-[#00ff41] drop-shadow-[4px_4px_0_rgba(0,0,0,1)] selection:bg-black selection:text-[#00ff41]">
                                MARKET GEMS
                            </span>
                        </h2>
                        <div className="flex items-start gap-4 p-6 bg-zinc-50 border-l-8 border-black shadow-[8px_8px_0_rgba(0,0,0,0.05)]">
                            <div className="bg-black p-2 text-[#00ff41]">
                                <Zap size={24} />
                            </div>
                            <p className="text-sm md:text-lg font-bold uppercase text-gray-800 leading-tight">
                                Our Aethrix-Nodes identify high-momentum signals.
                                <span className="block mt-2 text-xs text-gray-500 font-black tracking-widest italic opacity-70 underline decoration-[#00ff41] decoration-2">
                                    UPLINK SECURITY PROTOCOL: ACTIVE
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-3 bg-zinc-100 border-2 border-black px-4 py-2">
                            <div className="w-3 h-3 rounded-full bg-[#00ff41] animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-tighter">Live Telemetry Active</span>
                        </div>
                        <button
                            onClick={refreshData}
                            disabled={isRefreshing}
                            className="bg-black text-white px-6 py-2 border-2 border-black font-black uppercase text-xs hover:bg-white hover:text-black transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                            {isRefreshing ? "Refreshing..." : "Reset Feed"}
                        </button>
                    </div>

                    <div className="pt-8 border-t-4 border-black grid grid-cols-2 md:grid-cols-3 gap-8 relative overflow-hidden">
                        {/* Status Grid Background */}
                        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:10px_10px]" />

                        <div className="relative">
                            <div className="flex items-center gap-1 mb-2">
                                <Activity size={12} className="text-[#00ff41]" />
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Scan</div>
                            </div>
                            <div className="text-4xl font-black italic text-black">{activePools.length}+</div>
                            <div className="text-[9px] font-black uppercase text-gray-400 mt-1">Live Pairs Indexing</div>
                        </div>

                        <div className="relative border-l-2 border-black/10 pl-4 md:pl-6 leading-none flex flex-col justify-center">
                            <div className="flex items-center gap-1 mb-1 md:mb-2">
                                <Activity size={10} className="text-[#00ff41] md:w-[12px]" />
                                <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.market_sentiment}</div>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-3xl md:text-4xl font-black italic text-black">{marketSentiment}%</div>
                                {/* Matrix Gauge */}
                                <div className="flex-grow h-2 bg-black/10 rounded-full overflow-hidden mb-2 hidden md:block">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${marketSentiment}%` }}
                                        className={`h-full ${marketSentiment > 70 ? 'bg-[#00ff41]' : marketSentiment > 40 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                    />
                                </div>
                            </div>
                            <div className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mt-1">Ecosystem Pulse</div>
                        </div>

                        <div className="relative border-l-2 border-black/10 pl-4 md:pl-6 leading-none flex flex-col justify-center">
                            <div className="flex items-center gap-1 mb-1 md:mb-2 text-[#00ff41]">
                                <ShieldAlert size={10} className="md:w-[12px]" />
                                <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Alpha Alerts</div>
                            </div>
                            <div className="text-3xl md:text-4xl font-black italic text-[#00ff41]">{activePools.filter(p => p.score > 70).length}</div>
                            <div className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mt-1">High-Prob</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: The Swipeable Deck */}
                <div className="lg:w-1/2 w-full flex justify-center items-center min-h-[550px] relative group">
                    {/* Scanning Animation Overlays */}
                    <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
                        <motion.div
                            animate={{ y: ["0%", "100%", "0%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-full h-[2px] bg-[#00ff41] border-[#00ff41] shadow-[0_0_15px_#00ff41] opacity-20"
                        />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full border-x border-[#00ff41]/5 pointer-events-none" />

                    {/* Navigation HUD */}
                    <div className="absolute top-0 right-0 p-4 z-40">
                        <div className="flex flex-col items-end gap-1">
                            <div className="bg-black text-[#00ff41] px-2 py-0.5 text-[8px] font-black uppercase">Telemetry ID: {pool?.id?.substring(0, 8)}</div>
                            <div className="bg-[#00ff41] text-black px-2 py-0.5 text-[8px] font-black uppercase">Terminal: active</div>
                        </div>
                    </div>
                    {/* Empty State */}
                    {!pool && (
                        <div className="text-center bg-gray-50 border-4 border-black border-dashed p-12 w-full max-w-sm">
                            <div className="text-3xl font-black uppercase italic mb-2">Deck Exhausted</div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-6 leading-relaxed">
                                No more high-confidence alpha detected in current latency window.
                            </p>
                            <button
                                onClick={refreshData}
                                className="bg-black text-[#00ff41] px-8 py-4 border-4 border-black font-black uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                Re-Scan Network
                            </button>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {nextPool && (
                            <AlphaCard
                                key={nextPool.id}
                                pool={nextPool}
                                onSwipe={handleSwipe}
                                isTop={false}
                                isAuthorized={isAuthorized}
                                onSnipe={handleSnipe}
                            />
                        )}
                        {pool && (
                            <AlphaCard
                                key={pool.id}
                                pool={pool}
                                onSwipe={handleSwipe}
                                isTop={true}
                                isAuthorized={isAuthorized}
                                onSnipe={handleSnipe}
                            />
                        )}
                    </AnimatePresence>

                    {/* Progress indicator */}
                    {activePools.length > 0 && currentIndex < activePools.length && (
                        <div className="absolute bottom-[-40px] flex gap-1 items-center">
                            <div className="text-[10px] font-black uppercase tracking-tighter text-gray-400 mr-2">
                                {currentIndex + 1} / {activePools.length}
                            </div>
                            <div className="w-48 h-1 bg-zinc-100 border border-black relative overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-black"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentIndex + 1) / activePools.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Aesthetic Borders */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-8 border-l-8 border-black pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-8 border-r-8 border-black pointer-events-none" />
        </div>
    );
}
