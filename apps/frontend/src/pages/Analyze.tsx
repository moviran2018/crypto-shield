import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenAnalysis {
  contractAddress: string;
  chain: string;
  trustScore: number;
  riskLevel: string;
  trafficLight: 'green' | 'yellow' | 'red';
  summary: string;
  warnings: string[];
  cacheHit: boolean;
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
    ownerAddress: string | null;
  };
  sources: Array<{ source: string; score: number; isAvailable: boolean; duration: number }>;
  scannedAt: number;
}

const TRAFFIC_LIGHT = {
  green: { label: 'Safe to Trade', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' },
  yellow: { label: 'Use Caution', color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)' },
  red: { label: 'High Risk - Avoid', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
} as const;

const API = import.meta.env.VITE_API_URL ?? 'https://crypto-shield-api.moviran2018.workers.dev';

export function Analyze() {
  const [address, setAddress] = useState('');
  const [analysis, setAnalysis] = useState<TokenAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Please enter a valid contract address (0x...)');
      return;
    }
    setError('');
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: address, chain: 'bsc' }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setAnalysis(json.data as TokenAnalysis);
      } else {
        setError(json.error?.message ?? 'Analysis failed');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tl = analysis ? TRAFFIC_LIGHT[analysis.trafficLight] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="gradient-text">Token Security</span> Scanner
        </h1>
        <p className="text-brand-offwhite/50 text-base max-w-xl mx-auto">
          Triple-consensus engine scanning GoPlus, Honeypot.is, and onchain RPC data simultaneously.
        </p>
      </div>

      <Card className="mb-8 border-brand-gold/10">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Paste contract address (0x...)"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setError(''); }}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleAnalyze} disabled={loading} size="lg">
              {loading ? 'Scanning...' : 'Scan Token'}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
              <p className="text-brand-offwhite/60">Scanning 3 sources simultaneously...</p>
              <div className="w-full max-w-md space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Traffic Light Banner */}
          <div
            className="rounded-xl p-6 text-center border-2"
            style={{ backgroundColor: tl!.bg, borderColor: tl!.border }}
          >
            <div className="text-6xl mb-2">
              {analysis.trafficLight === 'green' ? '🟢' : analysis.trafficLight === 'yellow' ? '🟡' : '🔴'}
            </div>
            <h2 className="text-2xl font-bold" style={{ color: tl!.color }}>{tl!.label}</h2>
            <p className="text-brand-offwhite/70 mt-1 max-w-lg mx-auto">{analysis.summary}</p>
          </div>

          {/* Security Score Ring */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={tl!.color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(analysis.trustScore / 100) * 264} 264`}
                        style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold" style={{ color: tl!.color }}>{analysis.trustScore}</span>
                    </div>
                  </div>
                  <p className="text-brand-offwhite/50 text-sm mt-2">/ 100</p>
                </div>
              </CardContent>
            </Card>

            {/* Tax Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Buy Tax</span>
                    <span className={analysis.details.buyTax > 10 ? 'text-red-500 font-bold' : 'text-green-500'}>
                      {analysis.details.buyTax}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, analysis.details.buyTax * 3)} variant="risk" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sell Tax</span>
                    <span className={analysis.details.sellTax > 10 ? 'text-red-500 font-bold' : 'text-green-500'}>
                      {analysis.details.sellTax}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, analysis.details.sellTax * 3)} variant="risk" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-500">Risk Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Details Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Ownership', value: analysis.details.ownerRenounced ? '✅ Renounced' : '⚠️ Active', isGood: analysis.details.ownerRenounced },
                  { label: 'Proxy/Upgradable', value: analysis.details.isProxy ? '⚠️ Yes' : '✅ No', isGood: !analysis.details.isProxy },
                  { label: 'Mintable', value: analysis.details.isMintable ? '🚨 Yes' : '✅ No', isGood: !analysis.details.isMintable },
                  { label: 'Blacklist', value: analysis.details.hasBlacklist ? '🚨 Yes' : '✅ No', isGood: !analysis.details.hasBlacklist },
                  { label: 'Honeypot', value: analysis.details.isHoneypot ? '🚨 YES' : '✅ No', isGood: !analysis.details.isHoneypot },
                  { label: 'Verified', value: analysis.details.isVerified ? '✅ Yes' : '⚠️ No', isGood: analysis.details.isVerified },
                ].map((item, i) => (
                  <div key={i} className={`rounded-lg p-3 border ${item.isGood ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <p className="text-xs text-brand-offwhite/50 mb-1">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.isGood ? 'text-green-500' : 'text-red-500'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              {analysis.details.ownerAddress && (
                <div className="mt-4 bg-[#1a1a1a] rounded-lg p-3">
                  <p className="text-xs text-brand-offwhite/50 mb-1">Owner Address</p>
                  <code className="text-sm font-mono text-brand-offwhite/70 break-all">{analysis.details.ownerAddress}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Source Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.sources.map((s) => (
                  <div key={s.source} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium capitalize">{s.source}</span>
                      {s.duration > 0 && <span className="text-xs text-brand-offwhite/30">{(s.duration / 1000).toFixed(1)}s</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-offwhite/50">Score:</span>
                      <span className="font-mono font-bold" style={{ color: s.score >= 70 ? '#22c55e' : s.score >= 40 ? '#eab308' : '#ef4444' }}>
                        {s.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
