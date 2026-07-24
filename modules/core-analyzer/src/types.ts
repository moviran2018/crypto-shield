export interface ContractAnalysis {
  contractAddress: string;
  chain: 'bsc' | 'ethereum';
  trustScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  buyTax: number;
  sellTax: number;
  isVerified: boolean;
  hasBlacklist: boolean;
  ownerRenounced: boolean;
  hasHiddenMint: boolean;
  isProxy: boolean;
  ownerAddress: string | null;
  sources: SourceScore[];
  trend: TrendData[];
  timestamp: number;
}

export interface SourceScore {
  sourceName: 'bscscan' | 'etherscan' | 'getblock';
  score: number;
  isAvailable: boolean;
  error?: string;
  rawResponse?: Record<string, unknown>;
}

export interface TrendData {
  score: number;
  timestamp: number;
}

export interface RiskThresholds {
  buyTaxMax: number;
  sellTaxMax: number;
  requiresVerification: boolean;
  blacklistPenalty: number;
  ownerRenounceBonus: number;
  hiddenMintPenalty: number;
  proxyPenalty: number;
}

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  buyTaxMax: 10,
  sellTaxMax: 10,
  requiresVerification: false,
  blacklistPenalty: 30,
  ownerRenounceBonus: 15,
  hiddenMintPenalty: 40,
  proxyPenalty: 5,
};

export interface AnalysisResult {
  success: boolean;
  data?: ContractAnalysis;
  error?: {
    code: string;
    message: string;
    traceId: string;
  };
}

export interface BscScanResponse {
  status: string;
  message: string;
  result: Array<{
    ContractAddress: string;
    ContractCreator: string;
    TxHash: string;
    creator: string;
    IsProxy: '0' | '1';
    implementation?: string;
  }> | string;
}