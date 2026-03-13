import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Crosshair, Shield, Zap, Target, Activity, ExternalLink, Award, Search, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function HunterTracker() {
    const { hunters, hunterSignals, language, networkMode } = useAppStore();
    const [activeTab, setActiveTab] = useState<"SIGNALS" | "HUNTERS">("SIGNALS");
    const [filter, setFilter] = useState("");

    const filteredHunters = hunters.filter(h => 
        h.address.toLowerCase().includes(filter.toLowerCase()) || 
        h.alias.toLowerCase().includes(filter.toLowerCase())
    ).sort((a, b) => b.score - a.score);

    const formatAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <section className="px-4 md:px-16 py-8 md:py-16 relative z-10 w-full min-h-[80vh]">
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                
                {/* Header System */}
                <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-2">
                    <div className="flex flex-col">
                        <div className="inline-block bg-black text-[#00ff41] px-3 py-1 text-[10px] md:text-sm font-black uppercase tracking-widest w-fit mb-4 border-r-4 border-b-4 border-[#00ff41]/30">
                            Module :: HUNTER_TRACKING_SYS_V2.1
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none flex items-center gap-4">
                            {language === 'en' ? 'Hunter Core' : language === 'es' ? 'Núcleo Cazador' : '猎手核心'}
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff41] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00ff41]"></span>
                            </span>
                        </h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-2 max-w-xl">
                            {language === 'en' 
                                ? "Real-time surveillance of high-profit professional 'Hunters' on BNB Chain. Extracting alpha from wallet-specific execution patterns." 
                                : language === 'es'
                                ? "Vigilancia en tiempo real de 'Hunters' profesionales en BNB Chain. Extrayendo alfa de patrones de ejecución específicos."
                                : "实时监控 BNB 链上的高利润专业‘猎手’。从特定钱包执行模式中提取 Alpha。"}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col border-4 border-black p-4 bg-white shadow-[4px_4px_0_#000]">
                            <span className="text-[9px] font-black uppercase text-zinc-400">TRACKED_ENTITIES</span>
                            <span className="text-2xl font-black italic tracking-tighter text-black">
                                {hunters.length} <span className="text-xs">NODES</span>
                            </span>
                        </div>
                        <div className="flex flex-col border-4 border-black p-4 bg-white shadow-[4px_4px_0_#000]">
                            <span className="text-[9px] font-black uppercase text-zinc-400">TOTAL_RECAPTURES</span>
                            <span className="text-2xl font-black italic tracking-tighter text-[#00ff41] drop-shadow-[1px_1px_0_#000]">
                                {hunterSignals.length} <span className="text-xs text-black">SIGS</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Interaction Panel */}
                <div className="flex flex-col border-4 border-black bg-white shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden">
                    
                    {/* Navigation Tabs */}
                    <div className="flex border-b-4 border-black bg-zinc-100">
                        <button 
                            onClick={() => setActiveTab("SIGNALS")}
                            className={`flex-1 py-4 font-black uppercase text-xs md:text-sm tracking-widest transition-all ${activeTab === "SIGNALS" ? "bg-black text-[#00ff41]" : "hover:bg-zinc-200"}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Activity size={16} /> LIVE_TELEMETRY
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("HUNTERS")}
                            className={`flex-1 py-4 font-black uppercase text-xs md:text-sm tracking-widest transition-all ${activeTab === "HUNTERS" ? "bg-black text-[#00ff41]" : "hover:bg-zinc-200"}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Shield size={16} /> TARGET_REGISTRY
                            </span>
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-4 border-b-2 border-black flex flex-col md:flex-row gap-4 items-center bg-zinc-50">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input 
                                type="text"
                                placeholder="SEARCH_ADDRESS_OR_ALIAS..."
                                className="w-full bg-white border-2 border-black p-2 pl-10 font-black uppercase text-xs focus:ring-0 focus:border-[#00ff41] outline-none"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button className="flex-1 md:flex-none border-2 border-black p-2 bg-white hover:bg-black hover:text-white transition-all" title="Filter Targets">
                                <Filter size={16} />
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black text-[#00ff41] font-black text-[10px] uppercase">
                                <div className="w-2 h-2 bg-[#00ff41] animate-pulse rounded-full" />
                                SCANNING_BNB_L1
                            </div>
                        </div>
                    </div>

                    {/* Content Display */}
                    <div className="min-h-[500px] bg-white relative">
                        {!networkMode && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center">
                                <Zap size={48} className="text-zinc-300 mb-4 animate-pulse" />
                                <h3 className="text-2xl font-black uppercase text-black italic">LINK OVERDRIVE REQUIRED</h3>
                                <p className="text-zinc-500 font-bold uppercase text-[10px] mt-2">Connect to Vytronix Network to access Hunter Radar levels.</p>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {activeTab === "SIGNALS" ? (
                                <motion.div 
                                    key="signals"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 flex flex-col gap-3"
                                >
                                    {hunterSignals.length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center gap-4 grayscale opacity-30">
                                            <Target size={64} />
                                            <span className="font-black italic uppercase tracking-widest text-xl">Awaiting On-Chain Events...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {hunterSignals.slice(0, 50).map((sig) => (
                                                <motion.div 
                                                    key={sig.hash}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="border-2 border-black p-4 flex flex-col md:flex-row gap-4 items-center bg-white hover:bg-zinc-50 transition-all group relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    
                                                    <div className="flex flex-col items-center justify-center border-r-2 border-black pr-4 min-w-[100px]">
                                                        <span className="text-[10px] font-black uppercase text-zinc-400">TIMESTAMP</span>
                                                        <span className="text-xs font-bold font-mono">
                                                            {new Date(sig.timestamp).toLocaleTimeString([], { hour12: false })}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 w-full">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 bg-[#00ff41] rounded-full shadow-[0_0_8px_#00ff41]" />
                                                            <span className="font-black text-xs uppercase tracking-tighter">Capture verified: <span className="text-[#00ff41]">{formatAddress(sig.hunter)}</span></span>
                                                            <span className="ml-auto bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase">{sig.tier}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase text-zinc-400">TOKEN:</span>
                                                                <span className="font-black text-lg italic text-[#00ff41] drop-shadow-[1px_1px_0_#000]">${sig.token}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase text-zinc-400">DEX_PATH:</span>
                                                                <span className="font-black text-[10px] uppercase bg-zinc-100 px-2 border-black border italic">{sig.buyDex} → {sig.sellDex}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end border-l-2 border-black pl-4 min-w-[120px]">
                                                        <span className="text-[10px] font-black uppercase text-zinc-400">CAPTURED_PROFIT</span>
                                                        <span className="text-xl font-black italic text-[#00ff41]">+{sig.profitPct.toFixed(2)}%</span>
                                                        <span className="text-[10px] font-bold text-zinc-500">{formatCurrency(sig.profitUsd)}</span>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <a 
                                                            href={`https://bscscan.com/tx/${sig.hash}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-2 border-2 border-black hover:bg-black hover:text-[#00ff41] transition-all bg-white"
                                                            title="Inspect on BscScan"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="hunters"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="p-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredHunters.map((hunter) => (
                                            <div key={hunter.address} className="border-4 border-black p-6 flex flex-col bg-white relative group overflow-hidden shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff41]/5 -rotate-45 translate-x-12 -translate-y-12" />
                                                
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{hunter.tier}</span>
                                                        <h4 className="text-xl font-black italic uppercase leading-none mt-1">{hunter.alias}</h4>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase">SCORE</span>
                                                        <span className="text-2xl font-black text-black leading-none">{hunter.score.toFixed(0)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 mb-4 bg-zinc-50 p-2 border-2 border-black border-dashed">
                                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                        <span>CREDENTIALS:</span>
                                                        <span className="font-mono">{formatAddress(hunter.address)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                        <span>EXEC_SPEED:</span>
                                                        <span className="text-[#00ff41]">{hunter.speed}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t-2 border-black">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-zinc-400 uppercase">TRADES</span>
                                                        <span className="text-sm font-black">{hunter.trades}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-zinc-400 uppercase">AVG_ROI</span>
                                                        <span className="text-sm font-black text-[#00ff41]">+{hunter.avgProfit.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] font-black text-zinc-400 uppercase">CONST</span>
                                                        <span className="text-sm font-black">{hunter.consistency}%</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4">
                                                    <button className="w-full bg-black text-[#00ff41] py-2 font-black uppercase text-[10px] tracking-widest hover:bg-[#00ff41] hover:text-black transition-all flex items-center justify-center gap-2">
                                                        <Crosshair size={14} /> VIEW_PATTERNS
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Stats Bar */}
                    <div className="bg-black p-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] border-t-4 border-black">
                        <div className="flex gap-6 items-center flex-wrap justify-center">
                            <div className="flex items-center gap-2 text-white/50">
                                <Award size={12} className="text-[#fffc20]" />
                                TOP HUNTER: <span className="text-white">{hunters.sort((a,b) => b.score - a.score)[0]?.alias || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/50">
                                <Shield size={12} className="text-[#00ff41]" />
                                VERIFICATION: <span className="text-[#00ff41]">ACTIVE</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[#00ff41] mt-2 md:mt-0">
                            <Activity size={12} />
                            ENGINE_SYNC: OK // LATENCY: 14MS
                        </div>
                    </div>

                </div>

                {/* Integration Alert */}
                <div className="bg-[#fffc20] border-4 border-black p-6 flex items-start gap-4">
                    <Crosshair size={32} className="shrink-0" />
                    <div>
                        <h4 className="font-black uppercase text-sm leading-none mb-2">Alpha Signal Integration</h4>
                        <p className="text-black font-bold uppercase text-[10px] leading-tight">
                            These signals represent high-confidence MEV and Arbitrage patterns identified by the Vytronix Global Engine. 
                            Users can utilize this data to follow professional execution flows or adjust their own parameters based on target success rates.
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
}
