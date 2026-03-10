// Simulate Smart Money Activity tracking
self.onmessage = (e) => {
    const { action } = e.data;

    if (action === 'start') {
        const sendHeartbeat = () => {
            self.postMessage({
                type: 'SMART_MONEY_HEARTBEAT',
                status: 'HEALTHY',
                timestamp: Date.now()
            });
        };

        // Simulated Smart Money Pulse: Occurs every 30-60 seconds
        const emitWhaleActivity = () => {
            const mockWhales = [
                { tokenAddress: "So11111111111111111111111111111111111111112", lastInteraction: Date.now(), walletCount: 3 },
                { tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", lastInteraction: Date.now(), walletCount: 1 }
            ];

            self.postMessage({
                type: 'WHALE_PULSE',
                activity: mockWhales,
                timestamp: Date.now()
            });
        };

        setInterval(sendHeartbeat, 15000);
        setInterval(emitWhaleActivity, 45000);

        sendHeartbeat();
    }
};
