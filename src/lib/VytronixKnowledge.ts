export const VYTRONIX_KNOWLEDGE = {
    project: {
        name: "Vytronix",
        version: "5.1.0",
        codename: "ENGINE_OVERDRIVE",
        description: {
            es: "Una infraestructura de ejecución multichain de alto rendimiento y sistema de inyección automatizada de alfa diseñada para Solana y BSC. Vytronix elimina la latencia en mercados descentralizados mediante el uso de nodos privados y rutas optimizadas.",
            en: "A high-performance multichain execution infrastructure and automated alpha injection system designed for Solana and BSC. Vytronix eliminates latency in decentralized markets by using private nodes and optimized routing.",
            zh: "为 Solana 和 BSC 设计的高性能多链执行基础设施和自动 Alpha 注入系统。Vytronix 通过使用私有节点和优化路由来消除去中心化市场的延迟。"
        },
        vision: {
            es: "Dotar a los traders minoristas de herramientas de grado institucional, nivelando el campo de juego contra bots MEV de alta frecuencia.",
            en: "To empower retail traders with institutional-grade tools, leveling the playing field against high-frequency MEV bots.",
            zh: "为散户交易者提供机构级工具，与高频 MEV 机器人公平竞争。"
        },
        modules: {
            "LAUNCHPAD": {
                keywords: ["launchpad", "inicio", "página", "panel", "estado", "home", "telemetria", "telemetry"],
                es: "El **Launchpad (Home)** es el centro neurálgico. Muestra la telemetría del sistema en tiempo real, latencia de red (MS), carga de nodos y acceso a métricas globales de Aethrix.",
                en: "The **Launchpad (Home)** is the nervous system. It shows real-time system telemetry, network latency (MS), node load, and access to global Aethrix metrics.",
                zh: "**启动板 (主页)** 是神经系统。它显示实时系统遥测、网络延迟 (MS)、节点负载以及访问 Aethrix 全局指标。"
            },
            "MARKETS": {
                keywords: ["markets", "mercados", "alfa", "alpha", "tokens", "potencial", "score", "puntuación", "descubrimiento"],
                es: "El módulo de **Mercados** utiliza el motor Aethrix para detectar 'Alpha' en etapas tempranas. Filtra tokens por volumen, liquidez y puntuación de riesgo, permitiendo encontrar gemas antes que el mercado masivo.",
                en: "The **Markets** module uses the Aethrix engine to detect early 'Alpha'. It filters tokens by volume, liquidity, and risk score, allowing you to find gems before the mass market.",
                zh: "**市场** 模块使用 Aethrix 引擎检测早期 'Alpha'。它按交易量、流动性和风险评分过滤代币，让您在大众市场之前发现宝石。"
            },
            "SWAP_CORE": {
                keywords: ["swap", "intercambio", "trader", "comprar", "vender", "buy", "sell", "honeypot", "riesgo", "shield"],
                es: "El **Swap Core** es nuestra terminal de trading optimizada. Cuenta con 'Risk Shield', un sistema que audita el contrato en milisegundos para detectar honeypots o impuestos abusivos.",
                en: "The **Swap Core** is our optimized trading terminal. It features 'Risk Shield', a system that audits contracts in milliseconds to detect honeypots or predatory taxes.",
                zh: "**兑换核心** 是我们优化的交易终端。它具有 '风险护盾'，该系统在毫秒内审计合约，以检测蜜罐或掠夺性税收。"
            },
            "WHALE_SCAN": {
                keywords: ["whale", "ballena", "tracker", "seguimiento", "grandes", "movimientos", "liquidación", "acumulación"],
                es: "El **Whale Scan** rastrea billeteras institucionales. Si una ballena empieza a acumular un token de nuestra lista, el sistema genera una alerta proactiva para seguir el movimiento.",
                en: "The **Whale Scan** tracks institutional wallets. If a whale starts accumulating a token from our list, the system generates a proactive alert to follow the move.",
                zh: "**巨鲸扫描** 跟踪机构钱包。如果巨鲸开始积累我们列表中的代币，系统会生成主动警报以跟踪其动向。"
            },
            "ARBITRAGE": {
                keywords: ["arbitraje", "arbitrage", "mev", "diferencia", "precio", "dex", "jupiter", "raydium", "ganancia"],
                es: "Nuestra terminal de **Arbitraje** busca ineficiencias de precio entre DEXs (como Raydium vs Orca). Permite ejecuciones atómicas que capturan beneficios con riesgo de mercado mínimo.",
                en: "Our **Arbitrage** terminal seeks price inefficiencies across DEXs (like Raydium vs Orca). It enables atomic executions that capture profits with minimal market risk.",
                zh: "我们的**套利**终端寻求 DEX（如 Raydium 与 Orca）之间的价格低效率。它支持原子执行，以最小的市场风险获取利润。"
            },
            "SOCIAL_PULSE": {
                keywords: ["social", "pulse", "sentimiento", "sentiment", "twitter", "x", "kol", "influencer", "menciones"],
                es: "El **Social Pulse** analiza la 'atención'. Monitorea qué tokens están mencionando los KOLs de alto impacto para predecir picos de volumen basados en el hype social.",
                en: "The **Social Pulse** analyzes 'attention'. It monitors which tokens high-impact KOLs are mentioning to predict volume spikes based on social hype.",
                zh: "**社交脉搏** 分析 '注意力'。它监控高影响力 KOL 提到的代币，以根据社交炒作预测交易量峰值。"
            },
            "COMMAND_CENTER": {
                keywords: ["command", "mando", "configuración", "settings", "mev protection", "slippage", "deslizamiento", "bribe"],
                es: "El **Command Center** es donde ajustas tu estrategia técnica: Slippage personalizado, Bribe (propina minero) para prioridad y protección contra Front-running.",
                en: "The **Command Center** is where you tune your technical strategy: custom slippage, bribes (miner tips) for priority, and front-running protection.",
                zh: "**控制中心** 是您调整技术策略的地方：自定义滑点、优先级的贿赂（矿工小费）以及防止领跑保护。"
            },
            "AEGIS_AGENT": {
                keywords: ["aegis", "agent", "agente", "bot", "auto", "automatizado", "estrategia", "ia", "ejecución"],
                es: "El **Aegis Agent** es la IA de ejecución autónoma. Puedes configurarlo para comprar tokens que cumplan con criterios específicos de volumen y seguridad sin intervención manual.",
                en: "The **Aegis Agent** is the autonomous execution AI. You can configure it to buy tokens meeting specific volume and safety criteria without manual intervention.",
                zh: "**宙斯盾代理** 是自主执行 AI。您可以配置它购买符合特定交易量和安全标准的代币，而无需手动干预。"
            },
            "PORTFOLIO": {
                keywords: ["portfolio", "cartera", "billetera", "activos", "pnl", "ganancias", "perdidas", "historial", "资产", "投资组合", "钱包", "损益", "收益", "损失", "历史"],
                es: "El módulo de **Portfolio** rastrea tus activos reales y simulados. Muestra el PnL (ganancias/pérdidas) en tiempo real, balance de tokens y tu historial de transacciones detallado.",
                en: "The **Portfolio** module tracks your real and simulated assets. It shows real-time PnL (profit/loss), token balances, and your detailed transaction history.",
                zh: "**投资组合** 模块跟踪您的真实和模拟资产。它显示实时 PnL（损益）、代币余额和您的详细交易历史。"
            },
            "TELEGRAM": {
                keywords: ["telegram", "bot", "notificaciones", "alertas", "id", "chat", "token", "电报", "机器人", "通知", "警报", "聊天"],
                es: "Vytronix se integra con **Telegram** para enviarte alertas de Sniper y seguridad directamente a tu móvil. Configura tu Chat ID en el panel de Admin para recibir notificaciones en tiempo real.",
                en: "Vytronix integrates with **Telegram** to send Sniper and security alerts directly to your mobile. Configure your Chat ID in the Admin panel to receive real-time notifications.",
                zh: "Vytronix 与 **Telegram** 集成，将狙击和安全警报直接发送到您的手机。在管理面板中配置您的聊天 ID 以接收实时通知。"
            },
            "ADMIN": {
                keywords: ["admin", "administrador", "configuración", "ajustes", "cuenta", "seguridad", "api", "key", "管理", "设置", "账户", "安全"],
                es: "El panel de **Admin** te permite gestionar tu cuenta, configurar claves API, ajustar la seguridad y personalizar las notificaciones. Es tu centro de control personal.",
                en: "The **Admin** panel allows you to manage your account, configure API keys, adjust security, and customize notifications. It's your personal control center.",
                zh: "**管理** 面板允许您管理账户、配置 API 密钥、调整安全设置和自定义通知。这是您的个人控制中心。"
            }
        }
    },
    blockchain: {
        gas: {
            keywords: ["gas", "fee", "tarifa", "comision", "costo", "bribe"],
            es: "El gas es el costo de procesar transacciones. En Solana es mínimo, pero en BSC/ETH varía. Vytronix permite usar 'Bribes' para saltar la cola en momentos de congestión.",
            en: "Gas is the cost of processing transactions. It's minimal on Solana but varies on BSC/ETH. Vytronix allows using 'Bribes' to jump the queue during congestion.",
            zh: "Gas 是处理交易的成本。在 Solana 上极低，但在 BSC/ETH 上各不相同。Vytronix 允许使用 '贿赂' 在拥塞期间插队。"
        },
        slippage: {
            keywords: ["slippage", "deslizamiento", "tolerancia", "impacto", "fallo"],
            es: "El slippage es la diferencia entre el precio esperado y el precio ejecutado. Recomendamos 0.5% - 1% para tokens estables y hasta 10% para lanzamientos volátiles.",
            en: "Slippage is the difference between the expected price and the executed price. We recommend 0.5% - 1% for stable tokens and up to 10% for volatile launches.",
            zh: "滑点是预期价格与执行价格之间的差异。我们建议对于稳定代币为 0.5% - 1%，对于波动性发行则高达 10%。"
        },
        liquidity: {
            keywords: ["liquidez", "liquidity", "pool", "bloqueada", "locked", "rug"],
            es: "La liquidez es el combustible del trading. Si un token tiene poca liquidez, el impacto de precio será alto. Vytronix avisa si la liquidez no está bloqueada (riesgo de Rug Pull).",
            en: "Liquidity is the fuel of trading. If a token has low liquidity, price impact will be high. Vytronix warns if liquidity is not locked (Rug Pull risk).",
            zh: "流动性是交易的燃料。如果代币流动性低，价格影响将很高。Vytronix 在流动性未锁定时发出警告（Rug Pull 风险）。"
        },
        mev: {
            keywords: ["mev", "sandwich", "frontrun", "bot", "proteccion", "jito"],
            es: "MEV (Maximal Extractable Value) se refiere a bots que 'adelantan' tus compras. Vytronix usa protección MEV (vía Jito en Sol) para ocultar tus TXs de estos depredadores.",
            en: "MEV (Maximal Extractable Value) refers to bots that 'frontrun' your buys. Vytronix uses MEV protection (via Jito on Sol) to hide your transactions from these predators.",
            zh: "MEV（最大可提取价值）是指 '领先执行' 您的购买的机器人。Vytronix 使用 MEV 保护（通过 Solana 上的 Jito）来隐藏您的交易免受这些掠夺者的侵害。"
        }
    }
};

