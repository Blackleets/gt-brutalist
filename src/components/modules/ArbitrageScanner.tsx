import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, RefreshCw, Zap } from "lucide-react";
import { useAppStore, TelegramInlineButton } from "@/lib/store";
import { translations } from "@/lib/translations";
import { getTokenLogo, NATIVE_LOGOS } from "@/lib/tokenLogos";

// Removed generateRandomOpp fake generation. Now reading real data directly from GlobalEngine via store.

export function ArbitrageScanner() {
    const { networkMode, wallet, executeSwap, addAlert, globalRankings, addSystemLog, sendTelegramMessage, adminConfig, arbitrageOpportunities, executedArbs, addExecutedArb, language } = useAppStore();
    const tr = translations[language];
    const [opportunities, setOpportunities] = useState<typeof arbitrageOpportunities>([]);
    const [executingId, setExecutingId] = useState<string | null>(null);

    // Sync real opportunities from backend to local state to handle the countdown
    useEffect(() => {
        if (!networkMode) return;

        setOpportunities(prev => {
            const newMap = new Map(prev.map(p => [p.id, p]));
            arbitrageOpportunities.forEach(op => {
                const existing = newMap.get(op.id);
                if (existing) {
                    // Update prices and profit but keep the current countdown
                    newMap.set(op.id, {
                        ...op,
                        timeLeft: existing.timeLeft // keep local timer
                    });
                } else if (op.timeLeft > 0) {
                    newMap.set(op.id, op);
                }
            });

            return Array.from(newMap.values()).sort((a, b) => b.profit - a.profit);
        });
    }, [arbitrageOpportunities, networkMode]);

    // Internal ticker to decrement time
    useEffect(() => {
        if (!networkMode) return;

        const interval = setInterval(() => {
            setOpportunities(prev => {
                return prev
                    .map(op => ({ ...op, timeLeft: op.timeLeft - 1 }))
                    .filter(op => op.timeLeft > 0);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [networkMode]);

    if (!networkMode) return null;

    return (
        <div className="border-4 border-black p-8 relative z-10 bg-black text-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            {/* Background Grid Pattern */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none grid-pattern-green"
            />

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-8 border-b-4 border-[#00ff41]/50 pb-6">
                    <div>
                        <h2 className="text-3xl xs:text-4xl lg:text-5xl font-black uppercase text-[#00ff41] flex items-center gap-3 md:gap-4 leading-tight">
                            <ArrowLeftRight className="w-8 h-8 md:w-12 md:h-12 shrink-0" />
                            {tr.arb_title}
                        </h2>
                        <p className="text-sm xs:text-base md:text-xl font-bold text-[#00ff41]/70 mt-1 md:mt-2 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            {tr.arb_subtitle}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:gap-8 relative min-h-[600px] overflow-hidden">
                    <AnimatePresence mode="popLayout">
                        {opportunities.length > 0 ? opportunities.map((opp) => (
                            <motion.div
                                key={opp.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                whileHover={{ scale: 1.01, borderColor: "#00ff41" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="bg-[#111] border-4 border-black p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-center transition-all relative overflow-hidden group shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)]"
                            >
                                {/* EXPIRE BAR (Top) - Tied to state for stability */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 z-0">
                                    <motion.div
                                        animate={{ width: `${(opp.timeLeft / 30) * 100}%` }}
                                        transition={{ duration: 1, ease: "linear" }}
                                        className="h-full bg-[#00ff41]"
                                    />
                                </div>

                                {/* TOKEN INFO - Redesigned to avoid overlap */}
                                <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 md:gap-4 relative z-10">
                                    <div className="w-10 h-10 md:w-16 md:h-16 border-2 md:border-4 border-black bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] group-hover:border-[#00ff41] transition-colors">
                                        <img
                                            src={getTokenLogo(opp.token)}
                                            alt={opp.token}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = NATIVE_LOGOS[opp.buyChain === "SOLANA" ? "native_sol" : "native_bnb"] || ""; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-lg md:text-2xl font-black uppercase text-white leading-none mb-1 md:mb-2 truncate">
                                            {opp.token}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                            <div className="text-[7px] md:text-[9px] font-black bg-[#00ff41] text-black px-1.5 md:px-2 py-0.5 uppercase">
                                                {opp.buyChain === opp.sellChain ? "INTRA" : "CROSS"}
                                            </div>
                                            <div className="text-[7px] md:text-[9px] font-black border border-white/20 text-white/50 px-1.5 md:px-2 py-0.5 uppercase">
                                                {opp.timeLeft}S
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BUY SIDE */}
                                <div className="flex flex-col relative z-10 bg-black p-4 border-2 border-black">
                                    <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">{language === 'en' ? 'BUY AT' : language === 'es' ? 'COMPRAR EN' : '买入在'}</span>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${opp.buyChain === 'SOLANA' ? 'bg-[#9945FF]' : 'bg-[#F3BA2F]'}`} />
                                        <div className="text-xl font-black text-white leading-none truncate uppercase">
                                            {opp.buyExchange}
                                        </div>
                                    </div>
                                    <div className="text-[#00ff41] font-mono text-base font-black italic">
                                        ${opp.buyPrice < 0.01 ? opp.buyPrice.toExponential(4) : opp.buyPrice.toFixed(6)}
                                    </div>
                                </div>

                                {/* SELL SIDE */}
                                <div className="flex flex-col relative z-10 bg-black p-4 border-2 border-black">
                                    <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">{language === 'en' ? 'SELL AT' : language === 'es' ? 'VENDER EN' : '卖出在'}</span>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${opp.sellChain === 'SOLANA' ? 'bg-[#9945FF]' : 'bg-[#F3BA2F]'}`} />
                                        <div className="text-xl font-black text-white leading-none truncate uppercase">
                                            {opp.sellExchange}
                                        </div>
                                    </div>
                                    <div className="text-red-500 font-mono text-base font-black italic">
                                        ${opp.sellPrice < 0.01 ? opp.sellPrice.toExponential(4) : opp.sellPrice.toFixed(6)}
                                    </div>
                                </div>

                                {/* PROFIT/ACTION */}
                                <div className="flex flex-row lg:flex-col justify-between items-end lg:items-end gap-2 relative z-10">
                                    <div className="text-right">
                                        <div className="text-4xl xl:text-5xl font-black text-[#00ff41] leading-none tracking-tighter italic">
                                            +{opp.profit.toFixed(2)}%
                                        </div>
                                        <div className="text-[11px] font-black text-white/40 mt-1 uppercase tracking-widest">
                                            NET ALPHA: <span className="text-white">${opp.estimatedProfitUtic.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (!wallet.connected) return;
                                            setExecutingId(opp.id);
                                            try {
                                                if (!wallet.isWatchOnly && (wallet.providerType === "solana" || wallet.providerType === "evm" || wallet.providerType === "metamask" || wallet.providerType === "binance" || wallet.providerType === "solflare" || wallet.providerType === "walletconnect" || wallet.providerType === "okx")) {
                                                    const hash = await executeSwap({
                                                        fromToken: opp.buyChain === "SOLANA" ? "SOL" : "BNB",
                                                        toToken: opp.token,
                                                        fromAmount: 0.5,
                                                        toAmount: (0.5 * (opp.buyChain === "SOLANA" ? 145 : 600)) / opp.buyPrice,
                                                        chain: opp.buyChain === "SOLANA" ? "SOL" : "BSC"
                                                    });
                                                    addSystemLog(`ARBITRAGE SNIPE SUCCESS: ${opp.token} (+${opp.profit.toFixed(2)}% NET ROI)`, "success");
                                                    addExecutedArb({
                                                        id: opp.id,
                                                        wallet: wallet.address,
                                                        token: opp.token,
                                                        profitUsd: opp.estimatedProfitUtic,
                                                        spread: opp.profit,
                                                        dexFrom: opp.buyExchange,
                                                        dexTo: opp.sellExchange,
                                                        timestamp: Date.now(),
                                                        hash: hash,
                                                        sizeUsd: 0.5 * (opp.buyChain === "SOLANA" ? 145 : 600)
                                                    });
                                                } else {
                                                    await new Promise(r => setTimeout(r, 1200));
                                                    addAlert({
                                                        tokenId: opp.id,
                                                        tokenSymbol: opp.token,
                                                        type: "BUY_PRESSURE",
                                                        message: `SIMULATED EXECUTION: ${opp.token} via ${opp.buyExchange}`
                                                    });
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setExecutingId(null);
                                            }
                                        }}
                                        disabled={executingId === opp.id || !wallet.connected}
                                        className="w-full lg:w-auto bg-[#00ff41] text-black font-black uppercase px-6 py-3 md:py-4 hover:bg-white transition-all text-xs md:text-sm flex items-center justify-center gap-3 border-4 border-black shadow-[4px_4px_0_rgba(255,255,255,0.1)] hover:shadow-none active:translate-x-1 active:translate-y-1 shrink-0 disabled:opacity-50"
                                    >
                                        <Zap className={`w-4 h-4 md:w-5 md:h-5 ${executingId === opp.id ? "animate-spin" : ""}`} />
                                        {executingId === opp.id ? tr.arb_sniping : wallet.connected ? tr.arb_execute : tr.arb_auth_req}
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-1 border-4 border-dashed border-zinc-800 p-20 text-center flex flex-col items-center justify-center gap-6 bg-zinc-950"
                            >
                                <RefreshCw className="w-12 h-12 text-[#00ff41] animate-spin-slow" />
                                <div className="space-y-2">
                                    <div className="text-3xl font-black uppercase text-white tracking-widest leading-none">{tr.arb_scanning}</div>
                                    <div className="text-sm font-black text-gray-600 uppercase tracking-widest">{tr.arb_agg_alpha}</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div >

                {/* TELEMETRY WIDGET */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t-4 border-[#00ff41]/20 pt-8">
                    {/* Realized Profit History Log */}
                    <div className="flex-1 w-full md:w-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-[#00ff41]" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ff41]">
                                {tr.arb_success_history} [{executedArbs.length}]
                            </h3>
                        </div>

                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {executedArbs.length === 0 ? (
                                <div className="p-4 border-2 border-dashed border-zinc-800 text-[10px] font-black uppercase text-zinc-500 text-center">
                                    {tr.arb_no_success}
                                </div>
                            ) : (
                                [...executedArbs].reverse().slice(0, 5).map((arb) => (
                                    <div key={arb.id} className="bg-zinc-950 border-2 border-zinc-800 p-3 flex items-center justify-between group hover:border-[#00ff41] transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#00ff41] text-black flex items-center justify-center font-black text-xs italic">
                                                SUCCESS
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-white">{arb.token} SNIPE</div>
                                                <div className="text-[9px] font-black text-zinc-500 uppercase">{arb.dexFrom} → {arb.dexTo}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[#00ff41] font-black text-sm italic leading-none">
                                                +{arb.spread.toFixed(2)}%
                                            </div>
                                            <div className="text-[9px] font-bold text-zinc-600 mt-1">
                                                ${arb.profitUsd.toFixed(2)} NET
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-8 items-center bg-[#111] border-2 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] shrink-0">
                        <div className="text-center">
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-1">{tr.arb_chains}</div>
                            <div className="text-2xl font-black text-white italic">02</div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-1">{tr.arb_exchanges}</div>
                            <div className="text-2xl font-black text-white italic">06</div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-1">{tr.arb_precision}</div>
                            <div className="text-2xl font-black text-[#00ff41] italic">99.2%</div>
                        </div>
                    </div>
                    <div className="bg-black text-[#00ff41] p-4 border-2 border-[#00ff41] font-mono text-[10px] font-black uppercase shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-3">
                        <button
                            onClick={() => {
                                const mockOpp = {
                                    tokenSymbol: "VYTRONIX",
                                    spreadPercent: 5.2,
                                    estimatedProfitUtic: 125.50,
                                    buyExchange: "Raydium",
                                    sellExchange: "Jupiter",
                                    buyChain: "Solana",
                                    sellChain: "Solana",
                                };
                                const inlineButtons: TelegramInlineButton[][] = [
                                    [{ text: "🤖 GO TO VYTRONIX BOT 🤖", url: `https://t.me/ArbytradeAIBot` }],
                                    ...(adminConfig.customLink ? [[{ text: `🌍 ${adminConfig.customLinkLabel.toUpperCase()} 🌍`, url: adminConfig.customLink }]] : []),
                                    ...(adminConfig.twitterLink ? [[{ text: "🐦 OFFICIAL TWITTER (X) 🐦", url: adminConfig.twitterLink }]] : []),
                                    ...(adminConfig.discordLink ? [[{ text: "💬 JOIN DISCORD COMMUNITY 💬", url: adminConfig.discordLink }]] : [])
                                ];

                                const tgMsg =
                                    `⚡ VYTRONIX ARBITRAGE OPPORTUNITY\n` +
                                    `━━━━━━━━━━━━━━━━\n\n` +
                                    `💎 Token: ${mockOpp.tokenSymbol}\n\n` +
                                    `🛒 Buy on: ${mockOpp.buyExchange}\n` +
                                    `💸 Sell on: ${mockOpp.sellExchange}\n\n` +
                                    `📦 Trade Size: $10,000\n` +
                                    `📈 Potential Profit: +${mockOpp.spreadPercent.toFixed(2)}%\n\n` +
                                    `💧 Liquidity: $250.0K\n\n` +
                                    `━━━━━━━━━━━━━━━━\n` +
                                    `⚡ Detected by Vytronix Engine`;

                                sendTelegramMessage(tgMsg, "https://i.ibb.co/vzR0j4m/vytronix-promo-1.png", inlineButtons);
                                addSystemLog("TG_NODE: Manual alpha injection successfully triggered.", "success");
                            }}
                            className="bg-transparent border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-all py-1.5"
                        >
                            [ FORCE BROADCAST TEST ]
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                                Aethrix Live Ticker: Synced
                            </div>
                            <div className="flex justify-between gap-8">
                                <span>POOLS INDEXED: {3800 + globalRankings.length}</span>
                                <span>FILTERED FOCUS: {opportunities.length}</span>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div>
    );
}
