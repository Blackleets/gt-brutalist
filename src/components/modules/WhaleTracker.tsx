import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Clock, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";


export function WhaleTracker() {
    const { networkMode, language } = useAppStore();
    const tr = translations[language];
    const [totalVolume] = useState<number>(0);

    useEffect(() => {
        // Module temporarily offline — awaiting real data integration
    }, [networkMode]);

    return (
        <section className="px-4 md:px-16 py-8 md:py-16 relative z-10 w-full min-h-[80vh]">
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-4">
                    <div className="flex flex-col">
                        <div className="inline-block bg-black text-[#00ff41] px-3 py-1 text-[10px] md:text-sm font-black uppercase tracking-widest w-fit mb-4">
                            Module :: {tr.whale_title}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none flex items-center gap-4">
                            {language === 'en' ? 'Smart Money radar' : language === 'es' ? 'Radar Dinero Inteligente' : '聪明钱雷达'}
                            {networkMode && (
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff41] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00ff41]"></span>
                                </span>
                            )}
                        </h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2 max-w-xl">
                            {tr.whale_subtitle}
                        </p>
                    </div>

                    <div className="flex flex-col text-left md:text-right border-4 border-black p-4 bg-white hidden sm:flex">
                        <span className="text-[10px] font-black uppercase text-zinc-400">{language === 'en' ? 'Total Volume Tracked (24h)' : language === 'es' ? 'Volumen Total Rastreado (24h)' : '24H 总追踪额'}</span>
                        <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-[#00ff41] drop-shadow-[2px_2px_0_#000]">
                            {totalVolume > 0 ? formatCurrency(totalVolume) : <span className="animate-pulse">---</span>}
                        </span>
                    </div>
                </div>

                {/* Main Content Area - WAR ROOM TERMINAL STYLE */}
                <div className="border-4 border-black bg-black shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden relative">
                    {/* Scanline Effect Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.05] bg-[radial-gradient(#00ff41_1px,transparent_1px)] [background-size:20px_20px]" />

                    {/* Table Header (Desktop) */}
                    <div className="hidden md:grid grid-cols-6 gap-4 p-5 border-b-4 border-black bg-zinc-900/50 backdrop-blur-sm text-[11px] font-black uppercase text-[#00ff41]/50 relative z-10">
                        <div className="col-span-1 flex items-center gap-2"><Clock size={12} /> {tr.whale_time}</div>
                        <div className="col-span-1">{language === 'en' ? 'SOURCE_WALLET' : language === 'es' ? 'BILLETERA_ORIGEN' : '来源钱包'}</div>
                        <div className="col-span-1">{tr.whale_type}</div>
                        <div className="col-span-1">{language === 'en' ? 'ASSET_IDENT' : language === 'es' ? 'ID_ACTIVO' : '资产标识'}</div>
                        <div className="col-span-1 text-right">{tr.whale_amount}</div>
                        <div className="col-span-1 text-center">{language === 'en' ? 'STATUS' : language === 'es' ? 'ESTADO' : '状态'}</div>
                    </div>

                    {/* Transaction List */}
                    <div className="flex flex-col items-center justify-center min-h-[400px] relative z-10 font-mono text-[#00ff41] p-10 text-center">
                        <div className="border-2 border-[#00ff41] p-8 bg-zinc-900 shadow-[4px_4px_0_#00ff41]">
                            <p className="text-lg font-black uppercase tracking-[0.2em] mb-2 animate-pulse">
                                Module temporarily offline
                            </p>
                            <p className="text-[10px] font-bold opacity-60">
                                awaiting real data integration
                            </p>
                        </div>
                    </div>

                    {/* Terminal Footer */}
                    <div className="p-3 bg-zinc-900 border-t-4 border-black flex justify-between items-center text-[10px] font-black uppercase tracking-[3px]">
                        <div className="flex gap-4 items-center">
                            <div className="w-2 h-2 bg-[#00ff41] animate-pulse"></div>
                            <span className="text-[#00ff41] opacity-70">SYSLOG_UPLINK_STABLE</span>
                        </div>
                        <div className="text-white/20 italic">VYTRONIX_V2.0_RADAR</div>
                    </div>

                    {!networkMode && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <ShieldAlert size={48} className="text-rose-500 animate-bounce" />
                            <h3 className="text-3xl font-black uppercase text-white tracking-widest">ENCRYPTED_LINK_DOWN</h3>
                            <p className="text-[#00ff41] text-xs font-black uppercase max-w-sm">
                                {language === 'en' ? 'SYSTEM OFFLINE. ENTER NETWORK FOR LIVE DATA.' : language === 'es' ? 'SISTEMA FUERA DE LÍNEA. CONECTA RED PARA DATOS.' : '系统离线。请连接网络获取数据。'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
