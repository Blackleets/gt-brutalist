export interface PhantomProvider {
    isPhantom?: boolean;
    connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
    disconnect?: () => void;
    signMessage?: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
    signAndSendTransaction?: (transaction: unknown) => Promise<{ signature: string }>;
}

export interface SolflareProvider extends PhantomProvider {
    isSolflare?: boolean;
}

export interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    isBinanceChain?: boolean;
    isMetaMask?: boolean;
    isOKXWallet?: boolean;
    isOkxWallet?: boolean;
    providers?: EthereumProvider[];
}

declare global {
    interface Window {
        solana?: PhantomProvider & { isSolflare?: boolean };
        solflare?: SolflareProvider;
        ethereum?: EthereumProvider;
        okxwallet?: EthereumProvider;
        BinanceChain?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        };
    }
}