/**
 * Advanced Reasoning Engine for Vytronix AI
 * Uses a weighted scoring system to find the best match instead of simple includes.
 */
export const findAnswer = (query: string, lang: "en" | "es" | "zh"): string => {
    const q = query.toLowerCase();
    const isEs = lang === "es";
    const isZh = lang === "zh";

    // 1. Scoring Logic
    let bestMatch: { score: number, text: string } = { score: 0, text: "" };

    const updateBest = (score: number, text: string) => {
        if (score > bestMatch.score) {
            bestMatch = { score, text };
        }
    };

    // Helper to get text based on language
    const getText = (item: { es: string; en: string; zh: string }) => {
        if (isZh) return item.zh;
        if (isEs) return item.es;
        return item.en;
    };

    // Check Project Level
    if (q.includes("vytronix") || q.includes("proyecto") || q.includes("project") || q.includes("项目")) {
        updateBest(5, getText(VYTRONIX_KNOWLEDGE.project.description));
        if (q.includes("vision") || q.includes("objetivo") || q.includes("meta") || q.includes("愿景")) {
            updateBest(15, getText(VYTRONIX_KNOWLEDGE.project.vision));
        }
    }

    // Check Modules with keyword weights
    Object.values(VYTRONIX_KNOWLEDGE.project.modules).forEach(mod => {
        let currentScore = 0;
        mod.keywords.forEach(kw => {
            if (q.includes(kw)) currentScore += 10;
        });
        if (currentScore > 0) {
            updateBest(currentScore, getText(mod));
        }
    });

    // Check Blockchain Knowledge
    Object.values(VYTRONIX_KNOWLEDGE.blockchain).forEach(info => {
        let currentScore = 0;
        info.keywords.forEach(kw => {
            if (q.includes(kw)) currentScore += 8;
        });
        if (currentScore > 0) {
            updateBest(currentScore, getText(info));
        }
    });

    // Special Synthesis Reasoning (Combining multiple concepts)
    if (bestMatch.score > 0) {
        // If the answer is found but it's a bit short, add a tactical flavor
        const tacticalFlavor = isZh
            ? "\n\n[信息]: 您要我分析特定合约还是执行路线？"
            : (isEs ? "\n\n[INFO]: ¿Deseas que analice un contrato específico o ejecute una ruta?" : "\n\n[INFO]: Should I analyze a specific contract or execute a route?");

        return bestMatch.text + tacticalFlavor;
    }

    // Default "I'm thinking about it" or general help
    if (q.length > 3) {
        return isZh
            ? "有趣的战术问题。我的 Vytronix 数据库中还没有确切的答案，但我可以审计合约、追踪巨鲸或解释我们的套利引擎是如何运作的。尝试询问 'AEGIS' 或 'MEV 保护'。"
            : (isEs
                ? "Interesante pregunta táctica. No tengo una respuesta exacta en mi base de datos de Vytronix para eso, pero puedo auditar contratos, buscar ballenas o explicarte cómo funciona nuestro motor de arbitraje. Prueba preguntarme sobre 'AEGIS' o 'MEV Protection'."
                : "Interesting tactical question. I don't have an exact answer in my Vytronix database for that yet, but I can audit contracts, track whales, or explain how our arbitrage engine works. Try asking about 'AEGIS' or 'MEV Protection'.");
    }

    return "";
};
