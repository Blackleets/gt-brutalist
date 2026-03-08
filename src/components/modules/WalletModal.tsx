import { useState } from "react";
import { useAppStore, type WalletState } from "@/lib/store";
import { type EthereumProvider, type SolflareProvider } from "@/types/crypto";
import { X, Search, Zap, ShieldCheck, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MetaMaskIcon,
    PhantomIcon,
    SolflareIcon,
    BinanceIcon,
    OKXIcon,
    WalletConnectIcon
} from "./WalletIcons";
import { translations } from "@/lib/translations";

// --- Types ---
interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WalletOption {
    id: "phantom" | "metamask" | "binance" | "okx" | "walletconnect" | "watch" | "solflare";
    name: string;
    icon: React.ReactNode;
    type: string;
    description: string;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { connectWallet, language } = useAppStore();
    const t = translations[language];

    const WALLETS: WalletOption[] = [
        {
            id: "metamask",
            name: "MetaMask",
            icon: <MetaMaskIcon />,
            type: t.wallet_node_type_installed,
            description: t.wallet_desc_metamask
        },
        {
            id: "phantom",
            name: "Phantom",
            icon: <PhantomIcon />,
            type: t.wallet_node_type_installed,
            description: t.wallet_desc_phantom
        },
        {
            id: "solflare",
            name: "Solflare",
            icon: <SolflareIcon />,
            type: t.wallet_node_type_installed,
            description: t.wallet_desc_solflare
        },
        {
            id: "binance",
            name: "Binance",
            icon: <BinanceIcon />,
            type: t.wallet_node_type_installed,
            description: t.wallet_desc_binance
        },
        {
            id: "okx",
            name: "OKX Wallet",
            icon: <OKXIcon />,
            type: t.wallet_node_type_recommended,
            description: t.wallet_desc_okx
        },
        {
            id: "walletconnect",
            name: "W-Connect",
            icon: <WalletConnectIcon />,
            type: t.wallet_node_type_recommended,
            description: t.wallet_desc_wc
        },
    ];

    const [selectedWallet, setSelectedWallet] = useState<WalletOption>(WALLETS[0]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [watchAddress, setWatchAddress] = useState("");

    const handleConnect = async (wallet: WalletOption | { id: string, name: string }) => {
        setIsConnecting(true);
        setError(null);
        try {
            if (wallet.id === "watch") {
                if (!watchAddress) throw new Error("ADDRESS_REQUIRED");
                await connectWallet("watch", watchAddress.trim());
            } else {
                await connectWallet(wallet.id as NonNullable<WalletState["providerType"]>, watchAddress || undefined);
            }
            onClose();
        } catch (err: unknown) {
            const errorObj = err as Error;
            setError(errorObj.message || "Connection failed");
        } finally {
            setIsConnecting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, filter: "blur(10px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    exit={{ scale: 0.95, opacity: 0, filter: "blur(10px)" }}
                    className="relative w-full max-w-[1000px] h-[700px] bg-zinc-900 border-[12px] border-black shadow-[0_0_100px_rgba(0,255,65,0.15)] flex overflow-hidden font-mono text-zinc-300"
                >
                    {/* Matrix Scan Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,65,0.1)_50%),linear-gradient(90deg,rgba(0,255,65,0.05),rgba(0,0,0,0.01),rgba(0,255,65,0.05))] bg-[length:100%_4px,3px_100%] z-50 animate-pulse"></div>

                    {/* Sidebar: Selection Matrix */}
                    <div className="w-[400px] border-r-[10px] border-black flex flex-col bg-zinc-950 relative z-10">
                        <div className="p-10 border-b-[10px] border-black bg-zinc-900">
                            <div className="flex items-center gap-3 mb-2">
                                <Cpu size={18} className="text-[#00ff41]" />
                                <span className="text-[11px] font-black text-[#00ff41] uppercase tracking-[0.3em]">{t.wallet_system_core}</span>
                            </div>
                            <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-[4px_4px_0_#000]">{t.wallet_title}</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[12px] font-black text-white bg-[#00ff41] text-black px-3 py-1 border-2 border-black tracking-widest uppercase">{t.wallet_node}</h3>
                                    <span className="text-[10px] text-zinc-600 font-bold">{t.wallet_total_nodes}: {WALLETS.length}</span>
                                </div>
                                <div className="grid gap-4">
                                    {WALLETS.map((w) => {
                                        const win = window as unknown as Record<string, EthereumProvider & SolflareProvider & { BinanceChain: unknown }>;
                                        const isDetected = (w.id === 'phantom' && !!win.solana?.isPhantom) ||
                                            (w.id === 'solflare' && (!!win.solflare || !!win.solana?.isSolflare)) ||
                                            (w.id === 'metamask' && !!win.ethereum?.isMetaMask) ||
                                            (w.id === 'binance' && !!win.BinanceChain) ||
                                            (w.id === 'okx' && !!win.okxwallet);

                                        return (
                                            <button
                                                key={w.id}
                                                onClick={() => { setSelectedWallet(w); if (isDetected) handleConnect(w); }}
                                                className={`group relative w-full flex items-center gap-6 p-6 border-4 border-black transition-all overflow-hidden ${selectedWallet.id === w.id ? 'bg-[#00ff41] text-black translate-x-3 shadow-[-15px_0_0_#00ff41]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white shadow-[8px_8px_0_black]'}`}
                                            >
                                                <div className={`w-16 h-16 flex items-center justify-center bg-white border-4 border-black shrink-0 transition-transform duration-300 ${selectedWallet.id === w.id ? 'scale-110' : 'group-hover:rotate-6'}`}>
                                                    {w.icon}
                                                </div>
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="font-black uppercase text-lg leading-none mb-1 tracking-tight">{w.name}</span>
                                                    <span className={`text-[10px] font-bold uppercase opacity-60 ${selectedWallet.id === w.id ? 'text-black' : 'text-zinc-500'}`}>{w.description}</span>
                                                </div>
                                                {isDetected && (
                                                    <div className="absolute top-0 right-0">
                                                        <div className={`px-2 py-0.5 text-[8px] font-black uppercase ${selectedWallet.id === w.id ? 'bg-black text-[#00ff41]' : 'bg-[#00ff41] text-black'}`}>{t.wallet_detected}</div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[12px] font-black text-black bg-yellow-400 px-3 py-1 border-2 border-black tracking-widest uppercase">{t.wallet_emergency}</h3>
                                <button
                                    onClick={() => setSelectedWallet({ id: 'watch', name: 'Watch_Node', icon: <Search />, type: t.wallet_node_type_utility, description: t.wallet_watch_desc })}
                                    className={`w-full flex items-center gap-6 p-6 border-4 border-black border-dashed transition-all ${selectedWallet.id === 'watch' ? 'bg-black text-[#00ff41] translate-x-3 shadow-[-15px_0_0_#00ff41] border-solid' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 shadow-[8px_8px_0_black]'}`}
                                >
                                    <div className="w-16 h-16 flex items-center justify-center bg-zinc-800 border-4 border-black shrink-0 text-white">
                                        <Search size={28} strokeWidth={3} />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-black uppercase text-lg leading-none mb-1">{t.wallet_watch_mode}</span>
                                        <span className="text-[10px] font-bold opacity-50 uppercase">{t.wallet_passive_scan}</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-black flex flex-col gap-4 border-t-[10px] border-black">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase">
                                <span className="text-zinc-500">{t.wallet_status}</span>
                                <span className="text-[#00ff41] animate-pulse">{t.wallet_active}</span>
                            </div>
                            <div className="grid grid-cols-10 gap-1 h-2">
                                {[...Array(10)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.3, 1, 0.3], scaleY: [0.8, 1.2, 0.8] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="bg-[#00ff41]"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Display: Interface Matrix */}
                    <div className="flex-1 flex flex-col relative bg-zinc-900 z-10 overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none dot-matrix-green" />

                        <button
                            onClick={onClose}
                            title="Close Terminal"
                            aria-label="Close Terminal"
                            className="absolute top-10 right-10 w-20 h-20 border-[8px] border-black flex items-center justify-center bg-zinc-900 text-[#00ff41] hover:bg-rose-600 hover:text-white transition-all shadow-[12px_12px_0_black] hover:shadow-none active:translate-x-2 active:translate-y-2 z-50 group"
                        >
                            <X size={40} className="group-hover:rotate-180 transition-transform duration-500" strokeWidth={4} />
                        </button>

                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                            <AnimatePresence mode="wait">
                                {isConnecting ? (
                                    <motion.div key="connecting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-20">
                                        <div className="relative">
                                            <div className="w-56 h-56 border-[12px] border-black flex items-center justify-center bg-white mx-auto shadow-[30px_30px_0_#00ff41] p-12 z-10 relative">
                                                <div className="scale-[2.8]">{selectedWallet.icon}</div>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="absolute -inset-16 border-[6px] border-[#00ff41] border-dashed rounded-full opacity-20"
                                            />
                                        </div>
                                        <div className="space-y-8">
                                            <div className="inline-block bg-[#00ff41] border-4 border-black px-10 py-3 shadow-[8px_8px_0_black]">
                                                <h3 className="text-4xl font-black uppercase italic text-black tracking-tighter">{t.wallet_connecting}</h3>
                                            </div>
                                            <p className="text-zinc-500 font-bold uppercase text-[13px] tracking-[0.3em] max-w-[400px] mx-auto leading-relaxed">{t.wallet_handshake_msg.replace('{wallet}', selectedWallet.name)}</p>
                                        </div>
                                    </motion.div>
                                ) : selectedWallet.id === 'watch' ? (
                                    <motion.div key="watch" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md space-y-16">
                                        <div className="w-48 h-48 border-[12px] border-black flex items-center justify-center bg-yellow-400 text-black mx-auto shadow-[30px_30px_0_black]">
                                            <Search size={80} strokeWidth={5} />
                                        </div>
                                        <div className="space-y-10">
                                            <div className="relative group">
                                                <div className="absolute -top-4 left-6 bg-zinc-900 px-3 border-2 border-black font-black text-[12px] text-[#00ff41] z-10 uppercase">{t.wallet_registry_label}</div>
                                                <input
                                                    type="text"
                                                    placeholder={t.wallet_placeholder}
                                                    value={watchAddress}
                                                    onChange={(e) => setWatchAddress(e.target.value)}
                                                    className="w-full bg-black border-[8px] border-black p-10 font-mono text-sm font-black uppercase focus:ring-4 focus:ring-[#00ff41]/20 transition-all outline-none text-[#00ff41] text-center placeholder:text-zinc-800"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleConnect(selectedWallet)}
                                                className="w-full py-10 bg-[#00ff41] border-[8px] border-black text-black font-black uppercase text-3xl hover:bg-white hover:-translate-y-2 transition-all shadow-[20px_20px_0_black] hover:shadow-[0_40px_80px_rgba(0,255,65,0.4)] flex items-center justify-center gap-6 group"
                                            >
                                                <Zap fill="currentColor" size={32} className="group-hover:scale-125 transition-transform" />
                                                {t.wallet_scan}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                                        <div className="relative group">
                                            <div className="w-72 h-72 border-[12px] border-black flex items-center justify-center bg-white text-black mx-auto shadow-[35px_35px_0_#00ff41] overflow-hidden p-16 group-hover:shadow-[45px_45px_0_#00ff41] transition-all duration-500 z-10 relative cursor-pointer" onClick={() => handleConnect(selectedWallet)}>
                                                <div className="scale-[3.2] group-hover:scale-[3.8] transition-all duration-500">
                                                    {selectedWallet.icon}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 border-[6px] border-black px-8 py-3 font-black text-[14px] text-white uppercase shadow-[10px_10px_0_black] flex items-center gap-3 whitespace-nowrap z-20">
                                                <ShieldCheck size={22} className="text-[#00ff41]" />
                                                {t.wallet_secure}
                                            </div>
                                        </div>

                                        <div className="max-w-[600px] space-y-8 mt-10">
                                            <h3 className="text-8xl font-black uppercase italic tracking-tighter leading-[0.7] text-white text-center drop-shadow-[8px_8px_0_#000]">Vytronix<br /><span className="text-[#00ff41]">{t.wallet_access_node}</span></h3>
                                            <p className="text-zinc-500 font-bold uppercase text-[15px] leading-tight px-12 text-center tracking-tight">
                                                {t.wallet_desc}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleConnect(selectedWallet)}
                                            className="px-16 py-6 bg-white text-black border-[6px] border-black font-black uppercase text-xl hover:bg-[#00ff41] hover:shadow-[12px_12px_0_black] transition-all active:scale-95 shadow-[8px_8px_0_black]"
                                        >
                                            {t.wallet_initiate}
                                        </button>

                                        {error && (
                                            <motion.div initial={{ x: -10 }} animate={{ x: 0 }} className="p-8 bg-rose-500/10 border-[6px] border-rose-600 text-rose-500 text-[13px] font-black uppercase italic leading-none flex items-center gap-4 max-w-md mx-auto">
                                                <X size={24} strokeWidth={4} />
                                                <div className="text-left">
                                                    <div>{t.wallet_failure}</div>
                                                    <div className="opacity-70 text-[10px]">{error.toUpperCase()}</div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
