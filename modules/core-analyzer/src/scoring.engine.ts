import type { ContractAnalysis, SourceScore, TrendData } from './types.js';

const WEIGHTS = {
  bscscan: 0.25,
  etherscan: 0.25,
  getblock: 0.50,
};

export function calculateWeightedScore(sources: SourceScore[]): number {
  const availableSources = sources.filter(s => s.isAvailable);

  if (availableSources.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const source of availableSources) {
    const weight = WEIGHTS[source.sourceName] ?? 0;
    weightedSum += source.score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  const normalizedScore = weightedSum / totalWeight;
  return Math.round(Math.max(0, Math.min(100, normalizedScore)) * 100) / 100;
}

export function determineRiskLevel(score: number): ContractAnalysis['riskLevel'] {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'low';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'high';
  return 'critical';
}

export function detectSuddenDrop(trend: TrendData[]): { isSuddenDrop: boolean; dropAmount: number } {
  if (trend.length < 2) {
    return { isSuddenDrop: false, dropAmount: 0 };
  }

  const recent = trend.slice(-2);
  const current = recent[1]?.score ?? 0;
  const previous = recent[0]?.score ?? 0;
  const drop = previous - current;

  return {
    isSuddenDrop: drop > 15,
    dropAmount: Math.round(drop * 100) / 100,
  };
}

export function getRiskColor(level: ContractAnalysis['riskLevel']): string {
  switch (level) {
    case 'safe': return '#22c55e';
    case 'low': return '#eab308';
    case 'medium': return '#f97316';
    case 'high': return '#ef4444';
    case 'critical': return '#dc2626';
  }
}