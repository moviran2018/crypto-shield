import type { HoneypotResponse, SourceResult } from './types.js';

const HONEYPOT_API = 'https://honeypot.is/api/v2';

export async function scanHoneypot(
  contractAddress: string,
  chain: 'bsc' | 'ethereum'
): Promise<{ data: SourceResult; buyTax: number; sellTax: number; isHoneypot: boolean }> {
  const start = Date.now();
  try {
    const chainParam = chain === 'bsc' ? 'bsc' : 'eth';
    const url = `${HONEYPOT_API}/${chainParam}/${contractAddress}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        data: { source: 'honeypot', score: 50, isAvailable: false, duration: Date.now() - start, error: `HTTP ${response.status}` },
        buyTax: 0, sellTax: 0, isHoneypot: false,
      };
    }

    const json = await response.json() as HoneypotResponse;

    const simulation = json.data?.simulation ?? {};
    const buyTax = parseFloat(simulation.buyTax ?? simulation.buy_tax ?? '0');
    const sellTax = parseFloat(simulation.sellTax ?? simulation.sell_tax ?? '0');
    const isHoneypot = json.data?.honeypot === true || json.data?.isHoneypot === true;
    const liquidityLocked = json.data?.liquidityLocked === true;
    const lpLockDays = parseInt(json.data?.lpLockDays ?? json.data?.liquidityLockDays ?? '0');

    let score = 80;
    if (isHoneypot) score = 0;
    if (sellTax > 15) score -= sellTax;
    if (buyTax > 15) score -= buyTax;
    if (!liquidityLocked) score -= 15;
    if (lpLockDays > 365) score += 10;
    score = Math.max(0, Math.min(100, score));

    return {
      data: {
        source: 'honeypot', score, isAvailable: true,
        duration: Date.now() - start,
        raw: json.data as unknown as Record<string, unknown>,
      },
      buyTax, sellTax, isHoneypot,
    };
  } catch (error) {
    return {
      data: { source: 'honeypot', score: 50, isAvailable: false, duration: Date.now() - start, error: (error as Error).message },
      buyTax: 0, sellTax: 0, isHoneypot: false,
    };
  }
}
