import { AethrixPool } from "@/lib/aethrix";
import { AlphaModule, ModuleResult } from "./types";
import { PumpFunScanner } from "./plugins/PumpFunScanner";
import { SmartMoneyDetector } from "./plugins/SmartMoneyDetector";
import { RiskScanner } from "./plugins/RiskScanner";
import { DevWalletTracker } from "./plugins/DevWalletTracker";
import { AlphaSignal, alphaBus } from "./AlphaEventBus";

export class AlphaScoringEngine {
    private plugins: AlphaModule[] = [];

    constructor() {
        // Initialize with default plugins
        this.plugins = [
            new PumpFunScanner(),
            new SmartMoneyDetector(),
            new RiskScanner(),
            new DevWalletTracker()
        ];
    }

    async processPool(pool: AethrixPool) {
        let totalAlphaScore = 0;
        const allReasons: string[] = [];
        let isPumpFun = false;
        let smartMoneyIn = false;
        let contractRisk = 0;

        // Run all plugins in parallel
        const results = await Promise.all(this.plugins.map((p: AlphaModule) => p.analyze(pool)));

        results.forEach((res: ModuleResult, index: number) => {
            const plugin = this.plugins[index];
            totalAlphaScore += res.score;
            if (res.reasons.length > 0) {
                allReasons.push(...res.reasons);
            }

            // Map metadata to signal flags
            if (plugin instanceof PumpFunScanner && res.score > 0) isPumpFun = true;
            if (plugin instanceof SmartMoneyDetector && res.score > 0) smartMoneyIn = true;
            if (plugin instanceof RiskScanner) contractRisk = Math.abs(res.score);
        });

        // Normalize final score 0-100
        const finalScore = Math.max(0, Math.min(100, Math.round(totalAlphaScore + (pool.score / 2))));

        // Attach result to the pool object for UI consumption
        pool.alphaScore = finalScore;
        pool.alphaReasons = allReasons;

        // Emit signal if high alpha detected
        if (finalScore > 65) {
            const signal: AlphaSignal = {
                token: pool.baseToken.address,
                symbol: pool.baseToken.symbol,
                alpha_score: finalScore,
                risk_score: contractRisk,
                liquidity: pool.liquidityUsd,
                volume24h: pool.volume24hUsd,
                chain: pool.chain,
                timestamp: Date.now(),
                metadata: {
                    isPumpFun,
                    smartMoneyIn,
                    trustScore: 100 - contractRisk,
                    reasons: allReasons
                },
                poolData: pool
            };

            alphaBus.emit(signal);
        }
    }
}

export const alphaEngine = new AlphaScoringEngine();
