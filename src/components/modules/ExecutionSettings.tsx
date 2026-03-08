import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Settings2, Zap, ShieldAlert, Cpu, ChevronDown, ChevronUp, Check, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ExecutionSettings() {
    const { networkMode } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);

    // Professional Settings State
    const [priorityFee, setPriorityFee] = useState(0.005);
    const [jitoTip, setJitoTip] = useState(0.001);
    const [mevProtection, setMevProtection] = useState(true);
    const [slippage, setSlippage] = useState(1.0);
    const [rpcType, setRpcType] = useState<"PUBLIC" | "PRIVATE" | "STABLE">("PRIVATE");

    if (!networkMode) return null;

    return (
        <section className="px-4 md:px-16 py-4 bg-zinc-100 border-b-4 border-black relative z-50">
            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 border-2 border-black transition-colors ${isOpen ? 'bg-[#fffc20]' : 'bg-black text-white'}`}>
                        <Settings2 size={20} className={isOpen ? 'animate-spin-slow text-black' : ''} />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-xl font-black uppercase tracking-tighter leading-none">
                            Execution & Priority Configuration
                        </h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            Optimize Latency + MEV Protection + Gas Tipping
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-gray-400">PRIORITY</span>
                            <span className="text-xs font-black">{priorityFee} SOL</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-gray-400">MEV_SHIELD</span>
                            <span className={`text-xs font-black ${mevProtection ? 'text-green-600' : 'text-red-500'}`}>
                                {mevProtection ? 'ON' : 'OFF'}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-gray-400">RPC_STATUS</span>
                            <span className="text-xs font-black bg-black text-[#00ff41] px-1">{rpcType}</span>
                        </div>
                    </div>
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-8 mt-4 border-t-2 border-dashed border-gray-300">

                            {/* Priority Fee Slot */}
                            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap size={14} className="text-[#00ff41]" />
                                    <span className="text-[10px] font-black uppercase">Priority Fee (SOL/BNB)</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0.001, 0.005, 0.01].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setPriorityFee(v)}
                                            className={`flex-1 text-[10px] font-black py-1 border-2 border-black transition-colors ${priorityFee === v ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    value={priorityFee}
                                    title="Custom Priority Fee"
                                    aria-label="Enter custom priority fee"
                                    onChange={(e) => setPriorityFee(Number(e.target.value))}
                                    className="w-full mt-3 bg-zinc-100 border-2 border-black p-2 font-mono text-xs font-bold outline-none"
                                />
                                <div className="text-[10px] font-mono font-bold text-center mt-1 text-gray-400 uppercase tracking-widest">Exchange_Gas_Boost</div>
                            </div>

                            {/* Jito / Mev Tipping */}
                            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Cpu size={14} className="text-purple-600" />
                                    <span className="text-[10px] font-black uppercase">MEV / Jito Tip</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Enable Shield</span>
                                    <button
                                        onClick={() => setMevProtection(!mevProtection)}
                                        title={mevProtection ? "Disable MEV Protection" : "Enable MEV Protection"}
                                        aria-label="Toggle MEV Protection"
                                        className={`w-10 h-5 border-2 border-black relative transition-colors ${mevProtection ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-0 w-4 h-full bg-black transition-all ${mevProtection ? 'right-0' : 'left-0'}`} />
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min="0.0001"
                                    max="0.05"
                                    step="0.0001"
                                    title="MEV / Jito Tipping Slider"
                                    aria-label="Select Jito tip amount"
                                    value={jitoTip}
                                    onChange={(e) => setJitoTip(Number(e.target.value))}
                                    className="w-full accent-black mt-2"
                                />
                                <div className="text-[10px] font-mono font-bold text-center mt-1">{jitoTip.toFixed(4)} SOL</div>
                            </div>

                            {/* Slippage & Gas */}
                            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldAlert size={14} className="text-red-500" />
                                    <span className="text-[10px] font-black uppercase">Slippage & Impact</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[0.1, 0.5, 1.0, 5.0].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setSlippage(v)}
                                            className={`text-[10px] font-black py-1 border-2 border-black transition-colors ${slippage === v ? 'bg-[#ff003c] text-white' : 'hover:bg-gray-100'}`}
                                        >
                                            {v}%
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 p-2 bg-red-100 border border-red-200 text-[8px] font-bold uppercase text-red-600 leading-none">
                                    Warning: High slippage may result in MEV frontrunning.
                                </div>
                            </div>

                            {/* Node Type */}
                            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase">Infrastructure Node</span>
                                </div>
                                <div className="space-y-2">
                                    {["PUBLIC", "PRIVATE", "STABLE"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setRpcType(type as "PUBLIC" | "PRIVATE" | "STABLE")}
                                            className={`w-full text-left px-3 py-1.5 border-2 border-black text-[9px] font-black uppercase flex justify-between items-center transition-all ${rpcType === type ? 'bg-black text-[#00ff41]' : 'hover:bg-gray-50'}`}
                                        >
                                            {type} NODE
                                            {rpcType === type && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
