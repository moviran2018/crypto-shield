export interface BscScanTokenData {
  buyTax: number;
  sellTax: number;
  isVerified: boolean;
  hasBlacklist: boolean;
  ownerRenounced: boolean;
  hasHiddenMint: boolean;
  isProxy: boolean;
  ownerAddress: string | null;
  score: number;
}

const BSCSCAN_API_BASE = 'https://api.bscscan.com/api';

function getBscScanApiKey(): string {
  return globalThis.BSCSCAN_API_KEY ?? '';
}

export async function analyzeBscScanToken(
  contractAddress: string
): Promise<BscScanTokenData & { error?: string }> {
  const apiKey = getBscScanApiKey();
  if (!apiKey) {
    return {
      buyTax: 0, sellTax: 0, isVerified: false, hasBlacklist: false,
      ownerRenounced: false, hasHiddenMint: false, isProxy: false,
      ownerAddress: null, score: 50, error: 'API key not configured',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const [contractInfo, sourceCode, tokenInfo] = await Promise.allSettled([
      fetch(`${BSCSCAN_API_BASE}?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${apiKey}`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${BSCSCAN_API_BASE}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${BSCSCAN_API_BASE}?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${apiKey}`, { signal: controller.signal }).then(r => r.json()),
    ]);

    clearTimeout(timeoutId);

    const isVerified = sourceCode.status === 'fulfilled' && sourceCode.value?.result?.[0]?.SourceCode?.length > 0;
    const creatorData = contractInfo.status === 'fulfilled' ? contractInfo.value?.result?.[0] : null;
    const ownerAddress = creatorData?.contractCreator ?? null;
    const isProxy = sourceCode.status === 'fulfilled' && sourceCode.value?.result?.[0]?.Proxy === '1';

    let buyTax = 0;
    let sellTax = 0;
    let hasBlacklist = false;
    let hasHiddenMint = false;
    let ownerRenounced = false;

    const sourceCodeStr = sourceCode.status === 'fulfilled' ? JSON.stringify(sourceCode.value?.result?.[0] ?? '') : '';

    if (sourceCodeStr) {
      const buyTaxMatch = sourceCodeStr.match(/buyTax\s*=\s*(\d+)/i);
      const sellTaxMatch = sourceCodeStr.match(/sellTax\s*=\s*(\d+)/i);
      const buyFeeMatch = sourceCodeStr.match(/buyFee\s*=\s*(\d+)/i);
      const sellFeeMatch = sourceCodeStr.match(/sellFee\s*=\s*(\d+)/i);
      const taxRateMatch = sourceCodeStr.match(/taxRate\s*=\s*(\d+)/i);

      if (buyTaxMatch) buyTax = parseInt(buyTaxMatch[1] ?? '0') / 100;
      if (buyFeeMatch) buyTax = parseInt(buyFeeMatch[1] ?? '0') / 100;
      if (sellTaxMatch) sellTax = parseInt(sellTaxMatch[1] ?? '0') / 100;
      if (sellFeeMatch) sellTax = parseInt(sellFeeMatch[1] ?? '0') / 100;
      if (taxRateMatch) { buyTax = parseInt(taxRateMatch[1] ?? '0') / 100; sellTax = buyTax; }

      hasBlacklist = /\bblacklist\b/i.test(sourceCodeStr) || /\bBlackList\b/i.test(sourceCodeStr);
      hasHiddenMint = /\bmint\b/i.test(sourceCodeStr) && /\bonlyOwner\b/i.test(sourceCodeStr);
      ownerRenounced = sourceCodeStr.includes('address(0)') && sourceCodeStr.includes('renounce');
    }

    const score = calculateSourceScore({
      buyTax, sellTax, isVerified, hasBlacklist,
      ownerRenounced, hasHiddenMint, isProxy,
    });

    return {
      buyTax, sellTax, isVerified, hasBlacklist,
      ownerRenounced, hasHiddenMint, isProxy,
      ownerAddress, score,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      buyTax: 0, sellTax: 0, isVerified: false, hasBlacklist: false,
      ownerRenounced: false, hasHiddenMint: false, isProxy: false,
      ownerAddress: null, score: 0, error: message,
    };
  }
}

function calculateSourceScore(data: {
  buyTax: number; sellTax: number; isVerified: boolean;
  hasBlacklist: boolean; ownerRenounced: boolean;
  hasHiddenMint: boolean; isProxy: boolean;
}): number {
  let score = 70;

  if (data.isVerified) score += 10;
  else score -= 10;

  if (data.ownerRenounced) score += 15;

  if (data.hasBlacklist) score -= 30;
  if (data.hasHiddenMint) score -= 40;
  if (data.isProxy) score -= 5;

  if (data.buyTax > 10) score -= Math.min(data.buyTax, 40);
  if (data.sellTax > 10) score -= Math.min(data.sellTax, 40);

  return Math.max(0, Math.min(100, score));
}