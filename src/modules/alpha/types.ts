import { AethrixPool } from "@/lib/aethrix";

export interface AlphaModule {
    name: string;
    analyze: (pool: AethrixPool) => Promise<ModuleResult>;
}

export interface ModuleResult {
    score: number;
    reasons: string[];
    metadata?: Record<string, unknown>;
}

export interface AlphaSignalMetadata {
    isPumpFun: boolean;
    smartMoneyIn: boolean;
    devScore: number;
    contractRisk: number;
}
