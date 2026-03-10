import { kolTracker } from '../modules/kol/KOLTracker';
import { AethrixPool } from '../lib/aethrix';

let currentRankings: AethrixPool[] = [];

self.onmessage = async (e) => {
    const { action, rankings } = e.data;

    if (action === 'updateRankings') {
        currentRankings = rankings || [];
    }

    if (action === 'start') {
        const execute = async () => {
            if (currentRankings && currentRankings.length > 0) {
                try {
                    const signals = await kolTracker.scan(currentRankings);
                    if (signals.length > 0) {
                        self.postMessage({ type: 'KOL_DATA', signals, timestamp: Date.now() });
                    }
                } catch (scanErr) {
                    console.error("KOL_SCAN_FAILED", scanErr);
                    self.postMessage({ type: 'ERROR', error: 'KOL_SCAN_FAILED' });
                }
            }
        };

        execute();
        setInterval(execute, 10000);
    }
};
