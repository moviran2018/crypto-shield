import { scanGoPlus } from './goplus.service.js';
import { scanHoneypot } from './honeypot.service.js';
import { scanRPC } from './rpc.service.js';
import { getCached, setCache } from './cache.service.js';
import { calculateScore, getTrafficLight, getRiskLevel, generateSummary, generateWarnings } from './scoring.engine.js';
import type { TokenAnalysis, SourceResult, AnalysisResponse } from './types.js';

let circuitBreakers: Record<string, { failures: number; lastFailure: number }> = {};
const CB_THRESHOLD = 3;
const CB_RESET_MS = 60_000;

function isOpen(name: string): boolean {
  const b = circuitBreakers[name];
  if (!b) return false;
  if (b.failures >= CB_THRESHOLD && Date.now() - b.lastFailure < CB_RESET_MS) return true;
  if (b.failures >= CB_THRESHOLD) { circuitBreakers[name] = { failures: 0, lastFailure: 0 }; }
  return false;
}

function recordFail(name: string): void {
  const b = circuitBreakers[name] ?? { failures: 0, lastFailure: 0 };
  b.failures++;
  b.lastFailure = Date.now();
  circuitBreakers[name] = b;
}

export async function analyzeToken(
  contractAddress: string,
  chain: 'bsc' | 'ethereum' = 'bsc'
): Promise<AnalysisResponse> {
  const traceId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return { success: false, error: { code: 'INVALID_ADDRESS', message: 'Invalid contract address format', traceId } };
    }

    const cached = getCached(contractAddress, chain);
    if (cached) {
      return { success: true, data: cached };
    }

    const sources: SourceResult[] = [];
    let buyTax = 0, sellTax = 0;
    let isHoneypot = false, isProxy = false, isMintable = false;
    let hasBlacklist = false, ownerRenounced = false, isVerified = false;
    let liquidityLocked = false, lpLockDays = 0;
    let totalSupply = '0', holderCount = 0;
    let ownerAddress: string | null = null;

    // Source 1: GoPlus
    if (!isOpen('goplus')) {
      const r = await scanGoPlus(contractAddress, chain);
      sources.push(r.data);
      if (!r.data.isAvailable) recordFail('goplus');
      if (r.raw) {
        isHoneypot = r.raw.is_honeypot === '1';
        isProxy = r.raw.is_proxy === '1';
        isMintable = r.raw.is_mintable === '1';
        hasBlacklist = r.raw.is_in_blacklist === '1';
        ownerRenounced = r.raw.is_contract_renounced === '1';
        buyTax = parseFloat(r.raw.buy_tax ?? '0');
        sellTax = parseFloat(r.raw.sell_tax ?? '0');
        isVerified = r.raw.is_verified === '1';
        ownerAddress = r.raw.owner_address ?? null;
        totalSupply = r.raw.total_supply ?? '0';
        holderCount = parseInt(r.raw.holder_count ?? '0');
      }
    } else {
      sources.push({ source: 'goplus', score: 0, isAvailable: false, duration: 0, error: 'Circuit breaker active' });
    }

    // Source 2: Honeypot.is
    if (!isOpen('honeypot')) {
      const r = await scanHoneypot(contractAddress, chain);
      sources.push(r.data);
      if (!r.data.isAvailable) recordFail('honeypot');
      if (r.isHoneypot) isHoneypot = true;
      if (r.buyTax > 0) buyTax = r.buyTax;
      if (r.sellTax > 0) sellTax = r.sellTax;
    } else {
      sources.push({ source: 'honeypot', score: 0, isAvailable: false, duration: 0, error: 'Circuit breaker active' });
    }

    // Source 3: RPC
    if (!isOpen('rpc')) {
      const r = await scanRPC(contractAddress, chain);
      sources.push(r.data);
      if (!r.data.isAvailable) recordFail('rpc');
      if (r.ownerAddress) ownerAddress = r.ownerAddress;
      if (r.totalSupply !== '0') totalSupply = r.totalSupply;
      holderCount = r.holderCount;
    } else {
      sources.push({ source: 'rpc', score: 0, isAvailable: false, duration: 0, error: 'Circuit breaker active' });
    }

    const trustScore = calculateScore(sources);
    const trafficLight = getTrafficLight(trustScore);
    const riskLevel = getRiskLevel(trustScore);

    const details = {
      buyTax, sellTax, isHoneypot, isProxy, isMintable,
      hasBlacklist, ownerRenounced, isVerified,
      liquidityLocked, lpLockDays, totalSupply, holderCount, ownerAddress,
    };

    const analysis: TokenAnalysis = {
      contractAddress,
      chain,
      trustScore,
      riskLevel,
      trafficLight,
      summary: generateSummary(trustScore, details),
      warnings: generateWarnings(details),
      details,
      sources,
      cacheHit: false,
      scannedAt: Date.now(),
    };

    setCache(contractAddress, chain, analysis);

    const available = sources.filter(s => s.isAvailable).length;
    const errMsg = available < 3
      ? `Only ${available}/3 sources available. Accuracy: ${Math.round((available / 3) * 100)}%`
      : undefined;

    return {
      success: true,
      data: analysis,
      error: errMsg ? { code: 'PARTIAL_DATA', message: errMsg, traceId } : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'ANALYSIS_FAILED', message: (error as Error).message, traceId },
    };
  }
}

export { scanGoPlus } from './goplus.service.js';
export { scanHoneypot } from './honeypot.service.js';
export { scanRPC } from './rpc.service.js';
export { calculateScore, getTrafficLight, getRiskLevel, generateSummary, generateWarnings } from './scoring.engine.js';
export { getCached, setCache, getCacheSize, clearExpired } from './cache.service.js';
export type { TokenAnalysis, SourceResult, AnalysisResponse, Chain, RiskLevel, CacheEntry } from './types.js';
export { FLAGS, TRAFFIC_LIGHT, plainEnglishDescription } from './types.js';
