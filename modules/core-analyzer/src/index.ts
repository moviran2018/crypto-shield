import { analyzeBscScanToken } from './bscScan.service.js';
import { analyzeEtherscanToken } from './etherScan.service.js';
import { analyzeGetBlock } from './getBlock.service.js';
import { calculateWeightedScore, determineRiskLevel, detectSuddenDrop } from './scoring.engine.js';
import type { ContractAnalysis, SourceScore, AnalysisResult, TrendData } from './types.js';

let circuitBreakers: Record<string, { failures: number; lastFailure: number }> = {};

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 60_000;

function isCircuitOpen(sourceName: string): boolean {
  const breaker = circuitBreakers[sourceName];
  if (!breaker) return false;
  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    const elapsed = Date.now() - breaker.lastFailure;
    if (elapsed < CIRCUIT_BREAKER_RESET_MS) return true;
    circuitBreakers[sourceName] = { failures: 0, lastFailure: 0 };
  }
  return false;
}

function recordFailure(sourceName: string): void {
  const breaker = circuitBreakers[sourceName] ?? { failures: 0, lastFailure: 0 };
  breaker.failures++;
  breaker.lastFailure = Date.now();
  circuitBreakers[sourceName] = breaker;
}

let trendHistory: Record<string, TrendData[]> = {};

export async function analyzeContract(
  contractAddress: string,
  chain: 'bsc' | 'ethereum' = 'bsc',
  previousTrends: TrendData[] = []
): Promise<AnalysisResult> {
  const traceId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return {
        success: false,
        error: { code: 'INVALID_ADDRESS', message: 'Invalid contract address format', traceId },
      };
    }

    const sources: SourceScore[] = [];
    const errors: string[] = [];

    if (!isCircuitOpen('bscscan')) {
      try {
        const bscResult = await analyzeBscScanToken(contractAddress);
        sources.push({
          sourceName: 'bscscan',
          score: bscResult.score,
          isAvailable: !bscResult.error,
          error: bscResult.error,
        });
        if (bscResult.error) { errors.push(bscResult.error); recordFailure('bscscan'); }
      } catch (e) {
        sources.push({ sourceName: 'bscscan', score: 0, isAvailable: false, error: (e as Error).message });
        errors.push((e as Error).message);
        recordFailure('bscscan');
      }
    } else {
      sources.push({ sourceName: 'bscscan', score: 0, isAvailable: false, error: 'Circuit breaker active' });
    }

    if (chain === 'ethereum' && !isCircuitOpen('etherscan')) {
      try {
        const ethResult = await analyzeEtherscanToken(contractAddress);
        sources.push({
          sourceName: 'etherscan',
          score: ethResult.score,
          isAvailable: !ethResult.error,
          error: ethResult.error,
        });
        if (ethResult.error) { errors.push(ethResult.error); recordFailure('etherscan'); }
      } catch (e) {
        sources.push({ sourceName: 'etherscan', score: 0, isAvailable: false, error: (e as Error).message });
        errors.push((e as Error).message);
        recordFailure('etherscan');
      }
    }

    if (!isCircuitOpen('getblock')) {
      try {
        const gbResult = await analyzeGetBlock(contractAddress, chain);
        sources.push({
          sourceName: 'getblock',
          score: gbResult.score,
          isAvailable: !gbResult.error,
          error: gbResult.error,
        });
        if (gbResult.error) { errors.push(gbResult.error); recordFailure('getblock'); }
      } catch (e) {
        sources.push({ sourceName: 'getblock', score: 0, isAvailable: false, error: (e as Error).message });
        errors.push((e as Error).message);
        recordFailure('getblock');
      }
    } else {
      sources.push({ sourceName: 'getblock', score: 0, isAvailable: false, error: 'Circuit breaker active' });
    }

    const availableSources = sources.filter(s => s.isAvailable);
    const trustScore = calculateWeightedScore(sources);
    const riskLevel = determineRiskLevel(trustScore);

    const trend: TrendData[] = [
      ...previousTrends,
      { score: trustScore, timestamp: Date.now() },
    ].slice(-5);

    if (contractAddress) {
      trendHistory[contractAddress] = trend;
    }

    const suddenDrop = detectSuddenDrop(trend);

    const contractAnalysis: ContractAnalysis = {
      contractAddress,
      chain,
      trustScore,
      riskLevel,
      buyTax: 0,
      sellTax: 0,
      isVerified: sources.some(s => s.isAvailable),
      hasBlacklist: false,
      ownerRenounced: false,
      hasHiddenMint: false,
      isProxy: false,
      ownerAddress: null,
      sources,
      trend,
      timestamp: Date.now(),
    };

    if (availableSources.length < 3) {
      const warning = `Only ${availableSources.length}/3 sources available. Analysis accuracy: ${Math.round((availableSources.length / 3) * 100)}%`;
      errors.push(warning);
    }

    if (suddenDrop.isSuddenDrop) {
      errors.push(`ALERT: Sudden network drop detected! Score dropped by ${suddenDrop.dropAmount} points.`);
    }

    return {
      success: true,
      data: contractAnalysis,
      error: errors.length > 0
        ? { code: 'PARTIAL_DATA', message: errors.join('; '), traceId }
        : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: { code: 'ANALYSIS_FAILED', message, traceId },
    };
  }
}

export { analyzeBscScanToken } from './bscScan.service.js';
export { calculateWeightedScore, determineRiskLevel, detectSuddenDrop } from './scoring.engine.js';
export type { ContractAnalysis, SourceScore, TrendData, AnalysisResult } from './types.js';