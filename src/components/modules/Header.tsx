import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { WalletModal } from "./WalletModal";
import { AdminModal } from "./AdminModal";
import { Wallet, LogOut, Activity, ArrowUpRight, Settings, Volume2, VolumeX, Zap } from "lucide-react";
import { translations } from "@/lib/translations";
import { audio } from "@/lib/audio";

export function Header() {
    const {
        wallet,
        disconnectWallet,
        platformRevenue,
        ownerAddresses,
        activeViewId,
        setActiveViewId,
        language,
        setLanguage,
        audioEnabled,
        setAudioEnabled,
        aethrixStats,
        marketSentiment
    } = useAppStore();
    const t = translations[language];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [latency, setLatency] = useState(24);
    const [nodeLoad, setNodeLoad] = useState(12);

    // Dynamic latency simulation for brutalist telemetry feel
    useEffect(() => {
        const interval = setInterval(() => {
            setLatency(Math.floor(Math.random() * 15) + 18);
            setNodeLoad(Math.floor(Math.random() * 5) + 8);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
    };

    const isOwner = wallet.connected && ownerAddresses.some(addr => addr.toLowerCase() === (wallet.address || "").toLowerCase());

    const toggleAudio = () => {
        const next = !audioEnabled;
        setAudioEnabled(next);
        if (next) {
            audio.click();
        }
    };

    return (
        <header className="flex flex-col border-b-4 border-black border-x-0 relative z-[60] w-full overflow-hidden bg-white">
            {/* Ticker tape */}
            <div className="bg-[#00ff41] text-black font-black uppercase text-[10px] md:text-sm py-1 border-b-4 border-black overflow-hidden flex whitespace-nowrap">
                <div className="animate-[marquee_40s_linear_infinite] inline-block tracking-widest leading-none">
                    {t.head_ticker} {t.head_ticker}
                </div>
            </div>

            <div className="px-4 md:px-16 py-3 md:py-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-3 md:gap-4">
                <div className="hidden lg:flex items-center gap-6 border-r-4 border-black pr-8 mr-4 h-12">
                    {isOwner ? (
                        <button
                            onClick={() => {
                                const confirmWithdraw = window.confirm(t.head_withdraw_confirm.replace("{node}", ownerAddresses[0]).replace("{amount}", platformRevenue.toFixed(2).toString()));
                                if (confirmWithdraw) {
                                    alert(t.head_withdraw_broadcast);
                                }
                            }}
                            className="flex flex-col text-left group transition-all"
                            title="View Treasury Details"
                        >
                            <span className="text-[8px] font-black uppercase text-zinc-400 group-hover:text-black">{t.head_treasury}</span>
                            <span className="text-black font-black text-xl italic leading-none flex items-center gap-2">
                                {platformRevenue.toFixed(2)} <span className="text-[10px]">SOL</span>
                                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00ff41]" />
                            </span>
                        </button>
                    ) : (
                        <div className="flex flex-col text-left">
                            <span className="text-[8px] font-black uppercase text-zinc-400">{t.head_network_load}</span>
                            <span className="text-black font-black text-xl italic leading-none">8.4% <span className="text-[10px]">{t.head_sync}</span></span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black flex items-center justify-center animate-spin-slow shrink-0 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                            <div className="w-5 h-5 bg-white border-2 border-black" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-black text-xl md:text-3xl tracking-tighter uppercase leading-none mt-1 group cursor-default flex items-center gap-2">
                                Vytronix <span className="text-[#00ff41] text-[10px] md:text-xs px-2 py-0.5 bg-black tracking-widest hidden xs:inline transition-all group-hover:bg-[#00ff41] group-hover:text-black uppercase">CORE</span>
                            </h1>
                            <div className="flex items-center gap-2 text-[7px] md:text-[8px] font-black uppercase text-zinc-400 tracking-widest">
                                <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
                                <span className="hidden xs:inline">{t.head_heartbeat}: Active [{latency + 60}ms] // </span>{t.head_alpha}: {aethrixStats.activeSignals || 72} <span className="hidden md:inline">// {t.head_node_load}: {nodeLoad}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 w-full sm:w-auto">
                    {/* COMMAND CENTER STATUS BAR */}
                    <div className="flex items-stretch bg-zinc-100 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] h-10 overflow-hidden">
                        {/* Audio Toggle */}
                        <button
                            onClick={toggleAudio}
                            className={`px-3 flex items-center justify-center border-r-2 border-black transition-colors ${audioEnabled ? 'bg-[#00ff41] text-black' : 'bg-zinc-200 text-zinc-400'}`}
                            title={t.head_audio}
                        >
                            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>

                        {/* Latency Status */}
                        <div className="px-3 flex items-center gap-2 border-r-2 border-black bg-white group cursor-help" title={t.head_latency}>
                            <Activity size={14} className="text-[#00ff41] animate-pulse" />
                            <div className="flex flex-col leading-none">
                                <span className="text-[7px] font-black text-zinc-400 uppercase">{t.head_latency}</span>
                                <span className="text-[10px] font-black">{latency}ms</span>
                            </div>
                        </div>

                        {/* Neural Sentiment Pulse */}
                        <div className="px-3 md:flex items-center gap-3 border-r-2 border-black bg-zinc-50 group cursor-help transition-all hover:bg-zinc-100" title="Neural Market Sentiment">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${marketSentiment > 70 ? 'bg-[#00ff41]' : marketSentiment > 40 ? 'bg-[#fffc20]' : 'bg-red-600'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${marketSentiment > 70 ? 'bg-[#00ff41]' : marketSentiment > 40 ? 'bg-[#fffc20]' : 'bg-red-600'}`}></span>
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter">{t.market_sentiment}</span>
                                <div className="flex items-end gap-1">
                                    <span className={`text-[11px] font-black ${marketSentiment > 70 ? 'text-[#00ff41]' : marketSentiment > 40 ? 'text-yellow-500' : 'text-red-600'}`}>{marketSentiment}%</span>
                                    {/* Mini Sparkline */}
                                    <div className="flex gap-[1px] items-end h-3 opacity-60">
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    height: [
                                                        `${20 + (i * 15) % 80}%`,
                                                        `${80 - (i * 10) % 80}%`,
                                                        `${40 + (i * 20) % 60}%`
                                                    ]
                                                }}
                                                transition={{
                                                    duration: 0.6 + (i * 0.15),
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                className={`w-[1px] ${marketSentiment > 70 ? 'bg-[#00ff41]' : marketSentiment > 40 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RPC Status */}
                        <div className="px-3 hidden md:flex items-center gap-2 border-r-2 border-black bg-zinc-50 group cursor-help" title={t.head_rpc_status}>
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff41] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff41]"></span>
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[7px] font-black text-zinc-400 uppercase">{t.head_rpc_status}</span>
                                <span className="text-[9px] font-black truncate max-w-[60px]">MAINNET_L1</span>
                            </div>
                        </div>

                        {/* Language Selection */}
                        <div className="flex items-center">
                            {(['en', 'es', 'zh'] as const).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setLanguage(lang);
                                        audio.blip();
                                    }}
                                    className={`px-2 h-full text-[10px] font-black uppercase transition-all ${language === lang ? 'bg-black text-[#00ff41]' : 'bg-transparent text-zinc-400 hover:text-black hover:bg-zinc-200'}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isOwner && (
                        <button
                            onClick={() => setIsAdminOpen(true)}
                            className="bg-black text-white border-4 border-black px-4 py-2 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                            title="Vytronix Admin Config"
                        >
                            <Settings size={14} className="animate-spin-slow" />
                            <span className="hidden sm:inline">{t.nav_admin}</span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            const ctaSection = document.getElementById("swap-simulator-terminal");
                            if (ctaSection) {
                                ctaSection.scrollIntoView({ behavior: "smooth" });
                            } else {
                                window.scrollTo({ top: document.body.scrollHeight / 2, behavior: "smooth" });
                            }
                        }}
                        className="bg-[#fffc20] text-black border-4 border-black px-4 py-2 text-[10px] font-black uppercase hover:bg-black hover:text-[#fffc20] transition-all hidden lg:flex items-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                        <Zap size={14} />
                        {t.buy_vytronix}
                    </button>

                    {!wallet.connected ? (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 border-4 border-black bg-white text-black font-black uppercase text-xs md:text-sm h-10 md:h-12 px-4 md:px-8 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group hover:bg-black hover:text-[#00ff41]"
                        >
                            <Wallet size={16} className="group-hover:rotate-12 transition-transform" />
                            {t.connect_wallet}
                        </button>
                    ) : (
                        <div className="flex items-stretch bg-black border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] w-full sm:w-auto overflow-hidden animate-in fade-in slide-in-from-right-4 h-10 md:h-12">
                            <div className="hidden lg:flex flex-col justify-center px-4 text-xs font-bold leading-none uppercase text-white border-r-2 border-dashed border-zinc-700">
                                <span className="text-[#00ff41] font-black text-sm whitespace-nowrap">
                                    {wallet.balance?.toFixed(2)} <span className="text-[10px]">{wallet.chain === "SOL" ? "SOL" : "BNB"}</span>
                                </span>
                            </div>
                            <div className="flex flex-col justify-center px-4 bg-zinc-900 border-r-2 border-dashed border-zinc-700 min-w-[120px]">
                                <span className="text-[7px] font-black uppercase text-[#00ff41] tracking-widest">{wallet.identity?.rank || "AGENT"}</span>
                                <span className="text-white font-black text-[10px] tracking-tighter">
                                    {wallet.identity?.uid || "UPLINK_PENDING"}
                                </span>
                            </div>
                            <div className="flex flex-col justify-center px-3 md:px-4 bg-white border-r-4 border-black">
                                <span className="text-[7px] md:text-[8px] font-black uppercase text-zinc-400">{t.wallet_address}</span>
                                <span className="text-black font-black text-[10px] md:text-sm uppercase tracking-tighter">
                                    {formatAddress(wallet.address)}
                                </span>
                            </div>
                            <button
                                className="bg-white hover:bg-rose-500 hover:text-white text-black font-black uppercase text-xs px-3 md:px-5 transition-all flex items-center gap-2 group/out"
                                onClick={disconnectWallet}
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SECONDARY NAVIGATION BAR */}
            <nav className="flex items-center gap-2 md:gap-4 px-4 md:px-16 py-3 border-b-4 border-black bg-zinc-100 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]">
                {[
                    { id: "HOME", label: t.nav_home },
                    { id: "ARB_NETWORK", label: t.nav_arb_network },
                    { id: "HUNTER_TRACKER", label: t.nav_hunter },
                    { id: "WHALE_TRACKER", label: t.nav_whale },
                    { id: "SOCIAL_HUB", label: t.nav_social },
                    { id: "PORTFOLIO", label: t.nav_analytics },

                    /* 
                       Module hidden for UI simplification during Vytronix development phase:
                       { id: "ALPHA_SCANNER", label: t.nav_alpha_scanner },
                       { id: "SWAP_CORE", label: t.nav_swap },
                       { id: "CHART_TERMINAL", label: t.nav_charts },
                       { id: "COMMAND_CENTER", label: t.nav_cc },
                       { id: "WHITEPAPER_V3", label: t.nav_whitepaper }
                    */
                ].filter(view => view.id).map((view) => (
                    <button
                        key={view.id}
                        onClick={() => setActiveViewId(view.id)}
                        className={`px-4 py-2 font-black uppercase text-xs transition-all border-4 ${activeViewId === view.id
                            ? "bg-[#00ff41] text-black border-black shadow-[4px_4px_0_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                            : "bg-white text-gray-500 border-transparent hover:border-black hover:text-black hover:bg-zinc-200"
                            }`}
                    >
                        {view.label}
                    </button>
                ))}
            </nav>

            <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        </header>
    );
}
