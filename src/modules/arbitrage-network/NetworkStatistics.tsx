
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArbitrageIntelligenceSystem, NetworkStats } from "@/lib/arbitrageIntelligence";

export function NetworkStatistics() {
    const [stats, setStats] = useState<NetworkStats>({
        pairsScanned: 0,
        opportunitiesDetected: 0,
        arbitragesExecuted: 0,
        networkProfitToday: 0,
        lastUpdate: 0
    });

    useEffect(() => {
        const engine = ArbitrageIntelligenceSystem.getInstance();
        
        const update = () => {
            const currentStats = engine.getNetworkStats();
            if (currentStats) {
                setStats({...currentStats});
            }
        };

        const interval = setInterval(update, 5000);
        update();

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white w-full max-w-sm"
        >
            <div className="flex items-center gap-2 mb-3 border-b-2 border-[#00ff41] pb-2">
                <div className="w-2 h-2 bg-[#00ff41] animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Vytronix Network</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">Pairs Scanned</div>
                    <div className="text-xl font-black italic">{stats.pairsScanned}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">Opportunities</div>
                    <div className="text-xl font-black italic text-[#00ff41]">{stats.opportunitiesDetected}</div>
                </div>
                <div className="pt-2 border-t border-zinc-900">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">Executed Trades</div>
                    <div className="text-xl font-black italic">{stats.arbitragesExecuted}</div>
                </div>
                <div className="pt-2 border-t border-zinc-900">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">Network Profit</div>
                    <div className="text-xl font-black italic text-[#00ff41]">${stats.networkProfitToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
            </div>

            <div className="mt-4 pt-2 border-t-2 border-dashed border-zinc-800 flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase">
                <span>Real-Time Processing</span>
                <span>Last Upd: {stats.lastUpdate > 0 ? new Date(stats.lastUpdate).toLocaleTimeString() : "PENDING"}</span>
            </div>
        </motion.div>
    );
}
