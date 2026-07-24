/**
 * Crypto Shield Scheduler Worker
 * Runs every 6 hours to scan monitored contracts for critical changes.
 */

interface Env {
  BSCSCAN_API_KEY: string;
  ETHERSCAN_API_KEY: string;
  GETBLOCK_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
}

async function supabaseFetch(env: Env, path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    console.log(`Scheduler triggered at ${new Date().toISOString()}`);

    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const res = await supabaseFetch(env,
        `monitored_contracts?is_active=eq.true&or=(last_scan.is.null,last_scan.lt.${sixHoursAgo})&select=*`
      );

      if (!res.ok) {
        console.error('Failed to fetch contracts:', res.status);
        return;
      }

      interface Contract {
        id: string;
        user_id: string;
        contract_address: string;
        chain: string;
        last_scan: string | null;
      }

      const contracts = await res.json() as Contract[];
      console.log(`Found ${contracts.length} contracts to scan`);

      for (const contract of contracts) {
        try {
          globalThis.BSCSCAN_API_KEY = env.BSCSCAN_API_KEY;
          globalThis.ETHERSCAN_API_KEY = env.ETHERSCAN_API_KEY;
          globalThis.GETBLOCK_API_KEY = env.GETBLOCK_API_KEY;

          const { analyzeContract } = await import('../../../modules/core-analyzer/src/index.js');
          const result = await analyzeContract(
            contract.contract_address,
            contract.chain as 'bsc' | 'ethereum'
          );

          if (result.success && result.data) {
            const historyRes = await supabaseFetch(env,
              `monitoring_history?contract_id=eq.${contract.id}&order=scan_time.desc&limit=1`
            );
            const history = await historyRes.json() as Array<Record<string, unknown>>;
            const previous = history[0] as Record<string, unknown> | undefined;

            const changes: string[] = [];
            if (previous) {
              const prevTax = Number(previous.sell_tax ?? 0);
              const currTax = result.data.sellTax;
              if (currTax > prevTax * 1.2) {
                changes.push(`Sell tax increased from ${prevTax}% to ${currTax}%`);
              }
            }

            await supabaseFetch(env, 'monitoring_history', {
              method: 'POST',
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

            await supabaseFetch(env, `monitored_contracts?id=eq.${contract.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                last_scan: new Date().toISOString(),
                alert_level: changes.length > 0 ? 'high' : 'low',
              }),
            });

            if (changes.length > 0) {
              await supabaseFetch(env, 'notifications', {
                method: 'POST',
                body: JSON.stringify({
                  user_id: contract.user_id,
                  type: 'alert',
                  title: `Alert: ${contract.contract_address.slice(0, 10)}...`,
                  message: changes.join('\n'),
                }),
              });
            }
          }
        } catch (contractError) {
          console.error(`Error scanning ${contract.contract_address}:`, contractError);
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  },
};
