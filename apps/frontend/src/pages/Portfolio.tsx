import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const API = import.meta.env.VITE_API_URL ?? 'https://crypto-shield-api.moviran2018.workers.dev';

interface TokenEntry {
  address: string;
  balance: string;
  chain: string;
}

interface PortfolioResult {
  totalTokens: number;
  highRiskCount: number;
  highRiskPercent: number;
  results: Array<{
    address: string;
    riskScore: number;
    balance: number;
    analysis: { success: boolean; data?: { trustScore: number; trafficLight: string; warnings: string[] } } | null;
  }>;
}

export function Portfolio() {
  const [tokens, setTokens] = useState<TokenEntry[]>([{ address: '', balance: '', chain: 'bsc' }]);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addToken = () => setTokens([...tokens, { address: '', balance: '', chain: 'bsc' }]);

  const removeToken = (i: number) => {
    if (tokens.length === 1) return;
    setTokens(tokens.filter((_, idx) => idx !== i));
  };

  const updateToken = (i: number, field: keyof TokenEntry, value: string) => {
    const updated = [...tokens];
    updated[i] = { ...updated[i], [field]: value };
    setTokens(updated);
  };

  const handleAnalyze = async () => {
    const valid = tokens.filter(t => /^0x[a-fA-F0-9]{40}$/.test(t.address) && t.balance);
    if (valid.length === 0) {
      setError('Add at least one valid token address with balance');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/portfolio/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: valid }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data as PortfolioResult);
      else setError(json.error?.message ?? 'Analysis failed');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const riskColor = result
    ? result.highRiskPercent >= 50 ? '#ef4444' : result.highRiskPercent >= 20 ? '#eab308' : '#22c55e'
    : '#666';

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="gradient-text">Portfolio</span> Risk Tracker
        </h1>
        <p className="text-brand-offwhite/50 text-base">
          Paste your token addresses and balances to assess overall portfolio health.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tokens.map((t, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Token address (0x...)"
                  value={t.address}
                  onChange={(e) => updateToken(i, 'address', e.target.value)}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Balance (e.g. 1000)"
                    value={t.balance}
                    onChange={(e) => updateToken(i, 'balance', e.target.value)}
                    className="w-32 text-sm"
                  />
                  <select
                    value={t.chain}
                    onChange={(e) => updateToken(i, 'chain', e.target.value)}
                    className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-brand-offwhite"
                  >
                    <option value="bsc">BSC</option>
                    <option value="ethereum">ETH</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeToken(i)}
                className="text-red-500 hover:text-red-400 text-sm mt-2"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={addToken}>+ Add Token</Button>
            <Button onClick={handleAnalyze} disabled={loading} size="sm">
              {loading ? 'Scanning...' : 'Assess Portfolio'}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {result && !loading && (
        <div className="space-y-6">
          <Card className="border-2" style={{ borderColor: riskColor + '40' }}>
            <CardHeader>
              <CardTitle>Portfolio Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                  style={{ borderColor: riskColor, color: riskColor }}
                >
                  {100 - result.highRiskPercent}%
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Tokens: <strong>{result.totalTokens}</strong></span>
                    <span className="text-green-500">Safe: <strong>{result.totalTokens - result.highRiskCount}</strong></span>
                    <span className="text-red-500">High Risk: <strong>{result.highRiskCount}</strong></span>
                  </div>
                  <Progress value={100 - result.highRiskPercent} variant="risk" />
                  <p className="text-sm text-brand-offwhite/50">
                    {result.highRiskPercent === 0
                      ? '✅ Your portfolio appears healthy with no high-risk tokens.'
                      : `⚠️ ${result.highRiskPercent}% of your portfolio is in high-risk tokens.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.results.filter(r => r.analysis?.data?.warnings?.length).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-500">Risk Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.results.map((r, i) => {
                  if (!r.analysis?.data?.warnings?.length) return null;
                  return (
                    <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                      <code className="text-xs font-mono text-brand-offwhite/60">{r.address.slice(0, 10)}...</code>
                      <ul className="mt-2 space-y-1">
                        {r.analysis.data.warnings.map((w, wi) => (
                          <li key={wi} className="text-sm text-red-400">{w}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
