import { useAppStore } from "@/lib/store";
import { Users, Lock, Zap, TrendingUp } from "lucide-react";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";
import { useEffect } from "react";

export function KOLSignalsPanel() {
    const { language } = useAppStore();
    const { isAuthorized } = useAlphaGuard();

    // Filter to show only if within 20s and limit to 3
    const topSignals: any[] = [];

    // Module temporarily offline — awaiting real data integration
    useEffect(() => {
        // This useEffect is a placeholder for future data integration logic.
    }, []);

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
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
                    <div className="border-4 border-black p-8 bg-zinc-50 shadow-[6px_6px_0_black]">
                        <p className="text-lg font-[1000] uppercase tracking-tighter mb-2 italic">
                            Module temporarily offline
                        </p>
                        <p className="text-[10px] font-black uppercase text-zinc-400">
                            awaiting real data integration
                        </p>
                    </div>
                </div>

                {!isAuthorized && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-white/95 border-4 border-black border-dashed m-1">
                        <div className="w-24 h-24 bg-black text-white flex items-center justify-center border-4 border-black shadow-[10px_10px_0_#fffc20] mb-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Lock size={48} strokeWidth={3} className="text-[#fffc20]" />
                        </div>
                        <h3 className="text-4xl font-[1000] uppercase italic tracking-tighter leading-none mb-4 drop-shadow-[3px_3px_0_#fffc20]">
                            ENCRYPTED_FEED <br />
                            <span className="text-red-600">UPLINK_REQUIRED</span>
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
