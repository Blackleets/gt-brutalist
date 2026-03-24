import { useAppStore } from "@/lib/store";

export function SocialIntelligenceHub() {
    // Hook into store if needed later
    useAppStore();
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-10 bg-white border-4 border-black shadow-[12px_12px_0_black] mb-20 relative overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
            
            <div className="relative z-10">
                <div className="bg-[#fffc20] border-4 border-black p-12 shadow-[8px_8px_0_black]">
                    <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter mb-4 italic">
                        SOCIAL_INTEL_OFFLINE
                    </h2>
                    <p className="text-lg font-black uppercase tracking-widest mb-2">
                        Module temporarily offline
                    </p>
                    <p className="text-xs font-bold opacity-60 uppercase">
                        awaiting real data integration
                    </p>
                </div>
            </div>
        </div>
    );
}
