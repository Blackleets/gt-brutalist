import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { X, Terminal, ArrowRight, Send, MessageSquareText, Trash2, Activity } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { findAnswer } from "@/lib/VytronixKnowledge";

const BrutalistRobot = ({ isActive }: { isActive: boolean, tiltX: MotionValue<number>, tiltY: MotionValue<number> }) => (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden group">
        <motion.img 
            src="/vytronix-bot.jpg" 
            alt="Vytronix Sentinel"
            className={`w-[120%] h-[120%] object-cover object-center max-w-none transition-all duration-700 ${isActive ? 'brightness-125 contrast-125' : 'brightness-75 grayscale-[0.5]'}`}
            initial={{ scale: 1.1 }}
            animate={isActive ? { 
                scale: [1.1, 1.15, 1.1],
                filter: ["hue-rotate(0deg)", "hue-rotate(10deg)", "hue-rotate(0deg)"]
            } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        {isActive && (
            <div className="absolute inset-0 bg-[#00ff41]/10 animate-pulse pointer-events-none" />
        )}
        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
    </div>
);

const DEFAULT_HISTORY = (lang: string) => [
    { sender: "bot", text: translations[lang as keyof typeof translations].bot_greeting, type: "text" as const }
];

interface ChatMessage {
    sender: string;
    text: string;
    type?: "text" | "image";
    imagePath?: string;
}

export function AIBot() {
    const { 
        networkMode, 
        wallet, 
        networkFeed, 
        language, 
        audioEnabled: isAudioEnabled, 
        setAudioEnabled: setIsAudioEnabled, 
        marketSentiment,
        globalRankings,
        arbitrageOpportunities
    } = useAppStore();
    const t = translations[language];

    const QUICK_COMMANDS = [
        { label: "AUDIT_CA", cmd: "audit " },
        { label: "WHALE_SCAN", cmd: "whale_scan" },
        { label: "HEATMAP", cmd: "heatmap" },
        { label: "ARBITRAGE", cmd: "arbitrage" },
    ];

    // States
    const [isBotVisible] = useState(true); // Controls the floating avatar
    const [isTooltipVisible, setIsTooltipVisible] = useState(false); // Controls the 20s suggestion bubble
    const [isChatOpen, setIsChatOpen] = useState(false); // Controls the main chat window
    const [messageIndex, setMessageIndex] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [isTerminalMode, setIsTerminalMode] = useState(false);
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
        t.bot_suggest_visualize,
        t.bot_suggest_whales,
        t.bot_terminal_mode
    ].filter(Boolean) as string[], [t]);

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

    // Proactive alerts removed as part of signal simplification effort.

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

    // Audio Feedback helper
    const playAudio = (type: "msg" | "alert") => {
        if (!isAudioEnabled) return;
        try {
            const freq = type === "alert" ? 440 : 880;
            const AudioContextClass = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
            const audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) { console.warn("Audio Context Failed", e); }
    };

    const handleSendMessage = (e?: React.FormEvent | React.KeyboardEvent, forcedCommand?: string) => {
        if (e && 'preventDefault' in e) e.preventDefault();
        const userMsg = forcedCommand || inputValue.trim();
        if (!userMsg) return;

        setChatHistory((prev: ChatMessage[]) => [...prev, { sender: "user", text: userMsg, type: "text" as const }]);
        if (!forcedCommand) setInputValue("");
        setIsThinking(true);
        if (playAudio) playAudio("msg");

        // Real-time Command Processing
        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            const ethRegex = /0x[a-fA-F0-9]{40}/;
            const solRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
            
            let responseText = "";

            // 1. AUDIT_CA LOGIC (Real Data)
            if (lowerMsg.startsWith("audit ") || ethRegex.test(userMsg) || solRegex.test(userMsg)) {
                const addr = (userMsg.match(ethRegex)?.[0] || userMsg.match(solRegex)?.[0] || lowerMsg.replace("audit ", "").trim()) || "";
                const pool = globalRankings.find(p => 
                    p.baseToken.address.toLowerCase() === addr.toLowerCase() || 
                    p.baseToken.symbol.toLowerCase() === addr.toLowerCase()
                );

                if (pool) {
                    responseText = `[AI_SYS]\n\n` +
                                 `TOKEN: ${pool.baseToken.symbol}\n` +
                                 `METRICS:\n` +
                                 `• LIQUIDITY: $${pool.liquidityUsd.toLocaleString()}\n` +
                                 `• VOLUME_24H: $${pool.volume24hUsd.toLocaleString()}\n` +
                                 `• ALPHA_SCORE: ${pool.score}/100\n` +
                                 `• PRICE_CHG_5M: ${pool.priceChange5m?.toFixed(2)}%\n\n` +
                                 `INSIGHT: ${pool.score > 80 ? "HIGH_CONFIDENCE_ENTRY - BULLISH MOMENTUM" : pool.score > 50 ? "NEUTRAL_MOMENTUM - MONITORING" : "HIGH_RISK_DETECTED - PROCEED WITH CAUTION"}`;
                } else {
                    responseText = "[AI_SYS]\n\nNo real data available for this contract address. Ensure the scanner is active and the token has liquidity.";
                }
            }
            // 2. WHALE_SCAN LOGIC (Real Data)
            else if (lowerMsg === "whales" || lowerMsg === "whale_scan") {
                // Filter real whale transactions from the network feed (threshold > $10k or has K/M in value)
                const whaleEvents = networkFeed.filter(f => 
                    f.type === "ORDER_EXECUTION" && 
                    (f.metricValue.includes("K") || f.metricValue.includes("M") || parseFloat(f.metricValue.replace(/[^0-9.]/g, '')) > 10000)
                );
                
                if (whaleEvents.length > 0) {
                    responseText = `[AI_SYS]\n\n` +
                                 `TOKEN: ${whaleEvents[0].tokenSymbol} (AND OTHERS)\n` +
                                 `METRICS:\n` +
                                 whaleEvents.slice(0, 3).map(f => `• ${f.tokenSymbol}: ${f.metricValue} → ${f.isPositive ? "ACCUMULATION" : "DISTRIBUTION"}`).join("\n") +
                                 `\n\nINSIGHT: LARGE ON-CHAIN FLOW DETECTED. INSTITUTIONAL POSITIONING IN PROGRESS.`;
                } else {
                    responseText = "[AI_SYS]\n\nNo real data available: No whale activity detected in the current telemetry window.";
                }
            }
            // 3. HEATMAP LOGIC (Real Data)
            else if (lowerMsg === "meta" || lowerMsg === "heatmap") {
                const topGems = [...globalRankings].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
                
                if (topGems.length > 0) {
                    responseText = `[AI_SYS]\n\n` +
                                 `TOKEN: TOP_TRENDING_ASSETS\n` +
                                 `METRICS:\n` +
                                 topGems.map(g => `• ${g.baseToken.symbol}: ${g.score} PTS | ${g.priceChange24h > 0 ? '+' : ''}${g.priceChange24h?.toFixed(2)}%`).join("\n") +
                                 `\n\nINSIGHT: MARKET MOMENTUM IS CONCENTRATING IN THE ABOVE ASSETS.`;
                } else {
                    responseText = "[AI_SYS]\n\nNo real data available: Global rankings are currently synchronizing.";
                }
            }
            // 4. ARBITRAGE LOGIC (Real Data)
            else if (lowerMsg === "arbitrage") {
                const realArbs = arbitrageOpportunities;
                
                if (realArbs.length > 0) {
                    responseText = `[AI_SYS]\n\n` +
                                 `TOKEN: ${realArbs[0].token}\n` +
                                 `METRICS:\n` +
                                 realArbs.slice(0, 3).map(a => `• ${a.token}: ${a.profit}% SPREAD\n  ROUTE: ${a.buyExchange} → ${a.sellExchange}`).join("\n\n") +
                                 `\n\nINSIGHT: EXECUTABLE INEFFICIENCIES DETECTED. LIQUIDITY DEPTH IS SUFFICIENT FOR CAPTURE.`;
                } else {
                    responseText = "[AI_SYS]\n\nNo real data available: No executable arbitrage opportunities currently bypass the safety filters.";
                }
            }
            // 5. Terminal Toggle Logic
            else if (lowerMsg === "terminal" || lowerMsg === "modo_terminal") {
                setIsTerminalMode(prev => !prev);
                responseText = `[SYSTEM_MODE_CHANGE] TERMINAL_VIEW: ${!isTerminalMode ? "ACTIVE" : "OFF"}`;
            }
            // 6. Visualization Logic
            else if (lowerMsg.includes("visualize") || lowerMsg.includes("visualizar")) {
                setChatHistory((prev: ChatMessage[]) => [...prev, { 
                    sender: "bot", 
                    text: "Neural Market Visualization // Live Data Fusion", 
                    type: "image",
                    imagePath: "file:///C:/Users/Usuario/GT-infra/vytronix_market_neural_visualization_1773166375846.png"
                }]);
                setIsThinking(false);
                if (playAudio) playAudio("alert");
                return;
            }
            // Fallback to Knowledge Base
            else {
                const knowledgeAnswer = findAnswer(userMsg, language as "en" | "es" | "zh");
                responseText = knowledgeAnswer || t.bot_command_reply;
            }

            setChatHistory((prev: ChatMessage[]) => [...prev, { 
                sender: "bot", 
                text: responseText, 
                type: "text"
            }]);
            setIsThinking(false);
            if (responseText.includes("[")) playAudio("alert");

        }, 400); 
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
                className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 text-left select-none"
            >

                {/* --- Chat Window --- */}
                <AnimatePresence>
                    {isChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-[calc(100vw-48px)] sm:w-[440px] bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)] flex flex-col mb-4 overflow-hidden"
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
                                            <div className="relative flex items-center justify-center w-2 h-2">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${marketSentiment > 85 ? 'neural-ping-pulse-ultra' : marketSentiment > 60 ? 'neural-ping-pulse-fast' : 'neural-ping-pulse-normal'} ${marketSentiment > 70 ? 'bg-[#00ff41]' : marketSentiment > 40 ? 'bg-[#fffc20]' : 'bg-red-600'}`}></span>
                                                <span className={`relative inline-flex rounded-full h-2 w-2 ${marketSentiment > 70 ? 'bg-[#00ff41]' : marketSentiment > 40 ? 'bg-[#fffc20]' : 'bg-red-600'}`}></span>
                                            </div>
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
                                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                        title="Toggle Audio Feedback"
                                        aria-label="Toggle Audio Feedback"
                                        className={`transition-colors ${isAudioEnabled ? 'text-[#00ff41]' : 'text-zinc-500'}`}
                                    >
                                        <Activity size={16} className={isAudioEnabled ? 'animate-pulse' : ''} />
                                    </button>
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
                            <div className={`h-[380px] overflow-y-auto p-4 flex flex-col gap-4 font-mono transition-all duration-500
                                ${isTerminalMode
                                    ? 'bg-black bg-[linear-gradient(rgba(0,0,0,0.5)_50%,rgba(0,0,0,0)_50%),linear-gradient(90deg,rgba(0,255,0,0.1),rgba(255,0,0,0.1),rgba(0,0,255,0.1))] bg-[length:100%_2px,3px_100%] text-[#00ff41]'
                                    : 'bg-zinc-50 bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] text-black'}
                            `}>
                                {chatHistory.map((msg: ChatMessage, i: number) => (
                                    <div key={i} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 border-2 border-black max-w-[85%] transition-all
                                            ${msg.sender === 'user'
                                                ? (isTerminalMode ? 'bg-[#00ff41] text-black font-black' : 'bg-black text-white font-bold ml-4')
                                                : (isTerminalMode ? 'bg-black border-[#00ff41] text-[#00ff41] shadow-[4px_4px_0_#00ff41]' : 'bg-white text-black font-mono text-sm mr-4 shadow-[3px_3px_0_rgba(0,0,0,1)]')
                                            }`}>
                                            {msg.sender === 'bot' && (
                                                <div className={`text-[10px] bg-black inline-block px-1 mb-1 font-black uppercase ${isTerminalMode ? 'text-[#00ff41]' : 'text-[#00ff41]'}`}>
                                                    AI_SYS
                                                </div>
                                            )}
                                            {msg.type === "image" ? (
                                                <div className="space-y-2">
                                                    <img src={msg.imagePath} alt="Market Visualization" className="w-full border-2 border-black" />
                                                    <p className="text-[10px] italic">{msg.text}</p>
                                                </div>
                                            ) : (
                                                <p className={isTerminalMode ? "leading-tight" : ""}>{msg.text}</p>
                                            )}
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
                                            className="text-[8px] font-black uppercase bg-white border-2 border-black px-1.5 py-0.5 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-0.5 translate-x-0 active:translate-x-0.5 flex items-center gap-1.5 group"
                                        >
                                            <div className="w-1 h-1 bg-[#00ff41] rounded-full animate-pulse group-hover:bg-green-400" />
                                            [{q.label}]
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence >

                {/* --- Tooltip Suggestion --- */}
                <AnimatePresence>
                    {
                        isTooltipVisible && !isChatOpen && isBotVisible && (
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
                                    <span className="font-bold">{aiSuggestions[messageIndex]}</span>
                                </p>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* --- Bot Avatar --- */}
                <AnimatePresence>
                    {
                        isBotVisible && (
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
                        )
                    }
                </AnimatePresence >

            </motion.div >
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
