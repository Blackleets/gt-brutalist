import { CHAINS } from "@/lib/chains";

export function Nosotros() {
    const totalEndpoints = Object.values(CHAINS).reduce(
        (acc, chain) => acc + Object.values(chain.environments).reduce((eAcc, env) => eAcc + env.endpoints.length, 0),
        0
    );

    return (
        <section className="border-b-4 border-black relative z-10 w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 text-center text-xl xs:text-2xl md:text-3xl font-black uppercase">
                <div className="p-6 xs:p-8 md:p-10 border-b-4 md:border-b-0 md:border-r-4 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-default">
                    {Object.keys(CHAINS).length} Chains Supported
                </div>
                <div className="p-6 xs:p-8 md:p-10 border-b-4 md:border-b-0 md:border-r-4 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-default">
                    99.9% Node Uptime
                </div>
                <div className="p-6 xs:p-8 md:p-10 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-default">
                    {totalEndpoints} Global Endpoints
                </div>
            </div>
        </section>
    );
}
