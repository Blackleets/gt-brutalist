import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { CHAINS } from "@/lib/chains";
import { executeRealApiRequest } from "@/lib/chains";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { translations } from "@/lib/translations";

export function ApiHub() {
    const { selectedChain, apiKey, setApiKey, language } = useAppStore();
    const t = translations[language];
    const [testEndpoint, setTestEndpoint] = useState("https://api.dexscreener.com/latest/dex/search?q=USDT");
    const [response, setResponse] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const chainName = CHAINS[selectedChain].name;

    const handleExecute = async () => {
        setLoading(true);
        setResponse("");
        try {
            const res = await executeRealApiRequest(testEndpoint, "GET", apiKey);
            setResponse(JSON.stringify(res, null, 2));
        } catch (e: unknown) {
            setResponse(JSON.stringify({ error: e instanceof Error ? e.message : "Execution Failed" }, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-4 border-black p-6 md:p-8 relative z-10 bg-[#fffc20] shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div>
                <h2 className="text-3xl xs:text-4xl md:text-6xl font-black uppercase mb-6 md:mb-8 border-b-4 border-black pb-4 leading-tight">
                    {t.apihub_title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-sm font-bold uppercase mb-1 md:mb-2">{t.apihub_key_label}</label>
                            <input
                                type="password"
                                className="w-full bg-white border-2 md:border-4 border-black p-3 md:p-4 font-mono focus:outline-none focus:ring-4 ring-black/20 text-sm md:text-lg"
                                placeholder={t.apihub_key_placeholder}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-sm font-bold uppercase mb-1 md:mb-2">{t.apihub_network_label}</label>
                            <div className="w-full bg-gray-200 border-2 md:border-4 border-black p-3 md:p-4 font-mono font-bold uppercase text-sm md:text-base">
                                {chainName}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-sm font-bold uppercase mb-1 md:mb-2">{t.apihub_catalog_label}</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-white border-2 md:border-4 border-black p-3 md:p-4 font-mono font-bold appearance-none cursor-pointer focus:outline-none text-sm md:text-base pr-10"
                                    value={testEndpoint}
                                    onChange={(e) => setTestEndpoint(e.target.value)}
                                    title="Select API Endpoint"
                                >
                                    <option value="https://api.dexscreener.com/latest/dex/search?q=USDT">DexScreener Search (USDT)</option>
                                    <option value={`https://api.dexscreener.com/latest/dex/search?q=${selectedChain}`}>DexScreener Search (Chain)</option>
                                    <option value="https://api.coingecko.com/api/v3/ping">CoinGecko Ping (Health)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black text-xl">
                                    ↓
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleExecute}
                            disabled={loading}
                            className="w-full rounded-none border-4 border-black bg-black text-[#fffc20] text-lg md:text-xl px-6 md:px-10 py-6 md:py-8 hover:bg-white hover:text-black transition-none uppercase font-black tracking-wider disabled:opacity-50"
                        >
                            {loading ? t.apihub_executing : t.apihub_execute_req}
                        </Button>
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[300px] xs:h-[400px]">
                        <Card className="rounded-none border-4 border-black bg-black text-[#00ff41] shadow-none h-full font-mono overflow-auto">
                            <CardContent className="p-4 md:p-6">
                                <div className="text-[10px] md:text-xs uppercase text-gray-400 mb-3 md:mb-4 border-b border-gray-800 pb-2">{t.apihub_terminal_output}</div>
                                {response ? (
                                    <pre className="text-[10px] md:text-sm whitespace-pre-wrap breakdown-all leading-tight">{response}</pre>
                                ) : (
                                    <div className="text-gray-600 italic text-[10px] md:text-sm">{t.apihub_awaiting}</div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
