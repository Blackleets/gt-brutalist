// aethrix.ts
// Alpha Engine (Solana & BSC) Real-Market Data Processor

// DexScreener API pair shape (partial, only fields we use)
export interface DexScreenerPair {
    pairAddress?: string;
    chainId?: string;
    dexId?: string;
    baseToken?: { symbol?: string; address?: string };
    quoteToken?: { symbol?: string; address?: string };
    priceUsd?: string;
    pairCreatedAt?: number;
    liquidity?: { usd?: number };
    volume?: { h24?: number };
    priceChange?: { m5?: number; h24?: number };
    txns?: { m5?: { buys?: number; sells?: number } };
    info?: { imageUrl?: string };
}


export interface AethrixPool {
    id: string;
    chain: "solana" | "bsc";
    dex: string;
    baseToken: { symbol: string; address: string; logoUrl?: string };
    quoteToken: { symbol: string; address: string };
    pairAddress: string;
    createdAt: number;
    liquidityUsd: number;
    volume24hUsd: number;
    priceChange5m: number;
    priceChange24h?: number;
    txns5m: { buys: number; sells: number };
    score: number;
    alphaScore?: number;
    alphaReasons?: string[];
    riskScore: number;
    zone: "PRIME" | "VOLATILE" | "STABLE" | "DANGER";
    priceUsd: number;
    alphaReason?: string;
}

export type ThreatZone = AethrixPool["zone"];

export function calculateThreatMatrix(pool: Omit<AethrixPool, "riskScore" | "zone">): { riskScore: number, zone: ThreatZone } {
    let risk = 0;

    // 1. Liquidity relative to volume (High vol, low liq = slippage/manipulation risk)
    const volToLiqRatio = pool.volume24hUsd / Math.max(pool.liquidityUsd, 1);
    if (volToLiqRatio > 2) risk += 30;
    else if (volToLiqRatio > 1) risk += 15;

    // 2. Buy pressure imbalance (>80% or <20% is extreme)
    const totalTx = pool.txns5m.buys + pool.txns5m.sells;
    const buyRatio = totalTx > 0 ? pool.txns5m.buys / totalTx : 0.5;
    if (buyRatio > 0.85 || buyRatio < 0.15) risk += 25;

    // 3. Extreme price spikes
    const absChange = Math.abs(pool.priceChange5m);
    if (absChange > 50) risk += 30;
    else if (absChange > 20) risk += 15;

    // 4. Low transaction count but high % move
    if (totalTx < 20 && absChange > 10) risk += 20;

    // 5. Normalization
    const finalRisk = Math.min(risk, 100);

    // Zone Classification
    let zone: ThreatZone = "STABLE";
    const isHighAlpha = pool.score >= 60;
    const isHighRisk = finalRisk >= 40;

    if (isHighAlpha && !isHighRisk) zone = "PRIME";
    else if (isHighAlpha && isHighRisk) zone = "VOLATILE";
    else if (!isHighAlpha && isHighRisk) zone = "DANGER";
    else zone = "STABLE";

    return { riskScore: finalRisk, zone };
}

function calculateScore(liquidity: number, volume: number, change: number, buys: number, sells: number): number {
    // 1. Normalize Components (0 - 100 Scale)
    const liquidityFactor = Math.min(liquidity / 50000, 1) * 100;

    const volumeFactor = Math.min(volume / 100000, 1) * 100;

    // Momentum multiplier = 2 (Meaning a 50% price surge caps the momentum score at 100)
    const momentumMultiplier = 2;
    const momentumFactor = Math.max(0, Math.min(change * momentumMultiplier, 100));

    const totalTx = buys + sells;
    const buyPressureFactor = totalTx > 0 ? (buys / totalTx) * 100 : 50;

    // 2. Apply Weights
    // Liquidity (20%) | Volume (30%) | Momentum (20%) | Buy Pressure (30%)
    const weightedScore =
        (liquidityFactor * 0.20) +
        (volumeFactor * 0.30) +
        (momentumFactor * 0.20) +
        (buyPressureFactor * 0.30);

    // 3. Return clamped integer (0 - 100)
    return Math.max(0, Math.min(Math.round(weightedScore), 100));
}

