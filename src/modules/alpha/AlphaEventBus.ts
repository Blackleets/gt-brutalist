import { AethrixPool } from "@/lib/aethrix";

export interface AlphaSignal {
    token: string;
    symbol: string;
    alpha_score: number;
    risk_score: number;
    liquidity: number;
    volume24h: number;
    chain: string;
    timestamp: number;
    metadata: {
        isPumpFun: boolean;
        smartMoneyIn: boolean;
        trustScore: number;
        reasons: string[];
    };
    poolData: AethrixPool;
}

type AlphaSignalListener = (signal: AlphaSignal) => void;

class AlphaEventBus {
    private listeners: AlphaSignalListener[] = [];

    /**
     * Subscribe to alpha signals
     */
    onSignal(listener: AlphaSignalListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Broadcast an alpha signal to the system
     */
    emit(signal: AlphaSignal) {

        this.listeners.forEach(listener => {
            try {
                listener(signal);
            } catch (err) {
                console.error("[AlphaEventBus] Error in listener:", err);
            }
        });
    }
}

export const alphaBus = new AlphaEventBus();
