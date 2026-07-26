import type { GoPlusResponse, SourceResult } from './types.js';

const GOPLUS_API = 'https://api.gopluslabs.io/api/v1';

export async function scanGoPlus(
  contractAddress: string,
  chain: 'bsc' | 'ethereum'
): Promise<{ data: SourceResult; raw: GoPlusResponse['result'][string] | null }> {
  const start = Date.now();
  try {
    const chainId = chain === 'bsc' ? '56' : '1';
    const url = `${GOPLUS_API}/token_security/${chainId}?contract_addresses=${contractAddress}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        data: { source: 'goplus', score: 0, isAvailable: false, duration: Date.now() - start, error: `HTTP ${response.status}` },
        raw: null,
      };
    }

    const json = await response.json() as GoPlusResponse;

    if (json.code !== 1 || !json.result) {
      return {
        data: { source: 'goplus', score: 0, isAvailable: false, duration: Date.now() - start, error: json.message || 'No result' },
        raw: null,
      };
    }

    const tokenData = json.result[contractAddress.toLowerCase()];
    if (!tokenData) {
      return {
        data: { source: 'goplus', score: 0, isAvailable: false, duration: Date.now() - start, error: 'Token not found' },
        raw: null,
      };
    }

    const isHoneypot = tokenData.is_honeypot === '1';
    const isProxy = tokenData.is_proxy === '1';
    const isMintable = tokenData.is_mintable === '1';
    const hasBlacklist = tokenData.is_in_blacklist === '1';
    const ownerRenounced = tokenData.is_contract_renounced === '1';
    const buyTax = parseFloat(tokenData.buy_tax ?? '0');
    const sellTax = parseFloat(tokenData.sell_tax ?? '0');
    const isVerified = tokenData.is_verified === '1';

    let score = 85;
    if (isHoneypot) score = 0;
    if (isProxy) score -= 10;
    if (isMintable) score -= 25;
    if (hasBlacklist) score -= 25;
    if (ownerRenounced) score += 15;
    if (buyTax > 10) score -= Math.min(buyTax, 30);
    if (sellTax > 10) score -= Math.min(sellTax, 30);
    if (!isVerified) score -= 10;
    score = Math.max(0, Math.min(100, score));

    return {
      data: {
        source: 'goplus',
        score,
        isAvailable: true,
        duration: Date.now() - start,
        raw: json.result as unknown as Record<string, unknown>,
      },
      raw: tokenData,
    };
  } catch (error) {
    return {
      data: { source: 'goplus', score: 0, isAvailable: false, duration: Date.now() - start, error: (error as Error).message },
      raw: null,
    };
  }
}
