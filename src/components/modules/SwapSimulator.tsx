import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Zap, Shield, AlertTriangle, Check, Loader2, ChevronDown, Search, ExternalLink, Copy, CheckCircle2, X, Activity } from "lucide-react";
import { fetchTokenByAddress, AethrixPool } from "@/lib/aethrix";
import { TOKEN_LOGOS, getTokenLogo } from "@/lib/tokenLogos";
import { formatCurrency } from "@/lib/utils";

interface SwapToken {
    symbol: string;
    address: string;
    priceUsd: number;
    liquidityUsd: number;
    chain: string;
    logoUrl?: string;
    riskScore?: number;
    buyRatio?: number;
    totalTx?: number;
}

type SwapState = "idle" | "quoting" | "confirming" | "executing" | "success" | "error";

export function SwapSimulator() {
    const { globalRankings, wallet, selectedChain, recordSnapshot, addAlert, nativePrices, executeSwap, addSystemLog, prefilledSwap, setPrefilledSwap, adminConfig, language } = useAppStore();
    const t = translations[language];

    // Contract address lookup state
    const [contractSearch, setContractSearch] = useState("");
    const [searchingContract, setSearchingContract] = useState(false);
    const [contractResult, setContractResult] = useState<AethrixPool | null>(null);
    const [contractError, setContractError] = useState("");
    const [copiedAddress, setCopiedAddress] = useState(false);

    // Build token list from global rankings + native tokens + more defaults
    const availableTokens: SwapToken[] = useMemo(() => {
        const nativeTokens: SwapToken[] = [
            { symbol: "SOL", address: "native_sol", priceUsd: nativePrices["native_sol"] || 145.0, liquidityUsd: 999999999, chain: "solana", logoUrl: TOKEN_LOGOS.SOL },
            { symbol: "USDC", address: "native_usdc", priceUsd: nativePrices["native_usdc"] || 1.0, liquidityUsd: 999999999, chain: "solana", logoUrl: TOKEN_LOGOS.USDC },
            { symbol: "USDT", address: "native_usdt", priceUsd: nativePrices["native_usdt"] || 1.0, liquidityUsd: 999999999, chain: "solana", logoUrl: TOKEN_LOGOS.USDT },
            { symbol: "BNB", address: "native_bnb", priceUsd: nativePrices["native_bnb"] || 600.0, liquidityUsd: 999999999, chain: "bsc", logoUrl: TOKEN_LOGOS.BNB },
            { symbol: "ETH", address: "native_eth", priceUsd: nativePrices["native_eth"] || 3100.0, liquidityUsd: 999999999, chain: "ethereum", logoUrl: TOKEN_LOGOS.ETH },
            { symbol: "WBTC", address: "native_wbtc", priceUsd: nativePrices["native_btc"] || 97000.0, liquidityUsd: 999999999, chain: "ethereum", logoUrl: TOKEN_LOGOS.WBTC },
            { symbol: "DOGE", address: "native_doge", priceUsd: 0.32, liquidityUsd: 500000000, chain: "bsc", logoUrl: TOKEN_LOGOS.DOGE },
            { symbol: "PEPE", address: "native_pepe", priceUsd: 0.0000125, liquidityUsd: 200000000, chain: "ethereum", logoUrl: TOKEN_LOGOS.PEPE },
            { symbol: "SHIB", address: "native_shib", priceUsd: 0.0000225, liquidityUsd: 300000000, chain: "ethereum", logoUrl: TOKEN_LOGOS.SHIB },
            { symbol: "LINK", address: "native_link", priceUsd: 18.50, liquidityUsd: 800000000, chain: "ethereum", logoUrl: TOKEN_LOGOS.LINK },
            { symbol: "JUP", address: "native_jup", priceUsd: 0.94, liquidityUsd: 200000000, chain: "solana", logoUrl: TOKEN_LOGOS.JUP },
            { symbol: "BONK", address: "native_bonk", priceUsd: 0.000025, liquidityUsd: 100000000, chain: "solana", logoUrl: TOKEN_LOGOS.BONK },
            { symbol: "WIF", address: "native_wif", priceUsd: 1.85, liquidityUsd: 150000000, chain: "solana", logoUrl: TOKEN_LOGOS.WIF },
            { symbol: "RAY", address: "native_ray", priceUsd: 4.20, liquidityUsd: 80000000, chain: "solana", logoUrl: TOKEN_LOGOS.RAY },
            { symbol: "CAKE", address: "native_cake", priceUsd: 2.84, liquidityUsd: 80000000, chain: "bsc", logoUrl: TOKEN_LOGOS.CAKE },
        ];

        const poolTokens: SwapToken[] = globalRankings
            .filter(p => p.chain === selectedChain)
            .slice(0, 30)
            .map(p => ({
                symbol: p.baseToken.symbol,
                address: p.baseToken.address,
                priceUsd: p.priceUsd,
                liquidityUsd: p.liquidityUsd,
                chain: p.chain,
                logoUrl: getTokenLogo(p.baseToken.symbol, p.baseToken.logoUrl),
                riskScore: p.riskScore,
                buyRatio: (p.txns5m.buys + p.txns5m.sells) > 0 ? p.txns5m.buys / (p.txns5m.buys + p.txns5m.sells) : 0.5,
                totalTx: p.txns5m.buys + p.txns5m.sells
            }));

        // If contract result exists, add it to the list
        if (contractResult) {
            const exists = [...nativeTokens, ...poolTokens].some(t => t.address === contractResult.baseToken.address);
            if (!exists) {
                poolTokens.unshift({
                    symbol: contractResult.baseToken.symbol,
                    address: contractResult.baseToken.address,
                    priceUsd: contractResult.priceUsd,
                    liquidityUsd: contractResult.liquidityUsd,
                    chain: contractResult.chain,
                    logoUrl: getTokenLogo(contractResult.baseToken.symbol, contractResult.baseToken.logoUrl),
                    riskScore: contractResult.riskScore,
                    buyRatio: (contractResult.txns5m.buys + contractResult.txns5m.sells) > 0 ? contractResult.txns5m.buys / (contractResult.txns5m.buys + contractResult.txns5m.sells) : 0.5,
                    totalTx: contractResult.txns5m.buys + contractResult.txns5m.sells
                });
            }
        }

        return [...nativeTokens, ...poolTokens];
    }, [globalRankings, selectedChain, nativePrices, contractResult]);

    const [tokenFrom, setTokenFrom] = useState<SwapToken | null>(null);
    const [tokenTo, setTokenTo] = useState<SwapToken | null>(null);
    const [amountIn, setAmountIn] = useState("");
    const [slippage, setSlippage] = useState(0.5);
    const [swapState, setSwapState] = useState<SwapState>("idle");
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [isFlipping, setIsFlipping] = useState(false);

    // Handle prefilled swap from arbitrage alerts
    useEffect(() => {
        if (prefilledSwap && availableTokens.length > 0) {
            const from = availableTokens.find(t => t.symbol === prefilledSwap.fromSymbol);
            const to = availableTokens.find(t => t.symbol === prefilledSwap.toSymbol);

            if (from) setTokenFrom(from);
            if (to) setTokenTo(to);
            if (prefilledSwap.amount) setAmountIn(prefilledSwap.amount.toString());

            // Clear the prefill so it doesn't trigger again on every render
            setPrefilledSwap(null);

            addSystemLog(`SWAP PRE-CONFIGURED: ${prefilledSwap.fromSymbol} -> ${prefilledSwap.toSymbol}`, "info");
        }
    }, [prefilledSwap, availableTokens, setPrefilledSwap, addSystemLog]);

    // Auto-select defaults (modified to check if we already have tokens)
    useEffect(() => {
        if (availableTokens.length >= 2 && !tokenFrom && !prefilledSwap) {
            const timer = setTimeout(() => {
                const usdcToken = availableTokens.find(t => t.symbol === "USDC" || t.symbol === "USDT");
                const firstNonStable = availableTokens.find(t => !["USDC", "USDT"].includes(t.symbol));
                setTokenFrom(usdcToken || availableTokens[0]);
                setTokenTo(firstNonStable || availableTokens[1]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [availableTokens, tokenFrom, prefilledSwap]);

    // Contract address lookup
    const handleContractSearch = async () => {
        const query = contractSearch.trim();
        if (!query || query.length < 20) {
            setContractError("Enter a valid contract address (Solana or BSC)");
            return;
        }

        setSearchingContract(true);
        setContractError("");
        setContractResult(null);

        try {
            const result = await fetchTokenByAddress(query);
            if (result) {
                // Check if it's the official VYTRONIX contract
                const isOfficial =
                    (adminConfig.officialSolanaContract && query.toLowerCase() === adminConfig.officialSolanaContract.toLowerCase()) ||
                    (adminConfig.officialBscContract && query.toLowerCase() === adminConfig.officialBscContract.toLowerCase());

                if (isOfficial) {
                    addSystemLog(`🎯 OFFICIAL TOKEN IDENTIFIED: Welcome to the Vytronix Core.`, "success");
                    // We can add a custom flag to the result if needed or just handle it in UI
                }

                setContractResult(result);
                addSystemLog(`CONTRACT SCOUT: DISCOVERED ${result.baseToken.symbol} | LIQUIDITY: $${result.liquidityUsd.toLocaleString()}`, "success");
                setContractError("");
            } else {
                setContractError(language === 'en' ? "Token not found. Verify the contract address." : language === 'es' ? "Token no encontrado. Verifique la dirección del contrato." : "未找到代币。请验证合约地址。");
            }
        } catch {
            setContractError(language === 'en' ? "Failed to fetch token data. Try again." : language === 'es' ? "Error al obtener datos del token. Intente de nuevo." : "获取代币数据失败。请重试。");
        } finally {
            setSearchingContract(false);
        }
    };

    // Trigger search on Enter key
    const handleContractKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleContractSearch();
    };

    // Copy address helper
    const handleCopyAddress = (addr: string) => {
        navigator.clipboard.writeText(addr);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    // Calculate output
    const { amountOut, priceImpact, routeInfo, minReceived } = useMemo(() => {
        if (!tokenFrom || !tokenTo || !amountIn || parseFloat(amountIn) <= 0) {
            return { amountOut: 0, priceImpact: 0, routeInfo: "—", minReceived: 0 };
        }

        const inputUsd = parseFloat(amountIn) * tokenFrom.priceUsd;
        const rawOutput = inputUsd / tokenTo.priceUsd;

        const minLiq = Math.min(tokenFrom.liquidityUsd, tokenTo.liquidityUsd);
        const impact = Math.min(15, (inputUsd / Math.max(1, minLiq)) * 100);

        const outputAfterImpact = rawOutput * (1 - impact / 100);
        const minRecv = outputAfterImpact * (1 - slippage / 100);

        let route = `${tokenFrom.symbol} → ${tokenTo.symbol}`;
        if (impact > 2) {
            route = `${tokenFrom.symbol} → USDC → ${tokenTo.symbol} (split route)`;
        }

        return {
            amountOut: outputAfterImpact,
            priceImpact: impact,
            routeInfo: route,
            minReceived: minRecv,
        };
    }, [tokenFrom, tokenTo, amountIn, slippage]);

    const flipTokens = () => {
        setIsFlipping(true);
        setTimeout(() => {
            const temp = tokenFrom;
            setTokenFrom(tokenTo);
            setTokenTo(temp);
            setAmountIn("");
            setIsFlipping(false);
        }, 250);
    };

    const handleSwap = async () => {
        if (!wallet.connected) return;
        if (!tokenFrom || !tokenTo || !amountIn || parseFloat(amountIn) <= 0) return;

        // Tactical Sound Effect for Swap Initialization
        try {
            const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) { void e; }

        setSwapState("quoting");
        // Simulated quote fetching
        await new Promise(r => setTimeout(r, 800));

        try {
            if (!wallet.isWatchOnly && (wallet.providerType === "solana" || wallet.providerType === "evm")) {
                // REAL SWAP MODE
                setSwapState("confirming");

                const hash = await executeSwap({
                    fromToken: tokenFrom.symbol,
                    toToken: tokenTo.symbol,
                    fromAmount: parseFloat(amountIn),
                    toAmount: amountOut,
                    chain: tokenFrom.chain === "solana" ? "SOL" : "BSC"
                });

                setTxHash(hash);
                addSystemLog(`SWAP SUCCESS (REAL): ${tokenFrom?.symbol} -> ${tokenTo?.symbol}`, "success");
                setSwapState("success");

                addAlert({
                    tokenId: tokenTo.address,
                    tokenSymbol: tokenTo.symbol,
                    type: "BUY_PRESSURE",
                    message: `REAL SWAP: ${amountIn} ${tokenFrom.symbol} → ${amountOut.toFixed(4)} ${tokenTo.symbol}`
                });
            } else {
                // PAPER TRADING MODE
                setSwapState("confirming");
                await new Promise(r => setTimeout(r, 600));

                setSwapState("executing");
                await new Promise(r => setTimeout(r, 1200));

                // Hash generated by generic paper trading execute endpoint
                const hash = `0xPAPER_TRADING_MOCK_TX_${Date.now().toString(16).toUpperCase()}_${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
                setTxHash(hash);
                addSystemLog(`SWAP SUCCESS (PAPER): ${tokenFrom?.symbol} -> ${tokenTo?.symbol} | SIMULATOR_CONFIRM`, "success");
                setSwapState("success");

                recordSnapshot(tokenTo.address, tokenTo.priceUsd, tokenTo.symbol, tokenTo.chain, tokenTo.logoUrl);
                addAlert({
                    tokenId: tokenTo.address,
                    tokenSymbol: tokenTo.symbol,
                    type: "SCORE_SURGE",
                    message: `PAPER SWAP: Acquired ${tokenTo.symbol}`
                });
            }
        } catch (err) {
            console.error("Swap execution failed:", err);
            setSwapState("error");
            addAlert({
                tokenId: "error",
                tokenSymbol: "ERR",
                type: "MOMENTUM_SPIKE",
                message: "SWAP FAILED: Check wallet signature"
            });
        }

        setTimeout(() => {
            if (swapState !== "error") {
                setSwapState("idle");
                setTxHash("");
                setAmountIn("");
            }
        }, 6000);
    };

    const getSwapButtonText = () => {
        switch (swapState) {
            case "quoting": return t.swap_fetching_quote;
            case "confirming": return t.swap_confirm_wallet;
            case "executing": return t.swap_executing;
            case "success": return t.swap_confirmed;
            case "error": return t.swap_failed;
            default: {
                if (!wallet.connected) return t.swap_connect_wallet;
                if (!amountIn || parseFloat(amountIn) <= 0) return t.swap_enter_amount;
                if (priceImpact > 10) return t.swap_high_impact;
                return t.swap_button;
            }
        }
    };

    const getSwapButtonColor = () => {
        if (swapState === "success") return "bg-[#00ff41] text-black border-[#00ff41]";
        if (swapState === "error") return "bg-red-500 text-white border-red-500";
        if (swapState !== "idle") return "bg-yellow-400 text-black border-yellow-400";
        if (!wallet.connected || !amountIn) return "bg-gray-300 text-gray-500 border-gray-300";
        if (priceImpact > 10) return "bg-red-500 text-white border-red-500 hover:bg-red-600";
        return "bg-black text-white border-black hover:bg-[#00ff41] hover:text-black";
    };

    return (
        <section id="swap-simulator-terminal" className="px-4 md:px-16 py-12 md:py-24 relative z-10 w-full overflow-hidden bg-zinc-50 border-b-8 border-black">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3 md:gap-4">
                <ArrowDownUp className="w-8 h-8 md:w-14 md:h-14" />
                {t.swap_execution}
            </h2>
            <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 md:mb-10">
                {wallet.connected && !wallet.isWatchOnly
                    ? t.swap_mainnet_mode
                    : t.swap_paper_mode}
            </p>

            {/* CONTRACT ADDRESS LOOKUP */}
            <div className="max-w-2xl mx-auto mb-8">
                <div className="border-4 border-black bg-black p-4 md:p-6 shadow-[8px_8px_0_rgba(150,150,150,1)] transition-transform hover:-translate-y-1 hover:-translate-x-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Search className="w-5 h-5 text-white" />
                        <span className="text-sm font-black uppercase tracking-widest text-white">
                            {t.swap_paste_address}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={contractSearch}
                            onChange={(e) => setContractSearch(e.target.value)}
                            onKeyDown={handleContractKeyDown}
                            placeholder={t.swap_paste_placeholder}
                            className="flex-1 bg-white border-2 border-transparent text-black px-4 py-4 font-mono text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#00ff41] min-w-0 font-bold"
                            title={t.swap_paste_address}
                        />
                        <button
                            onClick={handleContractSearch}
                            disabled={searchingContract}
                            className="bg-[#00ff41] text-black px-6 py-4 font-black uppercase text-xs md:text-sm hover:bg-white transition-colors border-2 border-[#00ff41] hover:border-white disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                            title={t.market_scan}
                        >
                            {searchingContract ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                            {t.market_scan}
                        </button>
                    </div>
                    {contractError && (
                        <div className="mt-2 text-red-400 text-[10px] font-bold uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {contractError}
                        </div>
                    )}
                </div>

                {/* CONTRACT RESULT CARD */}
                <AnimatePresence>
                    {contractResult && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="border-4 border-t-0 border-black bg-zinc-950 p-6 relative group/contract">
                                <button
                                    onClick={() => {
                                        setContractResult(null);
                                        setContractSearch("");
                                        setContractError("");
                                    }}
                                    className="absolute top-4 right-4 text-white hover:text-black hover:bg-[#00ff41] transition-all bg-black border-2 border-[#00ff41] p-2 shadow-[4px_4px_0_rgba(0,136,204,1)] z-30 flex items-center gap-2 font-black text-[10px]"
                                    title={t.swap_close}
                                >
                                    <X size={18} strokeWidth={3} /> {t.swap_close}
                                </button>

                                {/* Token Header - Redesigned to avoid overlap */}
                                {((adminConfig.officialSolanaContract && contractResult.baseToken.address.toLowerCase() === adminConfig.officialSolanaContract.toLowerCase()) ||
                                    (adminConfig.officialBscContract && contractResult.baseToken.address.toLowerCase() === adminConfig.officialBscContract.toLowerCase())) && (
                                        <div className="mb-4 bg-[#00ff41] text-black p-3 border-2 border-[#00ff41] flex items-center gap-3 shadow-[4px_4px_0_rgba(0,255,65,0.4)] md:absolute top-4 left-4 z-40 w-fit">
                                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                                            <span className="text-[10px] font-black uppercase italic">{t.swap_official_badge}</span>
                                        </div>
                                    )}
                                <div className="flex flex-col items-start gap-4 mb-6 mt-8 md:mt-2">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-[#00ff41] bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-[6px_6px_0_rgba(0,0,0,1)]">
                                            {getTokenLogo(contractResult.baseToken.symbol, contractResult.baseToken.logoUrl) ? (
                                                <img
                                                    src={getTokenLogo(contractResult.baseToken.symbol, contractResult.baseToken.logoUrl)}
                                                    alt={contractResult.baseToken.symbol}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <span className="font-black text-[#00ff41] text-3xl">{contractResult.baseToken.symbol.substring(0, 2)}</span>
                                            )}
                                        </div>
                                        {/* Label moved below or positioned cleanly */}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[#00ff41] font-black text-3xl uppercase leading-none tracking-tighter mb-1 select-none">
                                            {contractResult.baseToken.symbol}_{language === 'zh' ? '节点' : 'NODE'}
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Activity size={10} className="text-[#00ff41]" />
                                            {contractResult.chain.toUpperCase()} · {contractResult.dex} ACTIVE_PIPELINE
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 border-2 text-[10px] font-black uppercase ${contractResult.zone === "PRIME" ? "text-[#00ff41] border-[#00ff41]" :
                                    contractResult.zone === "VOLATILE" ? "text-yellow-400 border-yellow-400" :
                                        contractResult.zone === "DANGER" ? "text-red-500 border-red-500" :
                                            "text-blue-400 border-blue-400"
                                    }`}>
                                    {contractResult.zone}
                                </div>

                                {/* Price + Score */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-zinc-900 border border-zinc-800 p-3">
                                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{t.swap_price_usd}</div>
                                        <div className="text-white font-black text-lg font-mono">
                                            ${contractResult.priceUsd < 0.0001 ? contractResult.priceUsd.toExponential(2) : contractResult.priceUsd.toFixed(6)}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-3">
                                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{t.market_score}</div>
                                        <div className={`font-black text-lg ${contractResult.score > 70 ? 'text-[#00ff41]' : contractResult.score > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {contractResult.score}/100
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Metrics */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="border-l-2 border-[#00ff41]/30 pl-2">
                                        <div className="text-[8px] font-black text-gray-500 uppercase">{t.market_liquidity}</div>
                                        <div className="text-white font-mono font-bold text-sm">{formatCurrency(contractResult.liquidityUsd)}</div>
                                    </div>
                                    <div className="border-l-2 border-[#00ff41]/30 pl-2">
                                        <div className="text-[8px] font-black text-gray-500 uppercase">{t.market_24h_vol}</div>
                                        <div className="text-white font-mono font-bold text-sm">{formatCurrency(contractResult.volume24hUsd)}</div>
                                    </div>
                                    <div className="border-l-2 border-[#00ff41]/30 pl-2">
                                        <div className="text-[8px] font-black text-gray-500 uppercase">{t.market_5m_mom}</div>
                                        <div className={`font-mono font-bold text-sm ${contractResult.priceChange5m >= 0 ? 'text-[#00ff41]' : 'text-red-400'}`}>
                                            {contractResult.priceChange5m >= 0 ? '+' : ''}{contractResult.priceChange5m.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* TX Activity + Risk */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-zinc-900 border border-zinc-800 p-2">
                                        <div className="text-[8px] font-black text-gray-500 uppercase">5m TXs</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[#00ff41] font-black text-xs">▲ {contractResult.txns5m.buys} buys</span>
                                            <span className="text-red-400 font-black text-xs">▼ {contractResult.txns5m.sells} sells</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-2">
                                        <div className="text-[8px] font-black text-gray-500 uppercase">Risk Score</div>
                                        <div className={`font-black text-lg ${contractResult.riskScore < 30 ? 'text-[#00ff41]' : contractResult.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {contractResult.riskScore}/100
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Address */}
                                <div className="bg-zinc-900 border border-zinc-800 p-3 mb-4">
                                    <div className="text-[8px] font-black text-gray-500 uppercase mb-1">Contract Address</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#00ff41] font-mono text-[10px] break-all flex-1">{contractResult.baseToken.address}</span>
                                        <button
                                            onClick={() => handleCopyAddress(contractResult.baseToken.address)}
                                            className="text-gray-400 hover:text-[#00ff41] transition-colors shrink-0"
                                            title="Copy address"
                                        >
                                            {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-[#00ff41]" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="text-[8px] font-bold text-gray-600 mt-1">
                                        Pair: {contractResult.pairAddress.slice(0, 10)}...{contractResult.pairAddress.slice(-6)}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const token: SwapToken = {
                                                symbol: contractResult.baseToken.symbol,
                                                address: contractResult.baseToken.address,
                                                priceUsd: contractResult.priceUsd,
                                                liquidityUsd: contractResult.liquidityUsd,
                                                chain: contractResult.chain,
                                                logoUrl: getTokenLogo(contractResult.baseToken.symbol, contractResult.baseToken.logoUrl),
                                                riskScore: contractResult.riskScore,
                                                buyRatio: (contractResult.txns5m.buys + contractResult.txns5m.sells) > 0 ? contractResult.txns5m.buys / (contractResult.txns5m.buys + contractResult.txns5m.sells) : 0.5,
                                                totalTx: contractResult.txns5m.buys + contractResult.txns5m.sells
                                            };
                                            setTokenTo(token);
                                        }}
                                        className="flex-1 bg-[#00ff41] text-black py-3 font-black uppercase text-[10px] hover:bg-white transition-colors border-2 border-[#00ff41] flex items-center justify-center gap-2"
                                    >
                                        <ArrowDownUp className="w-3 h-3" /> {t.swap_use_in_swap}
                                    </button>
                                    <a
                                        href={`https://dexscreener.com/${contractResult.chain}/${contractResult.pairAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-zinc-800 text-white px-4 py-3 font-black uppercase text-[10px] hover:bg-white hover:text-black transition-colors border-2 border-zinc-700 flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-3 h-3" /> DEX
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card className="rounded-none border-4 border-black bg-white shadow-[12px_12px_0_rgba(0,0,0,1)] transition-all">
                    <CardContent className="p-0 overflow-hidden">
                        {/* FROM */}
                        <motion.div
                            animate={{ opacity: isFlipping ? 0 : 1, y: isFlipping ? 30 : 0, scale: isFlipping ? 0.95 : 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            className="p-4 md:p-8 border-b-4 border-black relative bg-[#f4f4f4]"
                        >
                            <div className="flex justify-between items-center mb-2 md:mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.swap_from}</span>
                                <span className="text-[10px] font-bold text-gray-400">
                                    {tokenFrom ? `≈ $${(parseFloat(amountIn || "0") * tokenFrom.priceUsd).toFixed(2)}` : ""}
                                </span>
                            </div>
                            <div className="flex gap-2 md:gap-3 items-center">
                                <input
                                    type="number"
                                    value={amountIn}
                                    onChange={(e) => setAmountIn(e.target.value)}
                                    placeholder="0.00"
                                    className="flex-1 text-2xl md:text-4xl font-black bg-transparent outline-none placeholder:text-gray-300 min-w-0"
                                    title="Amount to swap from"
                                />
                                <div className="static md:relative shrink-0">
                                    <button
                                        onClick={() => { setShowFromPicker(!showFromPicker); setShowToPicker(false); }}
                                        className="flex items-center gap-2 bg-black text-white px-4 md:px-6 py-3 md:py-4 font-black uppercase text-xs md:text-base hover:bg-[#00ff41] hover:text-black transition-colors border-4 border-black whitespace-nowrap shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 hover:translate-x-0.5"
                                        title="Select token to swap from"
                                    >
                                        {tokenFrom?.logoUrl && (
                                            <img src={tokenFrom.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        )}
                                        {tokenFrom?.symbol || "SELECT"}
                                        <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                    <TokenPickerComponent
                                        show={showFromPicker}
                                        onClose={() => setShowFromPicker(false)}
                                        onSelect={setTokenFrom}
                                        exclude={tokenTo?.address}
                                        availableTokens={availableTokens}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* FLIP BUTTON */}
                        <div className="relative h-0 z-20 flex justify-center">
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 180 }}
                                whileTap={{ scale: 0.9, rotate: -180 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={flipTokens}
                                disabled={isFlipping}
                                className="absolute -translate-y-1/2 bg-black text-white p-3 md:p-4 border-4 border-white focus:outline-none hover:bg-[#00ff41] hover:text-black shadow-[0_0_0_4px_black] z-30"
                                title={t.swap_flip_order}
                            >
                                <ArrowDownUp className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isFlipping ? 'scale-75' : 'scale-100'}`} />
                            </motion.button>
                        </div>

                        {/* TO */}
                        <motion.div
                            animate={{ opacity: isFlipping ? 0 : 1, y: isFlipping ? -30 : 0, scale: isFlipping ? 0.95 : 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            className="p-4 md:p-8 border-b-4 border-black bg-white relative"
                        >
                            <div className="flex justify-between items-center mb-2 md:mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.swap_to}</span>
                                <span className="text-[10px] font-bold text-gray-400">
                                    {tokenTo ? `≈ $${(amountOut * tokenTo.priceUsd).toFixed(2)}` : ""}
                                </span>
                            </div>
                            <div className="flex gap-2 md:gap-3 items-center">
                                <div className="flex-1 text-2xl md:text-4xl font-black text-gray-800 min-w-0 truncate">
                                    {amountOut > 0
                                        ? (amountOut < 0.000001 ? amountOut.toExponential(4) : amountOut.toLocaleString(undefined, { maximumFractionDigits: 8 }))
                                        : "0.00"
                                    }
                                </div>
                                <div className="static md:relative shrink-0">
                                    <button
                                        onClick={() => { setShowToPicker(!showToPicker); setShowFromPicker(false); }}
                                        className="flex items-center gap-2 bg-gray-200 text-black px-4 md:px-6 py-3 md:py-4 font-black uppercase text-xs md:text-base hover:bg-black hover:text-white transition-colors border-4 border-black whitespace-nowrap shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5"
                                        title="Select token to swap to"
                                    >
                                        {tokenTo?.logoUrl && (
                                            <img src={tokenTo.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        )}
                                        {tokenTo?.symbol || "SELECT"}
                                        <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                    <TokenPickerComponent
                                        show={showToPicker}
                                        onClose={() => setShowToPicker(false)}
                                        onSelect={setTokenTo}
                                        exclude={tokenFrom?.address}
                                        availableTokens={availableTokens}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* SWAP DETAILS */}
                        {amountIn && parseFloat(amountIn) > 0 && tokenFrom && tokenTo && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="border-b-4 border-black overflow-hidden"
                            >
                                <div className="p-6 space-y-3">
                                    <div className="flex justify-between text-xs font-bold uppercase">
                                        <span className="text-gray-400">{t.swap_rate}</span>
                                        <span>1 {tokenFrom.symbol} = {(tokenFrom.priceUsd / tokenTo.priceUsd).toFixed(tokenTo.priceUsd < 0.01 ? 4 : 6)} {tokenTo.symbol}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase">
                                        <span className="text-gray-400">{t.swap_price_impact}</span>
                                        <span className={priceImpact > 5 ? "text-red-500" : priceImpact > 2 ? "text-yellow-500" : "text-[#00ff41]"}>
                                            {priceImpact > 5 && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                                            {priceImpact.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase">
                                        <span className="text-gray-400">{t.swap_route}</span>
                                        <span className="text-right max-w-[200px] truncate">{routeInfo}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase">
                                        <span className="text-gray-400">{t.swap_min_received}</span>
                                        <span>{minReceived < 0.01 ? minReceived.toFixed(8) : minReceived.toFixed(6)} {tokenTo.symbol}</span>
                                    </div>

                                    {/* Slippage */}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-[10px] font-black uppercase text-gray-400">{t.swap_slippage}</span>
                                        <div className="flex gap-1">
                                            {[0.1, 0.5, 1.0, 3.0].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSlippage(s)}
                                                    className={`px-2 py-1 text-[10px] font-black border-2 transition-colors ${slippage === s ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                                                    title={`Set slippage to ${s}%`}
                                                >
                                                    {s}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <RiskShield token={tokenTo} priceImpact={priceImpact} />
                            </motion.div>
                        )}

                        {/* SWAP BUTTON */}
                        <div className="p-4 md:p-8 bg-zinc-100">
                            <button
                                onClick={handleSwap}
                                disabled={!wallet.connected || swapState !== "idle" || !amountIn || parseFloat(amountIn) <= 0}
                                className={`w-full py-6 font-black uppercase text-xl md:text-2xl tracking-widest border-4 transition-all flex items-center justify-center gap-4 ${getSwapButtonColor()} disabled:cursor-not-allowed shadow-[6px_6px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[6px] active:translate-y-[6px]`}
                                title={getSwapButtonText()}
                            >
                                {swapState === "quoting" || swapState === "executing" ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : swapState === "success" ? (
                                    <Check className="w-5 h-5" />
                                ) : swapState === "confirming" ? (
                                    <Shield className="w-5 h-5" />
                                ) : (
                                    <Zap className="w-5 h-5" />
                                )}
                                {getSwapButtonText()}
                            </button>

                            <div className="mt-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <Shield className="w-3 h-3" />
                                {wallet.connected && !wallet.isWatchOnly
                                    ? t.swap_secure_session
                                    : t.swap_paper_session}
                            </div>

                            <AnimatePresence>
                                {txHash && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 bg-black text-white p-3 font-mono text-[10px] break-all border-2 border-[#00ff41]"
                                    >
                                        <span className="text-[#00ff41] font-black">TX:</span> {txHash}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section >
    );
}

const TokenPickerComponent = ({
    show,
    onClose,
    onSelect,
    exclude,
    availableTokens,
}: {
    show: boolean;
    onClose: () => void;
    onSelect: (t: SwapToken) => void;
    exclude?: string;
    availableTokens: SwapToken[];
}) => {
    const { language } = useAppStore();
    const t = translations[language];
    const [search, setSearch] = useState("");

    const filtered = availableTokens
        .filter(t => t.address !== exclude)
        .filter(t => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return t.symbol.toLowerCase().includes(q) || t.address.toLowerCase().includes(q) || t.chain.toLowerCase().includes(q);
        });

    return (
        <AnimatePresence>
            {show && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
                        title="Close token selection"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed md:absolute top-1/2 md:top-full left-1/2 md:left-auto right-auto md:right-0 -translate-x-1/2 md:translate-x-0 -translate-y-1/2 md:translate-y-0 z-[101] md:z-50 bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] w-[90vw] md:w-72 max-h-[70vh] md:max-h-[400px] overflow-hidden mt-0 md:mt-2 flex flex-col"
                    >
                        {/* Header with search */}
                        <div className="p-3 border-b-2 border-black bg-black sticky top-0 z-10">
                            <div className="flex justify-between items-center mb-2 md:hidden">
                                <span className="font-black uppercase text-xs text-white">{t.swap_select_token}</span>
                                <button onClick={onClose} className="text-[#00ff41] font-black text-lg" title="Close">[{language === 'en' ? 'X' : language === 'es' ? 'X' : '关'}]</button>
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.swap_search_placeholder}
                                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#00ff41]"
                            />
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {filtered.map((token) => (
                                <button
                                    key={token.address}
                                    onClick={() => { onSelect(token); onClose(); setSearch(""); }}
                                    className="w-full text-left px-4 py-3 hover:bg-[#00ff41]/10 border-b border-gray-100 flex justify-between items-center transition-colors group"
                                    title={`Select ${token.symbol}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 md:w-9 md:h-9 border-2 border-black bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 rounded-full">
                                            {token.logoUrl ? (
                                                <img
                                                    src={token.logoUrl}
                                                    alt={token.symbol}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <span className="font-black text-xs md:text-sm text-gray-500">{token.symbol.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-black text-xs md:text-sm uppercase group-hover:text-[#00ff41] transition-colors block">{token.symbol}</span>
                                            <span className="text-[8px] md:text-[9px] text-gray-400 font-mono uppercase">{token.chain}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] md:text-xs font-mono font-bold text-black bg-zinc-100 px-2 py-0.5 border border-black">
                                        ${token.priceUsd < 0.01 ? token.priceUsd.toExponential(2) : token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div className="p-6 text-center text-gray-400 font-bold text-xs uppercase">{language === 'en' ? 'No tokens match' : language === 'es' ? 'No se encontraron tokens' : '未匹配到代币'}</div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const RiskShield = ({ token, priceImpact }: { token: SwapToken | null, priceImpact: number }) => {
    const { language } = useAppStore();
    const t = translations[language];

    if (!token) return null;

    // Red flag logic
    const redFlags = [];
    const isHighHoneypot = (token.buyRatio || 0) > 0.9 && (token.totalTx || 0) > 20;
    const isCriticalImpact = priceImpact > 10;
    const isLowLiq = token.liquidityUsd < 5000;

    if (isHighHoneypot) redFlags.push(t.swap_risk_honeypot + t.swap_risk_critical);
    if (isLowLiq) redFlags.push(t.swap_risk_liquidity + t.swap_risk_low_liq);
    if (isCriticalImpact) redFlags.push(t.swap_risk_impact + t.swap_risk_critical);
    if ((token.riskScore || 0) > 60) redFlags.push(t.swap_risk_verdict + t.swap_risk_warning);

    const riskLevel: "secure" | "warning" | "critical" =
        isHighHoneypot || isCriticalImpact ? "critical" :
            isLowLiq || (token.riskScore || 0) > 40 ? "warning" : "secure";

    const config = {
        secure: { color: "text-[#00ff41]", border: "border-[#00ff41]/20", bg: "bg-[#00ff41]/5", label: t.swap_risk_secure, desc: t.swap_risk_secure_desc },
        warning: { color: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/5", label: t.swap_risk_warning, desc: t.swap_risk_warning_desc },
        critical: { color: "text-rose-500", border: "border-rose-500/20", bg: "bg-rose-500/5", label: t.swap_risk_critical, desc: t.swap_risk_critical_desc }
    };

    const current = config[riskLevel];

    return (
        <div className={`mx-6 mb-6 p-4 border-2 ${current.border} ${current.bg} transition-all duration-500 overflow-hidden relative`}>
            {/* Binary Stream Background */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] font-mono text-[8px] overflow-hidden pointer-events-none break-all p-1">
                {Array(20).fill("01101001011101101101").join("")}
            </div>

            <div className="flex justify-between items-start relative z-10 mb-3">
                <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${current.color}`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${current.color}`}>
                        {t.swap_risk_title}
                    </span>
                </div>
                <div className={`px-2 py-0.5 border-2 ${current.border} ${current.color} text-[8px] font-black uppercase italic`}>
                    {current.label}
                </div>
            </div>

            <div className="space-y-2 relative z-10">
                <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed max-w-[90%]">
                    {current.desc}
                </p>

                {redFlags.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-black/5 space-y-1">
                        {redFlags.map((flag, i) => (
                            <div key={i} className="flex items-center gap-2 text-[8px] font-black uppercase text-rose-500/80">
                                <AlertTriangle size={10} />
                                {flag}
                            </div>
                        ))}
                    </div>
                )}

                {redFlags.length === 0 && (
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase text-[#00ff41]/60">
                        <CheckCircle2 size={10} />
                        {t.swap_risk_all_good}
                    </div>
                )}
            </div>
        </div>
    );
};
