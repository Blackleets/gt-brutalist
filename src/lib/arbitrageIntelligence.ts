
import { AethrixPool } from "./aethrix";

// 1. DATA MODELS & INTERFACES
export interface MarketData {
    id: string;
    pair: string;
    baseToken: string;
    quoteToken: string;
    dex: string;
    chain: 'solana' | 'bsc';
    price: number;
    liquidity: number;
    fee: number;
}

export interface ArbitrageOpportunity {
    id: string;
    pair: string;
    route: string[]; // ["DEX A", "DEX B"] or ["DEX A", "DEX B", "DEX C"] for triangular
    chain: 'solana' | 'bsc';
    buyPrice?: number;
    sellPrice?: number;
    spread: number;
    liquidity: number;
    priceImpact: number;
    netProfit: number;
    timestamp: number;
}

export interface ExecutedArbitrage {
    id: string;
    wallet: string;
    pair: string;
    route: string[];
    spread: number;
    netProfit: number;
    txHash: string;
    timestamp: number;
    chain: 'solana' | 'bsc';
}

export interface NetworkStats {
    pairsScanned: number;
    opportunitiesDetected: number;
    arbitragesExecuted: number;
    networkProfitToday: number;
    lastUpdate: number;
}

// ARBITRAGE INTELLIGENCE SYSTEM CORE
export class ArbitrageIntelligenceSystem {
    private static instance: ArbitrageIntelligenceSystem;
    private stats: NetworkStats = {
        pairsScanned: 0,
        opportunitiesDetected: 0,
        arbitragesExecuted: 0,
        networkProfitToday: 0,
        lastUpdate: Date.now()
    };

    private executors: ExecutedArbitrage[] = [];
    // private onSignalCallback?: (signal: ExecutedArbitrage) => void;

    private constructor() {}

    public static getInstance() {
        if (!this.instance) this.instance = new ArbitrageIntelligenceSystem();
        return this.instance;
    }

    // Normalization
    private normalizePool(pool: AethrixPool): MarketData {
        return {
            id: pool.id,
            pair: `${pool.baseToken.symbol}/${pool.quoteToken.symbol}`,
            baseToken: pool.baseToken.symbol,
            quoteToken: pool.quoteToken.symbol,
            dex: pool.dex,
            chain: pool.chain as 'solana' | 'bsc',
            price: pool.priceUsd,
            liquidity: pool.liquidityUsd,
            fee: 0.003
        };
    }

    // 4. LIQUIDITY DEPTH PREDICTION ENGINE
    private analyzeLiquidityDepth(liquidity: number, tradeSize: number): { valid: boolean; maxSafeSize: number } {
        const maxSafeSize = liquidity * 0.04; // 4% as mid-range of 3-5%
        return {
            valid: tradeSize <= maxSafeSize && liquidity >= 100000,
            maxSafeSize
        };
    }

    // 5. PRICE IMPACT SIMULATOR
    private simulatePriceImpact(tradeSize: number, poolLiquidity: number): number {
        if (poolLiquidity <= 0) return 100;
        // Formula: (trade_size / (liquidity / 2)) * 100
        return (tradeSize / (poolLiquidity / 2)) * 100;
    }

    // 3. TRIANGULAR ARBITRAGE ENGINE
    private findTriangularOpportunities(data: MarketData[], tradeSize: number): ArbitrageOpportunity[] {
        const opportunities: ArbitrageOpportunity[] = [];
        const tokenMap = new Map<string, MarketData[]>();

        data.forEach(d => {
            if (!tokenMap.has(d.baseToken)) tokenMap.set(d.baseToken, []);
            if (!tokenMap.has(d.quoteToken)) tokenMap.set(d.quoteToken, []);
            tokenMap.get(d.baseToken)!.push(d);
            tokenMap.get(d.quoteToken)!.push(d);
        });

        // Simplified loop detection: A -> B -> C -> A
        // We only look at tokens with high volume/liquidity to maintain accuracy
        const startTokens = ["SOL", "BNB", "USDC", "USDT"];
        
        startTokens.forEach(tokenA => {
            const pairsA = data.filter(p => p.baseToken === tokenA || p.quoteToken === tokenA);
            
            pairsA.forEach(pair1 => {
                const tokenB = pair1.baseToken === tokenA ? pair1.quoteToken : pair1.baseToken;
                const pairsB = data.filter(p => (p.baseToken === tokenB || p.quoteToken === tokenB) && p.pair !== pair1.pair);

                pairsB.forEach(pair2 => {
                    const tokenC = pair2.baseToken === tokenB ? pair2.quoteToken : pair2.baseToken;
                    const pair3 = data.find(p => (p.baseToken === tokenC && p.quoteToken === tokenA) || (p.baseToken === tokenA && p.quoteToken === tokenC));

                    if (pair3) {
                        // We found a loop: A -> B -> C -> A
                        const result = this.calculateTriangularReturn(tokenA, tokenB, tokenC, pair1, pair2, pair3, tradeSize);
                        
                        if (result.netProfit > 0 && result.impact < 0.4 && result.spread > 0.5) {
                            opportunities.push({
                                id: `tri-${pair1.id}-${pair2.id}-${pair3.id}`,
                                pair: tokenA,
                                route: [pair1.dex, pair2.dex, pair3.dex],
                                chain: pair1.chain,
                                spread: result.spread,
                                liquidity: Math.min(pair1.liquidity, pair2.liquidity, pair3.liquidity),
                                priceImpact: result.impact,
                                netProfit: result.netProfit,
                                timestamp: Date.now()
                            });
                        }
                    }
                });
            });
        });

        return opportunities;
    }

