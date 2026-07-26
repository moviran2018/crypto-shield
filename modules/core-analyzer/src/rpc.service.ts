import type { SourceResult } from './types.js';

const RPC_URLS: Record<string, string> = {
  bsc: 'https://bsc-dataseed1.binance.org',
  ethereum: 'https://cloudflare-eth.com',
};

function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

function hexToString(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, 2), 16);
    if (code > 0) str += String.fromCharCode(code);
  }
  return str;
}

export async function scanRPC(
  contractAddress: string,
  chain: 'bsc' | 'ethereum'
): Promise<{ data: SourceResult; holderCount: number; totalSupply: string; ownerAddress: string | null }> {
  const start = Date.now();
  try {
    const rpcUrl = RPC_URLS[chain] ?? RPC_URLS.bsc;
    if (!rpcUrl) {
      return {
        data: { source: 'rpc', score: 50, isAvailable: false, duration: Date.now() - start, error: 'No RPC URL' },
        holderCount: 0, totalSupply: '0', ownerAddress: null,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const rpcBody = (method: string, params: unknown[]) => ({
      jsonrpc: '2.0', id: 1, method, params,
    });

    const totalSupplyHex = await rpcCall(rpcUrl, rpcBody('eth_call', [{
      to: contractAddress,
      data: '0x18160ddd',
    }, 'latest']), controller.signal);

    const ownerHex = await rpcCall(rpcUrl, rpcBody('eth_call', [{
      to: contractAddress,
      data: '0x8da5cb5b',
    }, 'latest']), controller.signal);

    const code = await rpcCall(rpcUrl, rpcBody('eth_getCode', [contractAddress, 'latest']), controller.signal);
    clearTimeout(timeout);

    const totalSupply = totalSupplyHex ? hexToNumber(totalSupplyHex) : 0;
    const ownerAddress = ownerHex && ownerHex !== '0x' && ownerHex !== '0x0000000000000000000000000000000000000000'
      ? `0x${ownerHex.slice(26)}` : null;
    const isContract = code && code !== '0x';

    let score = 75;
    if (!isContract) score = 0;
    if (ownerAddress === null) score += 15;
    if (totalSupply === 0) score -= 20;

    return {
      data: { source: 'rpc', score: Math.max(0, Math.min(100, score)), isAvailable: true, duration: Date.now() - start },
      holderCount: 0,
      totalSupply: totalSupply.toString(),
      ownerAddress,
    };
  } catch (error) {
    return {
      data: { source: 'rpc', score: 50, isAvailable: false, duration: Date.now() - start, error: (error as Error).message },
      holderCount: 0, totalSupply: '0', ownerAddress: null,
    };
  }
}

async function rpcCall(url: string, body: object, signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json() as { result?: string };
    return json.result ?? null;
  } catch {
    return null;
  }
}
