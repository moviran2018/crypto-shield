export interface GetBlockTokenData {
  score: number;
  riskFactors: string[];
  error?: string;
}

export async function analyzeGetBlock(
  contractAddress: string,
  chain: 'bsc' | 'ethereum' = 'bsc'
): Promise<GetBlockTokenData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const chainParam = chain === 'bsc' ? 'bsc' : 'eth';
    const url = `https://api.getblock.io/v1/${chainParam}/token/${contractAddress}/risk`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'x-api-key': globalThis.GETBLOCK_API_KEY ?? '' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { score: 50, riskFactors: ['API unavailable'], error: `HTTP ${response.status}` };
    }

    const data = await response.json() as Record<string, unknown>;

    const score = typeof data.score === 'number' ? data.score : 50;
    const riskFactors = Array.isArray(data.risk_factors) ? data.risk_factors as string[] : [];

    return { score, riskFactors };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { score: 0, riskFactors: [], error: message };
  }
}