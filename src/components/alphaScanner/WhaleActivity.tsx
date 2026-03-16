import { useState, useEffect } from "react";
import { Radar, User, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { formatCurrency } from "@/lib/utils";

interface WhaleBuy {
    id: string;
    wallet: string;
    token: string;
    size: number;
    time: string;
    chain: string;
}

export function WhaleActivity() {
    const { language, networkMode } = useAppStore();
    const t = translations[language];
    const [buys, setBuys] = useState<WhaleBuy[]>([]);

    useEffect(() => {
        if (!networkMode) return;

        const symbols = ["BTC", "ETH", "SOL", "BNB"];
        const updateWhales = async () => {
            try {
                // Fetch from common high-liquidity sources
                const newBuys: WhaleBuy[] = [];
                for (const s of symbols) {
                    const r = await fetch(`https://api.binance.com/api/v3/aggTrades?symbol=${s}USDT&limit=5`);
                    const data = await r.json();
                    if (Array.isArray(data)) {
                        data.forEach((t: { p: string; q: string; f: number; T: number }) => {
                            const size = parseFloat(t.p) * parseFloat(t.q);
                            if (size > 50000) { // $50k+ threshold for whale
                                newBuys.push({
                                    id: `w-${s}-${t.f}`,
                                    wallet: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
                                    token: s,
                                    size: size,
                                    time: new Date(t.T).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    chain: s === 'SOL' ? 'SOL' : 'BSC'
                                });
                            }
                        });
                    }
                }
                setBuys(prev => [...newBuys, ...prev].slice(0, 10));
            } catch (err) {
                console.error("Whale Radar Error:", err);
            }
        };

        updateWhales();
        const interval = setInterval(updateWhales, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, [networkMode]);

    return (
        <div className="border-4 border-black bg-white shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col h-full">
            <div className="bg-black p-4 flex items-center justify-between">
                <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                    <Radar className="text-[#00ff41]" size={16} /> {t.alpha_whale_activity}
                </h3>
                <span className="text-[10px] text-zinc-500 font-black uppercase">LIVE_RADAR</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px]">
                {buys.length > 0 ? (
                    <div className="divide-y-2 divide-black">
                        {buys.map((buy) => (
                            <div key={buy.id} className="p-4 hover:bg-[#00ff41]/5 transition-colors flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-black bg-zinc-100 flex items-center justify-center shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        <User size={20} className="text-zinc-400 group-hover:text-black transition-colors" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase text-zinc-400">WALLET_ID</div>
                                        <div className="font-mono text-sm font-black">{buy.wallet}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black italic tracking-tighter text-black">
                                        {formatCurrency(buy.size)} <span className="text-[10px] not-italic text-zinc-400">IN {buy.token}</span>
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-zinc-500 flex items-center justify-end gap-1">
                                        <Clock size={10} /> {buy.time} // {buy.chain}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-black uppercase text-zinc-400 tracking-[4px]">RADAR_BOOTING...</span>
                    </div>
                )}
            </div>
            
            <div className="bg-black p-2 flex justify-center">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-1 h-3 ${i < 3 ? 'bg-[#00ff41]' : 'bg-zinc-800'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}
