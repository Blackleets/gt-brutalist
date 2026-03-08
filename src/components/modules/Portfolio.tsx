import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { FolderGit2, Trash2, Wallet, History, ArrowUpRight, ArrowDownLeft, Repeat, ExternalLink, Activity, Zap } from "lucide-react";
import { NATIVE_LOGOS } from "@/lib/tokenLogos";
import { motion } from "framer-motion";
import { translations } from "@/lib/translations";

export function Portfolio() {
    const {
        wallet,
        positionSnapshots,
        globalRankings,
        networkMode,
        removeSnapshot,
        nativePrices,
        language
    } = useAppStore();

    const t = translations[language];

    const positions = Object.values(positionSnapshots);

    // Hydrate positions with current live data
    const hydratedPositions = positions.map(pos => {
        const liveData = globalRankings.find(pool => pool.baseToken.address === pos.tokenAddress);
        let symbol = liveData?.baseToken.symbol || pos.tokenSymbol || "UNKNOWN";
        let chain = liveData?.chain || pos.tokenChain || "???";
        const logoUrl = liveData?.baseToken.logoUrl || pos.tokenLogo || NATIVE_LOGOS[pos.tokenAddress];
        let isNative = false;

        if (pos.tokenAddress.startsWith("native_")) {
            isNative = true;
            if (pos.tokenAddress === "native_sol") { symbol = "SOL"; chain = "solana"; }
            if (pos.tokenAddress === "native_usdc") { symbol = "USDC"; chain = "solana"; }
            if (pos.tokenAddress === "native_usdt") { symbol = "USDT"; chain = "solana"; }
            if (pos.tokenAddress === "native_bnb") { symbol = "BNB"; chain = "bsc"; }
            if (pos.tokenAddress === "native_eth") { symbol = "ETH"; chain = "ethereum"; }
        }

        let pnlPercentage = 0;
        let currentPrice = pos.entryPrice;

        if (liveData) {
            currentPrice = liveData.priceUsd;
            pnlPercentage = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
        } else if (isNative) {
            currentPrice = nativePrices[pos.tokenAddress] || pos.entryPrice;
            pnlPercentage = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
        }

        return {
            ...pos,
            currentPrice,
            pnlPercentage,
            symbol,
            chain,
            logoUrl,
            isLive: !!liveData || isNative
        };
    }).sort((a, b) => b.timestamp - a.timestamp);

    const deletePosition = (address: string) => {
        removeSnapshot(address);
    };

    const totalEquity = useMemo(() => {
        const nativeValue = wallet.balance * (wallet.chain === "SOL" ? nativePrices["native_sol"] : nativePrices["native_bnb"]);
        const tokensValue = wallet.tokens.reduce((acc, token) => {
            const liveData = globalRankings.find(pool => pool.baseToken.address === token.mint);
            const price = liveData?.priceUsd || nativePrices["native_" + token.symbol.toLowerCase()] || 0;
            return acc + (token.balance * price);
        }, 0);
        return nativeValue + tokensValue;
    }, [wallet.balance, wallet.chain, wallet.tokens, nativePrices, globalRankings]);

    return (
        <section className={`px-4 md:px-16 py-12 border-b-8 border-black relative z-10 transition-colors ${networkMode ? 'bg-black text-[#00ff41]' : 'bg-[#1a1a1a] text-white'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* REAL WALLET DATA (If Connected) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="flex items-center justify-between pb-4 border-b-4 border-black">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-10 h-10 text-[#00ff41]" />
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                    {t.port_title}
                                </h2>
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{t.port_subtitle}</span>
                            </div>
                        </div>
                        {wallet.connected && (
                            <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 border-2 border-[#00ff41]">
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-black text-zinc-500">{t.port_est_balance}</div>
                                    <div className="text-[#00ff41] font-mono font-black text-xl leading-none">
                                        ${totalEquity.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!wallet.connected ? (
                        <div className="p-12 border-4 border-black border-dashed bg-white/5 flex flex-col items-center justify-center text-center space-y-4">
                            <Activity className="w-12 h-12 text-zinc-700 animate-pulse" />
                            <h3 className="text-2xl font-black uppercase text-zinc-500">{t.port_awaiting}</h3>
                            <p className="max-w-xs text-xs font-bold uppercase text-zinc-600 leading-tight">
                                {t.port_connect_msg}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* TOKEN ASSETS */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b-2 border-zinc-800 pb-2">
                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={16} className="text-[#00ff41] animate-pulse" />
                                        {t.port_token_balances} [{wallet.tokens.length + 1}]
                                    </h3>
                                    <span className="text-[10px] text-zinc-500 font-mono">{t.port_live_sync_on}</span>
                                </div>
                                <div className="space-y-3">
                                    {/* Native Token */}
                                    <div className="border-4 border-black bg-white p-4 flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
                                                <Zap size={20} className="text-[#00ff41]" />
                                            </div>
                                            <div>
                                                <div className="text-black font-black uppercase leading-none">{wallet.chain}</div>
                                                <div className="text-[10px] font-bold text-zinc-400">{t.port_asset_primary}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-black font-black text-lg leading-none">{wallet.balance.toFixed(4)}</div>
                                            <div className="text-[10px] font-bold text-[#00ff41] bg-black px-1.5 inline-block mt-1">
                                                ${(wallet.balance * (wallet.chain === "SOL" ? nativePrices["native_sol"] : nativePrices["native_bnb"])).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wallet Tokens */}
                                    {wallet.tokens.map(token => {
                                        const liveData = globalRankings.find(pool => pool.baseToken.address === token.mint);
                                        const currentPrice = liveData?.priceUsd || 0;
                                        const valueUsd = token.balance * currentPrice;

                                        return (
                                            <div key={token.mint} className="border-4 border-black bg-white p-4 flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-zinc-50 transition-colors group cursor-pointer relative overflow-hidden">
                                                <div className="absolute -right-4 -top-4 text-zinc-100 group-hover:text-zinc-200 transition-colors pointer-events-none z-0">
                                                    <Zap size={64} className="opacity-20 transform -rotate-12" />
                                                </div>
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <div className="w-10 h-10 border-2 border-black bg-zinc-100 flex items-center justify-center overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                        {token.logoUrl ? <img src={token.logoUrl} alt={token.symbol} title={token.symbol} className="w-full h-full object-cover" /> : <div className="text-xs font-black">?</div>}
                                                    </div>
                                                    <div>
                                                        <div className="text-black font-black text-xl uppercase leading-none truncate max-w-[120px]">{token.symbol}</div>
                                                        <div className="text-[10px] font-bold text-zinc-400 mt-0.5">
                                                            {liveData ? (
                                                                <span className="text-[#00ff41] flex items-center gap-1 font-black">
                                                                    <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse"></span>
                                                                    {t.port_live_sync_on}
                                                                </span>
                                                            ) : t.port_asset_tertiary}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right relative z-10">
                                                    <div className="text-black font-black text-xl leading-none">{token.balance.toFixed(2)}</div>
                                                    <div className={`text-[10px] font-bold px-1 inline-block mt-1 uppercase ${liveData ? 'bg-black text-[#00ff41]' : 'text-zinc-400 bg-zinc-100'}`}>
                                                        {liveData ? `$${valueUsd.toFixed(2)}` : t.port_valuation_pending}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TRANSACTION HISTORY */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History size={16} className="text-[#00ff41]" />
                                    {t.port_recent_activity} {t.port_live_indicator}
                                </h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {wallet.history.length === 0 ? (
                                        <div className="p-8 border-4 border-black border-dashed bg-zinc-900 text-center text-[10px] font-black uppercase text-zinc-500 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                            {t.port_scanning_history}
                                        </div>
                                    ) : wallet.history.map(tx => (
                                        <div key={tx.id} className="border-4 border-black bg-zinc-900 p-3 flex items-center gap-4 group/tx hover:border-[#00ff41] transition-all relative overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/tx:animate-[shimmer_1.5s_infinite]" />
                                            <div className={`w-8 h-8 shrink-0 flex items-center justify-center border-2 border-black bg-black shadow-[2px_2px_0_rgba(0,0,0,1)] ${tx.type === 'OUT' || tx.type === 'SWAP' ? 'text-rose-500' : 'text-[#00ff41]'}`}>
                                                {tx.type === 'IN' ? <ArrowDownLeft size={16} strokeWidth={3} /> : tx.type === 'OUT' ? <ArrowUpRight size={16} strokeWidth={3} /> : <Repeat size={16} strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[11px] font-black text-white">{tx.type} {tx.tokenSymbol}</span>
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-zinc-400 truncate tracking-tighter block mr-4">{t.port_hash_prefix}{tx.hash}</span>
                                                    <a href={tx.explorerUrl} target="_blank" rel="noreferrer" title={t.port_view_explorer} className="text-[#00ff41] opacity-0 group-hover/tx:opacity-100 transition-opacity">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PAPER TRADING (SIMULATIONS) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center gap-3 pb-4 border-b-4 border-black">
                        <FolderGit2 className="w-8 h-8 text-rose-500" />
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{t.port_simulated_title}</h2>
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{t.port_simulated_subtitle}</span>
                        </div>
                    </div>

                    {hydratedPositions.length > 0 && (
                        <div className="bg-black p-4 border-4 border-black shadow-[4px_4px_0_rgba(255,255,255,0.05)]">
                            <div className="text-[10px] font-black uppercase text-zinc-500 mb-4 flex justify-between">
                                <span>{t.port_pnl_chart}</span>
                                <span className={`${hydratedPositions.reduce((acc, p) => acc + (p.pnlPercentage || 0), 0) >= 0 ? 'text-[#00ff41]' : 'text-[#ff003c]'}`}>
                                    {hydratedPositions.reduce((acc, p) => acc + (p.pnlPercentage || 0), 0).toFixed(2)}% TOTAL
                                </span>
                            </div>
                            <div className="flex h-12 w-full border-2 border-zinc-800 overflow-hidden">
                                {hydratedPositions.map((pos) => (
                                    <div
                                        key={`chart-${pos.tokenAddress}`}
                                        className={`flex-1 h-full transition-all hover:brightness-125 cursor-pointer relative group/bar ${pos.pnlPercentage >= 0 ? 'bg-profit' : 'bg-loss'} ${Math.abs(pos.pnlPercentage) > 50 ? 'opacity-100' : Math.abs(pos.pnlPercentage) > 20 ? 'opacity-70' : 'opacity-40'}`}
                                        title={`${pos.symbol}: ${pos.pnlPercentage.toFixed(2)}%`}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 bg-black/60 pointer-events-none">
                                            <span className="text-[8px] font-black text-white">{pos.symbol}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hydratedPositions.length === 0 ? (
                        <div className="p-8 border-4 border-black border-dashed bg-white/5 text-center text-xs font-black uppercase text-zinc-600">
                            {t.port_no_simulations}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {hydratedPositions.map(pos => {
                                const isProfitable = pos.pnlPercentage >= 0;
                                return (
                                    <motion.div
                                        layout
                                        key={pos.tokenAddress}
                                        className="border-4 border-black p-4 bg-white text-black shadow-[6px_6px_0_rgba(0,0,0,1)] relative group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-black bg-zinc-100 flex items-center justify-center overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                                    {pos.logoUrl ? <img src={pos.logoUrl} alt={pos.symbol} title={pos.symbol} className="w-full h-full object-cover" /> : <FolderGit2 size={14} className="text-zinc-300" />}
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg tracking-tighter leading-none mb-0.5">{pos.symbol}</div>
                                                    <div className="text-[8px] font-bold uppercase bg-black text-white px-1.5 py-0.5 inline-block">{pos.chain}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deletePosition(pos.tokenAddress)}
                                                title={t.port_close_simulation_title}
                                                className="text-black hover:text-red-500 opacity-20 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
                                            <div>
                                                <span className="text-gray-400 block font-black uppercase">{t.port_entry}</span>
                                                <span className="font-mono font-bold">${pos.entryPrice.toFixed(6)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-400 block font-black uppercase">{t.port_current}</span>
                                                <span className="font-mono font-bold">${pos.currentPrice.toFixed(6)}</span>
                                            </div>
                                        </div>

                                        <div className={`p-2 border-2 border-black flex items-center justify-between ${isProfitable ? 'bg-[#00ff41]' : 'bg-[#ff003c] text-white'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.port_pnl}</span>
                                            <span className="font-black text-xl">
                                                {isProfitable ? '+' : ''}{pos.pnlPercentage.toFixed(2)}%
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
