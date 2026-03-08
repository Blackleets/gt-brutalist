import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Send, Lock, Zap, Shield, Globe, MessageSquare } from "lucide-react";
import { useAlphaGuard } from "@/modules/alpha/AlphaGuard";

export function PremiumPulseChat() {
    const { chatMessages, addChatMessage, wallet, language, ownerAddresses } = useAppStore();
    const { isAuthorized } = useAlphaGuard();
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const isOwner = wallet.connected && ownerAddresses.includes(wallet.address);
    // User mentions "area estara en comision para todos execto para mi" 
    // I'll interpret "comision" as "locked/restricted" or "paid access".
    // owner bypasses everything.
    const hasAccess = isOwner || (isAuthorized && wallet.connected);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSend = () => {
        if (!inputText.trim() || !wallet.connected) return;

        addChatMessage({
            sender: wallet.address,
            identity: wallet.identity?.uid || "AGENT_UNKNOWN",
            text: inputText,
            isPremium: true,
            isOwner: isOwner
        });
        setInputText("");
    };

    return (
        <div className="border-4 border-black bg-white shadow-[8px_8px_0_black] flex flex-col min-h-[600px] h-[750px] relative overflow-hidden group">
            {/* Header */}
            <div className="bg-black text-[#00ff41] p-3 flex justify-between items-center border-b-4 border-black">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    <span className="font-[1000] uppercase tracking-tighter text-sm">PULSE_NETWORK // SECURE_UPLINK</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasAccess ? (
                        <span className="text-[10px] font-black bg-[#00ff41] text-black px-2 py-0.5 animate-pulse">ACTIVE_NODE</span>
                    ) : (
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5">ENCRYPTED</span>
                    )}
                </div>
            </div>

            {/* Chat Messages */}
            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white ${!hasAccess ? 'blur-md pointer-events-none grayscale' : ''}`}
            >
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === wallet.address ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1 mb-1">
                            <span className={`text-[8px] font-[1000] uppercase ${msg.isOwner ? 'text-red-600' : 'text-black opacity-60'}`}>
                                {msg.isOwner ? 'ROOT_OWNER' : msg.identity}
                            </span>
                            <span className="text-[8px] text-zinc-300 font-bold">
                                [{new Date(msg.timestamp).toLocaleTimeString()}]
                            </span>
                        </div>
                        <div className={`p-3 border-2 border-black max-w-[85%] text-xs font-bold leading-relaxed shadow-[4px_4px_0_black] ${msg.sender === wallet.address
                            ? 'bg-[#00ff41] text-black'
                            : msg.sender === 'SYSTEM'
                                ? 'bg-[#fffc20] text-black italic border-dashed'
                                : 'bg-white text-black'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Overlay for Gating */}
            {!hasAccess && (
                <div className="absolute inset-x-0 bottom-0 top-[48px] z-50 flex flex-col items-center justify-center p-6 text-center bg-white/95 backdrop-blur-sm border-t-4 border-black">
                    <div className="w-16 h-16 border-4 border-black flex items-center justify-center bg-[#fffc20] mb-6 rotate-45 shadow-[6px_6px_0_black]">
                        <Lock size={30} className="text-black -rotate-45" />
                    </div>
                    <h4 className="text-xl font-[1000] text-black uppercase italic tracking-tighter mb-2">
                        CHANNELS_LOCKED
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase max-w-[200px] mb-6 leading-tight">
                        {language === 'es'
                            ? "Comunicación inter-billetera solo para nodos verificados Nivel 2."
                            : "Inter-wallet communication restricted to Level 2 verified nodes."}
                    </p>
                    <button
                        onClick={() => {
                            const header = document.querySelector('header');
                            if (header) header.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-[#00ff41] text-black border-4 border-black px-6 py-3 font-black uppercase text-[10px] shadow-[4px_4px_0_#fff] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Zap size={14} fill="currentColor" /> VALIDATE_IDENTITY
                    </button>
                </div>
            )}

            {/* Chat Input */}
            <div className={`p-4 border-t-4 border-black bg-white ${!hasAccess ? 'opacity-20' : ''}`}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={hasAccess ? "Transmit signal..." : "ENCRYPTED_INPUT"}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!hasAccess}
                        className="flex-1 bg-white border-4 border-black p-3 outline-none font-bold text-xs focus:shadow-[4px_4px_0_#00ff41] transition-all"
                    />
                    <button
                        onClick={handleSend}
                        title="Send Signal"
                        disabled={!hasAccess}
                        className="bg-black text-white border-4 border-black p-3 hover:bg-[#00ff41] hover:text-black transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="mt-2 flex justify-between items-center opacity-50">
                    <span className="text-[8px] font-black uppercase flex items-center gap-1">
                        <Shield size={10} /> AES-256_QUANTUM_GUARD
                    </span>
                    <span className="text-[8px] font-black uppercase flex items-center gap-1">
                        <Globe size={10} /> GLOBAL_PEER_SYNC
                    </span>
                </div>
            </div>
        </div>
    );
}
