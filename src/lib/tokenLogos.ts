// Shared token logo registry — CoinGecko CDN (publicly accessible)
// Used by SwapSimulator, Mercados, MarketSpotlight, Portfolio, etc.

export const TOKEN_LOGOS: Record<string, string> = {
    SOL: "https://assets.coingecko.com/coins/images/4128/standard/solana.png",
    USDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
    USDT: "https://assets.coingecko.com/coins/images/325/standard/Tether.png",
    BNB: "https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png",
    WBNB: "https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png",
    ETH: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
    WETH: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
    WBTC: "https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png",
    BTC: "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png",
    LINK: "https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png",
    AVAX: "https://assets.coingecko.com/coins/images/12559/standard/Avalanche_Circle_RedWhite_Trans.png",
    DOGE: "https://assets.coingecko.com/coins/images/5/standard/dogecoin.png",
    SHIB: "https://assets.coingecko.com/coins/images/11939/standard/shiba.png",
    PEPE: "https://assets.coingecko.com/coins/images/29850/standard/pepe-token.jpeg",
    ARB: "https://assets.coingecko.com/coins/images/16547/standard/arb.jpg",
    OP: "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png",
    MATIC: "https://assets.coingecko.com/coins/images/4713/standard/polygon.png",
    JUP: "https://assets.coingecko.com/coins/images/34188/standard/jup.png",
    BONK: "https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg",
    WIF: "https://assets.coingecko.com/coins/images/33566/standard/dogwifhat.jpg",
    RAY: "https://assets.coingecko.com/coins/images/13928/standard/PSigc4ie_400x400.jpg",
    CAKE: "https://assets.coingecko.com/coins/images/12632/standard/pancakeswap-cake-logo_%281%29.png",
    UNI: "https://assets.coingecko.com/coins/images/12504/standard/uni.jpg",
    AAVE: "https://assets.coingecko.com/coins/images/12645/standard/aave-token-round.png",
    RENDER: "https://assets.coingecko.com/coins/images/11636/standard/rndr.png",
    FET: "https://assets.coingecko.com/coins/images/5681/standard/Fetch.jpg",
    INJ: "https://assets.coingecko.com/coins/images/12882/standard/Secondary_Symbol.png",
    PYTH: "https://assets.coingecko.com/coins/images/31924/standard/pyth.png",
    WSOL: "https://assets.coingecko.com/coins/images/4128/standard/solana.png",
    FLOKI: "https://assets.coingecko.com/coins/images/16746/standard/PNG_image.png",
    BOME: "https://assets.coingecko.com/coins/images/36071/standard/bome.jpg",

    // DEX LOGOS
    RAYDIUM: "https://assets.coingecko.com/markets/images/643/standard/raydium.png",
    ORCA: "https://assets.coingecko.com/markets/images/680/standard/orca.png",
    JUPITER: "https://assets.coingecko.com/markets/images/1301/standard/jupiter-aggregator.png",
    METEORA: "https://assets.coingecko.com/markets/images/1203/standard/meteora.png",
    PANCAKESWAP: "https://assets.coingecko.com/markets/images/535/standard/pancakeswap_v2.png",
    UNISWAP: "https://assets.coingecko.com/markets/images/665/standard/uniswap-v3.png",
    BISWAP: "https://assets.coingecko.com/markets/images/593/standard/biswap.png",
};

// Native token address → logo mapping (for Portfolio)
export const NATIVE_LOGOS: Record<string, string> = {
    native_sol: TOKEN_LOGOS.SOL,
    native_usdc: TOKEN_LOGOS.USDC,
    native_usdt: TOKEN_LOGOS.USDT,
    native_bnb: TOKEN_LOGOS.BNB,
    native_eth: TOKEN_LOGOS.ETH,
    native_wbtc: TOKEN_LOGOS.WBTC,
    native_doge: TOKEN_LOGOS.DOGE,
    native_pepe: TOKEN_LOGOS.PEPE,
    native_shib: TOKEN_LOGOS.SHIB,
    native_link: TOKEN_LOGOS.LINK,
    native_jup: TOKEN_LOGOS.JUP,
    native_bonk: TOKEN_LOGOS.BONK,
    native_wif: TOKEN_LOGOS.WIF,
    native_ray: TOKEN_LOGOS.RAY,
    native_cake: TOKEN_LOGOS.CAKE,
};

/**
 * Get logo for a token — checks hardcoded map first, then falls back to API-provided logoUrl.
 * Works for both base and quote tokens (e.g. WBNB, WSOL).
 */
export function getTokenLogo(symbol: string, apiLogoUrl?: string): string | undefined {
    return TOKEN_LOGOS[symbol.toUpperCase()] || apiLogoUrl;
}
