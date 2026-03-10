import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import {
    Shield,
    Cpu,
    Radar,
    Lock,
    Layers,
    Coins,
    TrendingUp,
    Milestone,
    Eye,
    ChevronRight,
    Terminal,
    Rocket,
    Activity
} from "lucide-react";

export function WhitepaperV3() {
    const { language, setActiveViewId } = useAppStore();
    const t = translations[language];

    const sections = [
        {
            id: "01",
            title: t.wp_01_title,
            icon: <Terminal className="text-[#00ff41]" />,
            content: t.wp_01_content
        },
        {
            id: "02",
            title: t.wp_02_title,
            icon: <Cpu className="text-[#00ff41]" />,
            content: t.wp_02_content
        },
        {
            id: "03",
            title: t.wp_03_title,
            icon: <Shield className="text-[#00ff41]" />,
            content: (
                <div className="space-y-4">
                    <p>{t.wp_03_content}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["SCAN", "ANALYZE", "READY", "STRIKE"].map((step, i) => (
                            <div key={i} className="border-2 border-black p-2 bg-black text-white text-center font-black">
                                <div className="text-[10px] text-[#00ff41] mb-1">{i + 1}</div>
                                <div className="text-xs">{step}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: "04",
            title: t.wp_04_title,
            icon: <Radar className="text-[#00ff41]" />,
            content: t.wp_04_content
        },
        {
            id: "05",
            title: t.wp_05_title,
            icon: <Lock className="text-[#00ff41]" />,
            content: t.wp_05_content
        },
        {
            id: "06",
            title: t.wp_06_title,
            icon: <Layers className="text-[#00ff41]" />,
            content: t.wp_06_content
        },
        {
            id: "07",
            title: t.wp_07_title,
            icon: <Coins className="text-[#00ff41]" />,
            content: t.wp_07_content
        },
        {
            id: "08",
            title: t.wp_08_title,
            icon: <TrendingUp className="text-[#00ff41]" />,
            content: t.wp_08_content
        },
        {
            id: "09",
            title: t.wp_09_title,
            icon: <Milestone className="text-[#00ff41]" />,
            content: t.wp_09_content
        },
        {
            id: "10",
            title: t.wp_10_title,
            icon: <Eye className="text-[#00ff41]" />,
            content: t.wp_10_content
        },
        {
            id: "11",
            title: t.wp_11_title,
            icon: <Rocket className="text-[#00ff41]" />,
            content: t.wp_11_content
        },
        {
            id: "12",
            title: t.wp_12_title,
            icon: <Activity className="text-[#00ff41]" />,
            content: t.wp_12_content
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white font-mono selection:bg-[#00ff41] selection:text-black mt-[-4px]">
            {/* Grid background */}
            <div className="fixed inset-0 pointer-events-none opacity-10 grid-pattern overflow-hidden" />

            <div className="relative z-10 p-6 md:p-16 max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-20 border-l-8 border-[#00ff41] pl-6 md:pl-10">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                            {t.wp_title.split(' ')[0]} <br />
                            <span className="text-[#00ff41]">{t.wp_title.split(' ')[1]}</span> <br />
                            <span className="text-2xl md:text-5xl border-2 border-[#00ff41] px-4 py-1 mt-4 inline-block italic">{t.wp_release}</span>
                        </h1>
                        <p className="mt-8 text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm max-w-2xl leading-relaxed">
                            {t.wp_sub}
                        </p>
                    </motion.div>
                </header>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 border-2 border-zinc-800">
                    {sections.map((section, idx) => (
                        <motion.section
                            key={section.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            viewport={{ once: true }}
                            className="bg-black p-8 md:p-12 hover:bg-zinc-950 transition-colors group relative overflow-hidden"
                        >
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#00ff41] transition-colors" />

                            <div className="flex justify-between items-start mb-6">
                                <div className="text-5xl md:text-7xl font-black text-zinc-900 group-hover:text-zinc-800 transition-colors">
                                    {section.id}
                                </div>
                                <div className="p-3 border-2 border-zinc-800 group-hover:border-[#00ff41] transition-colors">
                                    {section.icon}
                                </div>
                            </div>

                            <h2 className="text-xl md:text-2xl font-black uppercase mb-4 tracking-tight flex items-center gap-2">
                                <ChevronRight className="text-[#00ff41] group-hover:translate-x-1 transition-transform" />
                                {section.title}
                            </h2>

                            <div className="text-zinc-400 text-sm md:text-base leading-relaxed font-bold uppercase border-l-2 border-zinc-800 pl-4 py-2 group-hover:border-[#00ff41] transition-colors">
                                {section.content}
                            </div>

                            {/* Decorative binary or data */}
                            <div className="mt-6 text-[8px] text-zinc-800 group-hover:text-zinc-700 font-black truncate">
                                [ LOGS_INF: SHIELD_PROT_V3 ] [ SHIELD_ID: 0x{section.id}FF41 ] [ STAT: NOMINAL ]
                            </div>
                        </motion.section>
                    ))}
                </div>

                {/* Footer / CTA */}
                <footer className="mt-20 border-t-8 border-[#00ff41] pt-12 text-center">
                    <div className="text-2xl md:text-4xl font-black uppercase mb-8 italic">
                        "{t.wp_quote}"
                    </div>
                    <button
                        onClick={() => { setActiveViewId("HOME"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="bg-[#00ff41] text-black px-10 py-5 font-black uppercase text-xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all"
                    >
                        {t.wp_back}
                    </button>
                    <div className="mt-8 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
                        {t.wp_disclaimer}
                    </div>
                </footer>
            </div>
        </div>
    );
}
