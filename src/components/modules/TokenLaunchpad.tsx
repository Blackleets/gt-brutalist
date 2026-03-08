import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Sprout, TrendingUp, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTokenLogo } from "@/lib/tokenLogos";

interface NewToken {
    id: string;
    symbol: string;
    name: string;
    bondingCurve: number; // 0-100
    marketCap: number;
    launchTime: string;
    riskScore: "LOW" | "MEDIUM" | "HIGH";
    creator: string;
    logo?: string;
}

export function TokenLaunchpad() {
    const { networkMode, addSystemLog } = useAppStore();
    const [tokens, setTokens] = useState<NewToken[]>(() => [
        { id: "1", symbol: "VYT", name: "Vytronix Early", bondingCurve: 91, marketCap: 80848, launchTime: "2m ago", riskScore: "LOW", creator: "vyt...core" },
        { id: "2", symbol: "PEPE2", name: "Pepe Reloaded", bondingCurve: 55, marketCap: 30842, launchTime: "5m ago", riskScore: "HIGH", creator: "0x3...abs" },
        { id: "3", symbol: "SOLDOG", name: "Solana Dog", bondingCurve: 25, marketCap: 9103, launchTime: "12m ago", riskScore: "MEDIUM", creator: "Dbg...p92" },
        { id: "4", symbol: "BRUTAL", name: "Brutalist Node", bondingCurve: 100, marketCap: 197979, launchTime: "30s ago", riskScore: "LOW", creator: "adm...seq" },
    ]);
    const [filter, setFilter] = useState<"ALL" | "RECENT" | "MOST_BONDED">("RECENT");

    useEffect(() => {
        if (!networkMode) return;

        const interval = setInterval(() => {
            setTokens((prev: NewToken[]) => {
                const updated = prev.map((t: NewToken) => ({
                    ...t,
                    bondingCurve: Math.min(100, t.bondingCurve + (Math.random() > 0.8 ? 0.5 : 0)),
                    marketCap: t.marketCap * (1 + (Math.random() * 0.002 - 0.0005))
                }));

                // Add new token occasionally without log spam
                if (Math.random() > 0.98) {
                    addSystemLog(`ALERT: NEW LIQUIDITY POOL DETECTED`, "info");
                }

                return updated;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [networkMode, addSystemLog]);

    if (!networkMode) return null;

    return (
        <section className="px-4 md:px-16 py-12 bg-white border-b-8 border-black relative z-10 overflow-hidden">
            {/* BACKGROUND WATERMARK */}
            <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4">
                <Sprout size={600} strokeWidth={4} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b-8 border-black pb-8">
                <div className="relative">
                    <div className="bg-black text-white text-[8px] font-black uppercase px-2 py-1 tracking-[0.3em] inline-block mb-4">
                        Beta_Access // Alpha Discovery
                    </div>
                    <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-none flex items-center gap-6">
                        <Sprout className="w-12 h-12 md:w-20 md:h-20 text-[#00ff41]" fill="#00ff41" />
                        LAUNCHPAD <span className="text-gray-300">MONITOR</span>
                    </h2>
                    <p className="text-sm md:text-xl font-black uppercase text-gray-500 max-w-2xl mt-4 leading-tight">
                        TRACKING REAL-TIME TOKEN LAUNCHES ACROSS BONDING CURVES
                        (SOLANA / BSC). IDENTIFYING EARLY LIQUIDITY VECTORS BEFORE
                        SECONDARY MARKET GRADUATION.
                    </p>
                </div>

                <div className="flex gap-2 bg-black p-1 self-center md:self-end">
                    {["ALL", "RECENT", "MOST_BONDED"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as "ALL" | "RECENT" | "MOST_BONDED")}
                            className={`px-6 py-2 font-black uppercase text-[10px] transition-all ${filter === f ? 'bg-[#00ff41] text-black' : 'bg-transparent text-white hover:bg-white/10'}`}
                        >
                            {f.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {tokens.map((token) => (
                        <motion.div
                            key={token.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border-8 border-black p-6 shadow-[12px_12px_0_rgba(0,0,0,1)] translate-hover flex flex-col relative"
                        >
                            {/* RISK BADGE */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase border-b-4 border-l-4 border-black ${token.riskScore === 'LOW' ? 'bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/50' : token.riskScore === 'MEDIUM' ? 'bg-[#fffc20]/10 text-yellow-600 border-[#fffc20]/50' : 'bg-red-100 text-red-600 border-red-500/50'}`}>
                                RISK: {token.riskScore}
                            </div>

                            <div className="flex items-center gap-6 mb-6">
                                <div className="w-16 h-16 bg-black flex items-center justify-center border-4 border-black shrink-0 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                                    <img
                                        src={getTokenLogo(token.symbol)}
                                        alt={token.symbol}
                                        className="w-full h-full object-cover grayscale invert"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${token.symbol}&backgroundColor=000000`;
                                        }}
                                    />
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-4xl font-black uppercase tracking-tighter leading-none mb-1 truncate">{token.symbol}</div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase truncate tracking-widest leading-none">{token.name}</div>
                                </div>
                            </div>

                            <div className="space-y-6 mb-8">
                                {/* BONDING CURVE */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-black uppercase text-gray-500">BONDING CURVE</span>
                                        <span className="text-sm font-black">{Math.floor(token.bondingCurve)}%</span>
                                    </div>
                                    <div className="h-6 bg-gray-100 border-4 border-black overflow-hidden relative">
                                        <motion.div
                                            className="h-full bg-[#00ff41]"
                                            animate={{ width: `${token.bondingCurve}%` }}
                                            transition={{ type: "spring", stiffness: 80 }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-black mix-blend-difference text-white tracking-widest">READY_TO_GRADUATE</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border-4 border-black p-4">
                                        <div className="text-[10px] font-black text-gray-400 uppercase mb-2">MKT CAP</div>
                                        <div className="text-xl font-black">${token.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    </div>
                                    <div className="border-4 border-black p-4">
                                        <div className="text-[10px] font-black text-gray-400 uppercase mb-2">LAUNCHED</div>
                                        <div className="text-xl font-black">{token.launchTime}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button className="w-full bg-[#00ff41] text-black border-4 border-black py-4 font-black uppercase text-sm hover:translate-x-1 hover:translate-y-1 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-none flex items-center justify-center gap-3 group">
                                    <TrendingUp size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                                    SNIPE TOKEN
                                </button>
                                <button className="w-full bg-white text-black border-4 border-black py-4 font-black uppercase text-sm hover:translate-x-1 hover:translate-y-1 transition-all shadow-[6px_6px_0_rgba(0,0,0,0.1)] hover:shadow-none flex items-center justify-center gap-3 group">
                                    <Search size={18} />
                                    DETAILS
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
}
