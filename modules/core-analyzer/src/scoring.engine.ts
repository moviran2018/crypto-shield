import type { TokenAnalysis, SourceResult, RiskLevel } from './types.js';

const WEIGHTS = {
  goplus: 0.40,
  honeypot: 0.40,
  rpc: 0.20,
};

export function calculateScore(sources: SourceResult[]): number {
  const active = sources.filter(s => s.isAvailable);
  if (active.length === 0) return 0;

  let weighted = 0;
  let totalWeight = 0;

  for (const s of active) {
    const w = WEIGHTS[s.source] ?? 0;
    weighted += s.score * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;
  return Math.round(Math.max(0, Math.min(100, weighted / totalWeight)));
}

export function getTrafficLight(score: number): TokenAnalysis['trafficLight'] {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'low';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'high';
  return 'critical';
}

export function generateSummary(score: number, details: TokenAnalysis['details']): string {
  if (details.isHoneypot) return 'This is a honeypot! You CANNOT sell this token. Avoid at all costs.';
  if (score >= 80) return 'This token appears safe to trade. All security checks passed with flying colors.';
  if (score >= 60) return 'This token has minor risk factors. Trade with normal caution.';
  if (score >= 40) return 'This token has several risk factors. Do your own research before investing.';
  if (score >= 20) return 'This token is high risk. Significant red flags detected.';
  return 'CRITICAL: This token shows severe scam indicators. Do not invest.';
}

export function generateWarnings(details: TokenAnalysis['details']): string[] {
  const w: string[] = [];
  if (details.isHoneypot) w.push('🚨 Confirmed honeypot - you will not be able to sell');
  if (details.isProxy && !details.ownerRenounced) w.push('⚠️ Contract is upgradable - owner can change rules anytime');
  if (details.isMintable) w.push('🚨 Owner can mint unlimited new tokens (dilutes your value)');
  if (details.hasBlacklist) w.push('🚨 Owner can block addresses from selling');
  if (!details.ownerRenounced) w.push('⚠️ Owner has not renounced contract ownership');
  if (details.sellTax > 10) w.push(`⚠️ High sell tax (${details.sellTax}%) - you lose significant value on exit`);
  if (details.buyTax > 10) w.push(`⚠️ High buy tax (${details.buyTax}%)`);
  if (!details.liquidityLocked) w.push('⚠️ Liquidity is not locked - owner can remove it');
  if (!details.isVerified) w.push('⚠️ Contract source code is not verified on explorer');
  return w;
}
