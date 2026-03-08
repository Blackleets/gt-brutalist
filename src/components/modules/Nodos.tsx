import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CHAINS, ChainId, simulateLatency } from "@/lib/chains";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Nodos() {
    const { selectedChain, setSelectedChain, activeRpcPerChain, setActiveRpc, activeEnvPerChain, setActiveEnv } = useAppStore();
    const currentChainData = CHAINS[selectedChain];
    const currentEnv = activeEnvPerChain[selectedChain] || currentChainData.defaultEnvironment;
    const activeEnvironmentData = currentChainData.environments[currentEnv];

    const [latencies, setLatencies] = useState<Record<string, number>>({});
    const [testing, setTesting] = useState(false);

    const runLatencyTests = async () => {
        setTesting(true);
        const results: Record<string, number> = {};
        for (const endpoint of activeEnvironmentData.endpoints) {
            results[endpoint.url] = await simulateLatency(endpoint.url);
        }
        setLatencies(results);
        setTesting(false);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchLatencies = async () => {
            setTesting(true);
            const results: Record<string, number> = {};
            for (const endpoint of activeEnvironmentData.endpoints) {
                results[endpoint.url] = await simulateLatency(endpoint.url);
            }
            if (isMounted) {
                setLatencies(results);
                setTesting(false);
            }
        };

        fetchLatencies();

        return () => {
            isMounted = false;
        };
    }, [selectedChain, currentEnv, activeEnvironmentData.endpoints]);

    return (
        <section className="px-4 md:px-16 py-8 md:py-16 border-b-4 border-black relative z-10 bg-white">
            <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-6 md:pb-8">
                <div>
                    <h2 className="text-3xl xs:text-4xl md:text-6xl font-black uppercase mb-2 md:mb-4 leading-tight">
                        Node Manager
                    </h2>
                    <p className="text-base md:text-xl font-bold text-gray-600 max-w-2xl leading-snug">
                        Select execution environment and route traffic through optimized RPC endpoints.
                    </p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 items-start md:items-end w-full md:w-auto">
                    <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 md:p-2 border-4 border-black w-full md:w-auto">
                        {(Object.keys(CHAINS) as ChainId[]).map((cId) => (
                            <Button
                                key={cId}
                                onClick={() => setSelectedChain(cId)}
                                className={`flex-1 md:flex-none rounded-none border-2 border-transparent uppercase font-black px-4 md:px-6 text-[10px] md:text-sm h-8 md:h-10 ${selectedChain === cId
                                    ? "bg-black text-white hover:bg-black hover:text-white"
                                    : "hover:border-black hover:bg-transparent text-gray-500"
                                    }`}
                            >
                                {CHAINS[cId].name}
                            </Button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2 p-1 border-2 border-dashed border-gray-400 w-full md:w-auto justify-start md:justify-end">
                        {Object.keys(currentChainData.environments).map((envId) => (
                            <Button
                                key={envId}
                                onClick={() => setActiveEnv(selectedChain, envId)}
                                className={`flex-1 md:flex-none rounded-none uppercase font-bold text-[8px] md:text-xs px-3 md:px-4 h-7 md:h-8 ${currentEnv === envId
                                    ? "bg-[#00ff41] text-black hover:bg-[#00ff41]"
                                    : "bg-transparent text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                {currentChainData.environments[envId].name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="text-xl md:text-2xl font-black uppercase">Available Rails</div>
                <Button
                    onClick={runLatencyTests}
                    disabled={testing}
                    className="h-9 md:h-12 rounded-none border-4 border-black uppercase font-black px-4 md:px-6 text-[10px] md:text-sm hover:bg-black hover:text-white"
                >
                    {testing ? "Testing..." : "Ping Nodes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {activeEnvironmentData.endpoints.map((ep) => {
                    const isActive = activeRpcPerChain[selectedChain] === ep.url;
                    const ping = latencies[ep.url];
                    const pingStatus = ping < 50 ? 'text-green-500' : ping < 150 ? 'text-yellow-500' : 'text-red-500';

                    return (
                        <motion.div key={ep.url} whileHover={{ y: -4, x: -4, boxShadow: "4px 4px 0 rgba(0,0,0,1)" }} className="transition-all duration-150">
                            <Card
                                className={`rounded-none border-4 border-black shadow-none h-full cursor-pointer transition-colors ${isActive ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'
                                    }`}
                                onClick={() => setActiveRpc(selectedChain, ep.url)}
                            >
                                <CardContent className="p-4 md:p-6 relative">
                                    <div className="flex justify-between items-start mb-4 md:mb-6">
                                        <div className="font-black text-lg md:text-xl uppercase truncate pr-4">{ep.name}</div>
                                        {isActive && (
                                            <div className="w-3 h-3 md:w-4 md:h-4 shrink-0 rounded-full bg-green-500 border-2 border-black animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                                        )}
                                    </div>

                                    <div className="text-[10px] md:text-sm font-mono opacity-60 mb-6 md:mb-8 truncate">{ep.url}</div>

                                    <div className="flex justify-between items-end border-t-2 border-dashed border-current pt-4">
                                        <div className={`font-mono text-xl md:text-2xl font-bold ${isActive ? 'text-white' : pingStatus}`}>
                                            {ping ? `${ping}ms` : '--'}
                                        </div>
                                        <div className="text-[8px] md:text-xs uppercase font-bold opacity-70">
                                            {isActive ? 'Active Route' : 'Standby'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    );
}
