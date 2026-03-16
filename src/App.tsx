
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
import { ArbitrageScanner } from "@/components/modules/ArbitrageScanner";
import { WhaleTracker } from "@/components/modules/WhaleTracker";
import { ChartTerminal } from "@/components/modules/ChartTerminal";
import { CommandCenter } from "@/components/modules/CommandCenter";
import { AIBot } from "@/components/modules/AIBot";
import { translations } from "@/lib/translations";
import { SocialIntelligenceHub } from "@/components/modules/SocialIntelligenceHub";
import { WhitepaperV3 } from "@/components/modules/WhitepaperV3";
import { HunterTracker } from "@/components/modules/HunterTracker";
import AlphaScanner from "@/pages/AlphaScanner";
import { SignalBridge } from "@/components/modules/SignalBridge";
import { AegisAgent } from "@/components/modules/AegisAgent";

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function AppContent() {
  const { networkMode, setNetworkMode, activeViewId, language } = useAppStore();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* GRID OVERLAY */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 grid-pattern-light" />

      <div className="relative z-10">
        <GlobalEngine />
        <SignalBridge />
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
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="xl:col-span-2 space-y-8">
                  {networkMode && <AegisAgent />}
                  <ArbitrageScanner />
                </div>

                {/* Intelligence & Stats Sidebar */}
                <div className="space-y-8">
                  <Mercados />
                  <ApiHub />
                </div>
              </div>
            </div>
            
            <LiveGraph />
            <StackMonitor />
          </>
        )}

        {activeViewId === "WHALE_TRACKER" && <WhaleTracker />}
        {activeViewId === "CHART_TERMINAL" && <ChartTerminal />}
        {activeViewId === "PORTFOLIO" && <Portfolio />}
        {activeViewId === "COMMAND_CENTER" && <CommandCenter />}
        {activeViewId === "SOCIAL_HUB" && <SocialIntelligenceHub />}
        {activeViewId === "WHITEPAPER_V3" && <WhitepaperV3 />}
        {activeViewId === "HUNTER_TRACKER" && <HunterTracker />}
        {activeViewId === "ALPHA_SCANNER" && <AlphaScanner />}

      </div>
    </div>
  );
}
