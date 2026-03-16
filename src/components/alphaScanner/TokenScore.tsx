import { Zap } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";

interface ScoreProps {
    symbol: string;
    score: number;
    metrics: {
        liquidity: number;
        volume: number;
        momentum: number;
    }
}

export function TokenScore({ symbol, score, metrics }: ScoreProps) {
    const { language } = useAppStore();
    const t = translations[language];

    // Determine color based on score
    const getColorClass = (s: number) => {
        if (s >= 80) return "bg-[#00ff41] text-black";
        if (s >= 50) return "bg-[#fffc20] text-black";
        return "bg-red-600 text-white";
    };

    const colorClass = getColorClass(score);

    const barRef = (el: HTMLDivElement | null) => {
        if (el) {
            el.style.width = `${score}%`;
        }
    };

    return (
        <div className="border-4 border-black bg-black p-6 shadow-xl relative overflow-hidden group">
            {/* Background Score Text */}
            <div className="absolute -right-4 -bottom-4 text-8xl font-black text-white/5 italic pointer-events-none group-hover:text-[#00ff41]/10 transition-colors">
                {score}
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[3px] mb-1 block">
                        {t.alpha_token_score}
                    </span>
                    <h4 className="text-3xl font-black text-white italic tracking-tighter">
                        <span className="text-[#00ff41]">$</span>{symbol}
                    </h4>
                </div>
                <div 
                    className={`w-16 h-16 border-4 border-black rounded-none flex items-center justify-center text-2xl font-black italic shadow-md ${colorClass}`}
                >
                    {score}
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {/* Score Bar */}
                <div className="h-6 border-4 border-black bg-zinc-900 overflow-hidden">
                    <div 
                        ref={barRef}
                        className={`h-full transition-all duration-1000 ease-out ${colorClass.split(' ')[0]}`}
                        title={`Score: ${score}%`}
                    />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-zinc-900 border-2 border-black p-2 flex flex-col items-center">
                        <span className="text-[7px] font-black uppercase text-zinc-500">LIQ_STR</span>
                        <span className="text-xs font-black text-white">{metrics.liquidity}%</span>
                    </div>
                    <div className="bg-zinc-900 border-2 border-black p-2 flex flex-col items-center">
                        <span className="text-[7px] font-black uppercase text-zinc-500">VOL_ACC</span>
                        <span className="text-xs font-black text-white">{metrics.volume}%</span>
                    </div>
                    <div className="bg-zinc-900 border-2 border-black p-2 flex flex-col items-center">
                        <span className="text-[7px] font-black uppercase text-zinc-500">MOM_PULSE</span>
                        <span className="text-xs font-black text-[#00ff41]">{metrics.momentum}%</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-zinc-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest italic">
                    {score > 70 ? 'STRONG_ALPHA_SIGNAL_DETECTED' : score > 40 ? 'NEUTRAL_MARKET_POSITION' : 'CAUTION_LOW_RELIABILITY'}
                </span>
            </div>
            
            <Zap size={20} className="absolute top-4 right-4 text-zinc-800 opacity-20" />
        </div>
    );
}

// Wrapper to show Multiple Scores
export function TokenScoreSection({ tokens }: { tokens: TokenData[] }) {
    const { language } = useAppStore();
    const t = translations[language];

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-black flex items-center gap-3">
                <Zap className="fill-[#fffc20] text-black" size={32} />
                {t.alpha_token_score}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tokens.length > 0 ? tokens.slice(0, 4).map(token => {
                    const scoreData = token.score || { total: 0, metrics: { liquidity: 0, volume: 0, momentum: 0 } };
                    return (
                        <TokenScore 
                            key={token.address}
                            symbol={token.symbol}
                            score={scoreData.total}
                            metrics={scoreData.metrics}
                        />
                    );
                }) : (
                    // Fallback
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 border-4 border-black bg-zinc-100 flex items-center justify-center border-dashed opacity-50 font-black uppercase text-zinc-400">
                            AWAITING_DATA...
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Add TokenData interface to keep it consistent
interface TokenData {
    symbol: string;
    address: string;
    liq: number;
    vol: number;
    age: string;
    score?: {
        total: number;
        metrics: {
            liquidity: number;
            volume: number;
            momentum: number;
        }
    };
}
