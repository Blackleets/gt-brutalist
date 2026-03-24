import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
        arbitrageOpportunities,
        riskProfile
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

    // Derived transforms for head tilt
    const rawTiltX = useTransform(mouseX, (v) => ((v / windowSize.w) - 0.5) * 40);
    const rawTiltY = useTransform(mouseY, (v) => -((v / windowSize.h) - 0.5) * 40);
    const tiltX = useSpring(rawTiltX, { damping: 25, stiffness: 120 });
    const tiltY = useSpring(rawTiltY, { damping: 25, stiffness: 120 });

    const displayX = useTransform(mouseX, (v) => v.toFixed(0));
    const displayY = useTransform(mouseY, (v) => v.toFixed(0));
    // Derived transforms for head tilt
    const rawTiltX = useTransform(mouseX, (v) => ((v / windowSize.w) - 0.5) * 40);
    const rawTiltY = useTransform(mouseY, (v) => -((v / windowSize.h) - 0.5) * 40);

    const dragControls = useDragControls();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const walletId = wallet?.address || "guest";
    const storageKey = `vytronix_ai_chat_${walletId}`;

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : DEFAULT_HISTORY(language);
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(chatHistory));
    }, [chatHistory, storageKey]);

    const handleClearChat = () => {
        setChatHistory(DEFAULT_HISTORY(language));
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_HISTORY(language)));
    };

    const agentAddress = "0x8004...Vytr0nix";
    const [isThinking, setIsThinking] = useState(false);

    const aiSuggestions = useMemo(() => [
        t.bot_suggest_audit,
        t.bot_suggest_visualize,
        t.bot_suggest_whales,
        t.bot_terminal_mode
    ].filter(Boolean) as string[], [t]);

    const lastLanguage = useRef(language);
    useEffect(() => {
        if (lastLanguage.current !== language) {
            lastLanguage.current = language;
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

    useEffect(() => {
        const tooltipInterval = setInterval(() => {
            if (!isChatOpen) {
                setMessageIndex(prev => (prev + 1) % aiSuggestions.length);
                setIsTooltipVisible(true);
                setTimeout(() => {
                    setIsTooltipVisible(false);
                }, 5000);
            }
        }, 20000);

        return () => clearInterval(tooltipInterval);
    }, [isChatOpen, aiSuggestions.length]);

    const playAudio = useCallback((type: "msg" | "alert") => {
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
    }, [isAudioEnabled]);

    const lastInsightsRef = useRef<Record<string, number>>({}); 

    useEffect(() => {
        if (!networkMode) return;

        const aiLoop = setInterval(() => {
            const now = Date.now();
            const cooldown = 180000;
            let proActiveMsg = "";

            const candidates = globalRankings.map(p => {
                const arb = arbitrageOpportunities.find(a => a.token === p.baseToken.symbol);
                const liqScore = Math.min(p.liquidityUsd / 200000, 1) * 30;
                const volScore = Math.min(p.volume24hUsd / 100000, 1) * 20;
                const momScore = Math.min((p.priceChange24h ?? p.priceChange5m) / 10, 1) * 20;
                const arbScore = arb ? 30 : 0;
                const totalScore = liqScore + volScore + momScore + arbScore;
                return { pool: p, score: totalScore, arb };
            }).sort((a,b) => b.score - a.score);

            const minLiq = riskProfile === "CONS" ? 300000 : riskProfile === "BAL" ? 100000 : 50000;
            const minScore = riskProfile === "CONS" ? 75 : riskProfile === "BAL" ? 50 : 30;
            const volThreshold = riskProfile === "CONS" ? 15 : 100;

            if (candidates.length > 0) {
                const best = candidates[0];
                const key = `decision_${best.pool.baseToken.address}`;
                
                if (!lastInsightsRef.current[key] || now - lastInsightsRef.current[key] > cooldown) {
                    const meetsLiq = best.pool.liquidityUsd >= minLiq;
                    const isNotTooVolatile = Math.abs(best.pool.priceChange24h || 0) <= volThreshold;

                    if (best.score >= minScore && meetsLiq && isNotTooVolatile) {
                        const tonePrefix = riskProfile === "CONS" ? "[AI_CONSERVATIVE]" : riskProfile === "AGGR" ? "[AI_AGGRESSIVE]" : "[AI_SYS]";
                        const riskPhrase = riskProfile === "CONS" ? "High-confidence opportunity" : riskProfile === "BAL" ? "Strong setup detected" : "Early opportunity detected";
                        
                        if (best.score > 75) {
                            proActiveMsg = `${tonePrefix}\n${riskPhrase} on ${best.pool.baseToken.symbol}\n\nENTRY: Favorable\nConditions aligned for potential entry. Score: ${Math.round(best.score)}/100.`;
                        } else if (best.score > 50) {
                            proActiveMsg = `${tonePrefix}\n${riskPhrase} on ${best.pool.baseToken.symbol}\n\nENTRY: Wait\nMomentum present but confirmation needed. Score: ${Math.round(best.score)}/100.`;
                        } else if (best.score > 30) {
                            proActiveMsg = `${tonePrefix}\n${riskPhrase} on ${best.pool.baseToken.symbol}\n\nACTION: Avoid\nWeak structure or inconsistent data. Score: ${Math.round(best.score)}/100.`;
                        }
                    }
                    
                    if (proActiveMsg) {
                        lastInsightsRef.current[key] = now;
                    }
                }
            }

            // Failsafe
            const anyPassedFullListing = candidates.some(c => {
                const cLiq = riskProfile === "CONS" ? 300000 : riskProfile === "BAL" ? 100000 : 50000;
                const cScore = riskProfile === "CONS" ? 75 : riskProfile === "BAL" ? 50 : 30;
                const cVol = riskProfile === "CONS" ? 15 : 100;
                return c.score >= cScore && c.pool.liquidityUsd >= cLiq && Math.abs(c.pool.priceChange24h || 0) <= cVol;
            });

            if (!anyPassedFullListing && !proActiveMsg && candidates.length > 0) {
                const failsafeKey = `failsafe_${riskProfile}`;
                if (!lastInsightsRef.current[failsafeKey] || now - lastInsightsRef.current[failsafeKey] > 300000) {
                    proActiveMsg = `[AI_SYS]\nNo valid opportunities under current risk profile (${riskProfile}).\nFilters: Score > ${minScore}, Liq > ${minLiq}.`;
                    lastInsightsRef.current[failsafeKey] = now;
                }
            }

            // Fallback for Volume Spikes
            if (!proActiveMsg && networkFeed.length > 0) {
                const spike = networkFeed.slice(0, 5).find(f => f.type === "OPPORTUNITY_DETECTED" && parseFloat(f.metricValue.replace(/[^0-9.]/g, '')) > 100000);
                if (spike) {
                    const key = `spike_${spike.tokenSymbol}`;
                    if (!lastInsightsRef.current[key] || now - lastInsightsRef.current[key] > cooldown) {
                        proActiveMsg = `[AI_SYS]\nUnusual volume expansion on ${spike.tokenSymbol}. Whale accumulation confirmed. Watchlist entry triggered.`;
                        lastInsightsRef.current[key] = now;
                    }
                }
            }

            if (proActiveMsg) {
                setChatHistory(prev => {
                    if (prev.length > 0 && prev[prev.length - 1].text === proActiveMsg) return prev;
                    return [...prev, { sender: "bot", text: proActiveMsg, type: "text" }];
                });
                playAudio("alert");
                if (!isChatOpen) {
                    setIsTooltipVisible(true);
                    setTimeout(() => setIsTooltipVisible(false), 8000);
                }
            }

        }, 12000);

        return () => clearInterval(aiLoop);
    }, [networkMode, globalRankings, networkFeed, arbitrageOpportunities, isChatOpen, playAudio, riskProfile]);

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

    useEffect(() => {
        if (hyperActive || networkFeed.some(f => f.type === "OPPORTUNITY_DETECTED" && parseFloat(f.metricValue.replace(/[^0-9.]/g, '')) > 500000)) {
            const triggerGlitch = () => {
                setIsGlitching(true);
                setTimeout(() => setIsGlitching(false), 150);
            };
            const tid = setInterval(triggerGlitch, Math.random() * 5000 + 4000);
            return () => clearInterval(tid);
        }
    }, [hyperActive, networkFeed]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, isChatOpen]);

    const handleSendMessage = (e?: React.FormEvent | React.KeyboardEvent, forcedCommand?: string) => {
        if (e && 'preventDefault' in e) e.preventDefault();
        const userMsg = forcedCommand || inputValue.trim();
        if (!userMsg) return;

        setChatHistory((prev: ChatMessage[]) => [...prev, { sender: "user", text: userMsg, type: "text" as const }]);
        if (!forcedCommand) setInputValue("");
        setIsThinking(true);
        if (playAudio) playAudio("msg");

        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            const ethRegex = /0x[a-fA-F0-9]{40}/;
            const solRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
            
            let responseText = "";

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
            else if (lowerMsg === "whales" || lowerMsg === "whale_scan") {
                const whaleEvents = networkFeed.filter(f => 
                    f.type === "OPPORTUNITY_DETECTED" && 
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
            else if (lowerMsg === "meta" || lowerMsg === "heatmap") {
                const topGems = [...globalRankings].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
                if (topGems.length > 0) {
                    responseText = `[AI_SYS]\n\n` +
                                 `TOKEN: TOP_TRENDING_ASSETS\n` +
                                 `METRICS:\n` +
                                 topGems.map(g => `• ${g.baseToken.symbol}: ${g.score} PTS | ${(g.priceChange24h ?? 0) > 0 ? '+' : ''}${(g.priceChange24h ?? 0).toFixed(2)}%`).join("\n") +
                                 `\n\nINSIGHT: MARKET MOMENTUM IS CONCENTRATING IN THE ABOVE ASSETS.`;
                } else {
                    responseText = "[AI_SYS]\n\nNo real data available: Global rankings are currently synchronizing.";
                }
            }
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
            else if (lowerMsg === "terminal" || lowerMsg === "modo_terminal") {
                setIsTerminalMode(prev => !prev);
                responseText = `[SYSTEM_MODE_CHANGE] TERMINAL_VIEW: ${!isTerminalMode ? "ACTIVE" : "OFF"}`;
            }
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

                <AnimatePresence>
                    {isChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-[calc(100vw-48px)] sm:w-[440px] bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)] flex flex-col mb-4 overflow-hidden"
                        >
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
                                        className={`transition-colors ${isAudioEnabled ? 'text-[#00ff41]' : 'text-zinc-500'}`}
                                    >
                                        <Activity size={16} className={isAudioEnabled ? 'animate-pulse' : ''} />
                                    </button>
                                    <button onClick={handleClearChat} className="text-white hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                    <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-red-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/95 border-b-2 border-black p-1.5 flex justify-around text-[7px] font-black uppercase tracking-widest text-white">
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">{t.bot_threat_label}:</span>
                                    <span className={hyperActive ? "text-red-500 animate-pulse" : "text-[#00ff41]"}>{hyperActive ? t.bot_threat_volatile : t.bot_threat_minimal}</span>
                                </div>
                                <div className="flex items-center gap-1"><span className="text-zinc-500">{t.bot_gas_label}:</span><span className="text-[#00ff41]">3.1 GWEI</span></div>
                                <div className="flex items-center gap-1"><span className="text-zinc-500">{t.bot_ping_label}:</span><span className="text-[#00ff41]">12MS</span></div>
                                <div className="flex items-center gap-1"><span className="text-zinc-500">{t.bot_load_label}:</span><span className="text-[#00ff41]">14%</span></div>
                            </div>

                            <div className={`h-[380px] overflow-y-auto p-4 flex flex-col gap-4 font-mono transition-all duration-500
                                ${isTerminalMode ? 'bg-black text-[#00ff41]' : 'bg-zinc-50 text-black'}
                            `}>
                                {chatHistory.map((msg: ChatMessage, i: number) => (
                                    <div key={i} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 border-2 border-black max-w-[85%]
                                            ${msg.sender === 'user'
                                                ? (isTerminalMode ? 'bg-[#00ff41] text-black font-black' : 'bg-black text-white font-bold ml-4')
                                                : (isTerminalMode ? 'bg-black border-[#00ff41] text-[#00ff41] shadow-[4px_4px_0_#00ff41]' : 'bg-white text-black font-mono text-sm mr-4 shadow-[3px_3px_0_rgba(0,0,0,1)]')
                                            }`}>
                                            {msg.sender === 'bot' && (
                                                <div className="text-[10px] bg-black inline-block px-1 mb-1 font-black uppercase text-[#00ff41]">AI_SYS</div>
                                            )}
                                            {msg.type === "image" ? (
                                                <div className="space-y-2">
                                                    <img src={msg.imagePath} alt="Market" className="w-full border-2 border-black" />
                                                    <p className="text-[10px] italic">{msg.text}</p>
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-black text-[#00ff41] p-2 border-2 border-black flex items-center gap-2">
                                            <div className="w-2 h-2 bg-[#00ff41] animate-bounce" />
                                            <span className="text-[10px] uppercase font-black">{t.bot_thinking}</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="border-t-4 border-black bg-white p-2">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={t.bot_placeholder}
                                        className="flex-grow bg-zinc-100 border-2 border-black p-2 outline-none font-bold uppercase text-sm"
                                    />
                                    <button type="submit" disabled={!inputValue.trim()} className="bg-black text-[#00ff41] border-2 border-black p-2 hover:bg-[#00ff41] hover:text-black transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                        <Send size={18} />
                                    </button>
                                </form>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {QUICK_COMMANDS.map((q) => (
                                        <button
                                            key={q.label}
                                            onClick={() => {
                                                setInputValue(q.cmd);
                                                if (!q.cmd.endsWith(" ")) handleSendMessage();
                                            }}
                                            className="text-[8px] font-black uppercase bg-white border-2 border-black px-1.5 py-0.5 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_rgba(0,0,0,1)]"
                                        >
                                            [{q.label}]
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence >

                <AnimatePresence>
                    {isTooltipVisible && !isChatOpen && isBotVisible && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white border-4 border-black p-3 shadow-[6px_6px_0_rgba(0,0,0,1)] relative max-w-[280px]"
                        >
                            <button onClick={() => setIsTooltipVisible(false)} className="absolute -top-3 -right-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center border-2 border-black">
                                <X size={14} />
                            </button>
                            <p className="font-mono text-xs leading-tight text-black flex items-start gap-2">
                                <ArrowRight size={12} className="shrink-0 mt-0.5 text-[#00ff41]" />
                                <span className="font-bold">{aiSuggestions[messageIndex]}</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence >

                <AnimatePresence>
                    {isBotVisible && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff41] rounded-full border-2 border-black animate-ping z-10" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff41] rounded-full border-2 border-black z-10" />
                            <button
                                onPointerDown={(e) => dragControls.start(e)}
                                onClick={() => {
                                    setIsChatOpen(!isChatOpen);
                                    setIsTooltipVisible(false);
                                }}
                                className={`relative w-16 h-16 border-4 border-black flex items-center justify-center shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all 
                                    ${isChatOpen ? 'bg-[#00ff41] text-black translate-y-1 translate-x-1 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-black text-white hover:bg-zinc-800'}
                                `}
                            >
                                {isChatOpen ? <MessageSquareText size={32} /> : <BrutalistRobot isActive={networkMode} tiltX={tiltX} tiltY={tiltY} />}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence >
            </motion.div >

            {networkMode && !isChatOpen && isBotVisible && (
                <motion.div className="fixed pointer-events-none z-[100] mix-blend-difference" style={{ x: mouseX, y: mouseY, left: 0, top: 0 }}>
                    <div className="absolute w-[80px] h-[1px] bg-[#00ff41] -translate-x-[40px] opacity-40" />
                    <div className="absolute w-[1px] h-[80px] bg-[#00ff41] -translate-y-[40px] opacity-40" />
                    <div className="absolute w-6 h-6 border-2 border-[#00ff41] -translate-x-3 -translate-y-3 rounded-full opacity-60 animate-pulse" />
                    <motion.div className="absolute top-4 left-4 font-mono text-[8px] text-[#00ff41] font-black uppercase tracking-tighter shadow-black drop-shadow-md">
                        TAR: <motion.span>{displayX}</motion.span>,<motion.span>{displayY}</motion.span><br />
                        NET: STABLE
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}

