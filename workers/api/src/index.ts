interface Env {
  GPLUS_API_KEY: string;
  RPC_URL_BSC: string;
  RPC_URL_ETH: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function err(code: string, msg: string, status = 400): Response {
  return json({ success: false, error: { code, message: msg } }, status);
}

async function supabase(env: Env, path: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
      switch (true) {
        case path === '/api/analyze' && method === 'POST':
          return handleAnalyze(request, env);
        case path === '/api/calculator' && method === 'POST':
          return handleCalculator(request);
        case path === '/api/portfolio/analyze' && method === 'POST':
          return handlePortfolio(request);
        case path === '/api/launchpad/list' && method === 'GET':
          return handleLaunchpadList(env);
        case path === '/api/launchpad/create' && method === 'POST':
          return handleLaunchpadCreate(request, env);
        case path === '/api/admin/verify-ad' && method === 'POST':
          return handleVerifyAd(request, env);
        case path === '/api/admin/metrics' && method === 'GET':
          return handleAdminMetrics(env);
        case path === '/api/health' && method === 'GET':
          return json({ status: 'ok', timestamp: Date.now() });
        default:
          return err('NOT_FOUND', 'Route not found', 404);
      }
    } catch (error) {
      return err('INTERNAL_ERROR', (error as Error).message, 500);
    }
  },
};

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const address = body.contractAddress as string | undefined;
  const chain = (body.chain as string) ?? 'bsc';

  if (!address) return err('INVALID_INPUT', 'contractAddress required');
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return err('INVALID_ADDRESS', 'Invalid contract address');

  globalThis.GPLUS_API_KEY = env.GPLUS_API_KEY ?? '';

  const { analyzeToken } = await import('../../../modules/core-analyzer/src/index.js');
  const result = await analyzeToken(address, chain as 'bsc' | 'ethereum');

  return json(result);
}

async function handleCalculator(request: Request): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { calculateExit } = await import('../../../modules/exit-calculator/src/index.js');
  const input = {
    investmentAmount: Number(body.investmentAmount ?? 0),
    tokenPrice: Number(body.tokenPrice ?? 1),
    sellTax: Number(body.sellTax ?? 0),
    maxSellPerTx: Number(body.maxSellPerTx ?? 0),
    gasPerTx: 21000,
    gasPriceGwei: Number(body.gasPriceGwei ?? 5),
    chain: (body.chain as 'bsc' | 'ethereum') ?? 'bsc',
  };
  return json({ success: true, data: calculateExit(input) });
}

async function handlePortfolio(request: Request): Promise<Response> {
  const body = await request.json() as Record<string, { balance: string; chain: string }[]>;
  const tokens = body.tokens as Array<{ address: string; balance: string; chain: string }> | undefined;

  if (!tokens || !Array.isArray(tokens)) {
    return err('INVALID_INPUT', 'tokens array required');
  }

  const { analyzeToken } = await import('../../../modules/core-analyzer/src/index.js');
  const results = [];
  let highRiskCount = 0;
  let totalValue = 0;

  for (const t of tokens) {
    try {
      const analysis = await analyzeToken(t.address, t.chain as 'bsc' | 'ethereum');
      const bal = parseFloat(t.balance);
      totalValue += bal;
      if (analysis.success && analysis.data && analysis.data.trustScore < 40) {
        highRiskCount++;
      }
      results.push({ address: t.address, riskScore: analysis.success ? analysis.data!.trustScore : 0, balance: bal, analysis });
    } catch {
      results.push({ address: t.address, riskScore: 0, balance: parseFloat(t.balance), analysis: null });
    }
  }

  return json({
    success: true,
    data: {
      totalTokens: tokens.length,
      highRiskCount,
      highRiskPercent: tokens.length > 0 ? Math.round((highRiskCount / tokens.length) * 100) : 0,
      results,
    },
  });
}

async function handleLaunchpadList(env: Env): Promise<Response> {
  const res = await supabase(env, 'presales?select=*&order=created_at.desc');
  const data = res.ok ? await res.json() : [];
  return json({ success: true, data });
}

async function handleLaunchpadCreate(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { tokenAddress, chain, name, symbol, totalSupply, presalePrice, softCap, hardCap, startDate, endDate, logoUrl, description } = body;

  if (!tokenAddress || !name || !symbol) {
    return err('INVALID_INPUT', 'tokenAddress, name, and symbol required');
  }

  // Auto-verify token before listing
  globalThis.GPLUS_API_KEY = env.GPLUS_API_KEY ?? '';
  const { analyzeToken } = await import('../../../modules/core-analyzer/src/index.js');
  const verification = await analyzeToken(tokenAddress as string, (chain as string) as 'bsc' | 'ethereum');

  const isSafe = verification.success && verification.data && verification.data.trafficLight === 'green';

  const presale = {
    token_address: tokenAddress,
    chain: chain ?? 'bsc',
    name, symbol,
    total_supply: totalSupply ?? '0',
    presale_price: presalePrice ?? '0',
    soft_cap: softCap ?? '0',
    hard_cap: hardCap ?? '0',
    start_date: startDate ?? new Date().toISOString(),
    end_date: endDate ?? new Date(Date.now() + 14 * 86400000).toISOString(),
    logo_url: logoUrl ?? '',
    description: description ?? '',
    is_verified: isSafe,
    risk_score: verification.success ? verification.data!.trustScore : 0,
    tokens_sold: '0',
    status: 'active',
    owner_renounced: verification.success ? verification.data!.details.ownerRenounced : false,
    liquidity_locked: verification.success ? verification.data!.details.liquidityLocked : false,
  };

  await supabase(env, 'presales', { method: 'POST', body: JSON.stringify(presale) });

  if (!isSafe) {
    return json({
      success: true,
      data: presale,
      warning: 'Token listed but FAILED safety checks. It will be marked as High Risk.',
    }, 201);
  }

  return json({ success: true, data: presale }, 201);
}

async function handleVerifyAd(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const address = body.contractAddress as string | undefined;
  const chain = (body.chain as string) ?? 'bsc';

  if (!address) return err('INVALID_INPUT', 'contractAddress required');

  globalThis.GPLUS_API_KEY = env.GPLUS_API_KEY ?? '';
  const { analyzeToken } = await import('../../../modules/core-analyzer/src/index.js');
  const result = await analyzeToken(address, chain as 'bsc' | 'ethereum');

  const isScam = !result.success || (result.data && (result.data.trafficLight === 'red' || result.data.details.isHoneypot));

  return json({
    success: true,
    data: {
      contractAddress: address,
      isScam,
      trustScore: result.success ? result.data!.trustScore : 0,
      trafficLight: result.success ? result.data!.trafficLight : 'red',
      warnings: result.success ? result.data!.warnings : [],
      autoRejected: isScam,
      message: isScam
        ? '❌ Ad REJECTED: Token flagged as High Risk/Scam by Triple-Consensus engine.'
        : '✅ Ad approved: Token passed all security checks.',
    },
  });
}

async function handleAdminMetrics(env: Env): Promise<Response> {
  return json({
    success: true,
    data: {
      totalUsers: 0,
      activePresales: 0,
      pendingAds: 0,
      systemStatus: 'operational',
      cacheSize: 0,
    },
  });
}
