import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface CalcInput {
  investment: string;
  sellTax: string;
  maxSell: string;
  gasPrice: string;
}

interface CalcResult {
  totalTransactions: number;
  sellTaxAmount: number;
  totalGasCost: number;
  netReceiveable: number;
  estimatedTime: string;
}

export function Calculator() {
  const [inputs, setInputs] = useState<CalcInput>({
    investment: '',
    sellTax: '',
    maxSell: '',
    gasPrice: '5',
  });
  const [result, setResult] = useState<CalcResult | null>(null);

  const handleCalculate = () => {
    const investment = parseFloat(inputs.investment);
    const sellTax = parseFloat(inputs.sellTax);
    const maxSell = parseFloat(inputs.maxSell);
    const gasPrice = parseFloat(inputs.gasPrice);

    if (!investment || !sellTax || !maxSell) return;

    const transactions = Math.ceil(investment / (maxSell * 1));
    const taxAmount = investment * (sellTax / 100);
    const gasCost = transactions * 21000 * gasPrice * 3e-9 * 600;
    const net = investment - taxAmount - gasCost;
    const timeSeconds = transactions * 3;

    const hours = Math.floor(timeSeconds / 3600);
    const mins = Math.floor((timeSeconds % 3600) / 60);
    const secs = timeSeconds % 60;

    setResult({
      totalTransactions: transactions,
      sellTaxAmount: taxAmount,
      totalGasCost: gasCost,
      netReceiveable: net,
      estimatedTime: `${hours}h ${mins}m ${secs}s`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Emergency Exit Calculator
        </h1>
        <p className="text-brand-offwhite/60 text-lg">
          Calculate the cost and time needed to exit a token position.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-brand-offwhite/70 mb-1 block">Investment Amount ($)</label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={inputs.investment}
                onChange={(e) => setInputs({ ...inputs, investment: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-brand-offwhite/70 mb-1 block">Sell Tax (%)</label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={inputs.sellTax}
                onChange={(e) => setInputs({ ...inputs, sellTax: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-brand-offwhite/70 mb-1 block">Max Sell per Tx (tokens)</label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={inputs.maxSell}
                onChange={(e) => setInputs({ ...inputs, maxSell: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-brand-offwhite/70 mb-1 block">Gas Price (Gwei)</label>
              <Input
                type="number"
                placeholder="5"
                value={inputs.gasPrice}
                onChange={(e) => setInputs({ ...inputs, gasPrice: e.target.value })}
              />
            </div>
            <Button onClick={handleCalculate} className="w-full" size="lg">
              Calculate Exit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <span className="text-sm text-brand-offwhite/50">Total Transactions</span>
                  <p className="text-2xl font-bold">{result.totalTransactions}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <span className="text-sm text-brand-offwhite/50">Sell Tax Amount</span>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(result.sellTaxAmount)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <span className="text-sm text-brand-offwhite/50">Total Gas Cost</span>
                  <p className="text-2xl font-bold text-orange-500">{formatCurrency(result.totalGasCost)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-brand-gold/30">
                  <span className="text-sm text-brand-offwhite/50">Net Receiveable</span>
                  <p className="text-3xl font-bold gradient-text">{formatCurrency(result.netReceiveable)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <span className="text-sm text-brand-offwhite/50">Estimated Time</span>
                  <p className="text-xl font-bold">{result.estimatedTime}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-brand-offwhite/30">
                <p>Enter parameters and calculate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
