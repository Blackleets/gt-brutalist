import { KOLSignalsPanel } from "./KOLSignalsPanel";
import { PremiumPulseChat } from "./PremiumPulseChat";
import { motion } from "framer-motion";

import { translations } from "@/lib/translations";
import { useAppStore } from "@/lib/store";

export function SocialIntelligenceHub() {
    const { language } = useAppStore();
    const t = translations[language];
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col h-full"
            >
                <div className="inline-block self-start bg-white text-black border-4 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 shadow-[4px_4px_0_#fffc20]">
                    MODULE :: {t.social_sentiment_title}
                </div>
                <div className="flex-1">
                    <KOLSignalsPanel />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col h-full"
            >
                <div className="inline-block self-start bg-white text-black border-4 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 shadow-[4px_4px_0_#00ff41]">
                    MODULE :: {t.social_chat_title}
                </div>
                <div className="flex-1">
                    <PremiumPulseChat />
                </div>
            </motion.div>
        </div>
    );
}
