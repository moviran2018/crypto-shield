import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const API = import.meta.env.VITE_API_URL ?? 'https://crypto-shield-api.moviran2018.workers.dev';

interface AdVerification {
  contractAddress: string;
  isScam: boolean;
  trustScore: number;
  trafficLight: string;
  warnings: string[];
  autoRejected: boolean;
  message: string;
}

export function History() {
  const [adAddress, setAdAddress] = useState('');
  const [verification, setVerification] = useState<AdVerification | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!adAddress || !/^0x[a-fA-F0-9]{40}$/.test(adAddress)) {
      setError('Enter a valid contract address');
      return;
    }
    setError('');
    setVerifying(true);
    setVerification(null);

    try {
      const res = await fetch(`${API}/api/admin/verify-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: adAddress, chain: 'bsc' }),
      });
      const json = await res.json();
      if (json.success) setVerification(json.data as AdVerification);
      else setError(json.error?.message ?? 'Verification failed');
    } catch {
      setError('Network error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="gradient-text">Admin & Ads</span> Panel
        </h1>
        <p className="text-brand-offwhite/50 text-base">
          Manage banner ads with automatic scam verification.
        </p>
      </div>

      {/* Ad Verification Gate */}
      <Card className="mb-8 border-brand-gold/20">
        <CardHeader>
          <CardTitle>🔒 Ad Application - Auto Verification Gate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-brand-offwhite/50 mb-4">
            Before renting ad space, the token contract is automatically scanned by the Triple-Consensus engine.
            Honeypots and scam tokens are rejected automatically.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="Paste token contract address to verify..."
              value={adAddress}
              onChange={(e) => { setAdAddress(e.target.value); setError(''); }}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleVerify} disabled={verifying}>
              {verifying ? 'Scanning...' : 'Verify Token'}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {verification && (
            <div className={`mt-4 rounded-lg p-4 border ${verification.autoRejected ? 'border-red-500/40 bg-red-500/10' : 'border-green-500/40 bg-green-500/10'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{verification.autoRejected ? '🚫' : '✅'}</span>
                <div>
                  <p className={`font-bold ${verification.autoRejected ? 'text-red-500' : 'text-green-500'}`}>
                    {verification.autoRejected ? 'REJECTED' : 'APPROVED'}
                  </p>
                  <p className="text-sm text-brand-offwhite/70">{verification.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                <div className="bg-[#1a1a1a] rounded p-2">
                  <span className="text-brand-offwhite/40">Score</span>
                  <p className="font-bold">{verification.trustScore}/100</p>
                </div>
                <div className="bg-[#1a1a1a] rounded p-2">
                  <span className="text-brand-offwhite/40">Status</span>
                  <p className="font-bold capitalize">{verification.trafficLight}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded p-2">
                  <span className="text-brand-offwhite/40">Flags</span>
                  <p className="font-bold">{verification.warnings.length}</p>
                </div>
              </div>
              {verification.warnings.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {verification.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-red-400">{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Management */}
      <Card>
        <CardHeader>
          <CardTitle>Banner Ad Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { slot: 'Sidebar Top', status: 'available', price: '$49/wk' },
              { slot: 'Sidebar Bottom', status: 'occupied', price: '$39/wk' },
              { slot: 'Header Banner', status: 'available', price: '$99/wk' },
              { slot: 'Footer', status: 'available', price: '$29/wk' },
              { slot: 'Between Results', status: 'occupied', price: '$59/wk' },
            ].map((ad) => (
              <div key={ad.slot} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-4">
                <div>
                  <p className="font-medium">{ad.slot}</p>
                  <p className="text-sm text-brand-offwhite/50">{ad.price}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  ad.status === 'available'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {ad.status === 'available' ? 'Available' : 'Occupied'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
