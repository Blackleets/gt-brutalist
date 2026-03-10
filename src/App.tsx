import { motion } from "framer-motion";
import { Twitter, Send, Globe } from "lucide-react";
import { AppProvider, useAppStore } from "@/lib/store";
import { Hero } from "@/components/modules/Hero";
import { Header } from "@/components/modules/Header";
import { Mercados } from "@/components/modules/Mercados";
import { ApiHub } from "@/components/modules/ApiHub";
import { LiveGraph } from "@/components/modules/LiveGraph";
import { StackMonitor } from "@/components/modules/StackMonitor";
import { Notifications } from "@/components/modules/Alerts";
import { TokenFactory } from "@/components/modules/TokenFactory";
import { Portfolio } from "@/components/modules/Portfolio";
import { GlobalEngine } from "@/components/modules/GlobalEngine";
import { SwapSimulator } from "@/components/modules/SwapSimulator";
import { ArbitrageScanner } from "@/components/modules/ArbitrageScanner";
import { WhaleTracker } from "@/components/modules/WhaleTracker";
import { ChartTerminal } from "@/components/modules/ChartTerminal";
import { CommandCenter } from "@/components/modules/CommandCenter";
import { AIBot } from "@/components/modules/AIBot";
import { translations } from "@/lib/translations";
import { SocialIntelligenceHub } from "@/components/modules/SocialIntelligenceHub";
import { WhitepaperV3 } from "@/components/modules/WhitepaperV3";

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function AppContent() {
  const { networkMode, setNetworkMode, activeViewId, setActiveViewId, language, setLanguage, adminConfig } = useAppStore();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* GRID OVERLAY */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 grid-pattern-light" />

      <div className="relative z-10">
        <GlobalEngine />
        <Notifications />
        <AIBot />
        <Header />
        {networkMode && (
          <div className="bg-[#00ff41] text-black font-black uppercase py-2 md:py-4 px-4 md:px-6 text-center border-b-4 border-black sticky top-0 z-[60] flex justify-between items-center group">
            <span className="flex items-center gap-2 text-[8px] xs:text-[10px] md:text-sm">
              <span className="w-2 h-2 bg-black animate-ping rounded-full shrink-0"></span>
              <span className="truncate">{t.net_active_banner}</span>
            </span>
            <button
              onClick={() => setNetworkMode(false)}
              className="bg-black text-white px-2 md:px-3 py-1 text-[8px] md:text-xs border-2 border-black hover:bg-white hover:text-black transition-none whitespace-nowrap ml-2"
            >
              {t.net_exit_btn}
            </button>
          </div>
        )}
        {activeViewId === "HOME" && (
          <>
            {!networkMode && <Hero />}
            <TokenFactory />
            <div className="px-4 md:px-16 py-8">
              <ArbitrageScanner />
              <Mercados />
            </div>
            <SwapSimulator />
            <LiveGraph />
            <ApiHub />
            <StackMonitor />
          </>
        )}

        {activeViewId === "WHALE_TRACKER" && <WhaleTracker />}
        {activeViewId === "CHART_TERMINAL" && <ChartTerminal />}
        {activeViewId === "PORTFOLIO" && <Portfolio />}
        {activeViewId === "COMMAND_CENTER" && <CommandCenter />}

        {activeViewId === "SOCIAL_HUB" && (
          <div className="px-4 md:px-16 py-8">
            <SocialIntelligenceHub />
          </div>
        )}

        {activeViewId === "WHITEPAPER_V3" && <WhitepaperV3 />}

        {/* CTA */}
        <section className="px-4 md:px-16 py-12 md:py-20 relative z-10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className={`border-4 border-black p-6 xs:p-10 md:p-16 transition-colors ${networkMode ? 'bg-[#00ff41]' : 'bg-[#fffc20]'}`}
          >
            <div className="text-3xl xs:text-5xl md:text-7xl font-black uppercase leading-tight md:leading-none">
              {networkMode ? (
                <div dangerouslySetInnerHTML={{ __html: t.cta_net_sync.replace(/\. /g, '.<br />') }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: t.cta_build_loud.replace(/\. /g, '.<br />') }} />
              )}
            </div>

            <div className="mt-8 md:mt-10">
              <button
                onClick={() => setNetworkMode(!networkMode)}
                className="w-full md:w-auto rounded-none border-4 border-black bg-black text-white text-base md:text-xl px-6 md:px-10 py-6 md:py-8 hover:bg-white hover:text-black transition-none uppercase font-black tracking-wider shadow-none"
              >
                {networkMode ? t.cta_exit_interface : t.cta_enter_network}
              </button>
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="border-t-4 border-black px-6 py-12 md:px-16 md:py-16 bg-black text-white relative z-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 font-mono">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-[#00ff41]">
                VYTRONIX <br />
                <span className="text-white text-lg">SYSTEMS</span>
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed max-w-xs">
                {t.footer_desc}
              </p>
            </div>

            {/* Column 2: Protocol */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b-2 border-zinc-800 pb-2 inline-block">{t.footer_protocol}</h4>
              <ul className="space-y-2 text-[10px] font-bold uppercase text-zinc-300">
                <li><a href="#" className="hover:text-[#00ff41] transition-colors hover:underline">{t.footer_swap}</a></li>
                <li><a href="#" className="hover:text-[#00ff41] transition-colors hover:underline">{t.footer_telemetry}</a></li>
                <li><a href="#" className="hover:text-[#00ff41] transition-colors hover:underline">{t.footer_status}</a></li>
                <li><a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActiveViewId("WHITEPAPER_V3"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="hover:text-[#00ff41] transition-colors hover:underline"
                >
                  {t.footer_whitepaper}
                </a></li>
              </ul>
            </div>

            {/* Column 3: Socials */}
            <div className="space-y-4 text-white">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b-2 border-zinc-800 pb-2 inline-block">{t.footer_socials}</h4>
              <ul className="space-y-2 text-[10px] font-bold uppercase text-zinc-300">
                <li><a href={adminConfig.twitterLink || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00ff41] transition-colors"><Twitter size={14} /> {t.footer_twitter}</a></li>
                <li><a href={adminConfig.telegramLink || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00ff41] transition-colors"><Send size={14} /> {t.footer_telegram}</a></li>
                <li><a href={adminConfig.discordLink || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00ff41] transition-colors"><Globe size={14} /> {t.footer_discord}</a></li>
              </ul>
            </div>

            {/* Column 4: Locale */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b-2 border-zinc-800 pb-2 inline-block">SYSTEM_LOCALE</h4>
              <div className="flex gap-2">
                {(['en', 'es', 'zh'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 text-[10px] font-black uppercase transition-all ${language === lang ? 'bg-[#00ff41] text-black' : 'bg-transparent text-white border-2 border-white hover:bg-white hover:text-black'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-zinc-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase text-zinc-600">
            <div>© 2026 VYTRONIX PROTOCOL // BUILD LOUD. SHIP BRUTAL.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Terminals_Agreement</a>
              <a href="#" className="hover:text-white transition-colors">Privacy_Matrix</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
