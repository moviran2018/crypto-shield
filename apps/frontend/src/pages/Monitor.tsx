import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const API = import.meta.env.VITE_API_URL ?? 'https://crypto-shield-api.moviran2018.workers.dev';

interface Presale {
  id: string;
  name: string;
  symbol: string;
  token_address: string;
  presale_price: string;
  soft_cap: string;
  hard_cap: string;
  tokens_sold: string;
  total_supply: string;
  is_verified: boolean;
  risk_score: number;
  owner_renounced: boolean;
  liquidity_locked: boolean;
  logo_url: string;
  description: string;
  status: string;
}

export function Monitor() {
  const [presales, setPresales] = useState<Presale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    tokenAddress: '', name: '', symbol: '', totalSupply: '',
    presalePrice: '', softCap: '', hardCap: '', description: '', chain: 'bsc',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formResult, setFormResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchPresales();
  }, []);

  const fetchPresales = async () => {
    try {
      const res = await fetch(`${API}/api/launchpad/list`);
      const json = await res.json();
      if (json.success) setPresales(json.data as Presale[]);
    } catch (e) {
      console.error('Failed to fetch presales:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePresale = async () => {
    if (!form.tokenAddress || !form.name || !form.symbol) return;
    setFormLoading(true);
    setFormResult(null);

    try {
      const res = await fetch(`${API}/api/launchpad/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setFormResult({ success: true, message: json.warning ?? 'Presale created successfully!' });
        setForm({ tokenAddress: '', name: '', symbol: '', totalSupply: '', presalePrice: '', softCap: '', hardCap: '', description: '', chain: 'bsc' });
        setShowForm(false);
        fetchPresales();
      } else {
        setFormResult({ success: false, message: json.error?.message ?? 'Failed to create' });
      }
    } catch {
      setFormResult({ success: false, message: 'Network error' });
    } finally {
      setFormLoading(false);
    }
  };

  const soldPercent = (sold: string, hard: string): number => {
    const s = parseFloat(sold), h = parseFloat(hard);
    if (h === 0) return 0;
    return Math.min(100, Math.round((s / h) * 100));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="gradient-text">Safe Presale</span> Launchpad
        </h1>
        <p className="text-brand-offwhite/50 text-base mb-6">
          Community-verified token presales with built-in scam protection.
        </p>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ List Your Presale'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-brand-gold/30">
          <CardHeader>
            <CardTitle>List New Presale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Token Address (0x...)" value={form.tokenAddress} onChange={(e) => setForm({ ...form, tokenAddress: e.target.value })} className="font-mono text-sm" />
              <Input placeholder="Token Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Symbol (e.g. SHIELD)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
              <Input placeholder="Total Supply" value={form.totalSupply} onChange={(e) => setForm({ ...form, totalSupply: e.target.value })} />
              <Input placeholder="Presale Price ($)" type="number" value={form.presalePrice} onChange={(e) => setForm({ ...form, presalePrice: e.target.value })} />
              <Input placeholder="Soft Cap ($)" type="number" value={form.softCap} onChange={(e) => setForm({ ...form, softCap: e.target.value })} />
              <Input placeholder="Hard Cap ($)" type="number" value={form.hardCap} onChange={(e) => setForm({ ...form, hardCap: e.target.value })} />
              <select value={form.chain} onChange={(e) => setForm({ ...form, chain: e.target.value })} className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-brand-offwhite">
                <option value="bsc">BSC</option>
                <option value="ethereum">Ethereum</option>
              </select>
              <div className="md:col-span-2">
                <textarea
                  placeholder="Description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-brand-offwhite h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleCreatePresale} disabled={formLoading} className="w-full">
                {formLoading ? 'Verifying & Listing...' : 'Submit Presale (Auto-Verified)'}
              </Button>
            </div>
            {formResult && (
              <p className={`mt-3 text-sm ${formResult.success ? 'text-green-500' : 'text-red-500'}`}>
                {formResult.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-brand-orange border-t-transparent animate-spin mx-auto" />
          <p className="text-brand-offwhite/50 mt-4">Loading presales...</p>
        </div>
      ) : presales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-brand-offwhite/30 text-lg">No active presales yet. Be the first to list!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presales.map((p) => {
            const percent = soldPercent(p.tokens_sold, p.hard_cap);
            const isSafe = p.is_verified && p.owner_renounced;
            return (
              <Card key={p.id} className={`border ${isSafe ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{p.name}</h3>
                      <span className="text-sm text-brand-offwhite/50">{p.symbol}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${isSafe ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {isSafe ? '✅ SAFE' : '🚨 HIGH RISK'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-offwhite/50">Sold</span>
                      <span>{parseFloat(p.tokens_sold).toLocaleString()} / {parseFloat(p.hard_cap).toLocaleString()}</span>
                    </div>
                    <Progress value={percent} variant="risk" />
                    <div className="flex justify-between text-xs text-brand-offwhite/30">
                      <span>{percent}% filled</span>
                      <span>Price: ${parseFloat(p.presale_price).toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {p.owner_renounced && <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">🔒 Ownership Renounced</span>}
                    {p.liquidity_locked && <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">🔒 Liquidity Locked</span>}
                  </div>

                  <code className="text-xs font-mono text-brand-offwhite/40 block truncate">{p.token_address.slice(0, 10)}...{p.token_address.slice(-6)}</code>

                  <Button variant={isSafe ? 'primary' : 'danger'} size="sm" className="w-full mt-3">
                    {isSafe ? 'Buy Presale' : 'View Details'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
