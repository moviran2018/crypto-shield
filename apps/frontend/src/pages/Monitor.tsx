import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';

export function Monitor() {
  const [newAddress, setNewAddress] = useState('');
  const { monitoredContracts, addMonitoredContract, removeMonitoredContract } = useAppStore();

  const handleAdd = () => {
    if (/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      addMonitoredContract(newAddress);
      setNewAddress('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Monitoring Dashboard
        </h1>
        <p className="text-brand-offwhite/60 text-lg">
          Track contracts and get alerts when risks change.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Add contract address to monitor..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {monitoredContracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-brand-offwhite/30 text-lg">
              No contracts being monitored. Add one above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {monitoredContracts.map((address) => (
            <Card key={address}>
              <CardContent className="py-4 flex items-center justify-between">
                <code className="text-sm font-mono text-brand-offwhite/80">{address}</code>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                    Active
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeMonitoredContract(address)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