export function determineAlphaReason(pool: Omit<AethrixPool, "riskScore" | "zone">): string {
    const totalTx = pool.txns5m.buys + pool.txns5m.sells;
    const buyRatio = totalTx > 0 ? pool.txns5m.buys / totalTx : 0.5;

    if (buyRatio > 0.8 && totalTx > 50) return "WHALE_ACCUMULATION";
    if (pool.priceChange5m > 15) return "MOMENTUM_SURGE";
    if (pool.volume24hUsd > pool.liquidityUsd * 2) return "HIGH_TRADING_VELOCITY";
    if (pool.priceChange5m > 5 && buyRatio > 0.6) return "BULL_CONSOLIDATION";
    if (pool.score > 80) return "OPTIMIZED_ENTRY_POINT";
    return "ORGANIC_GROWTH";
}

/**
 * Fetch a single token by its contract address via DexScreener.
 * Works with both Solana and BSC (EVM) addresses.
 * Returns the best pool for the token with full scoring, or null if not found.
 */
export async function fetchTokenByAddress(address: string): Promise<AethrixPool | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const data = await res.json();

        if (!data.pairs || data.pairs.length === 0) return null;

        // Find the best pool (highest liquidity)
        const validPairs = (data.pairs as DexScreenerPair[])
            .filter((p) => p.pairAddress && p.baseToken?.address && p.baseToken?.symbol && p.priceUsd)
            .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

        if (validPairs.length === 0) return null;

        const p = validPairs[0];
        const chain = p.chainId === 'solana' ? 'solana' : 'bsc';
        const liquidity = p.liquidity?.usd || 0;
        const volume = p.volume?.h24 || 0;
        const txns = (p.txns?.m5?.buys || 0) + (p.txns?.m5?.sells || 0);
        const momentum = p.priceChange?.m5 || 0;

        const score = calculateSpotlightScore(liquidity, volume, txns, momentum);

        const pool: Omit<AethrixPool, "riskScore" | "zone"> = {
            id: p.pairAddress!,
            chain: chain as "solana" | "bsc",
            dex: p.dexId || 'Unknown',
            baseToken: {
                symbol: p.baseToken!.symbol!,
                address: p.baseToken!.address!,
                logoUrl: p.info?.imageUrl
            },
            quoteToken: { symbol: p.quoteToken?.symbol || "USDC", address: p.quoteToken?.address || "" },
            pairAddress: p.pairAddress!,
            createdAt: p.pairCreatedAt || Date.now(),
            liquidityUsd: liquidity,
            volume24hUsd: volume,
            priceChange5m: momentum,
            priceChange24h: p.priceChange?.h24 || 0,
            txns5m: {
                buys: p.txns?.m5?.buys || 0,
                sells: p.txns?.m5?.sells || 0
            },
            score,
            priceUsd: parseFloat(p.priceUsd!) || 0
        };

        const { riskScore, zone } = calculateThreatMatrix(pool);
        const alphaReason = determineAlphaReason(pool);
        return { ...pool, riskScore, zone, alphaReason };
    } catch (err) {
        console.error("[AETHRIX] fetchTokenByAddress failed:", err);
        return null;
    }
}

