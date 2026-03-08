import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Users, TrendingUp, AlertCircle, ExternalLink, Lock, Zap } from "lucide-react";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";
import { motion } from "framer-motion";
import { Twitter } from "lucide-react";

export function KOLSignalsPanel() {
    const { kolSignals, language } = useAppStore();
    const { isAuthorized } = useAlphaGuard();
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Filter to show only if within 20s and limit to 3
    const topSignals = [...kolSignals]
        .filter(s => currentTime - s.timestamp < 20000)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
    return (
        <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            {/* Header Matrix */}
            <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fffc20] border-4 border-black flex items-center justify-center text-black shadow-[4px_4px_0_black]">
                        <Users size={24} strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className="font-[1000] text-2xl uppercase tracking-tighter leading-none italic">KOL_CENTRAL</h2>
                        <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Social Velocity Index // 0.6s</div>
                    </div>
                </div>
                <div className="bg-[#fffc20] px-3 py-1 border-2 border-black text-[10px] font-black uppercase shadow-[3px_3px_0_black] animate-pulse">
                    LIVE_SCAN
                </div>
            </div>

            {/* Content with Gating */}
            <div className="relative min-h-[750px]">
                <div className={`space-y-4 transition-all duration-500 ${!isAuthorized ? 'blur-xl select-none opacity-40 pointer-events-none grayscale' : ''}`}>
                    {topSignals.length === 0 ? (
                        <div className="py-20 text-center bg-zinc-50 border-4 border-dashed border-zinc-200">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-black border-dashed rounded-full"
                                />
                                <TrendingUp className="absolute inset-0 m-auto text-zinc-300" size={24} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Synchronizing Social Vectors...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topSignals.map((signal) => (
                                <div
                                    key={signal.id}
                                    className={`p-4 border-4 border-black transition-all group/item ${signal.isConfirmation ? 'bg-[#fffc20] shadow-[4px_4px_0_black]' : 'bg-white'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-[1000] text-3xl italic tracking-tighter text-black">
                                                    ${signal.tokenSymbol}
                                                </span>
                                                {signal.isConfirmation && (
                                                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 uppercase flex items-center gap-1">
                                                        <AlertCircle size={10} strokeWidth={3} /> CONFIRMED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {signal.kols.map((kol) => (
                                                    <a
                                                        key={kol}
                                                        href={`https://x.com/${kol.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`text-[11px] font-[1000] px-3 py-1 border-2 border-black transition-all active:scale-95 flex items-center gap-1 shadow-[2px_2px_0_black] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_black] ${signal.isConfirmation
                                                            ? 'bg-white text-black hover:bg-[#00ff41]'
                                                            : 'bg-zinc-50 text-black border-zinc-200 hover:bg-black hover:text-[#fffc20] hover:border-black'
                                                            }`}
                                                    >
                                                        @{kol.replace('@', '')}
                                                        <ExternalLink size={10} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right border-l-4 border-black pl-4 h-full">
                                            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">UPLINK_VAL</div>
                                            <div className={`text-4xl font-[1000] italic leading-none ${signal.impactScore > 85 ? 'text-red-600' :
                                                signal.impactScore > 75 ? 'text-orange-500' : 'text-[#00ff41]'
                                                }`}>
                                                {signal.impactScore}
                                            </div>
                                        </div>
                                    </div>

                                    {signal.tweetText && (
                                        <div className={`mt-4 p-4 border-2 border-black italic font-bold text-[11px] leading-relaxed relative shadow-[4px_4px_0_black] ${signal.isConfirmation ? 'bg-white border-dashed' : 'bg-zinc-50 text-black'
                                            }`}>
                                            <div className="absolute -top-3 -left-3 bg-[#00ff41] text-black p-2 border-2 border-black group-hover:rotate-12 transition-transform shadow-[2px_2px_0_black]">
                                                <Twitter size={12} fill="currentColor" />
                                            </div>
                                            <span className="opacity-70 mr-1">TWEET_UPLINK:</span>
                                            "{signal.tweetText}"
                                        </div>
                                    )}

                                    <div className={`flex items-center justify-between mt-4 pt-4 border-t-4 border-black border-dashed`}>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Reach</span>
                                                <span className="text-xs font-black">{signal.followerCount}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Velocity</span>
                                                <span className="text-xs font-black">{signal.mentions}x</span>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://dexscreener.com/solana/${signal.tokenAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-4 py-2 flex items-center gap-2 border-2 border-black font-black uppercase text-xs transition-all shadow-[4px_4px_0_black] active:shadow-none active:translate-x-1 active:translate-y-1 ${signal.isConfirmation ? 'bg-[#00ff41] text-black hover:bg-white' : 'bg-black text-white hover:bg-[#fffc20] hover:text-black'
                                                }`}
                                        >
                                            IDENTIFY
                                            <ExternalLink size={12} strokeWidth={3} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!isAuthorized && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-white/95 border-4 border-black border-dashed m-1">
                        <div className="w-24 h-24 bg-black text-white flex items-center justify-center border-4 border-black shadow-[10px_10px_0_#fffc20] mb-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Lock size={48} strokeWidth={3} className="text-[#fffc20]" />
                        </div>
                        <h3 className="text-4xl font-[1000] uppercase italic tracking-tighter leading-none mb-4 drop-shadow-[3px_3px_0_#fffc20]">
                            ENCRYPTED_FEED <br />
                            <span className="text-red-600 text-stroke-1-black">UPLINK_REQUIRED</span>
                        </h3>
                        <p className="text-[12px] font-[1000] text-black uppercase max-w-[280px] leading-relaxed mb-10 bg-[#fffc20] px-2 py-1 border-2 border-black inline-block">
                            {language === 'es'
                                ? "Se requiere autorización Nivel 2 o identidad de Propietario para desencriptar vectores sociales."
                                : "Level 2 authorization or Owner identity required to decrypt social sentiment vectors."}
                        </p>
                        <button
                            onClick={() => {
                                const header = document.querySelector('header');
                                if (header) header.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-black text-[#00ff41] border-4 border-black px-12 py-5 font-[1000] uppercase text-lg shadow-[8px_8px_0_#00ff41] hover:bg-[#00ff41] hover:text-black transition-all flex items-center gap-3 active:scale-95 active:shadow-none translate-y-0 active:translate-y-1 active:translate-x-1"
                        >
                            <Zap fill="currentColor" size={20} />
                            UPGRADE_TO_PREMIUM
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Matrix */}
            <div className="mt-8 pt-6 border-t-4 border-black">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tight">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#00ff41]" />
                        <span>SentiMatrix Engine v4.0.2</span>
                    </div>
                    <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 h-3 ${i < topSignals.length ? 'bg-[#00ff41]' : 'bg-zinc-200'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
