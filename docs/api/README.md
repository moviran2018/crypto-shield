# Crypto Shield API Documentation

## Base URL

Production: `https://api.cryptoshield.io`
Development: `http://localhost:8787`

## Authentication

### POST /api/auth/nonce
Get a nonce for wallet signature.

**Response:**
```json
{
  "success": true,
  "data": { "nonce": "uuid-string" }
}
```

### POST /api/auth/login
Login with wallet signature.

**Request:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "nonce": "uuid-string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": { "id": "uuid", "walletAddress": "0x..." }
  }
}
```

## Contract Analysis

### POST /api/analyze
Analyze a smart contract.

**Request:**
```json
{
  "contractAddress": "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
  "chain": "bsc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contractAddress": "0x...",
    "chain": "bsc",
    "trustScore": 85.5,
    "riskLevel": "safe",
    "buyTax": 3.0,
    "sellTax": 3.0,
    "isVerified": true,
    "hasBlacklist": false,
    "ownerRenounced": true,
    "hasHiddenMint": false,
    "isProxy": false,
    "sources": [
      { "sourceName": "bscscan", "score": 85, "isAvailable": true },
      { "sourceName": "etherscan", "score": 0, "isAvailable": false },
      { "sourceName": "getblock", "score": 86, "isAvailable": true }
    ],
    "trend": [],
    "timestamp": 1712345678000
  }
}
```

## Exit Calculator

### POST /api/calculator
Calculate emergency exit strategy.

**Request:**
```json
{
  "investmentAmount": 10000,
  "sellTax": 10,
  "maxSellPerTx": 1000,
  "gasPriceGwei": 5,
  "chain": "bsc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "investmentAmount": 10000,
    "totalTransactions": 10,
    "sellTaxPercent": 10,
    "sellTaxAmount": 1000,
    "totalGasCost": 3.78,
    "netReceiveable": 8996.22,
    "estimatedTimeFormatted": "30s"
  }
}
```

## Monitoring

### POST /api/monitor
Add a contract to monitoring.

**Request:**
```json
{
  "contractAddress": "0x...",
  "chain": "bsc",
  "userId": "uuid"
}
```

### GET /api/monitor?userId=uuid
Get monitored contracts for a user.

## Admin

### GET /api/admin/metrics
Get admin dashboard metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeSubscriptions": 45,
    "monthlyRevenue": 899.55,
    "todayRequests": 234
  }
}
```

## Health

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1712345678000
}
```

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "traceId": "uuid-for-tracking"
  }
}
```

**Error Codes:**
- `INVALID_ADDRESS` - Invalid contract address format
- `INVALID_INPUT` - Missing or invalid request parameters
- `ANALYSIS_FAILED` - Contract analysis failed
- `DUPLICATE` - Resource already exists
- `NOT_FOUND` - Resource or route not found
- `INTERNAL_ERROR` - Unexpected server error
