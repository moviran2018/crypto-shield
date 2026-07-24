import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreGauge } from '@/components/3d/ScoreGauge';
import { getRiskColor, getRiskLabel } from '@/lib/utils';

export function Analyze() {
  const [address, setAddress] = useState('');
  const { currentAnalysis, isAnalyzing, setCurrentAnalysis, setIsAnalyzing } = useAppStore();

  const handleAnalyze = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return;

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: address, chain: 'bsc' }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentAnalysis(result.data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Crypto Shield</span> Analyzer
        </h1>
        <p className="text-brand-offwhite/60 text-lg max-w-2xl mx-auto">
          Analyze any BSC or Ethereum contract with our 3-source engine.
          Get real-time risk assessment, tax information, and security analysis.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter contract address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleAnalyze} disabled={isAnalyzing} size="lg">
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentAnalysis && !isAnalyzing && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis Results</span>
                <span
                  className="text-sm font-mono px-3 py-1 rounded"
                  style={{
                    backgroundColor: `${getRiskColor(currentAnalysis.trustScore)}20`,
                    color: getRiskColor(currentAnalysis.trustScore),
                    border: `1px solid ${getRiskColor(currentAnalysis.trustScore)}40`,
                  }}
                >
                  {getRiskLabel(currentAnalysis.trustScore)} ({currentAnalysis.trustScore})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                  <ScoreGauge score={currentAnalysis.trustScore} />
                  <span className="text-4xl font-bold mt-4 gradient-text">
                    {currentAnalysis.trustScore}
                  </span>
                  <span className="text-brand-offwhite/50 text-sm">Trust Score</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brand-offwhite/70">Buy Tax</span>
                      <span className={currentAnalysis.buyTax > 10 ? 'text-red-500' : 'text-green-500'}>
                        {currentAnalysis.buyTax}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, currentAnalysis.buyTax * 5)} variant="risk" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brand-offwhite/70">Sell Tax</span>
                      <span className={currentAnalysis.sellTax > 10 ? 'text-red-500' : 'text-green-500'}>
                        {currentAnalysis.sellTax}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, currentAnalysis.sellTax * 5)} variant="risk" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <span className="text-xs text-brand-offwhite/50">Verified</span>
                      <p className="text-lg font-semibold">
                        {currentAnalysis.isVerified ? (
                          <span className="text-green-500">Yes</span>
                        ) : (
                          <span className="text-red-500">No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <span className="text-xs text-brand-offwhite/50">Blacklist</span>
                      <p className="text-lg font-semibold">
                        {currentAnalysis.hasBlacklist ? (
                          <span className="text-red-500">Yes</span>
                        ) : (
                          <span className="text-green-500">No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <span className="text-xs text-brand-offwhite/50">Owner Renounced</span>
                      <p className="text-lg font-semibold">
                        {currentAnalysis.ownerRenounced ? (
                          <span className="text-green-500">Yes</span>
                        ) : (
                          <span className="text-red-500">No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <span className="text-xs text-brand-offwhite/50">Hidden Mint</span>
                      <p className="text-lg font-semibold">
                        {currentAnalysis.hasHiddenMint ? (
                          <span className="text-red-500">Yes</span>
                        ) : (
                          <span className="text-green-500">No</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAnalysis.sources.map((source) => (
                  <div
                    key={source.sourceName}
                    className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          source.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="font-medium capitalize">{source.sourceName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-offwhite/70">Score:</span>
                      <span
                        className="font-mono font-bold"
                        style={{ color: getRiskColor(source.score) }}
                      >
                        {source.score}
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
