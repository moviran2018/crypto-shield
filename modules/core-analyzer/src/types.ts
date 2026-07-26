export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type Chain = 'bsc' | 'ethereum';

export interface TokenAnalysis {
  contractAddress: string;
  chain: Chain;
  trustScore: number;
  riskLevel: RiskLevel;
  trafficLight: 'green' | 'yellow' | 'red';
  summary: string;
  warnings: string[];
  details: {
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    isProxy: boolean;
    isMintable: boolean;
    hasBlacklist: boolean;
    ownerRenounced: boolean;
    isVerified: boolean;
    liquidityLocked: boolean;
    lpLockDays: number;
    totalSupply: string;
    holderCount: number;
    ownerAddress: string | null;
  };
  sources: SourceResult[];
  cacheHit: boolean;
  scannedAt: number;
}

export interface SourceResult {
  source: 'goplus' | 'honeypot' | 'rpc';
  score: number;
  isAvailable: boolean;
  duration: number;
  error?: string;
  raw?: Record<string, unknown>;
}

export interface AnalysisError {
  code: string;
  message: string;
  traceId: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: TokenAnalysis;
  error?: AnalysisError;
}

export interface GoPlusResponse {
  code: number;
  message: string;
  result: Record<string, {
    is_contract_renounced?: string;
    is_in_blacklist?: string;
    is_honeypot?: string;
    is_proxy?: string;
    is_mintable?: string;
    is_owner_change_balance?: string;
    buy_tax?: string;
    sell_tax?: string;
    total_supply?: string;
    holder_count?: string;
    owner_address?: string;
    is_verified?: string;
  }>;
}

export interface HoneypotResponse {
  success: boolean;
  data?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  error?: string;
}

export interface CacheEntry {
  data: TokenAnalysis;
  cachedAt: number;
  expiresAt: number;
}

export const FLAGS = {
  safe: { label: 'Safe', color: '#22c55e', emoji: '✅', description: 'No issues detected' },
  low: { label: 'Low Risk', color: '#eab308', emoji: '⚠️', description: 'Minor concerns' },
  medium: { label: 'Medium Risk', color: '#f97316', emoji: '⚠️', description: 'Several risk factors' },
  high: { label: 'High Risk', color: '#ef4444', emoji: '🚨', description: 'Dangerous token' },
  critical: { label: 'Critical', color: '#dc2626', emoji: '🚫', description: 'Confirmed scam/honeypot' },
} as const;

export const TRAFFIC_LIGHT = {
  green: { label: 'Safe to Trade', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' },
  yellow: { label: 'Use Caution', color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)' },
  red: { label: 'High Risk - Avoid', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
} as const;

export function plainEnglishDescription(key: string, value: boolean | string | number): string {
  const descriptions: Record<string, [string, string]> = {
    isProxy: ['⚠️ The owner can change the contract code at any time (upgradable proxy)', '✅ Contract is not upgradable'],
    isMintable: ['🚨 New tokens can be minted anytime, causing your holdings to devalue', '✅ Supply is fixed, no new tokens can be created'],
    hasBlacklist: ['🚨 Owner can block you from selling (rug pull risk)', '✅ No blacklist function found'],
    ownerRenounced: ['✅ Ownership is renounced - contract cannot be modified', '⚠️ Owner still has control over the contract'],
    isVerified: ['✅ Source code is verified on the explorer', '⚠️ Source code is not verified - high risk'],
    isHoneypot: ['🚨 This token cannot be sold! Classic honeypot scam', '✅ Token can be bought and sold normally'],
  };
  const pair = descriptions[key];
  if (!pair) return String(value);
  return value === true || value === 'true' ? pair[0] : pair[1];
}
