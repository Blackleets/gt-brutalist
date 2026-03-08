import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, decimals: number = 2): string {
    if (value === 0) return "$0.00";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`; // Keep K with 1 decimal for space
    if (value > 0 && value < 0.01) return `$${value.toFixed(6)}`;
    return `$${value.toFixed(decimals)}`;
}
