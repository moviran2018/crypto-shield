/**
 * Crypto Shield Scheduler Worker
 * 
 * Runs every 6 hours to scan monitored contracts
 * and send alerts if critical changes are detected.
 */

interface Env {
  BSCSCAN_API_KEY: string;
  ETHERSCAN_API_KEY: string;
  GETBLOCK_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log(`Scheduler triggered at ${new Date().toISOString()}`);

    try {
      const contractsResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/rpc/get_contracts_due_for_scan`,
        {
          headers: {
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!contractsResponse.ok) {
        console.error('Failed to fetch contracts:', contractsResponse.status);
        return;
      }

      interface Contract {
        id: string;
        user_id: string;
        contract_address: string;
        chain: string;
        last_scan: string | null;
      }

      const contracts = await contractsResponse.json() as Contract[];
      console.log(`Found ${contracts.length} contracts to scan`);

      for (const contract of contracts) {
        try {
          globalThis.BSCSCAN_API_KEY = env.BSCSCAN_API_KEY;
          globalThis.ETHERSCAN_API_KEY = env.ETHERSCAN_API_KEY;
          globalThis.GETBLOCK_API_KEY = env.GETBLOCK_API_KEY;

          const { analyzeContract } = await import('@crypto-shield/core-analyzer');
          const result = await analyzeContract(
            contract.contract_address,
            contract.chain as 'bsc' | 'ethereum'
          );

          if (result.success && result.data) {
            const previousResponse = await fetch(
              `${env.SUPABASE_URL}/rest/v1/monitoring_history?contract_id=eq.${contract.id}&order=scan_time.desc&limit=1`,
              {
                headers: {
                  'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                },
              }
            );

            const previousData = previousResponse.ok
              ? await previousResponse.json() as Array<Record<string, unknown>>
              : [];

            const previous = previousData[0] as Record<string, unknown> | undefined;

            const changes: string[] = [];
            if (previous) {
              const prevTax = Number(previous.sell_tax ?? 0);
              const currTax = result.data.sellTax;
              if (currTax > prevTax * 1.2) {
                changes.push(`Sell tax increased from ${prevTax}% to ${currTax}%`);
              }
            }

            await fetch(`${env.SUPABASE_URL}/rest/v1/monitoring_history`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contract_id: contract.id,
                trust_score: result.data.trustScore,
                buy_tax: result.data.buyTax,
                sell_tax: result.data.sellTax,
                is_blacklisted: result.data.hasBlacklist,
                owner_changed: false,
                alert_triggered: changes.length > 0,
                alert_level: changes.length > 0 ? 'high' : 'low',
                changes_detected: changes,
              }),
            });

            await fetch(`${env.SUPABASE_URL}/rest/v1/monitored_contracts?id=eq.${contract.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                last_scan: new Date().toISOString(),
                alert_level: changes.length > 0 ? 'high' : 'low',
              }),
            });

            if (changes.length > 0) {
              await fetch(`${env.SUPABASE_URL}/rest/v1/notifications`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: contract.user_id,
                  type: 'alert',
                  title: `Alert: ${contract.contract_address.slice(0, 10)}...`,
                  message: changes.join('\n'),
                }),
              });

              if (env.TELEGRAM_BOT_TOKEN) {
                const userResponse = await fetch(
                  `${env.SUPABASE_URL}/rest/v1/users?id=eq.${contract.user_id}`,
                  {
                    headers: { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}` },
                  }
                );
                if (userResponse.ok) {
                  const users = await userResponse.json() as Array<Record<string, unknown>>;
                }
              }
            }
          }
        } catch (contractError) {
          console.error(`Error scanning contract ${contract.contract_address}:`, contractError);
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  },
};
