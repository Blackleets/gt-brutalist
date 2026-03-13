import { useAppStore, RealArbitrageOpportunity } from "@/lib/store";
import { Zap, ArrowRight, Timer, Bell, BellOff, ShieldCheck, TrendingUp, Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TOKEN_LOGOS, getTokenLogo } from "@/lib/tokenLogos";
import { useState, useEffect } from "react";
import { translations } from "@/lib/translations";

export function ArbitrageFlash() {
    const context = useAppStore();
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [newWalletInput, setNewWalletInput] = useState("");

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Safety check for context
    if (!context) return null;

    const {
        arbitrageOpportunities = [],
        setPrefilledSwap,
        telegramEnabled = false,
        telegramChatId = "",
        toggleTelegram,
        setTelegramConfig,
        sendTelegramAlert,
        wallet = { connected: false, address: "", chain: "SOL" },
        ownerAddresses = [],
        executedArbs = [],
        authorizedWallets = [],
        addAuthorizedWallet,
        removeAuthorizedWallet,
        language
    } = context;

    const t = translations[language];

    const isOwner = wallet.connected && ownerAddresses.includes(wallet.address);

    // Sort by profit descending - with safety check
    const activeOps = Array.isArray(arbitrageOpportunities)
        ? [...arbitrageOpportunities].sort((a, b) => b.profit - a.profit)
        : [];

    const handleExecute = (op: RealArbitrageOpportunity) => {
        if (!op || !op.token) return;

        // Tactical Alert Broadcast (Fixed/Added per requirements)
        if (sendTelegramAlert) {
            const message = `🚀 *VYTRONIX ARBITRAGE SIGNAL*\n` +
                          `💎 Asset: *${op.token}*\n` +
                          `📈 Net Profit: *+${op.profit}%*\n` +
                          `🛒 Path: \`${op.path}\`\n\n` +
                          `⚡ Source: Vytronix Engine`;
            sendTelegramAlert(
                message,
                "-1003864053759",
                55
            );
        }

        // Tactical Sound Effect
        try {
            const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { void e; }

        if (setPrefilledSwap) {
            setPrefilledSwap({
                fromSymbol: op.quoteToken || (wallet.chain === 'SOL' ? 'USDC' : 'USDT'),
                toSymbol: op.token,
                amount: 100
            });
        }

        const swapSection = document.getElementById('swap-simulator');
        swapSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const getDexLogo = (dexName: string) => {
        const normalized = dexName.toUpperCase().replace(/\s+/g, '');
        return TOKEN_LOGOS[normalized as keyof typeof TOKEN_LOGOS] || null;
    };

    // Manual time formatter to replace date-fns temporarily for stability
    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((currentTime - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h`;
    };

    return (
        <div className="flex flex-col gap-10 py-10 px-4 md:px-16 relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#00ff41] text-black border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        <Zap size={24} className="fill-current" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{t.arb_terminal_title}</h2>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-black text-[#00ff41] bg-black px-2 py-0.5 border border-[#00ff41]/50">
                                <ShieldCheck size={10} /> {t.arb_verified_data}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-0.5 border border-zinc-200 flex gap-2">
                                <span>{t.arb_atomic_settlement}: ON</span>|<span className="text-zinc-400">{t.arb_fee_hurdle}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isOwner && (
                        <div className="flex flex-col md:flex-row items-stretch gap-2">
                            <input
                                type="text"
                                placeholder="TELEGRAM_CHAT_ID"
                                value={telegramChatId}
                                onChange={(e) => setTelegramConfig && setTelegramConfig("8759026886:AAHQRt0Qf-UR0uWQ4kyMwgeegjULIhwjlC0", e.target.value, "55")}
                                className="bg-white border-4 border-black px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-[#00ff41] transition-colors w-full md:w-32"
                            />
                            <button
                                onClick={() => {
                                    try {
                                        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
                                        const ctx = new AudioContext();
                                        const osc = ctx.createOscillator();
                                        const gain = ctx.createGain();
                                        osc.connect(gain);
                                        gain.connect(ctx.destination);
                                        osc.type = 'square';
                                        osc.frequency.setValueAtTime(200, ctx.currentTime);
                                        osc.frequency.setValueAtTime(100, ctx.currentTime + 0.05);
                                        gain.gain.setValueAtTime(0.1, ctx.currentTime);
                                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                                        osc.start();
                                        osc.stop(ctx.currentTime + 0.1);
                                    } catch (e) { void e; }
                                    if (toggleTelegram) toggleTelegram(!telegramEnabled);
                                }}
                                className={`px-5 py-3 border-4 border-black font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${telegramEnabled ? 'bg-[#00ff41] text-black' : 'bg-red-500 text-white'}`}
                            >
                                {telegramEnabled ? (
                                    <><Bell size={16} /> {t.arb_broadcast_active}</>
                                ) : (
                                    <><BellOff size={16} /> {t.arb_broadcast_muted}</>
                                )}
                            </button>
                        </div>
                    )}
                    <div className="hidden lg:flex flex-col items-end">
                        <div className="text-[10px] font-black text-zinc-400 uppercase mb-1 underline decoration-[#00ff41] decoration-2">{t.arb_nodes_active}</div>
                        <div className="text-xl font-black">{activeOps.length} {t.arb_active_spreads}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                {/* Main Opportunities List */}
                <div className="xl:col-span-3">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#00ff41]" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{t.arb_liquidity_gaps}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {activeOps.length > 0 ? (
                                activeOps.map((op) => {
                                    // Gated if profit is high AND the user is not the owner AND the user's wallet is not authorized
                                    const isPremiumGated = op.profit >= 1.0 && !isOwner && !authorizedWallets.includes(wallet.address);

                                    return (
                                        <motion.div
                                            key={op.id}
                                            layout
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`bg-white border-4 p-6 relative overflow-hidden group ${isPremiumGated ? 'border-zinc-300' : 'border-black shadow-[8px_8px_0_rgba(0,0,0,1)]'}`}
                                        >
                                            {/* Premium Gating Overlay */}
                                            {isPremiumGated && (
                                                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center border-4 border-black border-dashed m-2">
                                                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-full mb-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                                        <Lock size={32} />
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{t.arb_signal_locked}</h3>
                                                    <p className="text-xs font-bold text-zinc-600 uppercase mb-4 max-w-[200px]">{t.arb_gated_desc.replace("{val}", op.profit.toString())}</p>
                                                    <button className="bg-[#00ff41] text-black border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                                        {t.arb_upgrade}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Entry/Exit Visualizer */}
                                            <div className={`flex items-center justify-between mb-8 ${isPremiumGated ? 'grayscale blur-sm opacity-50' : ''}`}>
                                                <div className="flex-1 flex flex-col items-center">
                                                    <div className="w-14 h-14 bg-zinc-100 border-2 border-black flex items-center justify-center font-black text-xl mb-2 group-hover:bg-[#00ff41] transition-colors overflow-hidden p-1">
                                                        {getDexLogo(op.path.split('→')[0]?.trim() || "") ? (
                                                            <img
                                                                src={getDexLogo(op.path.split('→')[0]?.trim() || "")!}
                                                                alt="Entry"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <ArrowDownLeft size={24} className="text-zinc-400 group-hover:text-black" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{t.arb_buy_on}</span>
                                                    <span className="text-[12px] font-black mt-1 uppercase text-black tracking-tight">{op.path.split('→')[0]?.trim()}</span>
                                                </div>

                                                <div className="flex-[0.5] h-[2px] bg-black/10 relative mx-2">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00ff41] border-2 border-black px-2 flex flex-col items-center justify-center p-1 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                        <span className="text-[12px] font-black text-black">+{op.profit}%</span>
                                                        <span className="text-[7px] font-bold text-black/70 uppercase">{t.arb_net_roi}</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col items-center">
                                                    <div className="w-14 h-14 bg-zinc-100 border-2 border-black flex items-center justify-center font-black text-xl mb-2 group-hover:bg-[#00ff41] transition-colors overflow-hidden p-1">
                                                        {getDexLogo(op.path.split('→')[1]?.trim() || "") ? (
                                                            <img
                                                                src={getDexLogo(op.path.split('→')[1]?.trim() || "")!}
                                                                alt="Exit"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <ArrowUpRight size={24} className="text-zinc-400 group-hover:text-black" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{t.arb_sell_on}</span>
                                                    <span className="text-[12px] font-black mt-1 uppercase text-black tracking-tight">{op.path.split('→')[1]?.trim()}</span>
                                                </div>
                                            </div>

                                            <div className={`flex justify-between items-end gap-6 pt-4 border-t-2 border-dashed border-zinc-200 ${isPremiumGated ? 'grayscale blur-sm opacity-50' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-white flex items-center justify-center border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden p-1">
                                                        {getTokenLogo(op.token) ? (
                                                            <img src={getTokenLogo(op.token)!} alt={op.token} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="bg-zinc-900 text-white w-full h-full flex items-center justify-center font-black text-2xl uppercase">
                                                                {op.token?.[0] || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-black tracking-tighter leading-none">{op.token}</div>
                                                        <div className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1 mt-1">
                                                            <Timer size={12} /> {op.timeLeft}s {t.arb_validity}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleExecute(op)}
                                                    className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest border-2 border-black hover:bg-[#00ff41] hover:text-black transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center gap-2"
                                                >
                                                    {t.arb_flash_execute} <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-32 border-4 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-6 grayscale opacity-60">
                                    <div className="w-20 h-20 border-4 border-zinc-300 animate-spin border-t-zinc-800" />
                                    <div className="text-center">
                                        <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">{t.arb_flash_scanning}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2">{t.arb_connecting}</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Realized Profit Feed */}
                <div className="xl:col-span-1">
                    <div className="mb-4 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#00ff41]" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{t.arb_profit_feed}</span>
                    </div>

                    <div className="bg-black text-white border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col gap-6 h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                        {Array.isArray(executedArbs) && executedArbs.length > 0 ? (
                            executedArbs.map((arb) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={arb.id}
                                    className="border-b border-zinc-800 pb-4 last:border-0"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-[#00ff41] text-black flex items-center justify-center rounded-full">
                                                <Wallet size={12} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                                {arb.wallet?.substring(0, 4)}...{arb.wallet?.substring(38)}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase">
                                            {getTimeAgo(arb.timestamp)} {t.arb_ago}
                                        </span>
                                    </div>
                                    <div className="text-lg font-black text-[#00ff41] mb-1">
                                        +${arb.profitUsd?.toFixed(2)} {t.arb_captured.toUpperCase()}
                                    </div>
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRight size={8} /> {arb.token} @ {arb.spread}% {t.arb_spread.toUpperCase()}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-10 text-center flex flex-col items-center gap-4 grayscale opacity-50">
                                <Wallet size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.arb_waiting_executions}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t-2 border-zinc-800">
                            <div className="text-center">
                                <span className="text-[10px] font-black uppercase text-zinc-500">{t.arb_cumulative_gain}</span>
                                <div className="text-3xl font-black text-[#00ff41] mt-1">$1,429.34</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* OWNER ADMIN PANEL: ACCESS CONTROL */}
            {isOwner && (
                <div className="mt-12 bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] relative">
                    <div className="absolute top-0 right-0 bg-[#00ff41] text-black font-black text-xs px-2 py-1">
                        {t.arb_admin_only}
                    </div>
                    <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                        <Lock size={20} className="text-[#00ff41]" />
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                            {t.arb_access_control}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-widest">
                                {t.arb_authorize_desc}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t.arb_insert_addr_placeholder_admin}
                                    value={newWalletInput}
                                    onChange={(e) => setNewWalletInput(e.target.value)}
                                    className="flex-1 bg-black text-[#00ff41] font-mono text-xs border-2 border-zinc-700 p-3 focus:outline-none focus:border-[#00ff41]"
                                />
                                <button
                                    onClick={() => {
                                        if (newWalletInput.trim()) {
                                            addAuthorizedWallet(newWalletInput.trim());
                                            setNewWalletInput("");
                                        }
                                    }}
                                    className="bg-[#00ff41] text-black px-6 font-black text-xs uppercase hover:bg-white hover:text-black border-2 border-black focus:outline-none"
                                >
                                    {t.arb_authorize_btn}
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-widest">
                                {t.arb_authorized_members.replace("{val}", authorizedWallets.length.toString())}
                            </p>
                            <div className="bg-black border-2 border-zinc-800 max-h-[120px] overflow-y-auto">
                                {authorizedWallets.length > 0 ? (
                                    authorizedWallets.map((addr) => (
                                        <div key={addr} className="flex justify-between items-center p-2 border-b border-zinc-900 last:border-0 hover:bg-zinc-900">
                                            <span className="font-mono text-xs text-[#00ff41]">{addr}</span>
                                            <button
                                                onClick={() => removeAuthorizedWallet(addr)}
                                                className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase px-2 py-1 bg-red-500/10"
                                            >
                                                {t.arb_revoke}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-zinc-600 font-mono text-xs">
                                        {t.arb_no_wallets}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
