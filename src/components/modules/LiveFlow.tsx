import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SIGNALS_POSITIVE = [
    "Volume spike",
    "Liquidity rising",
    "Whale accumulation",
    "Breakout forming",
    "Social mention surge",
    "New pair detected"
];

const SIGNALS_NEGATIVE = [
    "Selling pressure",
    "Liquidity drop",
    "Whale dumping",
    "Bearish momentum",
    "Social sentiment drop",
    "High slippage"
];

const TOKENS = [
    "BONK", "WIF", "BODEN", "TREMP", "POPCAT", "MYRO", "MUMU", "SLERF", "BOME",
    "PEPE", "SHIB", "DOGE", "FLOKI", "TURBO", "MEME", "WEN", "DUKO", "TOSHI"
];

interface FlowItem {
    id: number;
    token: string;
    change: number;
    signal: string;
}

const generateRandomItem = (id: number): FlowItem => {
    const isPositive = Math.random() > 0.4; // Slightly more positive
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const changeAmount = (Math.random() * 15).toFixed(1);
    const change = isPositive ? parseFloat(changeAmount) : -parseFloat(changeAmount);
    const signalList = isPositive ? SIGNALS_POSITIVE : SIGNALS_NEGATIVE;
    const signal = signalList[Math.floor(Math.random() * signalList.length)];

    return { id, token, change, signal };
};

export function LiveFlow() {
    const [items, setItems] = useState<FlowItem[]>(() => 
        Array.from({ length: 6 }).map((_, i) => generateRandomItem(i))
    );
    const [counter, setCounter] = useState(6);

    // Update interval
    useEffect(() => {
        const interval = setInterval(() => {
            setItems(prevItems => {
                if (prevItems.length === 0) return prevItems;
                
                const newItems = [...prevItems];
                const numToReplace = Math.random() > 0.7 ? 2 : 1;
                
                let nextCounter = counter;

                for (let i = 0; i < numToReplace; i++) {
                    const idxToReplace = Math.floor(Math.random() * newItems.length);
                    newItems[idxToReplace] = generateRandomItem(nextCounter++);
                }

                setCounter(nextCounter);
                return newItems;
            });
        }, Math.floor(Math.random() * 2000) + 3000); // 3-5 seconds

        return () => clearInterval(interval);
    }, [counter]);

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-sm pointer-events-auto bg-black p-6 border-2 border-zinc-800 shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-dashed border-zinc-800 pb-4">
                <span className="text-[#00ff41] animate-pulse">⚡</span>
                <h3 className="text-white font-black uppercase text-sm tracking-widest">Live Flow</h3>
            </div>
            
            <div className="flex flex-col gap-3 font-mono text-xs uppercase overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => {
                        const isPositive = item.change >= 0;
                        const changeStr = isPositive ? `+${item.change}%` : `${item.change}%`;
                        const colorClass = isPositive ? "text-[#00ff41]" : "text-red-500";

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="flex items-center gap-2 w-full"
                            >
                                <span className="font-bold text-white min-w-[50px]">{item.token}</span>
                                <span className={`font-black min-w-[60px] ${colorClass}`}>{changeStr}</span>
                                <span className="text-zinc-600">→</span>
                                <span className="text-zinc-400 truncate">{item.signal}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
