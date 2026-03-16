import { Clock, ExternalLink, ShieldAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { formatCurrency } from "@/lib/utils";

interface TokenData {
    symbol: string;
    address: string;
    pairAddress: string;
    price: string;
    liq: number;
    vol: number;
    age: string;
    chain: string;
    imageUrl?: string;
}

export function NewTokens({ tokens, loading }: { tokens: TokenData[], loading: boolean }) {
    const { language, networkMode } = useAppStore();
    const t = translations[language];

    if (!networkMode) {
        return (
            <div className="border-4 border-black bg-zinc-900 p-8 text-center flex flex-col items-center gap-4">
                <ShieldAlert size={48} className="text-zinc-600" />
                <p className="text-[#00ff41] font-black uppercase text-xs tracking-widest leading-relaxed">
                    UPLINK_OFFLINE // CONNECT_NETWORK_FOR_LIVE_SCAN
                </p>
            </div>
        );
    }

    return (
        <div className="border-4 border-black bg-black overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="bg-zinc-900 border-b-4 border-black p-4 flex justify-between items-center">
                <h3 className="text-[#00ff41] font-black uppercase text-sm tracking-widest flex items-center gap-2">
                    <Clock size={16} /> {t.alpha_new_tokens}
                </h3>
                {loading && (
                    <div className="text-[10px] text-[#00ff41] animate-pulse font-black uppercase">SCANNING...</div>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-800 text-[10px] font-black uppercase text-zinc-500 border-b-2 border-black">
                        <tr>
                            <th className="p-4">{t.alpha_token_name}</th>
                            <th className="p-4">{t.alpha_age}</th>
                            <th className="p-4">{t.alpha_liquidity}</th>
                            <th className="p-4">{t.alpha_volume}</th>
                            <th className="p-4 text-center">LINK</th>
                        </tr>
                    </thead>
                    <tbody className="text-white font-mono text-xs">
                        {tokens.map((token) => (
                            <tr key={token.pairAddress} className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    {token.imageUrl ? (
                                        <img src={token.imageUrl} className="w-6 h-6 border border-[#00ff41]/30 rotate-3" alt="" />
                                    ) : (
                                        <div className="w-6 h-6 bg-zinc-800 border border-zinc-700 rotate-3" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm text-[#00ff41]">${token.symbol}</span>
                                        <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">{token.chain}</span>
                                    </div>
                                </td>
                                <td className="p-4 font-black">{token.age}</td>
                                <td className="p-4 font-black text-white">{formatCurrency(token.liq)}</td>
                                <td className="p-4 font-black text-white">{formatCurrency(token.vol)}</td>
                                <td className="p-4 text-center">
                                    <a 
                                        href={`https://dexscreener.com/${token.chain}/${token.pairAddress}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title={`View ${token.symbol} on DexScreener`}
                                        className="inline-block p-1 bg-[#00ff41] text-black border-2 border-black hover:bg-white transition-all shadow-[2px_2px_0_rgba(0,0,0,1)]"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {tokens.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-zinc-600 font-black uppercase italic tracking-widest">
                                    NO_NEW_SIGNALS_DETECTED
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-zinc-900 p-2 text-[8px] font-black text-zinc-600 uppercase tracking-[4px] text-center">
                REFRESH_INTERVAL: 60S // DATA_SOURCE: DEXSCREENER_PROFILES
            </div>
        </div>
    );
}
