import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "@/lib/store";
import { Activity, Zap } from "lucide-react";

export function LiveGraph() {
    const { selectedChain, activeRpcPerChain, latency, activeEnvPerChain, arbitrageOpportunities } = useAppStore();
    const [data, setData] = useState<{ t: number; v: number; maxSpread: number }[]>([]);
    const [currentTps, setCurrentTps] = useState(0);
    const lastBlockRef = useRef<{ number: number; txCount: number; time: number } | null>(null);

    // Track the max spread available right now
    const currentMaxSpread = (arbitrageOpportunities && arbitrageOpportunities.length > 0)
        ? Math.max(...arbitrageOpportunities.map(op => op.profit))
        : 0;

    useEffect(() => {
        const fetchTelemetry = async () => {
            const rpc = activeRpcPerChain[selectedChain];
            if (!rpc) return;

            let tps = 0;
            try {
                if (selectedChain === "solana") {
                    const res = await fetch(rpc, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            id: 1,
                            method: "getRecentPerformanceSamples",
                            params: [1]
                        })
                    });
                    const json = await res.json();
                    if (json.result && json.result[0]) {
                        const sample = json.result[0];
                        tps = Math.round(sample.numTransactions / sample.samplePeriodSecs);
                    } else {
                        tps = 0;
                    }
                } else {
                    const res = await fetch(rpc, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            id: 1,
                            method: "eth_getBlockByNumber",
                            params: ["latest", false]
                        })
                    });
                    const json = await res.json();
                    if (json.result && json.result.transactions) {
                        const blockNum = parseInt(json.result.number, 16);
                        const txCount = json.result.transactions.length;

                        if (lastBlockRef.current && lastBlockRef.current.number !== blockNum) {
                            const timeDiff = (Date.now() - lastBlockRef.current.time) / 1000;
                            tps = Math.round(txCount / Math.max(1, timeDiff));
                        } else {
                            tps = Math.round(txCount / 3);
                        }
                        lastBlockRef.current = { number: blockNum, txCount, time: Date.now() };
                    } else {
                        tps = 0;
                    }
                }
            } catch (err) {
                void err;
                // Silent fail for telemetry, return 0 for realism
                tps = 0;
            }

            setCurrentTps(tps);
        };

        const timer = setTimeout(() => {
            fetchTelemetry();
        }, 0);

        const interval = setInterval(fetchTelemetry, 10000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [selectedChain, activeRpcPerChain]);

    // Graph Data Appender (Ticks every 2 seconds to make the graph feel very alive)
    useEffect(() => {
        const dataInterval = setInterval(() => {
            setData(prev => {
                const next = [...prev, { t: Date.now(), v: currentTps, maxSpread: currentMaxSpread }];
                return next.slice(-25); // Keep last 25 points
            });
        }, 2000);

        return () => clearInterval(dataInterval);
    }, [currentTps, currentMaxSpread]);

    const currentEnv = activeEnvPerChain[selectedChain] || "MAINNET";

    return (
        <div className="border-4 border-black p-6 md:p-8 relative z-10 w-full overflow-hidden bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-6">
                <div>
                    <h2 className="text-3xl xs:text-4xl md:text-6xl font-black uppercase leading-tight">
                        Global Telemetry
                    </h2>
                    <div className="text-[10px] md:text-sm font-bold text-gray-400 mt-1 md:mt-2 uppercase tracking-widest">
                        Live Base Feed — [ {selectedChain} / {currentEnv} ]
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full md:w-auto">
                    <div className="border-2 border-black p-3 md:p-4 bg-[#00ff41]/10">
                        <div className="text-[0.6rem] md:text-[0.65rem] font-black uppercase text-gray-500">Current TPS</div>
                        <div className="text-xl md:text-2xl font-black">{currentTps}</div>
                    </div>
                    <div className="border-2 border-black p-3 md:p-4 bg-black text-white flex flex-col justify-between">
                        <div className="text-[0.6rem] md:text-[0.65rem] font-black uppercase text-gray-400 flex items-center gap-1">
                            <Zap size={10} className="text-[#00ff41]" /> Max Spread
                        </div>
                        <div className="text-xl md:text-2xl font-black text-[#00ff41]">{currentMaxSpread.toFixed(2)}%</div>
                    </div>
                    <div className="border-2 border-black p-3 md:p-4">
                        <div className="text-[0.6rem] md:text-[0.65rem] font-black uppercase text-gray-500">Latency</div>
                        <div className="text-xl md:text-2xl font-black">{latency}ms</div>
                    </div>
                    <div className="border-2 border-black p-3 md:p-4">
                        <div className="text-[0.6rem] md:text-[0.65rem] font-black uppercase text-gray-500">Mode</div>
                        <div className="text-xl md:text-2xl font-black uppercase truncate">{currentEnv}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* TPS Chart */}
                <Card className="rounded-none border-4 border-black bg-white overflow-hidden shadow-none lg:col-span-2 relative group">
                    <div className="absolute top-3 left-4 md:top-4 md:left-6 z-20 bg-black text-white px-2 py-1 text-[8px] md:text-xs font-black uppercase flex items-center gap-2 transition-transform group-hover:scale-105">
                        <Activity size={12} /> Network Load (TPS)
                    </div>
                    <CardContent className="p-0 h-[240px] xs:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <XAxis dataKey="t" hide />
                                <YAxis hide domain={["dataMin-10", "dataMax+10"]} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const val = payload[0].value;
                                            return (
                                                <div className="bg-black text-white p-2 font-mono font-bold uppercase text-[10px] md:text-sm border-2 border-white shadow-[4px_4px_0_rgba(0,255,65,0.4)]">
                                                    {val} TPS
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="stepAfter"
                                    dataKey="v"
                                    stroke="black"
                                    strokeWidth={4}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#00ff41", stroke: "black", strokeWidth: 3 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Spread Volatility Area Chart */}
                <Card className="rounded-none border-4 border-black bg-zinc-900 overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)] relative group">
                    <div className="absolute top-3 right-4 md:top-4 md:right-6 z-20 bg-[#00ff41] text-black px-2 py-1 text-[8px] md:text-xs font-black uppercase flex items-center gap-2 transition-transform group-hover:-translate-x-1 hover:shadow-none">
                        Spread Volatility %
                    </div>
                    <CardContent className="p-0 h-[240px] xs:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00ff41" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="t" hide />
                                <YAxis hide domain={[0, "dataMax + 0.5"]} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const val = payload[0].payload.maxSpread;
                                            return (
                                                <div className="bg-white text-black p-2 font-mono font-bold uppercase text-[10px] md:text-sm border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                                    MAX: +{val.toFixed(2)}%
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="maxSpread"
                                    stroke="#00ff41"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorSpread)"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
