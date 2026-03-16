import { useAppStore } from "@/lib/store";
import { CHAINS } from "@/lib/chains";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function StackMonitor() {
    const {
        selectedChain,
        activeRpcPerChain,
        activeEnvPerChain,
        wallet,
        aethrixStats,
        latency,
        rpcHealth
    } = useAppStore();

    const isReady = wallet.connected && rpcHealth === "ONLINE";
    const readiness = isReady ? "READY" : (wallet.connected || rpcHealth === "ONLINE") ? "PARTIAL" : "NOT READY";

    const panels = [
        {
            title: "Chain-Agnostic Infrastructure",
            stats: [
                { label: "Supported Chains", value: Object.keys(CHAINS).length, color: "text-black" },
                { label: "Active Chain", value: selectedChain.toUpperCase(), color: "text-black" },
                { label: "Active RPC", value: activeRpcPerChain[selectedChain]?.split("//")[1]?.slice(0, 15) + "...", color: "text-gray-500" },
                { label: "Network Mode", value: activeEnvPerChain[selectedChain]?.toUpperCase(), color: "text-black" },
                { label: "RPC Latency", value: `${latency}ms`, color: latency < 100 ? "text-[#00ff41]" : "text-yellow-500" },
                { label: "Health Status", value: rpcHealth, color: rpcHealth === "ONLINE" ? "text-[#00ff41]" : "text-red-500" },
            ]
        },
        {
            title: "Modular Execution Rails",
            stats: [
                { label: "Wallet Connected", value: wallet.connected ? "YES" : "NO", color: wallet.connected ? "text-[#00ff41]" : "text-red-500" },
                { label: "Address", value: wallet.address ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}` : "N/A", color: "text-gray-500" },
                { label: "Detected Chain", value: wallet.chain || "NONE", color: "text-black" },
                { label: "Execution Readiness", value: readiness, color: readiness === "READY" ? "text-[#00ff41]" : readiness === "PARTIAL" ? "text-yellow-500" : "text-red-500" },
                { label: "Switching", value: "AVAILABLE", color: "text-[#00ff41]" },
                { label: "Provider", value: wallet.providerType?.toUpperCase() || "NONE", color: "text-gray-500" },
            ]
        },
        {
            title: "Real-Time Signal Engine",
            stats: [
                { label: "Active Signals", value: aethrixStats.activeSignals, color: "text-black" },
                { label: "High Confidence", value: aethrixStats.highConfidence, color: "text-[#00ff41]" },
                { label: "Momentum Spikes", value: aethrixStats.momentumSpikes, color: "text-[#00ff41]" },
                { label: "Auto-Refresh", value: aethrixStats.autoRefresh ? "ON (30S)" : "OFF", color: aethrixStats.autoRefresh ? "text-[#00ff41]" : "text-gray-400" },
                { label: "API Mode", value: aethrixStats.apiMode, color: aethrixStats.apiMode === "Live" ? "text-[#00ff41]" : "text-yellow-500" },
                { label: "Scanning", value: aethrixStats.scanningChain.toUpperCase(), color: "text-black" },
            ]
        }
    ];

    return (
        <div className="border-4 border-black p-6 md:p-8 relative z-10 bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <h2 className="text-2xl xs:text-3xl md:text-6xl font-black uppercase mb-6 md:mb-12 flex flex-wrap items-center gap-2 md:gap-4">
                <span>VYTRONIX Stack</span>
                <span className="text-[8px] md:text-sm bg-black text-[#00ff41] px-2 py-1 animate-pulse">LIVE MONITOR</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {panels.map((panel, idx) => (
                    <motion.div
                        key={panel.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="transition-all duration-150"
                    >
                        <Card className="rounded-none border-4 border-black bg-white shadow-none h-full relative overflow-hidden group">
                            <CardContent className="p-4 md:p-8">
                                <div className="text-sm md:text-xl font-black uppercase mb-4 md:mb-6 pb-2 border-b-2 border-black">{panel.title}</div>
                                <div className="space-y-3">
                                    {panel.stats.map((stat, sIdx) => (
                                        <div key={sIdx} className="flex justify-between items-center text-[10px] md:text-sm font-bold uppercase gap-2">
                                            <span className="text-gray-400 shrink-0">{stat.label}</span>
                                            <span className={`${stat.color} truncate text-right`}>{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 md:mt-8 text-[0.55rem] md:text-[0.65rem] font-black uppercase tracking-widest text-gray-300 group-hover:text-black transition-colors">
                                    // SYS_LOG_{panel.title.split(' ')[0].toUpperCase()}_OK
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
