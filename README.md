# 🛡️ Crypto Shield v4.0

**White-Label Blockchain Security Platform**

Crypto Shield is a comprehensive blockchain security analysis platform designed for crypto investors and Telegram group admins. It provides multi-source contract analysis, emergency exit calculations, automated monitoring with alerts, and full white-label branding capabilities.

## Architecture

```
crypto-shield/
├── modules/                    # Independent modules (npm workspace packages)
│   ├── core-analyzer/         # 3-source blockchain analysis engine
│   ├── exit-calculator/       # Emergency exit strategy calculator
│   ├── monitoring-alerts/     # Automated monitoring & alert system
│   ├── admin-panel/           # Admin dashboard & management
│   ├── ad-manager/            # Ad banner management system
│   ├── white-label/           # Brand customization & theming
│   └── telegram-bot/          # White-label Telegram bot
├── apps/
│   └── frontend/              # React SPA (Vite + Tailwind + Shadcn)
├── workers/
│   ├── api/                   # Cloudflare Worker API
│   └── scheduler/             # Cloudflare Cron Scheduler
├── database/
│   ├── migrations/            # Supabase SQL migrations
│   └── seed/                  # Seed data scripts
├── docs/
│   └── api/                   # API documentation
└── scripts/                   # Utility scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3, Vite 5, Tailwind CSS 3.4, Shadcn/ui |
| State | Zustand 4, TanStack React Query v5 |
| Routing | React Router v6 (lazy loading) |
| 3D | React Three Fiber, Three.js |
| Charts | Recharts |
| Backend | Cloudflare Workers (TypeScript, ES Modules) |
| Database | Supabase (PostgreSQL + RLS) |
| Blockchain | Ethers.js v6 |
| Testing | Vitest, Playwright |
| Animation | Framer Motion |

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 10
- Supabase account
- Cloudflare account (for Workers)
- API keys: BscScan, Etherscan, GetBlock

### Installation

```bash
# Clone and install
cd crypto-shield
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
npm run db:migrate

# Start development
npm run dev
```

### Environment Variables

```env
# API Keys
BSCSCAN_API_KEY=your_bscscan_key
ETHERSCAN_API_KEY=your_etherscan_key
GETBLOCK_API_KEY=your_getblock_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
```

## Module Documentation

### Core Analyzer (`modules/core-analyzer`)

Multi-source contract analysis engine supporting BscScan, Etherscan, and GetBlock.

```typescript
import { analyzeContract } from '@crypto-shield/core-analyzer';

const result = await analyzeContract('0x...', 'bsc');
// Returns trust score, tax info, risk level, source breakdown
```

**Features:**
- Parallel data fetching from 3 sources
- Weighted scoring: BscScan (25%) + Etherscan (25%) + GetBlock (50%)
- Circuit breaker: auto-disable failing sources after 3 errors
- Dynamic trust score with trend tracking (last 5 scans)
- Sudden drop detection (alert if >15 point drop)

### Exit Calculator (`modules/exit-calculator`)

Emergency exit strategy calculator for token positions.

```typescript
import { calculateExit } from '@crypto-shield/exit-calculator';

const result = calculateExit({
  investmentAmount: 10000,
  sellTax: 10,
  maxSellPerTx: 1000,
  gasPriceGwei: 5,
  chain: 'bsc',
});
// Returns total tx count, fees, net receiveable, estimated time
```

### Monitoring & Alerts (`modules/monitoring-alerts`)

Automated contract monitoring with 6-hour scan intervals.

```typescript
import { scanContract, detectChanges } from '@crypto-shield/monitoring-alerts';

const changes = detectChanges(previousState, currentState);
// Detects: tax increases >20%, blacklist activation, owner changes, logic contract changes
```

### White Label (`modules/white-label`)

Full brand customization system.

```typescript
import { getBrand, updateBrand, generateBrandCSS } from '@crypto-shield/white-label';

updateBrand({ brandName: 'My Shield', primaryColor: '#00FF00' });
const css = generateBrandCSS(getBrand());
```

### Telegram Bot (`modules/telegram-bot`)

White-label Telegram bot with custom branding.

```bash
Commands:
/check <address>  - Analyze a contract
/subscribe         - Get premium subscription
/help              - Show help
```

### Admin Panel (`modules/admin-panel`)

Full admin management dashboard with:
- User management (search, filter, subscription control)
- Ad banner management (CRUD, CTR tracking)
- Brand settings (logo, colors, domain)
- Revenue & growth analytics

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts & subscriptions |
| `scan_history` | Historical analysis records |
| `data_source_scores` | Per-source scoring breakdown |
| `monitored_contracts` | Contracts under surveillance |
| `monitoring_history` | Scan results over time |
| `user_alert_settings` | User notification preferences |
| `notifications` | In-app notifications |
| `ad_banners` | Advertisement management |
| `brand_settings` | White-label configuration |

### Row Level Security

All tables have RLS enabled. Users can only access their own data. Admin functions use service role key.

## Business Model

### Freemium B2C

| Feature | Free | Premium ($19.99/mo) |
|---------|------|-------------------|
| Daily analyses | 5 | Unlimited |
| Sources | BscScan only | All 3 sources |
| Exit calculator | No | Yes |
| Monitoring | No | Yes |
| History | No | Full |

### White-Label B2B

| Plan | Price | Features |
|------|-------|----------|
| Basic | $99/mo | Analysis + Branding |
| Professional | $199/mo | All modules + Admin + Telegram bot |
| Enterprise | $499/mo | Everything + Custom domain + Priority support |

## API Endpoints

### POST `/api/analyze`
Analyze a contract address.

```json
{
  "contractAddress": "0x...",
  "chain": "bsc"
}
```

### POST `/api/calculator`
Calculate exit strategy.

```json
{
  "investmentAmount": 10000,
  "sellTax": 10,
  "maxSellPerTx": 1000,
  "gasPriceGwei": 5,
  "chain": "bsc"
}
```

### POST `/api/monitor`
Add contract to monitoring.

### GET `/api/admin/metrics`
Get admin dashboard metrics.

## Deployment

### Cloudflare Workers

```bash
npm run deploy:workers
```

### Frontend (Static)

```bash
npm run build
# Deploy dist/ to any static hosting (Cloudflare Pages, Vercel, etc.)
```

### Docker

```bash
docker-compose up -d
```

## Testing

```bash
npm test
```

## Security

- All API keys stored in Cloudflare Workers Secrets
- Supabase RLS ensures data isolation
- Input validation on all endpoints
- Circuit breaker pattern prevents API abuse
- Rate limiting on free tier (5 analyses/day)

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#0A0A0A` | Background, header, footer |
| Burnt Orange | `#E87A00` | Buttons, highlights, warnings |
| Gold | `#FFD700` | Premium elements, high scores |
| Off-White | `#F5F0E8` | Text, cards |

## Growth Strategy

1. **Viral Content**: 30-second problem-awareness videos on Twitter/X, Telegram, Reddit
2. **#CryptoShieldChallenge**: Viral awareness campaign
3. **Telegram Group Partnerships**: Free access in exchange for promotions
4. **Ambassador Program**: Free subscription for referrals

## License

Proprietary - All rights reserved.
