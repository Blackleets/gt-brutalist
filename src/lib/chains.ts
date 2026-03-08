export type ChainId = "bsc" | "solana" | "ethereum";

export interface Endpoint {
    url: string;
    name: string;
}

export interface Pair {
    symbol: string;
    dex: string;
    price: string;
    change24h: string;
    volume24h: string;
    liquidity: string;
}

export interface ChainEnvironment {
    name: string;
    endpoints: Endpoint[];
    defaultEndpoint: string;
}

export interface ChainConfig {
    id: ChainId;
    name: string;
    environments: Record<string, ChainEnvironment>;
    defaultEnvironment: string;
    pairs: Pair[];
}

export const CHAINS: Record<ChainId, ChainConfig> = {
    bsc: {
        id: "bsc",
        name: "Binance Smart Chain",
        defaultEnvironment: "mainnet",
        environments: {
            mainnet: {
                name: "Mainnet",
                endpoints: [
                    { url: "https://bsc-dataseed.binance.org", name: "Binance Official" },
                    { url: "https://rpc.ankr.com/bsc", name: "Ankr" },
                    { url: "https://bsc.publicnode.com", name: "PublicNode" },
                ],
                defaultEndpoint: "https://bsc-dataseed.binance.org",
            },
            testnet: {
                name: "Testnet",
                endpoints: [
                    { url: "https://data-seed-prebsc-1-s1.binance.org:8545", name: "Binance Testnet 1" },
                    { url: "https://data-seed-prebsc-2-s1.binance.org:8545", name: "Binance Testnet 2" }
                ],
                defaultEndpoint: "https://data-seed-prebsc-1-s1.binance.org:8545",
            }
        },
        pairs: [
            { symbol: "BNB/USDT", dex: "PancakeSwap", price: "$584.20", change24h: "+2.4%", volume24h: "$1.2B", liquidity: "$400M" },
            { symbol: "CAKE/USDT", dex: "PancakeSwap", price: "$2.84", change24h: "-1.2%", volume24h: "$45M", liquidity: "$80M" },
            { symbol: "MemeCoin/BNB", dex: "PancakeSwap", price: "$0.000042", change24h: "+14.5%", volume24h: "$2M", liquidity: "$500K" },
        ]
    },
    solana: {
        id: "solana",
        name: "Solana",
        defaultEnvironment: "mainnet",
        environments: {
            mainnet: {
                name: "Mainnet",
                endpoints: [
                    { url: "https://api.mainnet-beta.solana.com", name: "Solana Mainnet" },
                    { url: "https://rpc.ankr.com/solana", name: "Ankr" },
                    { url: "https://solana-api.projectserum.com", name: "Project Serum" },
                ],
                defaultEndpoint: "https://api.mainnet-beta.solana.com",
            },
            devnet: {
                name: "Devnet",
                endpoints: [
                    { url: "https://api.devnet.solana.com", name: "Solana Devnet" },
                    { url: "https://api.testnet.solana.com", name: "Solana Testnet" }
                ],
                defaultEndpoint: "https://api.devnet.solana.com",
            }
        },
        pairs: [
            { symbol: "SOL/USDC", dex: "Raydium", price: "$142.50", change24h: "+5.1%", volume24h: "$800M", liquidity: "$300M" },
            { symbol: "JUP/USDC", dex: "Jupiter", price: "$0.94", change24h: "+1.2%", volume24h: "$120M", liquidity: "$60M" },
            { symbol: "BONK/SOL", dex: "Orca", price: "$0.000015", change24h: "-4.5%", volume24h: "$40M", liquidity: "$20M" },
        ]
    },
    ethereum: {
        id: "ethereum",
        name: "Ethereum",
        defaultEnvironment: "mainnet",
        environments: {
            mainnet: {
                name: "Mainnet",
                endpoints: [
                    { url: "https://cloudflare-eth.com", name: "Cloudflare" },
                    { url: "https://rpc.ankr.com/eth", name: "Ankr" },
                    { url: "https://eth.llamarpc.com", name: "LlamaNodes" },
                ],
                defaultEndpoint: "https://cloudflare-eth.com",
            },
            testnet: {
                name: "Sepolia",
                endpoints: [
                    { url: "https://rpc.sepolia.org", name: "Sepolia RPC" },
                ],
                defaultEndpoint: "https://rpc.sepolia.org",
            }
        },
        pairs: [
            { symbol: "ETH/USDT", dex: "Uniswap", price: "$3,120.45", change24h: "+1.8%", volume24h: "$2.5B", liquidity: "$1.2B" },
            { symbol: "UNI/USDT", dex: "Uniswap", price: "$7.50", change24h: "+0.5%", volume24h: "$150M", liquidity: "$90M" },
            { symbol: "PEPE/ETH", dex: "Uniswap", price: "$0.000001", change24h: "+8.2%", volume24h: "$80M", liquidity: "$30M" },
        ]
    }
};

// --- Mock SDK/API simulation ---

export async function simulateLatency(endpointUrl: string): Promise<number> {
    // Simulate network delay and return a mock ping in ms
    return new Promise((resolve) => {
        setTimeout(() => {
            // Base delay + some random variance between 10ms and 150ms depending on endpoint name hash
            const hash = endpointUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const baseMs = (hash % 100) + 10;
            const variance = Math.floor(Math.random() * 20) - 10;
            resolve(Math.max(5, baseMs + variance));
        }, Math.random() * 300 + 100);
    });
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeRealApiRequest(endpoint: string, method: string, apiKey: string): Promise<any> {
    const isLocalMock = endpoint.includes("vytronix.net");

    // If it's still trying to hit our fake local router, reject it.
    if (isLocalMock) {
        throw new Error("Local mock endpoints disabled. Configure a real RPC or node provider.");
    }

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (e: unknown) {
        throw new Error(`API Execution Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
}
