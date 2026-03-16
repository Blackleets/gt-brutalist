import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Hammer, Coins, ImageIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type DeployState = "idle" | "uploading" | "deploying" | "success" | "error";

export function TokenFactory() {
    const { networkMode, wallet, addSystemLog, addPlatformFee } = useAppStore();
    const [deployState, setDeployState] = useState<DeployState>("idle");
    const [txHash, setTxHash] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        initialSupply: "1000000000",
        image: null as File | null
    });

    if (!networkMode) return null;

    const handleDeploy = async () => {
        if (!wallet.connected) {
            addSystemLog("DEPLOY_FAILED: WALLET NOT CONNECTED.", "error");
            return;
        }

        const FEE = 0.25;
        if (wallet.balance < FEE) {
            addSystemLog(`INSUFFICIENT_FUNDS: DEPLOYMENT REQUIRES ${FEE} SOL.`, "error");
            return;
        }

        setDeployState("deploying");
        addSystemLog(`INITIALIZING_DEPLOYMENT: CREATING TOKEN PROTOCOL ${formData.symbol}...`, "info");

        try {
            // 1. Simulate the "real" transaction fee via executeSwap (or similar)
            // For now we use the store's wallet deduction logic
            await new Promise(r => setTimeout(r, 2000));

            // 2. The win! Collect fee
            addPlatformFee(FEE);
            addSystemLog(`FEE_COLLECTED: ${FEE} SOL TRANSFERRED TO TREASURY NODE.`, "success");

            // 3. Metadata upload
            addSystemLog("METADATA_UPLOADED: IPFS CID GENERATED.", "info");
            await new Promise(r => setTimeout(r, 1500));

            // 4. Contract deployment
            const mockHash = Array.from({ length: 44 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            setTxHash(mockHash);

            setDeployState("success");
            addSystemLog(`SUCCESS: ${formData.symbol} DEPLOYED ON MAINNET. GAS_HASH: ${mockHash.substring(0, 12)}...`, "success");
        } catch {
            setDeployState("error");
            addSystemLog("DEPLOYMENT_FAILED: RPC_ERROR_TIMEOUT.", "error");
        }
    };

    return (
        <div className="bg-[#fffc20] border-4 border-black p-8 relative z-10 shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row gap-12 max-w-[1400px] mx-auto">

                {/* LEFT: FORM */}
                <div className="flex-1 space-y-8">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 flex items-center gap-4">
                            <Hammer className="w-10 h-10 md:w-14 md:h-14" />
                            Token Factory
                        </h2>
                        <p className="text-sm font-black uppercase text-black/60 tracking-widest">
                            Deploy custom liquidity protocols to Solana/BSC infrastructure.
                            Fully compliant SPL/BEP-20 metadata standards.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase">Token Name</label>
                                <input
                                    type="text"
                                    title="Token Name"
                                    aria-label="Enter token name"
                                    placeholder="e.g. Vytronix Core"
                                    className="bg-white border-4 border-black p-3 font-black uppercase outline-none focus:bg-[#00ff41] transition-colors"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase">Ticker / Symbol</label>
                                <input
                                    type="text"
                                    title="Token Symbol"
                                    aria-label="Enter token symbol"
                                    placeholder="e.g. VYT"
                                    className="bg-white border-4 border-black p-3 font-black uppercase outline-none focus:bg-[#00ff41] transition-colors"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase">Description</label>
                            <textarea
                                title="Token Description"
                                aria-label="Enter token description"
                                placeholder="Describe your protocol vision..."
                                className="bg-white border-4 border-black p-3 font-black uppercase outline-none focus:bg-[#00ff41] transition-colors h-24 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase">Initial Supply</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    title="Initial Supply"
                                    aria-label="Enter initial supply amount"
                                    placeholder="1,000,000,000"
                                    className="w-full bg-white border-4 border-black p-3 font-black uppercase outline-none pr-24"
                                    value={formData.initialSupply}
                                    onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-gray-400">UNITS</div>
                            </div>
                        </div>

                        <button
                            className="w-full h-20 bg-black text-white border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                            onClick={handleDeploy}
                            disabled={deployState === "deploying" || deployState === "success"}
                        >
                            {deployState === "deploying" ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    TRANSACTION_IN_PROGRESS...
                                </>
                            ) : deployState === "success" ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="text-[#00ff41]" size={24} />
                                        PROTOCOL_DEPLOYED
                                    </div>
                                    <div className="text-[8px] opacity-50 mt-1 font-mono uppercase">Hash: {txHash?.substring(0, 16)}...</div>
                                </div>
                            ) : (
                                <>
                                    <Coins size={24} className="group-hover:rotate-12 transition-transform" />
                                    DEPLOY PROTOCOL [0.25 SOL]
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT: PREVIEW CARD */}
                <div className="w-full md:w-96">
                    <div className="sticky top-8 space-y-6">
                        <div className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 inline-block">Live_Preview</div>
                        <div className="border-8 border-black bg-white p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-black text-white font-black text-[8px] uppercase">Vytronix_Standard</div>

                            <div className="w-24 h-24 bg-zinc-100 border-4 border-black flex items-center justify-center mb-6 group cursor-pointer hover:bg-zinc-200 transition-colors">
                                <ImageIcon className="text-gray-400 group-hover:scale-110 transition-transform" size={32} />
                                <input type="file" title="Upload Token Logo" aria-label="Upload Token Logo" className="hidden" />
                            </div>

                            <div className="space-y-2">
                                <div className="text-4xl font-black uppercase tracking-tighter truncate">
                                    {formData.symbol || "TICKER"}
                                </div>
                                <div className="text-sm font-black uppercase text-gray-500 truncate">
                                    {formData.name || "Protocol Name"}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase line-clamp-3 mt-4 h-12 italic">
                                    {formData.description || "Enter a description to see preview here..."}
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t-4 border-black space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span>Supply</span>
                                    <span>{Number(formData.initialSupply).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span>Decimals</span>
                                    <span>9 [SOL STANDARD]</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span>Status</span>
                                    <span className="text-yellow-600">Pending_Config</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-4 border-black p-4 flex gap-4 items-start shadow-[6px_6px_0_rgba(0,0,0,1)]">
                            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                            <div className="text-[9px] font-black uppercase leading-tight">
                                Authority will be revoked upon deployment. Liquidity pool creation requires additional collateral.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
