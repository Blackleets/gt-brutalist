import { useAppStore } from "@/lib/store";
import { useMemo } from "react";

/**
 * AlphaGuard: Centralized access control for Vytronix Alpha Engine.
 * 
 * Access is granted if:
 * 1. The wallet is an owner address (hardcoded in store.tsx).
 * 2. The wallet is in the 'authorizedWallets' list (managed via Admin UI).
 */
export function useAlphaGuard() {
    const { wallet, ownerAddresses, authorizedWallets } = useAppStore();

    const isAuthorized = useMemo(() => {
        if (!wallet.connected || !wallet.address) return false;

        // Check owners
        const isOwner = ownerAddresses.includes(wallet.address);
        if (isOwner) return true;

        // Check authorized (paying) wallets
        const isPaid = authorizedWallets.includes(wallet.address);
        if (isPaid) return true;

        return false;
    }, [wallet.connected, wallet.address, ownerAddresses, authorizedWallets]);

    return {
        isAuthorized,
        canAccessAlpha: isAuthorized
    };
}

/**
 * Static check for non-hook environments (e.g. backend/background loops if they have access to state)
 * Note: Since we are in a SPA, we mostly use the hook.
 */
export const checkAlphaAccess = (address: string, owners: string[], authorized: string[]) => {
    return owners.includes(address) || authorized.includes(address);
};
