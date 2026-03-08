import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useEffect } from "react";
import { translations } from "@/lib/translations";

export function Notifications() {
    const { activeAlerts, removeAlert, alertsEnabled, language } = useAppStore();
    const t = translations[language];

    useEffect(() => {
        // Trigger system notification for NEW alerts only
        const latestAlert = activeAlerts[0];
        if (latestAlert && alertsEnabled && Notification.permission === "granted") {
            // Check if we already notified for THIS specific alert ID in this session
            const notifiedKey = `notified_${latestAlert.id}`;
            if (!sessionStorage.getItem(notifiedKey)) {
                new Notification(`VYTRONIX ALPHA: ${latestAlert.tokenSymbol}`, {
                    body: latestAlert.message,
                    icon: "/favicon.ico", // Or a specific alpha icon
                    tag: latestAlert.id
                });
                sessionStorage.setItem(notifiedKey, "true");
            }
        }
    }, [activeAlerts, alertsEnabled]);

    return (
        <div className="fixed top-4 md:top-24 right-4 md:right-6 z-[100] flex flex-col gap-4 w-full max-w-[calc(100%-2rem)] md:max-w-[320px] pointer-events-none">
            <AnimatePresence>
                {activeAlerts.map((alert) => (
                    <motion.div
                        key={alert.id}
                        initial={{ x: 350, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 350, opacity: 0 }}
                        className="pointer-events-auto"
                    >
                        <div className="bg-black border-4 border-[#00ff41] text-[#00ff41] p-3 md:p-4 relative shadow-[8px_8px_0_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-start mb-1 md:mb-2">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
                                    <span className="font-black uppercase text-[9px] md:text-xs tracking-widest truncate max-w-[180px]">
                                        {alert.tokenSymbol} {t.alerts_title}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeAlert(alert.id)}
                                    className="p-1 hover:bg-white hover:text-black transition-none shrink-0"
                                    title={t.alerts_dismiss}
                                    aria-label={t.alerts_dismiss}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="text-xs md:text-sm font-bold uppercase leading-tight pr-4">
                                {alert.message}
                            </div>

                            <div className="mt-2 md:mt-4 flex justify-between items-end text-[8px] md:text-[10px] font-black opacity-50 uppercase tracking-widest">
                                <span>{t.alerts_type}: {alert.type.replace('_', ' ')}</span>
                                <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* SCANLINE EFFECT */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00ff41] animate-scan" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export function AlertsToggle() {
    const { alertsEnabled, setAlertsEnabled, language } = useAppStore();
    const t = translations[language];

    return (
        <div className="flex items-center gap-4 bg-white border-4 border-black p-4 self-start">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setAlertsEnabled(!alertsEnabled)}>
                <div className={`w-12 h-6 border-4 border-black flex items-center p-0.5 transition-colors ${alertsEnabled ? 'bg-[#00ff41]' : 'bg-gray-300'}`}>
                    <div className={`w-3 h-3 bg-black transition-transform ${alertsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-black uppercase tracking-wider text-black">
                    {t.alerts_watcher}: {alertsEnabled ? t.alerts_active : t.alerts_disabled}
                </span>
            </div>
            <div className="h-6 w-1 bg-black/20" />
            <div className="text-[10px] font-black uppercase text-gray-400 max-w-[120px] leading-tight">
                {t.alerts_desc}
            </div>
        </div>
    );
}
