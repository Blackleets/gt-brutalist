import { useState } from "react";
import { useAppStore, type WalletState } from "@/lib/store";
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
    const { connectWallet, language, wallet } = useAppStore();
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

    const isDetected = (type: string) => {
        if (typeof window === 'undefined') return false;
        if (type === 'phantom') return !!window.solana?.isPhantom;
        if (type === 'solflare') return !!window.solflare || !!window.solana?.isSolflare;
        if (type === 'metamask') return !!window.ethereum?.isMetaMask && !window.ethereum?.isOKXWallet;
        if (type === 'binance') return !!window.BinanceChain || !!window.ethereum?.isBinanceChain;
        if (type === 'okx') return !!window.okxwallet || !!window.ethereum?.isOKXWallet;
        return false;
    };

    const handleConnect = async (type: string) => {
        setIsConnecting(true);
        setError(null);

        // Mobile detection and deep-linking
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        try {
            if (type === "watch") {
                if (!watchAddress) throw new Error("ADDRESS_REQUIRED");
                await connectWallet("watch", watchAddress.trim());
            } else if (isMobile && !isDetected(type) && type !== 'walletconnect') {
                // If on mobile and wallet not injected, try deep linking
                const dappUrl = typeof window !== 'undefined' ? window.location.href : "https://vytronix.protocol";
                if (type === 'metamask') {
                    window.open(`https://metamask.app.link/dapp/${dappUrl.replace('https://', '')}`, '_blank');
                    return;
                } else if (type === 'phantom') {
                    window.open(`https://phantom.app/ul/browse/${encodeURIComponent(dappUrl)}?ref=${encodeURIComponent(dappUrl)}`, '_blank');
                    return;
                } else if (type === 'okx') {
                    window.open(`okx://wallet/dapp/details?dappUrl=${encodeURIComponent(dappUrl)}`, '_blank');
                    return;
                }
                // Fallback to regular connection attempt
                await connectWallet(type as NonNullable<WalletState["providerType"]>);
            } else {
                await connectWallet(type as NonNullable<WalletState["providerType"]>);
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
                    className="relative w-full max-w-[1000px] h-full max-h-[90vh] md:h-[700px] bg-zinc-900 border-[8px] md:border-[12px] border-black shadow-[0_0_100px_rgba(0,255,65,0.15)] flex flex-col md:flex-row overflow-hidden font-mono text-zinc-300 pointer-events-auto"
                >
                    {/* Matrix Scan Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,65,0.1)_50%),linear-gradient(90deg,rgba(0,255,65,0.05),rgba(0,0,0,0.01),rgba(0,255,65,0.05))] bg-[length:100%_4px,3px_100%] z-50 animate-pulse"></div>

                    {/* Sidebar: Selection Matrix */}
                    <div className="w-full md:w-[400px] border-b-[8px] md:border-b-0 md:border-r-[10px] border-black flex flex-col bg-zinc-950 relative z-10 shrink-0 h-[40%] md:h-full">
                        <div className="p-6 md:p-10 border-b-[8px] md:border-b-[10px] border-black bg-zinc-900">
                            <div className="flex items-center gap-3 mb-1 md:mb-2">
                                <Cpu size={18} className="text-[#00ff41]" />
                                <span className="text-[10px] md:text-[11px] font-black text-[#00ff41] uppercase tracking-[0.3em]">{t.wallet_system_core}</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-[4px_4px_0_#000]">{t.wallet_title}</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-10 custom-scrollbar scrollbar-hide">
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] md:text-[12px] font-black text-white bg-[#00ff41] text-black px-2 md:px-3 py-1 border-2 border-black tracking-widest uppercase">{t.wallet_node}</h3>
                                    <span className="text-[8px] md:text-[10px] text-zinc-600 font-bold">{t.wallet_total_nodes}: {WALLETS.length}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-4">
                                    {WALLETS.map((w) => {
                                        const isDetected = (w.id === 'phantom' && (!!window.solana?.isPhantom)) ||
                                            (w.id === 'solflare' && (!!window.solflare || !!window.solana?.isSolflare)) ||
                                            (w.id === 'metamask' && (!!window.ethereum?.isMetaMask && !window.ethereum?.isOKXWallet)) ||
                                            (w.id === 'binance' && (!!window.BinanceChain || !!window.ethereum?.isBinanceChain)) ||
                                            (w.id === 'okx' && (!!window.okxwallet || !!window.ethereum?.isOKXWallet));

                                        return (
                                            <button
                                                key={w.id}
                                                onClick={() => {
                                                    setError(null);
                                                    setSelectedWallet(w);
                                                }}
                                                className={`group relative w-full flex flex-col md:flex-row items-center gap-3 md:gap-6 p-4 md:p-6 border-4 border-black transition-all overflow-hidden ${selectedWallet.id === w.id ? 'bg-[#00ff41] text-black md:translate-x-3 md:shadow-[-15px_0_0_#00ff41] shadow-[2px_2px_0_black]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white shadow-[4px_4px_0_black] md:shadow-[8px_8px_0_black]'}`}
                                            >
                                                <div className={`w-10 h-10 md:w-16 md:h-16 flex items-center justify-center bg-white border-4 border-black shrink-0 transition-transform duration-300 ${selectedWallet.id === w.id ? 'scale-110' : 'group-hover:rotate-6'}`}>
                                                    <div className="scale-75 md:scale-125">{w.icon}</div>
                                                </div>
                                                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                                    <span className="font-black uppercase text-xs md:text-lg leading-none mb-1 tracking-tight">{w.name}</span>
                                                    <span className={`text-[7px] md:text-[10px] font-bold uppercase opacity-60 ${selectedWallet.id === w.id ? 'text-black' : 'text-zinc-500'} hidden md:inline`}>{w.description}</span>
                                                </div>
                                                {isDetected && (
                                                    <div className="absolute top-0 right-0">
                                                        <div className={`px-1.5 md:px-2 py-0.5 text-[6px] md:text-[8px] font-black uppercase flex items-center gap-1 ${selectedWallet.id === w.id ? 'bg-black text-[#00ff41]' : 'bg-[#00ff41] text-black'}`}>
                                                            <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                                                            {t.wallet_detected}
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <h3 className="text-[10px] md:text-[12px] font-black text-black bg-yellow-400 px-3 py-1 border-2 border-black tracking-widest uppercase">{t.wallet_emergency}</h3>
                                <button
                                    onClick={() => {
                                        setError(null);
                                        setSelectedWallet({ id: 'watch', name: 'Watch_Node', icon: <Search />, type: t.wallet_node_type_utility, description: t.wallet_watch_desc });
                                    }}
                                    className={`w-full flex items-center gap-4 md:gap-6 p-4 md:p-6 border-4 border-black border-dashed transition-all ${selectedWallet.id === 'watch' ? 'bg-black text-[#00ff41] md:translate-x-3 md:shadow-[-15px_0_0_#00ff41] border-solid shadow-[4px_4px_0_black]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 shadow-[4px_4px_0_black] md:shadow-[8px_8px_0_black]'}`}
                                >
                                    <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center bg-zinc-800 border-4 border-black shrink-0 text-white">
                                        <Search size={20} className="md:w-7 md:h-7" strokeWidth={3} />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-black uppercase text-xs md:text-lg leading-none mb-1">{t.wallet_watch_mode}</span>
                                        <span className="text-[8px] md:text-[10px] font-bold opacity-50 uppercase">{t.wallet_passive_scan}</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-8 bg-black flex flex-col gap-2 md:gap-4 border-t-4 md:border-t-[10px] border-black hidden md:flex">
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
                            title="Close"
                            className="absolute top-10 right-10 w-16 h-16 border-[6px] border-black flex items-center justify-center bg-zinc-900 text-[#00ff41] hover:bg-rose-600 hover:text-white transition-all shadow-[8px_8px_0_black] z-[60] group"
                        >
                            <X size={32} strokeWidth={4} />
                        </button>

                        <div className="flex-1 flex flex-col bg-zinc-50 overflow-y-auto custom-scrollbar">
                            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
                                <AnimatePresence mode="wait">
                                    {isConnecting ? (
                                        <motion.div key="connecting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12">
                                            <div className="relative">
                                                <div className="w-48 h-48 border-[12px] border-black flex items-center justify-center bg-white mx-auto shadow-[15px_15px_0_#00ff41] p-10 z-10 relative">
                                                    <div className="scale-[2.5]">{selectedWallet.icon}</div>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                    className="absolute -inset-10 border-[4px] border-[#00ff41] border-dashed rounded-full opacity-20"
                                                />
                                            </div>
                                            <div className="space-y-6">
                                                <div className="inline-block bg-[#00ff41] border-4 border-black px-6 py-2 shadow-[4px_4px_0_black]">
                                                    <h3 className="text-2xl font-black uppercase italic text-black tracking-tighter">{t.wallet_connecting}</h3>
                                                </div>
                                                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] max-w-[300px] mx-auto leading-relaxed">
                                                    {t.wallet_handshake_msg.replace('{wallet}', selectedWallet.name)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : selectedWallet.id === 'watch' ? (
                                        <motion.div key="watch" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-10">
                                            <div className="w-40 h-40 border-[10px] border-black flex items-center justify-center bg-yellow-400 text-black mx-auto shadow-[15px_15px_0_black]">
                                                <Search size={64} strokeWidth={4} />
                                            </div>
                                            <div className="space-y-6">
                                                <div className="relative">
                                                    <div className="absolute -top-3 left-4 bg-zinc-900 px-2 border-2 border-black font-black text-[9px] text-[#00ff41] z-10 uppercase">{t.wallet_registry_label}</div>
                                                    <input
                                                        type="text"
                                                        placeholder={t.wallet_placeholder}
                                                        value={watchAddress}
                                                        onChange={(e) => setWatchAddress(e.target.value)}
                                                        className="w-full bg-white border-4 border-black p-6 font-mono text-xs font-black uppercase outline-none text-black text-center placeholder:text-zinc-300"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleConnect("watch")}
                                                    className="w-full py-6 bg-black text-[#00ff41] border-4 border-black font-black uppercase text-xl hover:bg-[#00ff41] hover:text-black transition-all shadow-[8px_8px_0_black] flex items-center justify-center gap-4 group"
                                                >
                                                    <Zap fill="currentColor" size={24} className="group-hover:scale-125 transition-transform" />
                                                    {t.wallet_scan}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 w-full max-w-sm mx-auto">
                                            <div className="relative group mx-auto">
                                                <div className="w-48 h-48 border-[10px] border-black flex items-center justify-center bg-white text-black mx-auto shadow-[15px_15px_0_#00ff41] p-12 transition-all duration-500 z-10 relative">
                                                    <div className="scale-[2.5]">{selectedWallet.icon}</div>
                                                </div>
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border-4 border-black px-4 py-2 font-black text-[9px] text-white uppercase shadow-[6px_6px_0_black] flex items-center gap-2 whitespace-nowrap z-20">
                                                    <ShieldCheck size={16} className="text-[#00ff41]" />
                                                    {t.wallet_secure}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-4xl md:text-5xl font-[1000] uppercase tracking-tighter leading-none text-black drop-shadow-[2px_2px_0_#fff]">
                                                    VYTRONIX <br />
                                                    <span className="text-[#00ff41] stroke-black text-stroke-1-black">{t.wallet_access_node}</span>
                                                </h3>

                                                {/* IDENTITY HOOK */}
                                                <div className="border-[3px] border-black p-4 bg-white flex items-center gap-4 relative overflow-hidden group/id">
                                                    <div className="w-10 h-10 bg-black flex items-center justify-center text-[#00ff41] font-black text-xs shrink-0">V-ID</div>
                                                    <div className="text-left">
                                                        <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t.wallet_identity}</div>
                                                        <div className="text-black font-black text-sm tracking-tight uppercase">
                                                            {wallet.connected && wallet.identity ? wallet.identity.uid : "V-ID-####-###"}
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className="text-[7px] font-black bg-zinc-100 px-1 py-0.5">
                                                                [ {t.wallet_rank}: {wallet.connected && wallet.identity ? wallet.identity.rank : "UNASSIGNED"} ]
                                                            </span>
                                                            <span className="text-[7px] font-black bg-zinc-100 px-1 py-0.5">
                                                                [ {t.wallet_level}: {wallet.connected && wallet.identity ? wallet.identity.level : "0"} ]
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-zinc-500 font-bold uppercase text-[10px] leading-tight tracking-tight">
                                                    {t.wallet_desc}
                                                </p>

                                                <button
                                                    onClick={() => handleConnect(selectedWallet.id)}
                                                    disabled={wallet.connected}
                                                    className="w-full py-4 bg-[#00ff41] text-black border-4 border-black font-black uppercase text-lg hover:bg-black hover:text-[#00ff41] transition-all shadow-[8px_8px_0_black] active:scale-95 disabled:opacity-50"
                                                >
                                                    {wallet.connected ? t.connected : t.wallet_initiate}
                                                </button>

                                                {error && (
                                                    <motion.div initial={{ x: -5 }} animate={{ x: 0 }} className="p-4 bg-rose-50 border-2 border-rose-600 text-rose-600 text-[10px] font-black uppercase text-left flex items-start gap-3">
                                                        <X size={16} strokeWidth={4} className="shrink-0" />
                                                        <div>
                                                            <div>{t.wallet_failure}</div>
                                                            <div className="opacity-70 text-[8px] mt-1">{error.toUpperCase()}</div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
