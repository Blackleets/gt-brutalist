import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

export function LiveFlow() {
    const { networkFeed } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);

    // Map network feed to flow items reactively
    const items = useMemo(() => {
        if (!networkFeed) return [];
        return networkFeed.map((s, index) => ({
            id: s.id || `${s.tokenSymbol}-${index}-${s.time}`,
            token: s.tokenSymbol,
            change: s.metricValue,
            signal: s.type.toLowerCase()
        })).slice(0, 6);
    }, [networkFeed]);

    useEffect(() => {
        if (items.length > 0 && isLoading) {
            const timer = setTimeout(() => setIsLoading(false), 800);
            return () => clearTimeout(timer);
        } else if (items.length === 0 && isLoading) {
            // Keep loading for a bit to see if data arrives
            const timer = setTimeout(() => setIsLoading(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [items.length, isLoading]);

    return (
        <div className="font-mono uppercase text-[10px] md:text-xs tracking-tight select-none">
            <div className="flex items-center gap-2 mb-4 text-black font-black opacity-90">
                <span className="text-[#00ff41] animate-pulse">⚡</span>
                <span className="tracking-widest">LIVE FLOW</span>
            </div>
            
            <div className="flex flex-col gap-1.5 min-h-[140px]">
                {isLoading && (
                    <div className="text-zinc-400 animate-pulse">SYNCING BOT UPLINK...</div>
                )}

                {!isLoading && items.length === 0 && (
                    <div className="text-zinc-500 italic">No live signals available</div>
                )}

                <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item) => {
                        // Extract percentage or value if present for coloring
                        const numericMatch = item.change.match(/[+-]?\d+(\.\d+)?%/);
                        const changeStr = numericMatch ? numericMatch[0] : item.change.split(':')[1]?.trim() || item.change;
                        const isPositive = !changeStr.includes('-') && (changeStr.includes('+') || !changeStr.match(/\d/));
                        const colorClass = isPositive ? "text-[#00ff41]" : "text-red-600";

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="flex items-center gap-3 whitespace-nowrap overflow-hidden py-0.5"
                            >
                                <span className="font-black text-black w-[55px] shrink-0">{item.token}</span>
                                <span className={`font-black w-[80px] text-right shrink-0 ${colorClass} truncate`}>{changeStr}</span>
                                <span className="text-zinc-300 shrink-0">→</span>
                                <span className="text-zinc-500 truncate">{item.signal}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}


