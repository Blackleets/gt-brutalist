import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Search, Volume2, Droplets, Activity, Settings2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ChartTerminal() {
    const { networkMode } = useAppStore();

    // DexScreener Integration States
    const [searchInput, setSearchInput] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Default config starts with Solana USDC on Raydium
    const [activePair, setActivePair] = useState({
        chainId: "solana",
        pairAddress: "8sYv7bgbZtvUks7sZ6D9aW9rftR4K4D8E3c1a2eK3d4G",
        symbol: "SOL/USDC",
        price: 0,
        high: 0,
        low: 0,
        volume: 0,
        quoteVolume: 0,
        dex: "Raydium"
    });
    const [isIframeLoading, setIsIframeLoading] = useState(true);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!networkMode || !searchInput.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${searchInput}`);
            const data = await res.json();

            if (data.pairs && data.pairs.length > 0) {
                // Pick the highest volume/liquidity match (usually the first one)
                const pair = data.pairs[0];
                setActivePair({
                    chainId: pair.chainId,
                    pairAddress: pair.pairAddress,
                    symbol: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
                    price: parseFloat(pair.priceUsd) || 0,
                    high: 0,
                    low: 0,
                    volume: pair.volume?.h24 || 0,
                    quoteVolume: pair.liquidity?.usd || 0,
                    dex: pair.dexId
                });
                setIsIframeLoading(true);
                setSearchInput("");
            } else {
                alert("Token not found or liquidity too low.");
            }
        } catch (err) {
            console.warn("Error searching token:", err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (networkMode && activePair.price === 0) {
            fetch(`https://api.dexscreener.com/latest/dex/pairs/${activePair.chainId}/${activePair.pairAddress}`)
                .then(r => r.json())
                .then(d => {
                    if (d.pairs && d.pairs.length > 0) {
                        const pair = d.pairs[0];
                        setActivePair(prev => ({
                            ...prev,
                            price: parseFloat(pair.priceUsd) || 0,
                            volume: pair.volume?.h24 || 0,
                            quoteVolume: pair.liquidity?.usd || 0
                        }));
                    }
                }).catch(console.warn);
        }
    }, [networkMode, activePair.chainId, activePair.pairAddress, activePair.price]);


    return (
        <section className="px-4 md:px-16 py-8 md:py-12 relative z-10 w-full min-h-[85vh] flex flex-col">
            <div className="flex flex-col gap-4 w-full h-full flex-grow">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 w-full border-b-4 border-black pb-4">
                    <div className="flex flex-col w-full sm:w-auto">
                        <div className="inline-block bg-black text-[#00ff41] px-3 py-1 text-[10px] md:text-sm font-black uppercase tracking-widest w-fit mb-2">
                            Module :: Pro Charts Terminal
                        </div>
                        <form onSubmit={handleSearch} className="flex items-center gap-2 border-4 border-black w-full sm:w-96 p-2 shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white focus-within:translate-x-1 focus-within:translate-y-1 focus-within:shadow-none transition-all">
                            <Search size={20} className="text-zinc-400 shrink-0" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                disabled={!networkMode || isSearching}
                                className="w-full h-full outline-none font-black text-xl uppercase placeholder:text-zinc-300 bg-transparent disabled:opacity-50"
                                placeholder={isSearching ? "SEARCHING..." : "SEARCH PAIR / CA / MINT"}
                            />
                            <button type="submit" className="hidden">Submit</button>
                        </form>
                    </div>

                    <div className="flex gap-4">
                        <button className="bg-black text-white px-4 py-2 text-xs font-black uppercase hover:bg-[#00ff41] hover:text-black transition-colors border-2 border-black flex items-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:translate-x-1 active:shadow-none">
                            <Settings2 size={14} /> Indicator Settings
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-6 flex-grow">

                    {/* Left Sidebar Info */}
                    <div className="w-full lg:w-1/4 flex flex-col gap-4">
                        <div className="border-4 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] bg-white flex flex-col gap-4">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter shrink-0">{activePair.symbol}</h1>
                                <p className="text-sm font-bold uppercase tracking-widest text-[#00ff41] bg-black inline-block px-2 mt-1">
                                    Vytronix Aggregator // {activePair.dex.toUpperCase()} // Network: {activePair.chainId.toUpperCase()}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 border-b-4 border-black pb-4">
                                <div className="text-5xl font-black tracking-tighter italic">
                                    ${activePair.price > 0 ? (activePair.price < 0.01 ? activePair.price.toFixed(6) : activePair.price.toFixed(2)) : "---"}
                                </div>
                                {activePair.price > 0 && (
                                    <span className="text-sm font-bold px-2 py-1 flex items-center gap-1 border-2 border-black bg-[#00ff41] text-black">
                                        <TrendingUp size={14} /> LIVE PING
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase mt-2">
                                <div className="border-b-2 border-dashed border-black pb-1">
                                    <span className="text-zinc-400 block text-[10px]">24H Volume</span>
                                    <span className="flex items-center gap-1"><Volume2 size={12} /> {activePair.volume > 0 ? formatCurrency(activePair.volume) : "---"}</span>
                                </div>
                                <div className="border-b-2 border-dashed border-black pb-1">
                                    <span className="text-zinc-400 block text-[10px]">Liquidity (USD)</span>
                                    <span className="flex items-center gap-1"><Droplets size={12} /> {activePair.quoteVolume > 0 ? formatCurrency(activePair.quoteVolume) : "---"}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Main Chart Area */}
                    <div className="w-full lg:w-3/4 flex flex-col border-4 border-black bg-zinc-950 shadow-[8px_8px_0_rgba(0,0,0,1)] min-h-[500px] overflow-hidden relative">
                        {networkMode ? (
                            <>
                                {isIframeLoading && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-90">
                                        <div className="w-12 h-12 border-4 border-[#00ff41] border-t-transparent animate-spin mb-4" />
                                        <span className="text-[10px] font-black uppercase text-[#00ff41] tracking-[0.5em] animate-pulse">Establishing_Data_Link</span>
                                    </div>
                                )}
                                <div className="w-full h-full absolute inset-0">
                                    <iframe
                                        title="DexScreener Chart"
                                        src={`https://dexscreener.com/${activePair.chainId}/${activePair.pairAddress}?embed=1&theme=dark&trades=1&info=0`}
                                        className="w-full h-full border-none"
                                        onLoad={() => setIsIframeLoading(false)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 p-8 text-center text-zinc-400 gap-4">
                                <Activity size={48} className="animate-pulse" />
                                <h3 className="font-black text-2xl uppercase">Terminal Offline</h3>
                                <p className="font-bold uppercase text-xs">Awaiting Network Sync to retrieve live candlestick data.</p>
                            </div>
                        )}

                        {/* Chart Status Underlay/Overlay aesthetic */}
                        <div className="absolute top-0 right-0 pointer-events-none p-4">
                            <div className="bg-black text-white text-[10px] uppercase font-black px-2 py-1 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${networkMode ? 'bg-[#00ff41] animate-pulse' : 'bg-red-500'}`} />
                                {networkMode ? 'CHART ENGINE ACTIVE' : 'DISCONNECTED'}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
