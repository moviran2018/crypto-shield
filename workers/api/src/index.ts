/**
 * Crypto Shield API - Cloudflare Worker
 * 
 * Main entry point for the Crypto Shield API.
 * Handles contract analysis, user management, and monitoring.
 * 
 * Routes:
 *   POST /api/analyze - Analyze a contract address
 *   POST /api/calculator - Calculate exit strategy
 *   POST /api/monitor - Add contract to monitoring
 *   GET  /api/monitor/:id - Get monitoring results
 *   POST /api/auth/login - Login with wallet signature
 *   GET  /api/admin/metrics - Get admin dashboard metrics
 */

interface Env {
  BSCSCAN_API_KEY: string;
  ETHERSCAN_API_KEY: string;
  GETBLOCK_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
  DB: D1Database;
}

type CorsHeaders = Record<string, string>;

const CORS_HEADERS: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

function errorResponse(code: string, message: string, status = 400): Response {
  return corsResponse({ success: false, error: { code, message } }, status);
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
        case path.startsWith('/api/monitor') && method === 'POST':
          return handleAddMonitor(request, env);
        case path.startsWith('/api/monitor') && method === 'GET':
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

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const trigger = event.cron;
    console.log(`Running scheduled task: ${trigger}`);

    try {
      const contracts = await env.DB.prepare(
        `SELECT id, user_id, contract_address, chain, last_scan 
         FROM monitored_contracts 
         WHERE is_active = true 
           AND (last_scan IS NULL OR last_scan < datetime('now', '-6 hours'))`
      ).all();

      for (const contract of contracts.results ?? []) {
        try {
          const response = await fetch(`${env.SUPABASE_URL}/functions/v1/scan-contract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              contractId: contract.id,
              contractAddress: contract.contract_address,
              chain: contract.chain,
              userId: contract.user_id,
            }),
          });

          if (!response.ok) {
            console.error(`Scan failed for ${contract.contract_address}: ${response.status}`);
          }
        } catch (scanError) {
          console.error(`Error scanning ${contract.contract_address}:`, scanError);
        }
      }
    } catch (error) {
      console.error('Scheduled task failed:', error);
    }
  },
};

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { contractAddress, chain = 'bsc' } = body;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return errorResponse('INVALID_INPUT', 'contractAddress is required');
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return errorResponse('INVALID_ADDRESS', 'Invalid contract address format');
  }

  const { analyzeContract } = await import('@crypto-shield/core-analyzer');
  const result = await analyzeContract(contractAddress, chain as 'bsc' | 'ethereum');

  return corsResponse(result);
}

async function handleCalculator(request: Request): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { calculateExit } = await import('@crypto-shield/exit-calculator');

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
  const { contractAddress, chain = 'bsc', userId } = body;

  if (!contractAddress || !userId) {
    return errorResponse('INVALID_INPUT', 'contractAddress and userId are required');
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM monitored_contracts WHERE user_id = ? AND contract_address = ?'
  ).bind(userId, contractAddress).first();

  if (existing) {
    return errorResponse('DUPLICATE', 'Contract already being monitored');
  }

  await env.DB.prepare(
    `INSERT INTO monitored_contracts (user_id, contract_address, chain)
     VALUES (?, ?, ?)`
  ).bind(userId, contractAddress, chain).run();

  return corsResponse({ success: true, message: 'Contract added to monitoring' }, 201);
}

async function handleGetMonitor(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return errorResponse('INVALID_INPUT', 'userId is required');
  }

  const contracts = await env.DB.prepare(
    'SELECT * FROM monitored_contracts WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return corsResponse({ success: true, data: contracts.results ?? [] });
}

async function handleGetNonce(): Promise<Response> {
  const nonce = crypto.randomUUID();
  return corsResponse({ success: true, data: { nonce } });
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const { walletAddress, signature, nonce } = body;

  if (!walletAddress || !signature || !nonce) {
    return errorResponse('INVALID_INPUT', 'walletAddress, signature, and nonce are required');
  }

  return corsResponse({
    success: true,
    data: { token: 'placeholder-jwt', user: { id: crypto.randomUUID(), walletAddress } },
  });
}

async function handleAdminMetrics(env: Env): Promise<Response> {
  const totalUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  const activeSubs = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE subscription_status = 'premium'"
  ).first();
  const todayRequests = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM scan_history WHERE created_at > datetime('now', '-1 day')"
  ).first();

  return corsResponse({
    success: true,
    data: {
      totalUsers: (totalUsers as { count: number })?.count ?? 0,
      activeSubscriptions: (activeSubs as { count: number })?.count ?? 0,
      monthlyRevenue: ((activeSubs as { count: number })?.count ?? 0) * 19.99,
      todayRequests: (todayRequests as { count: number })?.count ?? 0,
    },
  });
}
