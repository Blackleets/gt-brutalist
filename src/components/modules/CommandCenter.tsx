import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Shield, Zap, Settings, Skull, ZapOff } from "lucide-react";

export function CommandCenter() {
    const { networkMode } = useAppStore();

    // Command center states
    const [slippage, setSlippage] = useState("0.5");
    const [bribePriority, setBribePriority] = useState<"STANDARD" | "HIGH" | "ULTRA" | "CUSTOM">("HIGH");
    const [customBribe, setCustomBribe] = useState("0.01");

    // Protection features
    const [mevProtection, setMevProtection] = useState(true);
    const [frontrunGuard, setFrontrunGuard] = useState(true);
    const [antitoxic, setAntitoxic] = useState(false);

    // Node selection
    const [rpcNode, setRpcNode] = useState<"PUBLIC" | "PRIVATE" | "VYTRONIX_ELITE">("VYTRONIX_ELITE");

    return (
        <section className="px-4 md:px-16 py-8 md:py-16 relative z-10 w-full min-h-[80vh]">
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-4">
                    <div className="flex flex-col">
                        <div className="inline-block bg-black text-[#00ff41] px-3 py-1 text-[10px] md:text-sm font-black uppercase tracking-widest w-fit mb-4">
                            Module :: Command Center
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none flex items-center gap-4">
                            Execution Params
                        </h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2 max-w-xl">
                            Configure institutional-grade sniper parameters, MEV bribing logic, and transaction defense protocols.
                        </p>
                    </div>

                    {!networkMode && (
                        <div className="bg-[#ff003c] text-white p-2 text-xs font-black uppercase flex items-center gap-2 border-4 border-black">
                            <ZapOff size={16} /> GLOBAL SYNC REQUIRED FOR DIRECT NODE ACCESS
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Transaction Routing (Bribes & RPC) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* RPC Node Selection */}
                        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_rgba(0,0,0,1)]">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                                <Zap size={24} className="text-[#00ff41]" /> Routing Infrastructure
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: "PUBLIC", label: "Public Aggregator", speed: "Standard", fee: "Free" },
                                    { id: "PRIVATE", label: "Private RPC Pool", speed: "Fast", fee: "0.2% Fee" },
                                    { id: "VYTRONIX_ELITE", label: "Vytronix Elite Node", speed: "Ultra-Low Latency", fee: "0.5% Fee" }
                                ].map(node => (
                                    <button
                                        key={node.id}
                                        disabled={!networkMode}
                                        onClick={() => setRpcNode(node.id as "PUBLIC" | "PRIVATE" | "VYTRONIX_ELITE")}
                                        className={`flex flex-col items-start p-4 border-4 transition-all text-left ${!networkMode ? "bg-zinc-200 text-zinc-400 border-zinc-200 cursor-not-allowed" :
                                                rpcNode === node.id
                                                    ? "bg-black text-[#00ff41] border-black shadow-[4px_4px_0_rgba(0,255,65,1)] translate-x-[-2px] translate-y-[-2px]"
                                                    : "bg-zinc-100 text-black border-transparent hover:border-black"
                                            }`}
                                    >
                                        <span className="font-black uppercase text-sm">{node.label}</span>
                                        <span className={`text-[10px] font-bold uppercase mt-2 ${rpcNode === node.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                            Speed: {node.speed}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase ${rpcNode === node.id ? 'text-[#00ff41]' : 'text-zinc-500'}`}>
                                            [{node.fee}]
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Miner Bribing / Priority Fees */}
                        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_rgba(0,0,0,1)]">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                                <Skull size={24} className="text-rose-500" /> Block Inclusion Bribe (Jito / MEV)
                            </h3>

                            <p className="text-xs font-bold text-zinc-500 uppercase mb-4">
                                Override standard gas mechanics. Pay validators directly for guaranteed next-block inclusion. Essential for arbitrage and sniping.
                            </p>

                            <div className="flex flex-wrap gap-4 mb-4">
                                {["STANDARD", "HIGH", "ULTRA", "CUSTOM"].map(prio => (
                                    <button
                                        key={prio}
                                        disabled={!networkMode}
                                        onClick={() => setBribePriority(prio as "STANDARD" | "HIGH" | "ULTRA" | "CUSTOM")}
                                        className={`px-6 py-2 border-2 font-black uppercase text-xs transition-colors ${!networkMode ? "bg-zinc-200 text-zinc-400 border-zinc-200 cursor-not-allowed" :
                                                bribePriority === prio
                                                    ? "bg-rose-500 text-white border-rose-500"
                                                    : "bg-white text-zinc-400 border-zinc-200 hover:border-black hover:text-black"
                                            }`}
                                    >
                                        {prio} {prio !== "CUSTOM" && "BID"}
                                    </button>
                                ))}
                            </div>

                            {bribePriority === "CUSTOM" ? (
                                <div className="flex items-center gap-2 border-4 border-black w-full sm:w-64 p-2 focus-within:translate-x-1 focus-within:translate-y-1 focus-within:shadow-none transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                    <input
                                        type="number"
                                        title="Custom Bribe Amount"
                                        placeholder="0.01"
                                        value={customBribe}
                                        disabled={!networkMode}
                                        onChange={(e) => setCustomBribe(e.target.value)}
                                        className="w-full h-full outline-none font-black text-xl uppercase placeholder:text-zinc-300 bg-transparent disabled:text-zinc-400 disabled:cursor-not-allowed"
                                        step="0.001"
                                    />
                                    <span className="font-black text-zinc-400 px-2">SOL</span>
                                </div>
                            ) : (
                                <div className="text-sm font-bold uppercase text-zinc-500 p-4 bg-zinc-100 border-2 border-dashed border-zinc-300">
                                    Estimated bribe: <span className="text-rose-500 font-black">
                                        {bribePriority === "STANDARD" ? "0.0001" : bribePriority === "HIGH" ? "0.005" : "0.025"} SOL
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Protections & Slippage */}
                    <div className="flex flex-col gap-6">

                        {/* Protection Toggles */}
                        <div className="border-4 border-black bg-zinc-950 text-white p-6 shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col gap-4">
                            <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2 border-b-4 border-white pb-2 text-[#00ff41]">
                                <Shield size={24} /> Defense Protocols
                            </h3>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="font-black uppercase text-sm group-hover:text-[#00ff41] transition-colors">MEV Protection</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Obfuscate TX from public mempool</span>
                                </div>
                                <div className={`w-12 h-6 border-2 flex items-center p-0.5 transition-colors ${mevProtection ? 'border-[#00ff41] bg-[#00ff41]/20' : 'border-zinc-600 bg-transparent'}`} onClick={() => setMevProtection(!mevProtection)}>
                                    <div className={`w-4 h-4 bg-[#00ff41] transition-transform ${mevProtection ? 'translate-x-6' : 'translate-x-0 bg-zinc-600'}`} />
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="font-black uppercase text-sm group-hover:text-[#00ff41] transition-colors">Front-run Guard</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Auto-fail if sandwich attack detected</span>
                                </div>
                                <div className={`w-12 h-6 border-2 flex items-center p-0.5 transition-colors ${frontrunGuard ? 'border-[#00ff41] bg-[#00ff41]/20' : 'border-zinc-600 bg-transparent'}`} onClick={() => setFrontrunGuard(!frontrunGuard)}>
                                    <div className={`w-4 h-4 bg-[#00ff41] transition-transform ${frontrunGuard ? 'translate-x-6' : 'translate-x-0 bg-zinc-600'}`} />
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group mb-2 border-b border-white/10 pb-4">
                                <div className="flex flex-col">
                                    <span className="font-black uppercase text-sm group-hover:text-[#00ff41] transition-colors">Anti-Toxic Liquidity</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Skip pools with known honeypots</span>
                                </div>
                                <div className={`w-12 h-6 border-2 flex items-center p-0.5 transition-colors ${antitoxic ? 'border-[#00ff41] bg-[#00ff41]/20' : 'border-zinc-600 bg-transparent'}`} onClick={() => setAntitoxic(!antitoxic)}>
                                    <div className={`w-4 h-4 bg-[#00ff41] transition-transform ${antitoxic ? 'translate-x-6' : 'translate-x-0 bg-zinc-600'}`} />
                                </div>
                            </label>

                            <div className="mt-auto">
                                <button className="w-full bg-[#00ff41] text-black font-black uppercase py-4 hover:bg-white transition-colors border-2 border-transparent">
                                    Apply Security Profile
                                </button>
                            </div>
                        </div>

                        {/* Slippage Settings */}
                        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_rgba(0,0,0,1)]">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                                <Settings size={24} className="text-black" /> Max Slippage
                            </h3>

                            <div className="flex gap-2 mb-4">
                                {["0.1", "0.5", "1.0", "Auto"].map(slip => (
                                    <button
                                        key={slip}
                                        disabled={!networkMode}
                                        onClick={() => setSlippage(slip)}
                                        className={`flex-1 py-2 font-black uppercase text-xs border-2 transition-colors ${!networkMode ? "bg-zinc-200 text-zinc-400 border-zinc-200 cursor-not-allowed" :
                                                slippage === slip
                                                    ? "bg-black text-[#fffc20] border-black"
                                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-black"
                                            }`}
                                    >
                                        {slip}{slip !== "Auto" ? "%" : ""}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 border-4 border-black w-full p-2 bg-zinc-50 focus-within:bg-white focus-within:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all">
                                <input
                                    type="text"
                                    title="Max Slippage"
                                    placeholder="0.5"
                                    value={slippage}
                                    disabled={!networkMode}
                                    onChange={(e) => setSlippage(e.target.value)}
                                    className="w-full h-full outline-none font-black text-xl bg-transparent disabled:text-zinc-400 disabled:cursor-not-allowed"
                                />
                                <span className="font-black text-black">%</span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 text-right">
                                Warning: High slippage may result in MEV targeting
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
