
import { motion } from "framer-motion";
import { LiveArbitrageFeed } from "./LiveArbitrageFeed";
import { NetworkStatistics } from "./NetworkStatistics";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";

export default function ArbitrageNetworkModule() {
    const { language } = useAppStore();
    const t = translations[language];

    return (
        <div className="min-h-screen bg-white text-black font-mono">
            <div className="pt-32 px-4 md:px-16 pb-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto space-y-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-8 border-black pb-6">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
                                {t.nav_arb_network}
                            </h1>
                            <p className="text-sm font-bold text-zinc-500 uppercase mt-2">
                                Real-time on-chain intelligence & network performance
                            </p>
                        </div>
                        <NetworkStatistics />
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <LiveArbitrageFeed />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
