import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { X, Terminal, ArrowRight, Send, MessageSquareText, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";

const BrutalistRobot = ({ isActive, tiltX, tiltY }: { isActive: boolean, tiltX: MotionValue<number>, tiltY: MotionValue<number> }) => (
    <motion.svg
        viewBox="0 0 100 100"
        className="w-[42px] h-[42px] relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            rotateX: tiltY,
            rotateY: tiltX,
            perspective: 1000,
            transformStyle: "preserve-3d"
        }}
    >
        {/* Deep background shadow block */}
        <rect x="15" y="15" width="70" height="70" fill={isActive ? "#00ff41" : "#333"} opacity="0.2" className={isActive ? "animate-pulse" : ""} />

        {/* Main brutalist geometric head - an inverted pyramid vibe */}
        <path d="M 5 10 L 95 10 L 80 90 L 20 90 Z" stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" fill="transparent" />
        <path d="M 20 90 L 50 100 L 80 90" stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" fill="transparent" />

        {/* Giant Monolithic Eye */}
        <rect x="30" y="30" width="40" height="15" stroke="currentColor" strokeWidth="5" fill={isActive ? "#00ff41" : "transparent"} />
        {isActive && (
            <>
                <circle cx="40" cy="37.5" r="3" fill="#000" className="animate-ping [animation-duration:3s]" />
                <circle cx="60" cy="37.5" r="3" fill="#000" className="animate-ping [animation-duration:3.1s]" />
            </>
        )}

        {/* Central Vertical vent/processing line */}
        <line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="4" />
        <line x1="50" y1="45" x2="50" y2="95" stroke="currentColor" strokeWidth="4" />

        {/* Data intake grills */}
        <path d="M 35 60 L 65 60 M 40 70 L 60 70 M 45 80 L 55 80" stroke="currentColor" strokeWidth="5" strokeLinecap="square" />

        {/* Side antennas/connectors */}
        <path d="M 5 30 L -5 30 M 95 30 L 105 30 M 12 50 L -2 50 M 88 50 L 102 50" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />

        {/* Active scanning elements */}
        {isActive && (
            <rect x="5" y="0" width="90" height="4" fill="#00ff41" opacity="0.5">
                <animate attributeName="y" values="10;90;10" dur="2s" repeatCount="indefinite" />
            </rect>
        )}
    </motion.svg>
);

interface ChatMessage {
    sender: string;
    text: string;
}

const DEFAULT_HISTORY = (lang: string) => [
    { sender: "bot", text: translations[lang as keyof typeof translations].bot_greeting }
];

