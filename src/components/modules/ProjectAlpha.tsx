import { motion } from "framer-motion";
import { Shield, Zap, Cpu, Globe } from "lucide-react";

export function ProjectAlpha() {
    const tokenomics = [
        { label: "Community Alpha", value: "40%", description: "Dedicated to signal providers and node operators." },
        { label: "Liquidity Core", value: "30%", description: "Locked for sustainable multichain execution." },
        { label: "Infrastructure", value: "20%", description: "Scaling VYTRONIX RPC nodes and bridge tech." },
        { label: "Strategic", value: "10%", description: "Early institutional and ally partnerships." },
    ];

    const roadmap = [
        { phase: "Q1", title: "GENESIS", items: ["Vytronix Web V1 Launch", "Aethrix Alpha Integration", "Telegram Bot Node V1"] },
        { phase: "Q2", title: "SCALE", items: ["Custom Link Administration", "Multichain Signal Logic", "Public Token Launch"] },
        { phase: "Q3", title: "DOMINANCE", items: ["Mobile App Prototype", "Cross-Chain Execution Layer", "Alliance Network Expansion"] },
    ];

    return (
        <section className="bg-black text-white px-4 md:px-16 py-20 md:py-32 relative overflow-hidden">
            {/* GRID OVERLAY DARK */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
                {/* TOKENOMICS SECTION */}
                <div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-12 tracking-tighter">
                        Token_Distro <br />
                        <span className="text-[#00ff41]">[ALPHA_SUPPLY]</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tokenomics.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="border-4 border-[#00ff41]/20 p-6 hover:border-[#00ff41] transition-colors group"
                            >
                                <div className="text-3xl font-black text-[#00ff41] mb-2">{item.value}</div>
                                <div className="text-sm font-black uppercase mb-3 tracking-widest">{item.label}</div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed text-balance">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 bg-[#00ff41] text-black p-8 border-4 border-black shadow-[8px_8px_0_white]">
                        <div className="flex items-center gap-4 mb-4">
                            <Shield className="w-8 h-8" />
                            <div className="text-2xl font-black uppercase italic">Audit_Status: Verified</div>
                        </div>
                        <p className="text-xs font-black uppercase leading-relaxed">
                            Vytronix smart contracts are architected for brutal security. No backdoors, no mint, 100% execution focused.
                        </p>
                    </div>
                </div>

                {/* ROADMAP SECTION */}
                <div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-12 tracking-tighter text-right">
                        System_Roadmap <br />
                        <span className="text-zinc-500">[2026_SCHEDULE]</span>
                    </h2>

                    <div className="space-y-8">
                        {roadmap.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ x: 50, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex gap-6 items-start text-right justify-end group"
                            >
                                <div className="space-y-2 order-2">
                                    <div className="text-4xl font-black text-white leading-none group-hover:text-[#00ff41] transition-colors">{item.phase}</div>
                                    <div className="text-xs font-black bg-zinc-800 px-2 py-1 inline-block uppercase">{item.title}</div>
                                </div>
                                <ul className="space-y-1 pt-1 order-1">
                                    {item.items.map((li, i) => (
                                        <li key={i} className="text-[10px] font-bold text-zinc-400 uppercase">
                                            // {li}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="flex flex-col items-center gap-2">
                            <Cpu className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Edge_Computing</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Globe className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Agility_Bridging</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Zap className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Zero_Latency</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