    private calculateTriangularReturn(a: string, b: string, c: string, p1: MarketData, p2: MarketData, p3: MarketData, size: number) {
        let amount = size;
        
        // Fee factor
        const F = 0.997; // 1 - 0.003

        // Step 1: A -> B
        if (p1.baseToken === a) amount = (amount / p1.price) * F; // Buying B with A
        else amount = (amount * p1.price) * F; // Selling A for B

        // Step 2: B -> C
        if (p2.baseToken === b) amount = (amount / p2.price) * F;
        else amount = (amount * p2.price) * F;

        // Step 3: C -> A
        if (p3.baseToken === c) amount = (amount / p3.price) * F;
        else amount = (amount * p3.price) * F;

        const netProfit = amount - size;
        const spread = (netProfit / size) * 100;
        
        const impact = Math.max(
            this.simulatePriceImpact(size, p1.liquidity),
            this.simulatePriceImpact(size, p2.liquidity),
            this.simulatePriceImpact(size, p3.liquidity)
        );

        return { netProfit, spread, impact };
    }

    // 1. SMART ROUTING & 2. SPREAD ENGINE
    public processPools(pools: AethrixPool[]): { opportunities: ArbitrageOpportunity[], stats: NetworkStats } {
        const normalized = pools.map(p => this.normalizePool(p));
        const groups = new Map<string, MarketData[]>();
        
        normalized.forEach(d => {
            if (!groups.has(d.pair)) groups.set(d.pair, []);
            groups.get(d.pair)!.push(d);
        });

        const activeOpportunities: ArbitrageOpportunity[] = [];
        const TRADE_SIZE = 5000;

        // Linear Arbitrage with SMART ROUTING
        groups.forEach((data, pair) => {
            if (data.length < 2) return;
            this.stats.pairsScanned++;

            const routes: ArbitrageOpportunity[] = [];

            // Cross-DEX Smart Routing
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data.length; j++) {
                    if (i === j) continue;
                    const buy = data[i];
                    const sell = data[j];

                    if (buy.chain !== sell.chain) continue;

                    const spread = ((sell.price - buy.price) / buy.price) * 100;
                    const depth = this.analyzeLiquidityDepth(Math.min(buy.liquidity, sell.liquidity), TRADE_SIZE);
                    const impact = this.simulatePriceImpact(TRADE_SIZE, Math.min(buy.liquidity, sell.liquidity));
                    
                    // Calculation of net profit including fees and impact
                    const netProfit = (TRADE_SIZE * (spread / 100)) - (TRADE_SIZE * 0.006) - (TRADE_SIZE * (impact / 100));

                    if (spread > 0.5 && depth.valid && impact < 0.4 && netProfit > 0) {
                        routes.push({
                            id: `route-${buy.id}-${sell.id}`,
                            pair,
                            route: [buy.dex, sell.dex],
                            chain: buy.chain,
                            buyPrice: buy.price,
                            sellPrice: sell.price,
                            spread,
                            liquidity: Math.min(buy.liquidity, sell.liquidity),
                            priceImpact: impact,
                            netProfit,
                            timestamp: Date.now()
                        });
                    }
                }
            }

            // Route Optimization: Select highest net profit
            if (routes.length > 0) {
                const best = routes.sort((a, b) => b.netProfit - a.netProfit)[0];
                activeOpportunities.push(best);
                this.stats.opportunitiesDetected++;
            }
        });

        // Add Triangular Opportunities
        const triangular = this.findTriangularOpportunities(normalized, TRADE_SIZE);
        activeOpportunities.push(...triangular);
        if (triangular.length > 0) this.stats.opportunitiesDetected += triangular.length;

        this.stats.lastUpdate = Date.now();
        return {
            opportunities: activeOpportunities,
            stats: this.stats
        };
    }

    /*
    private executeArbitrage(opp: ArbitrageOpportunity) {
        // Mock execution disabled to prevent fake data in feed
        // Real on-chain execution logic will be implemented here
        console.log("Arbitrage potential detected, but execution is currently in manual/validation mode:", opp.pair);
    }
    */

    public getExecutedFeed() {
        return this.executors;
    }

    public getNetworkStats() {
        return this.stats;
    }

    public onSignal(cb: (signal: ExecutedArbitrage) => void) {
        // this.onSignalCallback = cb;
        console.log("Signal listener attached:", cb.name);
    }
}
