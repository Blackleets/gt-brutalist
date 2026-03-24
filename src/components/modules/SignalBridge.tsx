
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { ArbitrageIntelligenceSystem } from "@/lib/arbitrageIntelligence";

export function SignalBridge() {
    const { sendTelegramMessage, telegramEnabled, addSystemLog } = useAppStore();
    const lastSignalRef = useRef<number>(0);

    useEffect(() => {
        const engine = ArbitrageIntelligenceSystem.getInstance();

        engine.onSignal((signal) => {
            const now = Date.now();
            // Simple throttle to avoid flooding (10s)
            if (now - lastSignalRef.current < 10000) return;
            
            lastSignalRef.current = now;

            if (telegramEnabled && sendTelegramMessage) {
                const explorerLink = signal.chain === 'solana' 
                    ? `https://solscan.io/tx/${signal.txHash}` 
                    : `https://bscscan.com/tx/${signal.txHash}`;

                const message = 
                    `⚡ EXECUTABLE ARBITRAGE\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `💎 Pair: ${signal.pair}\n` +
                    `🔄 Route: ${signal.route.join(' → ')}\n` +
                    `📈 Spread captured: ${signal.spread.toFixed(2)}%\n` +
                    `💵 Net profit: $${signal.netProfit.toFixed(2)}\n\n` +
                    `🔗 Transaction Hash:\n` +
                    `${signal.txHash}\n\n` +
                    `🌐 View on Explorer:\n` +
                    `${explorerLink}\n\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `⚡ Real-Time On-chain Intelligence`;

                sendTelegramMessage(message);
                addSystemLog(`ARB_SIGNAL: Intelligence dispatched to Telegram for ${signal.pair}`, "success");
            }
        });
    }, [sendTelegramMessage, telegramEnabled, addSystemLog]);

    return null;
}