export function AIBot() {
    const { networkMode, wallet, networkFeed, arbitrageOpportunities, language } = useAppStore();
    const t = translations[language];
    const lastFeedCount = useRef(networkFeed.length);
    const lastArbCount = useRef(arbitrageOpportunities.length);

    const QUICK_COMMANDS = [
        { label: t.bot_quick_audit, cmd: "audit " },
        { label: t.bot_quick_whale, cmd: "whales" },
        { label: t.bot_quick_heatmap, cmd: "meta" },
        { label: t.bot_quick_arb, cmd: "arbitrage" },
    ];

    // States
    const [isBotVisible] = useState(true); // Controls the floating avatar
    const [isTooltipVisible, setIsTooltipVisible] = useState(false); // Controls the 20s suggestion bubble
    const [isChatOpen, setIsChatOpen] = useState(false); // Controls the main chat window
    const [messageIndex, setMessageIndex] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [dynamicAlert, setDynamicAlert] = useState("");
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Derived transforms for head tilt - Optimized with declarative MotionValues
    const rawTiltX = useTransform(mouseX, (v) => ((v / windowSize.w) - 0.5) * 40);
    const rawTiltY = useTransform(mouseY, (v) => -((v / windowSize.h) - 0.5) * 40);
    const tiltX = useSpring(rawTiltX, { damping: 25, stiffness: 120 });
    const tiltY = useSpring(rawTiltY, { damping: 25, stiffness: 120 });

    const displayX = useTransform(mouseX, (v) => v.toFixed(0));
    const displayY = useTransform(mouseY, (v) => v.toFixed(0));

    const [isGlitching, setIsGlitching] = useState(false);

    const dragControls = useDragControls();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const walletId = wallet?.address || "guest";
    const storageKey = `vytronix_ai_chat_${walletId}`;

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : DEFAULT_HISTORY(language);
    });

    // Key-based remount is handled by the parent or by adding key to the container
    // Removed the effect that caused cascading renders on storageKey change.

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(chatHistory));
    }, [chatHistory, storageKey]);

    const handleClearChat = () => {
        setChatHistory(DEFAULT_HISTORY(language));
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_HISTORY(language)));
    };

    const agentAddress = "0x8004...Vytr0nix";
    const [isThinking, setIsThinking] = useState(false);

    // Vytronix AI Context & Multi-language suggestions
    const aiSuggestions = useMemo(() => [
        t.bot_suggest_audit,
        t.bot_suggest_contract,
        t.bot_suggest_whales,
        t.bot_suggest_price
    ], [t]);

    // Handle language change for the initial greeting - Optimized to avoid cascading renders
    const lastLanguage = useRef(language);
    useEffect(() => {
        if (lastLanguage.current !== language) {
            lastLanguage.current = language;
            // Use timeout to avoid synchronous setState inside effect warning
            setTimeout(() => {
                setChatHistory(prev => {
                    if (prev.length === 0) return DEFAULT_HISTORY(language);
                    const firstMsg = prev[0];
                    if (firstMsg.sender === "bot") {
                        const possibleGreetings = Object.values(translations).map(lang => lang.bot_greeting);
                        if (possibleGreetings.includes(firstMsg.text)) {
                            const newHistory = [...prev];
                            newHistory[0] = { ...firstMsg, text: t.bot_greeting };
                            return newHistory;
                        }
                    }
                    return prev;
                });
            }, 0);
        }
    }, [language, t.bot_greeting]);

    // Appear every 20 seconds
    useEffect(() => {
        const tooltipInterval = setInterval(() => {
            if (!isChatOpen) {
                setMessageIndex(prev => (prev + 1) % aiSuggestions.length);
                setIsTooltipVisible(true);

                // Hide tooltip after 5 seconds
                setTimeout(() => {
                    setIsTooltipVisible(false);
                }, 5000);
            }
        }, 20000); // Every 20 seconds

        return () => clearInterval(tooltipInterval);
    }, [isChatOpen, aiSuggestions.length]);

    // PROACTIVE SNIPER PERSONALITY: Listen to the pulse feed and "shout" alerts
    useEffect(() => {
        if (!networkMode) return;

        // Compare length to detect new events
        if (networkFeed.length > lastFeedCount.current) {
            const latest = networkFeed[networkFeed.length - 1];
            lastFeedCount.current = networkFeed.length;

            // Only alert on major dominance or big executions
            if (latest.type === "BUY DOMINANCE" || (latest.type === "ORDER_EXECUTION" && parseFloat(latest.metricValue) > 50000)) {
                const sniperAlert = t.bot_sniper_alert
                    .replace('{type}', latest.type)
                    .replace('{token}', latest.tokenSymbol)
                    .replace('{chain}', latest.chain)
                    .replace('{val}', latest.metricValue);

                // Wrap in timeout to avoid cascading render warning in React
                setTimeout(() => {
                    setChatHistory(prev => {
                        if (prev[prev.length - 1]?.text === sniperAlert) return prev;
                        return [...prev, { sender: "bot", text: sniperAlert }];
                    });

                    if (!isChatOpen) {
                        setDynamicAlert(sniperAlert);
                        setMessageIndex(-1); // Signal for dynamic alert
                        setIsTooltipVisible(true);
                    }
                }, 0);

                if (!isChatOpen) {
                    setTimeout(() => setIsTooltipVisible(false), 8000);
                }
            }
        }
    }, [networkFeed, networkMode, isChatOpen, language, t.bot_sniper_alert]);

    // ARBITRAGE PROACTIVE: Detect profitable spreads and alert
    useEffect(() => {
        if (!networkMode || arbitrageOpportunities.length === 0) return;

        if (arbitrageOpportunities.length > lastArbCount.current) {
            const sorted = [...arbitrageOpportunities].sort((a, b) => b.profit - a.profit);
            const best = sorted[0];
            lastArbCount.current = arbitrageOpportunities.length;

            if (best && best.profit > 1.5) {
                const arbAlert = t.bot_arb_alert
                    .replace('{token}', best.token)
                    .replace('{spread}', best.profit.toFixed(2))
                    .replace('{buy}', best.buyExchange)
                    .replace('{sell}', best.sellExchange);

                setTimeout(() => {
                    setChatHistory((prev: ChatMessage[]) => {
                        if (prev[prev.length - 1]?.text === arbAlert) return prev;
                        return [...prev, { sender: "bot", text: arbAlert }];
                    });
                }, 100);
            }
        }
    }, [arbitrageOpportunities, networkMode, language, t.bot_arb_alert]);

    // DERIVED GLOBAL MOOD: Fast pulse if hyperactive, slow if calm
    const [hyperActive, setHyperActive] = useState(false);
    useEffect(() => {
        const checkHyper = () => {
            const now = Date.now();
            setHyperActive(networkFeed.filter(f => (now - f.time) < 30000).length > 3);
        };
        checkHyper();
        const interval = setInterval(checkHyper, 5000);
        return () => clearInterval(interval);
    }, [networkFeed]);

    // REAL_TIME_MOUSE_TRACKER: Tactical Crosshair - Optimized with MotionValues to avoid re-renders
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        if (isBotVisible) {
            window.addEventListener("mousemove", handleMouseMove);
        }
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isBotVisible, mouseX, mouseY]);

    // NEURAL_GLITCH: Triggers on hyperactivity or large whales
    useEffect(() => {
        if (hyperActive || networkFeed.some(f => f.type === "ORDER_EXECUTION" && parseFloat(f.metricValue.replace('$', '').replace('K', '000')) > 500000)) {
            const triggerGlitch = () => {
                setIsGlitching(true);
                setTimeout(() => setIsGlitching(false), 150);
            };
            const tid = setInterval(triggerGlitch, Math.random() * 5000 + 4000);
            return () => clearInterval(tid);
        }
    }, [hyperActive, networkFeed]);

    // Auto-scroll chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, isChatOpen]);

    const handleSendMessage = (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e && 'preventDefault' in e) e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setChatHistory((prev: ChatMessage[]) => [...prev, { sender: "user", text: userMsg }]);
        setInputValue("");
        setIsThinking(true);

        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            const ethRegex = /0x[a-fA-F0-9]{40}/;
            const solRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
            const isAddress = ethRegex.test(userMsg) || solRegex.test(userMsg);

            if (isAddress) {
                const addr = (userMsg.match(ethRegex)?.[0] || userMsg.match(solRegex)?.[0]) || "CA_UNKNOWN";
                setIsThinking(false);

                const t_lock = t.bot_lock_on.replace('{addr}', `${addr.substring(0, 10)}...`);
                const t_lp = t.bot_lp_scan;
                const t_auth = t.bot_auth_scan;

                setChatHistory((p: ChatMessage[]) => [...p, { sender: "bot", text: t_lock }]);
                setTimeout(() => setChatHistory((p: ChatMessage[]) => [...p, { sender: "bot", text: t_lp }]), 800);
                setTimeout(() => setChatHistory((p: ChatMessage[]) => [...p, { sender: "bot", text: t_auth }]), 1600);
                setTimeout(() => {
                    const isRug = Math.random() > 0.8;
                    const verdict = isRug ? t.bot_report_conclusion_rug : t.bot_report_conclusion_safe;
                    const status = isRug ? t.bot_rug_alert : t.bot_safe_report;

                    const finalReport = `${t.bot_report_final}: ${status}\n${t.bot_report_adr}: ${addr.substring(0, 10)}...\n${t.bot_report_lp}: ${isRug ? t.bot_report_unlocked : t.bot_report_locked}\n${t.bot_report_renounced}: ${isRug ? t.bot_report_no : t.bot_report_yes}\n${t.bot_report_verdict}: ${verdict}`;
                    setChatHistory((p: ChatMessage[]) => [...p, { sender: "bot", text: finalReport }]);
                }, 2400);

                return;
            }

            let botReply = "";
            if (lowerMsg.includes("precio") || lowerMsg.includes("price") || lowerMsg.includes("价格")) {
                botReply = t.bot_price_reply;
            } else if (lowerMsg.includes("whale") || lowerMsg.includes("ballena") || lowerMsg.includes("大户")) {
                botReply = t.bot_whale_reply.replace('{count}', networkFeed.length.toString());
            } else {
                botReply = t.bot_command_reply;
            }

            setChatHistory((prev: ChatMessage[]) => [...prev, { sender: "bot", text: botReply }]);
            setIsThinking(false);
        }, 1500);
    };



    return (
        <>
            <motion.div
                key={walletId}
                drag
                dragListener={false}
                dragControls={dragControls}
                dragMomentum={false}
                dragElastic={0}
                className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 text-left select-none"
            >

                {/* --- Chat Window --- */}
                <AnimatePresence>
                    {isChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-[320px] sm:w-[380px] bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col mb-4 overflow-hidden"
                        >
                            {/* Header */}
                            <div className={`bg-black text-[#00ff41] p-3 flex justify-between items-center border-b-4 border-black ${isGlitching ? 'translate-x-[2px] skew-x-1' : ''}`}>
                                <div className="flex flex-col">
                                    <div className={`flex items-center gap-2 ${hyperActive ? 'animate-pulse text-red-500' : ''}`}>
                                        <Terminal size={18} />
                                        <span className="font-black tracking-widest uppercase">{hyperActive ? t.bot_overdrive : t.bot_core_title}</span>
                                    </div>
                                    <div className="text-[10px] flex items-center justify-between mt-1 -mb-1 w-full relative">
                                        {isGlitching && <div className="absolute inset-0 bg-[#00ff41]/20 -z-10 mix-blend-screen" />}
                                        <div className="flex items-center gap-2 opacity-80">
                                            <div className={`w-2 h-2 rounded-full ${networkMode ? 'bg-[#00ff41] animate-pulse' : 'bg-red-500'}`} />
                                            <span>EIP-8004 ID: <span className="font-mono text-[9px]">{agentAddress}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-[#00ff41] text-black px-1 font-black px-1.5 rounded-sm">
                                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                                            <span className="text-[8px] uppercase">{t.bot_neural_state}: {t.bot_neural_state_active}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button
                                        onClick={handleClearChat}
                                        aria-label={t.bot_clear_chat}
                                        className="text-white hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsChatOpen(false)}
                                        aria-label={t.bot_close_chat}
                                        className="text-white hover:text-red-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Neural Telemetry Header */}
                            <div className="bg-black/95 border-b-2 border-black p-1.5 flex justify-around text-[7px] font-black uppercase tracking-widest text-white">
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">{t.bot_threat_label}:</span>
                                    <span className={hyperActive ? "text-red-500 animate-pulse" : "text-[#00ff41]"}>
                                        {hyperActive ? t.bot_threat_volatile : t.bot_threat_minimal}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">{t.bot_gas_label}:</span>
                                    <span className="text-[#00ff41]">3.1 GWEI</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">{t.bot_ping_label}:</span>
                                    <span className="text-[#00ff41]">12MS</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">{t.bot_load_label}:</span>
                                    <span className="text-[#00ff41]">14%</span>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="h-[300px] overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50">
                                {chatHistory.map((msg: ChatMessage, i: number) => (
                                    <div key={i} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 border-2 border-black max-w-[85%] ${msg.sender === 'user'
                                            ? 'bg-black text-white font-bold ml-4'
                                            : 'bg-white text-black font-mono text-sm mr-4 shadow-[3px_3px_0_rgba(0,0,0,1)]'
                                            }`}>
                                            {msg.sender === 'bot' && (
                                                <div className="text-[10px] text-[#00ff41] bg-black inline-block px-1 mb-1 font-black uppercase">
                                                    AI_SYS
                                                </div>
                                            )}
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-black text-[#00ff41] p-2 border-2 border-black flex items-center gap-2 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                                            <div className="w-2 h-2 bg-[#00ff41] animate-bounce" />
                                            <span className="text-[10px] uppercase font-black">{t.bot_thinking}</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t-4 border-black bg-white p-2">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        placeholder={t.bot_placeholder}
                                        className="flex-grow bg-zinc-100 border-2 border-black p-2 outline-none font-bold placeholder:text-zinc-400 focus:bg-white transition-colors uppercase text-sm"
                                    />
                                    <button
                                        type="submit"
                                        aria-label={t.bot_send_message}
                                        disabled={!inputValue.trim()}
                                        className="bg-black text-[#00ff41] border-2 border-black p-2 hover:bg-[#00ff41] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>

                                {/* Quick Action Chips */}
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {QUICK_COMMANDS.map((q) => (
                                        <button
                                            key={q.label}
                                            onClick={() => {
                                                if (q.cmd.endsWith(" ")) {
                                                    setInputValue(q.cmd);
                                                } else {
                                                    setInputValue(q.cmd);
                                                    handleSendMessage();
                                                }
                                            }}
                                            className="text-[8px] font-black uppercase bg-white border-2 border-black px-1.5 py-0.5 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-0.5 translate-x-0 active:translate-x-0.5"
                                        >
                                            [{q.label}]
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Tooltip Suggestion --- */}
                <AnimatePresence>
                    {isTooltipVisible && !isChatOpen && isBotVisible && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white border-4 border-black p-3 shadow-[6px_6px_0_rgba(0,0,0,1)] relative max-w-[280px]"
                        >
                            <button
                                onClick={() => setIsTooltipVisible(false)}
                                aria-label={t.bot_close_suggestion}
                                className="absolute -top-3 -right-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors border-2 border-black active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none"
                            >
                                <X size={14} />
                            </button>
                            <p className="font-mono text-xs leading-tight text-black flex items-start gap-2">
                                <ArrowRight size={12} className="shrink-0 mt-0.5 text-[#00ff41]" />
                                <span className="font-bold">{messageIndex === -1 ? dynamicAlert : aiSuggestions[messageIndex]}</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Bot Avatar --- */}
                <AnimatePresence>
                    {isBotVisible && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative"
                        >
                            {/* Status Blip */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff41] rounded-full border-2 border-black animate-ping z-10" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff41] rounded-full border-2 border-black z-10" />

                            <button
                                onPointerDown={(e) => dragControls.start(e)}
                                onClick={() => {
                                    setIsChatOpen(!isChatOpen);
                                    setIsTooltipVisible(false);
                                }}
                                aria-label="Toggle AI Bot"
                                className={`
                                relative w-16 h-16 border-4 border-black flex items-center justify-center shadow-[6px_6px_0_rgba(0,0,0,1)] 
                                transition-all cursor-grab active:cursor-grabbing group overflow-hidden
                                ${isChatOpen ? 'bg-[#00ff41] text-black translate-y-1 translate-x-1 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-black text-white hover:bg-zinc-800'}
                            `}
                            >
                                {/* Visual Sniper Halo effect when network is on */}
                                {networkMode && (
                                    <div className={`absolute inset-0 border-2 border-[#00ff41] animate-ping opacity-30 pointer-events-none ${hyperActive ? '[animation-duration:0.6s]' : '[animation-duration:2.5s]'}`} />
                                )}

                                {isChatOpen ? <MessageSquareText size={32} /> : <BrutalistRobot isActive={networkMode} tiltX={tiltX} tiltY={tiltY} />}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
            {/* Tactical Crosshair - Moved OUTSIDE the draggable container to restore absolute tracking */}
            {
                networkMode && !isChatOpen && isBotVisible && (
                    <motion.div
                        className="fixed pointer-events-none z-[100] mix-blend-difference"
                        style={{ x: mouseX, y: mouseY, left: 0, top: 0 }}
                    >
                        <div className="absolute w-[80px] h-[1px] bg-[#00ff41] -translate-x-[40px] opacity-40 shrink-0" />
                        <div className="absolute w-[1px] h-[80px] bg-[#00ff41] -translate-y-[40px] opacity-40 shrink-0" />
                        <div className="absolute w-6 h-6 border-2 border-[#00ff41] -translate-x-3 -translate-y-3 rounded-full opacity-60 animate-pulse shrink-0" />
                        <motion.div className="absolute top-4 left-4 font-mono text-[8px] text-[#00ff41] font-black uppercase tracking-tighter shadow-black drop-shadow-md">
                            TAR: <motion.span>{displayX}</motion.span>,<motion.span>{displayY}</motion.span><br />
                            NET: STABLE
                        </motion.div>
                    </motion.div>
                )
            }
        </>
    );
}
