import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Terminal, Cpu, Database, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function SystemConsole() {
    const { systemLogs, triggerGlobalSync, rpcHealth, latency, language } = useAppStore();
    const t = translations[language];
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [systemLogs, isMinimized]);

    return (
        <section className={`px-4 md:px-16 bg-black border-t-8 border-white/10 relative overflow-hidden transition-all duration-300 ${isMinimized ? 'py-2 h-14' : 'py-8'}`}>
            {/* BACKGROUND MATRIX EFFECT (SIMULATED) */}
            <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden font-mono text-[8px] leading-none text-[#00ff41]">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="whitespace-nowrap matrix-row opacity-50">
                        {Array.from({ length: 50 }).map(() => Math.random().toString(36).substring(2)).join(" ")}
                    </div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                {/* STATUS BAR */}
                <div className={`w-full lg:w-72 shrink-0 ${isMinimized ? 'flex items-center justify-between' : 'space-y-4'}`}>
                    <div className="flex items-center gap-3">
                        <Terminal size={isMinimized ? 16 : 24} className="text-[#00ff41]" />
                        <h2 className={`${isMinimized ? 'text-sm' : 'text-2xl'} font-black uppercase text-white tracking-tighter`}>{t.sys_title}</h2>
                        {isMinimized && (
                            <div className="hidden sm:flex items-center gap-4 ml-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse" />
                                    <span className="text-[10px] text-[#00ff41] font-mono uppercase tracking-widest">{t.sys_live_monitoring}</span>
                                </div>
                                <div className="text-[10px] font-black text-white/40 uppercase space-x-4">
                                    <span>Sync: <span className="text-white">{rpcHealth}</span></span>
                                    <span>Lat: <span className="text-white">{latency}ms</span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isMinimized && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-zinc-900 p-3 border border-zinc-800">
                                <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Cpu size={10} /> {t.sys_core_process}
                                </div>
                                <div className="text-[#00ff41] font-black text-xs uppercase">{t.bot_status_active}</div>
                            </div>
                            <div className="bg-zinc-900 p-3 border border-zinc-800">
                                <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Database size={10} /> {t.sys_data_sync}
                                </div>
                                <div className="text-white font-black text-xs uppercase">{rpcHealth}</div>
                            </div>
                            <div className="bg-zinc-900 p-3 border border-zinc-800">
                                <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Wifi size={10} /> {t.sys_latency}
                                </div>
                                <div className="text-white font-black text-xs uppercase">{latency}MS</div>
                            </div>
                            <button
                                onClick={() => triggerGlobalSync()}
                                className="bg-[#00ff41] p-3 border-2 border-[#00ff41] hover:bg-white transition-colors group"
                            >
                                <div className="text-black font-black text-[8px] uppercase tracking-widest h-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {t.sys_global_sync}
                                </div>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className={`font-black uppercase text-[10px] px-3 py-1.5 transition-all ${isMinimized ? 'bg-[#00ff41] text-black border-2 border-black' : 'bg-transparent text-white border-2 border-white/20 hover:border-white'}`}
                    >
                        {isMinimized ? t.sys_open_terminal : t.sys_minimize_shell}
                    </button>
                </div>

                {!isMinimized && (
                    <div className="flex-1 bg-zinc-950 border-4 border-zinc-900 h-[200px] relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ff41]/20 z-20 animate-scanline" />

                        <div
                            ref={scrollRef}
                            className="h-full overflow-y-auto p-4 font-mono text-[10px] space-y-1.5 flex flex-col-reverse"
                        >
                            <AnimatePresence initial={false}>
                                {systemLogs.length === 0 ? (
                                    <div className="text-zinc-600 italic">{t.sys_idle}</div>
                                ) : (
                                    systemLogs.map((log) => (
                                        <motion.div
                                            key={log.timestamp}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-4 items-start"
                                        >
                                            <span className="text-zinc-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                            <span className={`${log.type === 'success' ? 'text-[#00ff41]' :
                                                log.type === 'error' ? 'text-red-500' :
                                                    log.type === 'warning' ? 'text-yellow-400' :
                                                        'text-zinc-400'
                                                } leading-relaxed`}>
                                                <span className="font-black mr-2">/&gt;</span>
                                                {log.msg}
                                            </span>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-10" />
                    </div>
                )}
            </div>
        </section>
    );
}
