import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";

interface RiskAudit {
    symbol: string;
    risk: "LOW" | "MEDIUM" | "HIGH";
    checks: {
        liquidityLocked: boolean;
        ownershipRenounced: boolean;
        taxSafe: boolean;
    };
    id: string;
}

export function ContractRisk({ symbol, risk, checks, id }: RiskAudit) {
    const { language } = useAppStore();
    const t = translations[language];

    const getStatusColor = (r: string) => {
        switch (r) {
            case "LOW": return "bg-[#00ff41] text-black";
            case "MEDIUM": return "bg-[#fffc20] text-black";
            case "HIGH": return "bg-red-600 text-white";
            default: return "bg-zinc-200 text-black";
        }
    };

    const getIcon = (r: string) => {
        switch (r) {
            case "LOW": return <ShieldCheck className="text-[#00ff41]" size={24} />;
            case "MEDIUM": return <Shield className="text-yellow-500" size={24} />;
            case "HIGH": return <ShieldAlert className="text-red-500" size={24} />;
            default: return <Shield size={24} />;
        }
    };

    return (
        <div className="border-4 border-black bg-zinc-900 p-5 shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    {getIcon(risk)}
                    <div>
                        <h4 className="font-black text-white italic tracking-tighter uppercase text-lg">${symbol}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-none ${getStatusColor(risk)}`}>
                            {risk === "LOW" ? t.alpha_risk_low : risk === "MEDIUM" ? t.alpha_risk_med : t.alpha_risk_high}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-zinc-500">LIQUIDITY_LOCKED</span>
                    <span className={checks.liquidityLocked ? "text-[#00ff41]" : "text-red-500"}>
                        {checks.liquidityLocked ? "VERIFIED" : "UNLOCKED"}
                    </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-zinc-500">OWNER_RENOUNCED</span>
                    <span className={checks.ownershipRenounced ? "text-[#00ff41]" : "text-red-500"}>
                        {checks.ownershipRenounced ? "YES" : "NO"}
                    </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-zinc-500">TAX_SUSPECT</span>
                    <span className={checks.taxSafe ? "text-[#00ff41]" : "text-red-500"}>
                        {checks.taxSafe ? "SAFE" : "DANGER"}
                    </span>
                </div>
            </div>
            
            <div className="mt-4 text-[7px] font-black uppercase text-zinc-600 tracking-[2px]">
                AUDIT_ID: {id}
            </div>
        </div>
    );
}

export function ContractRiskSection({ tokens }: { tokens: TokenData[] }) {
    const { language } = useAppStore();
    const t = translations[language];

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-black flex items-center gap-3">
                <ShieldCheck className="text-blue-500" size={32} />
                {t.alpha_contract_risk}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tokens.length > 0 ? tokens.slice(0, 4).map(token => {
                    const audit = token.audit || {
                        risk: "MEDIUM",
                        checks: { liquidityLocked: false, ownershipRenounced: false, taxSafe: false },
                        id: "AWAITING"
                    };
                    return (
                        <ContractRisk 
                            key={token.address}
                            symbol={token.symbol}
                            risk={audit.risk}
                            checks={audit.checks}
                            id={audit.id}
                        />
                    );
                }) : (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 border-4 border-black bg-zinc-100 flex items-center justify-center border-dashed opacity-50 font-black uppercase text-zinc-400">
                            AWAITING_AUDIT...
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

interface TokenData {
    symbol: string;
    address: string;
    liq: number;
    audit?: {
        risk: "LOW" | "MEDIUM" | "HIGH";
        checks: {
            liquidityLocked: boolean;
            ownershipRenounced: boolean;
            taxSafe: boolean;
        };
        id: string;
    };
}