export async function scanAethrixPools(
    targetChain: "solana" | "bsc" = "solana",
    isNetworkMode: boolean = false
): Promise<AethrixResponse> {
    try {
        // DYNAMIC DISCOVERY: Fetch boosted/trending tokens to ensure "all opportunities" are visible
        let dynamicTokens: string[] = [];
        try {
            const boostRes = await fetch("https://api.dexscreener.com/token-boosts/latest/v1");
            if (boostRes.ok) {
                const boosts = await boostRes.json();
                if (Array.isArray(boosts)) {
                    dynamicTokens = boosts
                        .filter(b => b.chainId === targetChain)
                        .map(b => b.tokenAddress);
                }
            }
        } catch (e) {
            console.warn("Dynamic discovery failed, falling back to static list", e);
        }

        // Multiple discovery tokens per chain to get diverse results
        // DexScreener supports comma-separated addresses (up to ~30 per request)
        const discoveryTokens: Record<string, string[]> = {
            solana: [
                "So11111111111111111111111111111111111111112",  // SOL
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  // USDT
                "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  // JUP
                "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
                "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // WIF
                "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82",  // BOME
                "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3",  // SLERF
                "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk",  // WEN
                "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqZNuP3B",  // mSOL
                "jtojtomepa8beP8AuQc6ePAB3MKhz5A9Z4y4XQ33XhQ",  // JTO
                "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3GBnB387fPqgD",   // PYTH
                "27G8MtK7Vt_solana_placeholder",
                "orcaEKTCC79dt9zG7CcrtBjrsas8qf3SHBfsYvz25",     // ORCA
                "RAY6n9vV6isvS697E3rXQat8qE62K8G3K7z3M4x9fH",    // RAY
            ],
            bsc: [
                "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
                "0x55d398326f99059fF775485246999027B3197955", // USDT
                "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
                "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
                "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE
                "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
                "0xba2ae424d960c26247dd6c32edc70b295c744c43", // DOGE
                "0xbf5140a22ff5bea5499ceb44ceded5f6c8d76d43",  // FLOKI
                "0x0d7875429a888d4c97970997194f414777e8ea79", // PEPE_BSC
            ]
        };

        const staticTokens = discoveryTokens[targetChain] || discoveryTokens.solana;
        // Merge static and dynamic, shuffle and limit to 30 to ensure varied results every scan
        const combinedTokens = Array.from(new Set([...dynamicTokens, ...staticTokens]));
        const tokens = combinedTokens.sort(() => 0.5 - Math.random()).slice(0, 30);

        // Fetch multiple token endpoints in parallel for richer data
        // Split into 3 batches to avoid URL length issues
        const batch1 = tokens.slice(0, 10).join(",");
        const batch2 = tokens.slice(10, 20).join(",");
        const batch3 = tokens.slice(20, 30).join(",");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const fetchOpts = { signal: controller.signal };
        const requests = [];
        if (batch1) requests.push(fetch(`https://api.dexscreener.com/latest/dex/tokens/${batch1}`, fetchOpts));
        if (batch2) requests.push(fetch(`https://api.dexscreener.com/latest/dex/tokens/${batch2}`, fetchOpts));
        if (batch3) requests.push(fetch(`https://api.dexscreener.com/latest/dex/tokens/${batch3}`, fetchOpts));

        const responses = await Promise.all(requests);
        clearTimeout(timeoutId);

        // Merge all pairs from all requests
        let allPairs: DexScreenerPair[] = [];
        for (const res of responses) {
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.pairs)) {
                    allPairs = [...allPairs, ...data.pairs];
                }
            }
        }



        // STRICT VALIDATION & NORMALIZATION
        const validPools: AethrixPool[] = allPairs
            .filter((p: DexScreenerPair) => {
                if (!p.pairAddress || !p.baseToken?.address || !p.baseToken?.symbol) return false;
                if (!p.priceUsd) return false;
                // Only include pairs from the target chain
                if (targetChain === "solana" && p.chainId !== "solana") return false;
                if (targetChain === "bsc" && p.chainId !== "bsc") return false;
                return true;
            })
            .map((p: DexScreenerPair) => {
                let dexFormat = "RAYDIUM";
                const rawId = p.dexId?.toLowerCase() || "";

                if (rawId.includes("orca")) dexFormat = "ORCA";
                else if (rawId.includes("jupiter")) dexFormat = "JUPITER";
                else if (rawId.includes("meteora")) dexFormat = "METEORA";
                else if (rawId.includes("pancake")) dexFormat = "PANCAKESWAP";
                else if (rawId.includes("biswap")) dexFormat = "BISWAP";
                else if (rawId.includes("uniswap")) dexFormat = "UNISWAP";
                else if (rawId.includes("raydium")) dexFormat = "RAYDIUM";
                else dexFormat = rawId.toUpperCase();

                const priceUsd = parseFloat(p.priceUsd!) || 0;

                return {
                    id: p.pairAddress!,
                    chain: targetChain,
                    dex: dexFormat,
                    baseToken: {
                        symbol: p.baseToken!.symbol!,
                        address: p.baseToken!.address!,
                        logoUrl: p.info?.imageUrl
                    },
                    quoteToken: { symbol: p.quoteToken?.symbol || (targetChain === "bsc" ? "BNB" : "SOL"), address: p.quoteToken?.address || "" },
                    pairAddress: p.pairAddress!,
                    createdAt: p.pairCreatedAt || Date.now(),
                    liquidityUsd: p.liquidity?.usd || 0,
                    volume24hUsd: p.volume?.h24 || 0,
                    priceChange5m: p.priceChange?.m5 || 0,
                    txns5m: {
                        buys: p.txns?.m5?.buys || 0,
                        sells: p.txns?.m5?.sells || 0
                    },
                    score: 0,
                    riskScore: 0,
                    zone: "STABLE" as ThreatZone,
                    priceUsd: priceUsd
                };
            });



        // Apply scoring to all valid pools
        const scored: AethrixPool[] = validPools.map((p) => {
            const score = calculateScore(p.liquidityUsd, p.volume24hUsd, p.priceChange5m, p.txns5m.buys, p.txns5m.sells);
            const { riskScore, zone } = calculateThreatMatrix({ ...p, score });
            const alphaReason = determineAlphaReason(p);
            return { ...p, score, riskScore, zone, alphaReason };
        });

        scored.sort((a, b) => b.score - a.score);



        // Discard any remaining low-liquidity noise in Network Mode
        const minLiq = isNetworkMode ? 5000 : 2000;
        const finalPools = scored.filter((p, index) => p.liquidityUsd >= minLiq || index < 10);



        return {
            pools: finalPools,
            mode: "Live",
            emptyResponse: allPairs.length === 0
        };

    } catch (e) {
        console.error("AETHRIX: Data Fetch Failed", e);
        return { pools: [], mode: "Error", emptyResponse: false };
    }
}

