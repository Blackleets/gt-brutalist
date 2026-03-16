
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Zap } from "lucide-react";
import { ArbitrageIntelligenceSystem, ExecutedArbitrage } from "@/lib/arbitrageIntelligence";
import { useAppStore } from "@/lib/store";

export function LiveArbitrageFeed() {
    const { globalRankings } = useAppStore();
    const [events, setEvents] = useState<ExecutedArbitrage[]>([]);

    useEffect(() => {
        const engine = ArbitrageIntelligenceSystem.getInstance();
        
        // Listener for new signals
        engine.onSignal((signal) => {
            setEvents(prev => [signal, ...prev].slice(0, 10));
        });

        // Initial load - use a microtask to avoid synchronous cascading renders
        const initialFeed = engine.getExecutedFeed().slice(0, 10);
        Promise.resolve().then(() => {
            setEvents(initialFeed);
        });

        // Periodic processing to simulate live engine activity
        const interval = setInterval(() => {
            engine.processPools(globalRankings);
        }, 3000);

        return () => clearInterval(interval);
    }, [globalRankings]);

    return (
        <div className="bg-black border-4 border-black p-4 md:p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] text-white w-full">
            <div className="flex justify-between items-center mb-6 border-b-4 border-[#ff00ff] pb-4">
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#ff00ff] fill-[#ff00ff] animate-pulse" />
                    <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">Live Arbitrage Feed</h2>
                </div>
                <div className="px-3 py-1 bg-[#ff00ff] text-black text-[10px] font-black uppercase">Real-Time On-Chain</div>
            </div>

            <div className="space-y-4 min-h-[300px]">
                <AnimatePresence initial={false}>
                    {events.length > 0 ? events.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border-2 border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-[#00ff41] relative overflow-hidden group"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-sm font-black text-white uppercase mb-1">
                                        User <span className="text-[#00ff41]">{event.wallet}</span> 
                                        {" "}captured a <span className="text-[#00ff41]">{event.spread.toFixed(2)}%</span> spread
                                    </div>
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                        Secured a <span className="text-white">${event.netProfit.toFixed(2)}</span> profit on 
                                        {" "}<span className="text-white">{event.pair}</span> using route: 
                                        {" "}<span className="text-[#ff00ff]">{event.route.join(' → ')}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-center min-w-[120px]">
                                    <div className="text-[10px] font-black text-zinc-600 uppercase mb-2">Transaction Hash</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-[10px] font-mono text-zinc-400 bg-black px-2 py-1 border border-zinc-800">
                                            {event.txHash.substring(0, 8)}...{event.txHash.substring(event.txHash.length - 8)}
                                        </code>
                                        <a 
                                            href={event.chain === 'solana' ? `https://solscan.io/tx/${event.txHash}` : `https://bscscan.com/tx/${event.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:text-[#00ff41] transition-colors"
                                            aria-label="View transaction on explorer"
                                            title="View on Explorer"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-1">
                                <div className={`text-[8px] font-black px-1.5 py-0.5 uppercase ${event.chain === 'solana' ? 'bg-[#9945FF] text-white' : 'bg-[#F3BA2F] text-black'}`}>
                                    {event.chain}
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-700 border-2 border-dashed border-zinc-900">
                            <Zap className="w-8 h-8 mb-4 opacity-20" />
                            <div className="text-xs font-black uppercase tracking-widest">Scanning Blockchain for Arbitrage Events...</div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-6 text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41]" />
                Verified Vytronix Intelligence Layer
            </div>
        </div>
    );
}
