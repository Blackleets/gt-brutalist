import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { WalletModal } from "./WalletModal";

export function Hero() {
    const { selectedChain, activeRpcPerChain, wallet, language, setNetworkMode } = useAppStore();
    const t = translations[language];
    const [launchState, setLaunchState] = useState<"idle" | "core" | "rpc" | "aethrix" | "restore" | "online">("idle");
    const [showStatus, setShowStatus] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [latency, setLatency] = useState(45);

    useEffect(() => {
        if (showStatus) {
            const interval = setInterval(() => {
                setLatency(Math.floor(Math.random() * 30) + 20); // Fluctuates between 20ms and 50ms
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [showStatus]);

    const handleLaunch = async () => {
        if (launchState !== "idle") return;

        setLaunchState("core");
        await new Promise(r => setTimeout(r, 500));
        setLaunchState("rpc");
        await new Promise(r => setTimeout(r, 600));
        setLaunchState("aethrix");
        await new Promise(r => setTimeout(r, 700));
        setLaunchState("restore");
        await new Promise(r => setTimeout(r, 500));
        setLaunchState("online");

        setTimeout(() => {
            setLaunchState("idle");
            setNetworkMode(true);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 800);
    };

    const getLaunchText = () => {
        switch (launchState) {
            case "core": return t.hero_launch_core;
            case "rpc": return t.hero_launch_bridge;
            case "aethrix": return t.hero_launch_feed;
            case "restore": return t.hero_launch_encrypt;
            case "online": return t.hero_launch_online;
            default: return t.hero_launch_access;
        }
    };

    return (
        <section className="px-4 md:px-8 pt-20 md:pt-32 pb-24 md:pb-32 border-b-8 border-black relative z-10 w-full overflow-hidden bg-white selection:bg-black selection:text-[#00ff41]">
            {/* AGGRESSIVE BACKGROUND ELEMENTS */}
            <div className="absolute top-0 right-0 w-1/2 h-full border-l-4 border-black/5 pointer-events-none hidden lg:block">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] [background-size:24px_24px]"></div>
            </div>

            <div className="relative">


                {/* EXISTING TERMINAL LAUNCHER (MODIFIED TO SYNC WITH NEW DESIGN) */}
                <div className="pt-24 border-t-4 border-dashed border-zinc-200">
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        className="inline-block bg-black text-white px-3 py-1 text-[10px] md:text-sm font-black uppercase mb-6"
                    >
                        {t.hero_stable}
                    </motion.div>

                    <motion.h2
                        initial={{ y: 80, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="text-5xl xs:text-6xl sm:text-7xl md:text-[6rem] lg:text-[8rem] font-black tracking-[calc(-0.06em)] leading-[0.85] uppercase mb-8"
                    >
                        VYTRONIX <br />
                        <span className="text-stroke-2 text-white">{t.hero_systems}</span>
                    </motion.h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
                        <div className="max-w-xl">
                            <p className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight">
                                {t.hero_title}
                                <span className="text-[#00ff41] stroke-black text-stroke-1-black">{t.hero_aggregation}</span>{t.hero_on_sol_bsc}
                            </p>
                            <p className="mt-6 text-sm md:text-base font-bold text-gray-500 uppercase max-w-md">
                                {t.hero_desc}
                            </p>

                            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleLaunch}
                                    disabled={launchState !== "idle"}
                                    className={`group relative border-4 border-black px-8 py-6 font-black uppercase text-xl transition-all shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${launchState !== "idle"
                                        ? "bg-[#00ff41] text-black border-[#00ff41]"
                                        : "bg-black text-white hover:bg-white hover:text-black"
                                        }`}
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        {launchState === "idle" && <div className="w-3 h-3 bg-white group-hover:bg-black animate-pulse" />}
                                        {getLaunchText()}
                                    </span>
                                </button>

                                {!wallet.connected && (
                                    <button
                                        onClick={() => setIsWalletOpen(true)}
                                        className="border-4 border-black px-8 py-6 font-black uppercase text-xl bg-white text-black hover:bg-black hover:text-white transition-all shadow-[8px_8px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center gap-3"
                                    >
                                        <div className="w-3 h-3 bg-black group-hover:bg-white" />
                                        SYNC_UPLINK
                                    </button>
                                )}

                                <div className="flex flex-col justify-center">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.hero_latency_sync}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black">{latency}MS</span>
                                        <div className="w-12 h-1 bg-zinc-200">
                                            <motion.div
                                                animate={{ width: `${(latency / 80) * 100}%` }}
                                                className="h-full bg-[#00ff41]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex flex-col gap-4 border-l-4 border-black pl-8">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-zinc-400 uppercase">{t.hero_active_networks}</div>
                                <div className="flex gap-2">
                                    <span className="bg-zinc-100 px-2 py-1 text-[10px] font-black">SOLANA_RPC_V2</span>
                                    <span className="bg-zinc-100 px-2 py-1 text-[10px] font-black">BSC_MAINNET</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-zinc-400 uppercase">{t.hero_engine_status}</div>
                                <div className="text-lg font-black uppercase italic">{t.hero_engine_online}</div>
                            </div>
                            <button
                                onClick={() => setShowStatus(true)}
                                className="mt-4 text-[10px] font-black uppercase underline hover:no-underline text-left"
                            >
                                {t.hero_view_metrics}
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showStatus && (
                        <div className="absolute top-0 left-0 w-full h-full min-h-[400px] z-50 flex items-center justify-start pointer-events-none md:p-16 p-6">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="bg-black text-white border-4 border-[#00ff41] shadow-[8px_8px_0_rgba(0,255,65,0.4)] p-8 max-w-md w-full pointer-events-auto"
                            >
                                <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-gray-700 pb-4">
                                    <h2 className="text-2xl font-black uppercase text-[#00ff41] flex items-center gap-2">
                                        <span className="w-3 h-3 bg-[#00ff41] animate-pulse"></span>
                                        {t.hero_metrics_title}
                                    </h2>
                                    <button
                                        onClick={() => setShowStatus(false)}
                                        className="text-gray-400 hover:text-white font-black text-xl"
                                    >
                                        [X]
                                    </button>
                                </div>

                                <div className="space-y-4 font-bold uppercase text-sm tracking-wide">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t.hero_metrics_chain}</span>
                                        <span className="text-[#00ff41]">{selectedChain}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t.hero_metrics_rpc}</span>
                                        <span className="truncate max-w-[180px]" title={activeRpcPerChain[selectedChain]}>
                                            {activeRpcPerChain[selectedChain] || "NOT SET"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">{t.hero_metrics_latency}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-end gap-[1px] h-3">
                                                <div className="w-1 h-1 bg-[#00ff41]"></div>
                                                <div className="w-1 h-2 bg-[#00ff41]"></div>
                                                <div className="w-1 h-3 bg-[#00ff41]"></div>
                                                <div className={`w-1 h-full ${latency > 40 ? 'bg-gray-700' : 'bg-[#00ff41]'}`}></div>
                                            </div>
                                            <span className="text-[#00ff41]">{latency}ms</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t.hero_metrics_engine}</span>
                                        <span className="bg-[#00ff41] text-black px-1">{t.hero_metrics_hybrid}</span>
                                    </div>
                                    <div className="flex justify-between mt-4 pt-4 border-t-2 border-dashed border-gray-700">
                                        <span className="text-gray-500">{t.hero_metrics_wallet}</span>
                                        {wallet.connected ? (
                                            <span className="text-[#00ff41]">
                                                {t.hero_metrics_connected} [{wallet.chain}] {wallet.address?.substring(0, 6)}...
                                            </span>
                                        ) : (
                                            <span className="text-red-500">{t.hero_metrics_disconnected}</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
            </div>
        </section>
    );
}
