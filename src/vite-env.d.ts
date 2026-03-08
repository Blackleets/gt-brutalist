/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TELEGRAM_TOKEN?: string;
    readonly VITE_TELEGRAM_CHAT_ID?: string;
    readonly VITE_BSCSCAN_API_KEY?: string;
    readonly VITE_SOLANA_RPC?: string;
    readonly VITE_BSC_RPC?: string;
    readonly VITE_ETH_RPC?: string;
    readonly VITE_ANTIGRAVITY_API?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
