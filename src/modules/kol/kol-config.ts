// kol-config.ts
// Configuration for monitored accounts and weighting

export interface MonitoredKOL {
    username: string;
    followerCount: number;
    followerWeight: number; // Impact weight based on real reach
}

export const MONITORED_KOLS: MonitoredKOL[] = [
    { username: "lookonchain", followerCount: 1200000, followerWeight: 40 },
    { username: "pentosh1", followerCount: 850000, followerWeight: 35 },
    { username: "CryptoKaleo", followerCount: 620000, followerWeight: 30 },
    { username: "hsakaTrades", followerCount: 550000, followerWeight: 28 },
    { username: "0xSun", followerCount: 320000, followerWeight: 25 },
    { username: "Ansem", followerCount: 450000, followerWeight: 35 },
    { username: "ZachXBT", followerCount: 650000, followerWeight: 50 }, // Security focus
];

// Detection logic config
export const KOL_SCAN_INTERVAL = 60000; // 60 seconds
export const MIN_IMPACT_SCORE = 70;