export interface AethrixResponse {
    pools: AethrixPool[];
    mode: "Live" | "Error";
    emptyResponse: boolean;
}



function calculateSpotlightScore(liquidity: number, volume: number, txns: number, momentum: number): number {
    // Normalization thresholds
    const liqNorm = Math.min(liquidity / 5000000, 1) * 100; // 5M cap
    const volNorm = Math.min(volume / 10000000, 1) * 100;   // 10M cap
    const txNorm = Math.min(txns / 500, 1) * 100;         // 500 txs cap
    const momNorm = Math.min(Math.abs(momentum) / 20, 1) * 100; // 20% move cap

    const score = (liqNorm * 0.35) + (volNorm * 0.35) + (txNorm * 0.2) + (momNorm * 0.1);
    return Math.max(0, Math.min(Math.round(score), 100));
}

export async function fetchSpotlightTokens(): Promise<AethrixPool[]> {
    try {
        const [solRes, bscRes] = await Promise.all([
            fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112'),
            fetch('https://api.dexscreener.com/latest/dex/tokens/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c')
        ]);

        const solData = await solRes.json();
        const bscData = await bscRes.json();

        const allPairs = [...(solData.pairs || []), ...(bscData.pairs || [])];

        const rankedPools = allPairs
            .filter((p: DexScreenerPair) => {
                const liquidity = p.liquidity?.usd || 0;
                const volume = p.volume?.h24 || 0;
                return p.pairAddress && p.baseToken?.address && p.priceUsd && liquidity > 500000 && volume > 1000000;
            })
            .map((p: DexScreenerPair) => {
                const liquidity = p.liquidity?.usd || 0;
                const volume = p.volume?.h24 || 0;
                const txns = (p.txns?.m5?.buys || 0) + (p.txns?.m5?.sells || 0);
                const momentum = p.priceChange?.m5 || 0;

                const spotlightScore = calculateSpotlightScore(liquidity, volume, txns, momentum);

                return {
                    id: p.pairAddress,
                    chain: p.chainId === 'solana' ? 'solana' : 'bsc',
                    dex: p.dexId || 'Unknown',
                    baseToken: {
                        symbol: p.baseToken!.symbol!,
                        address: p.baseToken!.address!,
                        logoUrl: p.info?.imageUrl
                    },
                    quoteToken: { symbol: p.quoteToken?.symbol || "USDC", address: p.quoteToken?.address || "" },
                    pairAddress: p.pairAddress,
                    createdAt: p.pairCreatedAt || Date.now(),
                    liquidityUsd: liquidity,
                    volume24hUsd: volume,
                    priceChange5m: momentum,
                    priceChange24h: p.priceChange?.h24 || 0,
                    txns5m: {
                        buys: p.txns?.m5?.buys || 0,
                        sells: p.txns?.m5?.sells || 0
                    },
                    score: spotlightScore,
                    riskScore: 0,
                    zone: "STABLE",
                    priceUsd: parseFloat(p.priceUsd!)
                } as AethrixPool;
            });

        // Second pass for threat matrix as it needs the alpha score
        const finalScored = rankedPools.map(p => {
            const { riskScore, zone } = calculateThreatMatrix(p);
            const alphaReason = determineAlphaReason(p);
            return { ...p, riskScore, zone, alphaReason };
        });

        // Sort descending by score
        return finalScored.sort((a, b) => b.score - a.score);

    } catch (e) {
        console.error("Spotlight fetch failed", e);
        return [];
    }
}


