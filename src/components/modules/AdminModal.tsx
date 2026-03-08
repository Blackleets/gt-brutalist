import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, ShieldCheck, Settings, Globe, Trash2, Plus, Twitter } from "lucide-react";
import { translations } from "@/lib/translations";

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
    const {
        telegramToken,
        telegramChatId,
        telegramEnabled,
        setTelegramConfig,
        toggleTelegram,
        sendTelegramMessage,
        adminConfig,
        setAdminConfig,
        activeRpcPerChain,
        setActiveRpc,
        authorizedWallets,
        addAuthorizedWallet,
        removeAuthorizedWallet,
        language
    } = useAppStore();

    const t = translations[language];

    const [token, setToken] = useState(telegramToken || "");
    const [chatId, setChatId] = useState(telegramChatId);
    const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [lastError, setLastError] = useState<string | null>(null);
    const [deliveredTo, setDeliveredTo] = useState<string | null>(null);
    const [newWhaleAddr, setNewWhaleAddr] = useState("");

    const handleSave = () => {
        setTelegramConfig(token, chatId);
        onClose();
    };

    const runTest = async () => {
        if (!token || !chatId) return;
        setTestStatus("loading");
        setLastError(null);
        setDeliveredTo(null);
        try {
            const mockMsg = `🛡 *VYTRONIX CONNECTION TEST*\n\n` +
                `✅ STATUS: [HEALTHY]\n` +
                `👤 AUTHORIZED OPS: [ADMIN]\n` +
                `📡 BROADCAST: [VERIFIED]\n\n` +
                `_Deployment successful. Bot is now linked and ready for alpha transmission._`;

            const chatName = await sendTelegramMessage(mockMsg, undefined, undefined, { token, chatId }) as unknown as string;
            setDeliveredTo(chatName);
            setTestStatus("success");
            setTimeout(() => setTestStatus("idle"), 5000);
        } catch (e) {
            const error = e as Error;
            setTestStatus("error");
            setLastError(error.message || "Unknown Error");
            setTimeout(() => {
                setTestStatus("idle");
                setLastError(null);
            }, 5000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-white border-4 border-black p-6 md:p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-zinc-100 transition-colors border-2 border-transparent hover:border-black"
                            title="Close Settings"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start sm:items-center justify-between gap-3 border-b-4 border-black pb-4 flex-col sm:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-black text-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                                    <Settings size={24} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{t.admin_title}</h2>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{t.admin_subtitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                className="w-full sm:w-auto py-2 px-8 bg-[#00ff41] text-black font-black uppercase text-[10px] border-4 border-black hover:bg-black hover:text-[#00ff41] transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none whitespace-nowrap"
                            >
                                {t.admin_save}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                {/* [1] TELEGRAM INJECTION */}
                                <div className="space-y-3 bg-zinc-50 border-2 border-black p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black font-black text-[10px] flex items-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        {t.admin_tg_feed}
                                        <button
                                            onClick={() => toggleTelegram(!telegramEnabled)}
                                            className={`px-2 py-[1px] text-[8px] uppercase transition-all border-l-2 border-black ml-2 ${telegramEnabled ? "text-[#00ff41] bg-black" : "text-red-500 bg-black"}`}
                                        >
                                            {telegramEnabled ? "● ON" : "○ OFF"}
                                        </button>
                                    </div>

                                    <div className="space-y-2 mt-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Send size={10} className="text-blue-500" /> {t.admin_bot_token}</label>
                                        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:ABCDE..." className="w-full border-2 border-black p-2 font-mono text-[10px] focus:ring-0 focus:outline-none focus:bg-blue-50/50" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.admin_chat_id}</label>
                                        <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value.trim())} placeholder="-100xxxxxxx" className={`w-full border-2 border-black p-2 font-mono text-[10px] focus:ring-0 focus:outline-none ${chatId.startsWith("-") ? "bg-[#00ff41]/10" : "bg-red-500/10"}`} />
                                    </div>

                                    <button
                                        onClick={runTest}
                                        disabled={!token || !chatId || testStatus === "loading"}
                                        className={`w-full py-2 font-black uppercase text-[10px] border-2 border-black transition-all ${testStatus === "success" ? "bg-[#00ff41] text-black border-black" : testStatus === "error" ? "bg-red-500 text-white border-black" : "bg-white text-black hover:bg-black hover:text-white"}`}
                                    >
                                        {testStatus === "loading" ? t.admin_transmitting : testStatus === "success" ? `${t.admin_success} ➔ ${deliveredTo?.toUpperCase() || "OK"}` : testStatus === "error" ? (lastError || t.admin_failed) : t.admin_test_conn}
                                    </button>
                                </div>

                                {/* [2] RPC NODES */}
                                <div className="space-y-3 bg-white border-2 border-black p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black font-black text-[10px] shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        {t.admin_rpc_nodes}
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Globe size={10} className="text-[#00ff41]" /> {t.admin_bsc_network}</label>
                                            <input type="text" title="Binance Smart Chain RPC" value={activeRpcPerChain.bsc} onChange={(e) => setActiveRpc("bsc", e.target.value)} className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Globe size={10} className="text-[#9945FF]" /> {t.admin_sol_network}</label>
                                            <input type="text" title="Solana Network RPC" value={activeRpcPerChain.solana} onChange={(e) => setActiveRpc("solana", e.target.value)} className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* [3] CORE CONTRACTS */}
                                <div className="space-y-3 bg-white border-2 border-black p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black font-black text-[10px] shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        {t.admin_protocol_ca}
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{t.admin_sol_contract}</label>
                                            <input type="text" title="Official SOL Contract" value={adminConfig.officialSolanaContract} onChange={(e) => setAdminConfig({ officialSolanaContract: e.target.value })} className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{t.admin_bsc_contract}</label>
                                            <input type="text" title="Official BSC Contract" value={adminConfig.officialBscContract} onChange={(e) => setAdminConfig({ officialBscContract: e.target.value })} className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* [4] WHALE WATCHLIST */}
                                <div className="space-y-3 bg-white border-2 border-black p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black font-black text-[10px] shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        {t.admin_whale_watchlist}
                                    </div>
                                    <div className="space-y-2 mt-4 max-h-[120px] overflow-y-auto border-2 border-dashed border-zinc-200 p-2">
                                        {authorizedWallets.length === 0 ? (
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase text-center py-4 italic">{t.admin_no_whales}</p>
                                        ) : (
                                            authorizedWallets.map(addr => (
                                                <div key={addr} className="flex items-center justify-between gap-2 bg-zinc-50 p-1 px-2 border border-black/10 group">
                                                    <span className="font-mono text-[9px] truncate">{addr}</span>
                                                    <button onClick={() => removeAuthorizedWallet(addr)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Revoke Alpha Access">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newWhaleAddr}
                                            onChange={(e) => setNewWhaleAddr(e.target.value)}
                                            placeholder={t.admin_insert_addr}
                                            className="flex-1 border-2 border-black p-1 px-2 font-mono text-[9px] focus:outline-none"
                                        />
                                        <button
                                            onClick={() => { if (newWhaleAddr) { addAuthorizedWallet(newWhaleAddr); setNewWhaleAddr(""); } }}
                                            className="p-1 px-3 bg-black text-white border-2 border-black hover:bg-[#00ff41] hover:text-black transition-colors"
                                            title="Authorize Alpha Wallet"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* [5] COMMS_ROUTING */}
                        <div className="space-y-3 bg-white border-2 border-black p-4 relative">
                            <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black font-black text-[10px] shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                {t.admin_comms}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-1"><Twitter size={10} className="text-[#1DA1F2]" /> {t.admin_twitter_node}</label>
                                    <input type="text" value={adminConfig.twitterLink} onChange={(e) => setAdminConfig({ twitterLink: e.target.value })} placeholder="https://x.com/..." className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" title="Twitter Link" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-1"><Send size={10} className="text-[#0088cc]" /> {t.admin_tg_link}</label>
                                    <input type="text" value={adminConfig.telegramLink} onChange={(e) => setAdminConfig({ telegramLink: e.target.value })} placeholder="https://t.me/..." className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" title="Telegram Link" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-1">
                                        <div className="w-[10px] h-[10px] text-[#5865F2]">
                                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                        </div>
                                        {t.admin_discord_relay}
                                    </label>
                                    <input type="text" value={adminConfig.discordLink} onChange={(e) => setAdminConfig({ discordLink: e.target.value })} placeholder="https://discord.gg/..." className="w-full border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" title="Discord Link" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-1"><Globe size={10} className="text-[#fffc20]" /> {t.admin_custom_link}</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={adminConfig.customLink} onChange={(e) => setAdminConfig({ customLink: e.target.value })} placeholder="URL" className="flex-1 border-2 border-black p-2 font-mono text-[9px] bg-zinc-50 focus:bg-white" title="Custom URL" />
                                        <input type="text" value={adminConfig.customLinkLabel} onChange={(e) => setAdminConfig({ customLinkLabel: e.target.value })} placeholder="LABEL" className="w-1/3 border-2 border-black p-2 font-black text-[9px] bg-zinc-50 focus:bg-white placeholder:text-zinc-300" title="Custom Label" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-zinc-900 border-2 border-black text-white text-[9px] font-medium leading-relaxed uppercase flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 shrink-0 text-[#00ff41]" />
                            <p>{t.admin_session_active}</p>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
