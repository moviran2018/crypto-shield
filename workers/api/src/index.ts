/**
 * Crypto Shield API - Cloudflare Worker
 *
 * Routes:
 *   POST /api/analyze        - Analyze a contract address
 *   POST /api/calculator     - Calculate exit strategy
 *   POST /api/monitor        - Add contract to monitoring
 *   GET  /api/monitor        - Get monitored contracts
 *   GET  /api/auth/nonce     - Get login nonce
 *   POST /api/auth/login     - Login with wallet signature
 *   GET  /api/admin/metrics  - Get admin dashboard metrics
 *   GET  /api/health         - Health check
 */

interface Env {
  BSCSCAN_API_KEY: string;
  ETHERSCAN_API_KEY: string;
  GETBLOCK_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function errorResponse(code: string, message: string, status = 400): Response {
  return corsResponse({ success: false, error: { code, message } }, status);
}

async function supabaseFetch(env: Env, path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      switch (true) {
        case path === '/api/analyze' && method === 'POST':
          return handleAnalyze(request, env);
        case path === '/api/calculator' && method === 'POST':
          return handleCalculator(request);
        case path === '/api/monitor' && method === 'POST':
          return handleAddMonitor(request, env);
        case path === '/api/monitor' && method === 'GET':
          return handleGetMonitor(request, env);
        case path === '/api/auth/nonce' && method === 'GET':
          return handleGetNonce();
        case path === '/api/auth/login' && method === 'POST':
          return handleLogin(request, env);
        case path === '/api/admin/metrics' && method === 'GET':
          return handleAdminMetrics(env);
        case path === '/api/health' && method === 'GET':
          return corsResponse({ status: 'ok', timestamp: Date.now() });
        default:
          return errorResponse('NOT_FOUND', 'Route not found', 404);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse('INTERNAL_ERROR', message, 500);
    }
  },
};

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const contractAddress = body.contractAddress as string | undefined;
  const chain = (body.chain as string) ?? 'bsc';

  if (!contractAddress) {
    return errorResponse('INVALID_INPUT', 'contractAddress is required');
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return errorResponse('INVALID_ADDRESS', 'Invalid contract address format');
  }

  globalThis.BSCSCAN_API_KEY = env.BSCSCAN_API_KEY;
  globalThis.ETHERSCAN_API_KEY = env.ETHERSCAN_API_KEY;
  globalThis.GETBLOCK_API_KEY = env.GETBLOCK_API_KEY;

  const { analyzeContract } = await import('../../../modules/core-analyzer/src/index.js');
  const result = await analyzeContract(contractAddress, chain as 'bsc' | 'ethereum');

  return corsResponse(result);
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

  const result = calculateExit(input);
  return corsResponse({ success: true, data: result });
}

async function handleAddMonitor(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { contractAddress, userId } = body;

  if (!contractAddress || !userId) {
    return errorResponse('INVALID_INPUT', 'contractAddress and userId are required');
  }

  const checkRes = await supabaseFetch(env,
    `monitored_contracts?user_id=eq.${userId}&contract_address=eq.${contractAddress}&select=id`
  );
  const existing = await checkRes.json() as Array<Record<string, unknown>>;
  if (existing.length > 0) {
    return errorResponse('DUPLICATE', 'Contract already being monitored');
  }

  await supabaseFetch(env, 'monitored_contracts', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, contract_address: contractAddress, chain: body.chain ?? 'bsc' }),
  });

  return corsResponse({ success: true, message: 'Contract added to monitoring' }, 201);
}

async function handleGetMonitor(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return errorResponse('INVALID_INPUT', 'userId is required');
  }

  const res = await supabaseFetch(env,
    `monitored_contracts?user_id=eq.${userId}&order=created_at.desc`
  );
  const contracts = await res.json();
  return corsResponse({ success: true, data: contracts });
}

function handleGetNonce(): Response {
  const nonce = crypto.randomUUID();
  return corsResponse({ success: true, data: { nonce } });
}

async function handleLogin(request: Request, _env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { walletAddress, signature, nonce } = body;

  if (!walletAddress || !signature || !nonce) {
    return errorResponse('INVALID_INPUT', 'walletAddress, signature, and nonce are required');
  }

  return corsResponse({
    success: true,
    data: {
      token: 'placeholder-jwt',
      user: { id: crypto.randomUUID(), walletAddress },
    },
  });
}

async function handleAdminMetrics(env: Env): Promise<Response> {
  const [usersRes, subsRes, todayRes] = await Promise.all([
    supabaseFetch(env, 'users?select=id&limit=0'),
    supabaseFetch(env, "users?subscription_status=eq.premium&select=id&limit=0"),
    supabaseFetch(env, "scan_history?created_at=gt.$(date -d '1 day ago' --iso-8601=seconds)&select=id&limit=0"),
  ]);

  return corsResponse({
    success: true,
    data: {
      totalUsers: 0,
      activeSubscriptions: 0,
      monthlyRevenue: 0,
      todayRequests: 0,
    },
  });
}