/**
 * FETCH TRENDING PAIRS
 * Actively scans for top volume pairs across supported chains.
 */
export async function fetchTrendingPairs(): Promise<AethrixPool[]> {
    try {
        // We use the DexScreener 'Latest Pairs' or 'Volume' discovery indirectly 
        // by targetting major dexes if they have high volume.
        // For actual "trending" we can use the search API with volume parameters or common tokens.
        
        // Strategy: Fetch from common high-activity tokens on both chains to find active pairs
        const [solRes, bscRes] = await Promise.all([
            fetch('https://api.dexscreener.com/latest/dex/search?q=sol %20liquidity:100000'),
            fetch('https://api.dexscreener.com/latest/dex/search?q=bsc %20liquidity:100000')
        ]);
        
        const solData = await solRes.json();
        const bscData = await bscRes.json();
        
        const allPairs = [...(solData.pairs || []), ...(bscData.pairs || [])];
        
        const processed = allPairs
            .filter((p: DexScreenerPair) => {
                const liq = p.liquidity?.usd || 0;
                const vol = p.volume?.h24 || 0;
                return p.pairAddress && p.baseToken?.address && p.priceUsd && liq >= 100000 && vol >= 50000;
            })
            .map((p: DexScreenerPair) => {
                const liq = p.liquidity?.usd || 0;
                const vol = p.volume?.h24 || 0;
                const momentum = p.priceChange?.m5 || 0;
                
                const score = calculateScore(liq, vol, momentum, p.txns?.m5?.buys || 0, p.txns?.m5?.sells || 0);
                
                const pool = {
                    id: p.pairAddress!,
                    chain: p.chainId === 'solana' ? 'solana' : 'bsc',
                    dex: p.dexId?.toUpperCase() || 'UNKNOWN',
                    baseToken: {
                        symbol: p.baseToken!.symbol!,
                        address: p.baseToken!.address!,
                        logoUrl: p.info?.imageUrl
                    },
                    quoteToken: { symbol: p.quoteToken?.symbol || "USDC", address: p.quoteToken?.address || "" },
                    pairAddress: p.pairAddress!,
                    createdAt: p.pairCreatedAt || Date.now(),
                    liquidityUsd: liq,
                    volume24hUsd: vol,
                    priceChange5m: momentum,
                    priceChange24h: p.priceChange?.h24 || 0,
                    txns5m: {
                        buys: p.txns?.m5?.buys || 0,
                        sells: p.txns?.m5?.sells || 0
                    },
                    score: score,
                    priceUsd: parseFloat(p.priceUsd!) || 0
                } as AethrixPool;
                
                const { riskScore, zone } = calculateThreatMatrix(pool);
                const alphaReason = determineAlphaReason(pool);
                return { ...pool, riskScore, zone, alphaReason };
            });

        return processed.sort((a, b) => b.volume24hUsd - a.volume24hUsd);

    } catch (e) {
        console.error("Trending fetch failed", e);
        return [];
    }
}
