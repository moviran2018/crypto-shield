var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err2) => function __init() {
  if (err2) throw err2[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err2 = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../modules/core-analyzer/src/goplus.service.ts
async function scanGoPlus(contractAddress, chain) {
  const start = Date.now();
  try {
    const chainId = chain === "bsc" ? "56" : "1";
    const url = `${GOPLUS_API}/token_security/${chainId}?contract_addresses=${contractAddress}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return {
        data: { source: "goplus", score: 0, isAvailable: false, duration: Date.now() - start, error: `HTTP ${response.status}` },
        raw: null
      };
    }
    const json2 = await response.json();
    if (json2.code !== 1 || !json2.result) {
      return {
        data: { source: "goplus", score: 0, isAvailable: false, duration: Date.now() - start, error: json2.message || "No result" },
        raw: null
      };
    }
    const tokenData = json2.result[contractAddress.toLowerCase()];
    if (!tokenData) {
      return {
        data: { source: "goplus", score: 0, isAvailable: false, duration: Date.now() - start, error: "Token not found" },
        raw: null
      };
    }
    const isHoneypot = tokenData.is_honeypot === "1";
    const isProxy = tokenData.is_proxy === "1";
    const isMintable = tokenData.is_mintable === "1";
    const hasBlacklist = tokenData.is_in_blacklist === "1";
    const ownerRenounced = tokenData.is_contract_renounced === "1";
    const buyTax = parseFloat(tokenData.buy_tax ?? "0");
    const sellTax = parseFloat(tokenData.sell_tax ?? "0");
    const isVerified = tokenData.is_verified === "1";
    let score = 85;
    if (isHoneypot) score = 0;
    if (isProxy) score -= 10;
    if (isMintable) score -= 25;
    if (hasBlacklist) score -= 25;
    if (ownerRenounced) score += 15;
    if (buyTax > 10) score -= Math.min(buyTax, 30);
    if (sellTax > 10) score -= Math.min(sellTax, 30);
    if (!isVerified) score -= 10;
    score = Math.max(0, Math.min(100, score));
    return {
      data: {
        source: "goplus",
        score,
        isAvailable: true,
        duration: Date.now() - start,
        raw: json2.result
      },
      raw: tokenData
    };
  } catch (error) {
    return {
      data: { source: "goplus", score: 0, isAvailable: false, duration: Date.now() - start, error: error.message },
      raw: null
    };
  }
}
var GOPLUS_API;
var init_goplus_service = __esm({
  "../../modules/core-analyzer/src/goplus.service.ts"() {
    "use strict";
    GOPLUS_API = "https://api.gopluslabs.io/api/v1";
    __name(scanGoPlus, "scanGoPlus");
  }
});

// ../../modules/core-analyzer/src/honeypot.service.ts
async function scanHoneypot(contractAddress, chain) {
  const start = Date.now();
  try {
    const chainParam = chain === "bsc" ? "bsc" : "eth";
    const url = `${HONEYPOT_API}/${chainParam}/${contractAddress}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return {
        data: { source: "honeypot", score: 50, isAvailable: false, duration: Date.now() - start, error: `HTTP ${response.status}` },
        buyTax: 0,
        sellTax: 0,
        isHoneypot: false
      };
    }
    const json2 = await response.json();
    const simulation = json2.data?.simulation ?? {};
    const buyTax = parseFloat(simulation.buyTax ?? simulation.buy_tax ?? "0");
    const sellTax = parseFloat(simulation.sellTax ?? simulation.sell_tax ?? "0");
    const isHoneypot = json2.data?.honeypot === true || json2.data?.isHoneypot === true;
    const liquidityLocked = json2.data?.liquidityLocked === true;
    const lpLockDays = parseInt(json2.data?.lpLockDays ?? json2.data?.liquidityLockDays ?? "0");
    let score = 80;
    if (isHoneypot) score = 0;
    if (sellTax > 15) score -= sellTax;
    if (buyTax > 15) score -= buyTax;
    if (!liquidityLocked) score -= 15;
    if (lpLockDays > 365) score += 10;
    score = Math.max(0, Math.min(100, score));
    return {
      data: {
        source: "honeypot",
        score,
        isAvailable: true,
        duration: Date.now() - start,
        raw: json2.data
      },
      buyTax,
      sellTax,
      isHoneypot
    };
  } catch (error) {
    return {
      data: { source: "honeypot", score: 50, isAvailable: false, duration: Date.now() - start, error: error.message },
      buyTax: 0,
      sellTax: 0,
      isHoneypot: false
    };
  }
}
var HONEYPOT_API;
var init_honeypot_service = __esm({
  "../../modules/core-analyzer/src/honeypot.service.ts"() {
    "use strict";
    HONEYPOT_API = "https://honeypot.is/api/v2";
    __name(scanHoneypot, "scanHoneypot");
  }
});

// ../../modules/core-analyzer/src/rpc.service.ts
function hexToNumber(hex) {
  return parseInt(hex, 16);
}
async function scanRPC(contractAddress, chain) {
  const start = Date.now();
  try {
    const rpcUrl = RPC_URLS[chain] ?? RPC_URLS.bsc;
    if (!rpcUrl) {
      return {
        data: { source: "rpc", score: 50, isAvailable: false, duration: Date.now() - start, error: "No RPC URL" },
        holderCount: 0,
        totalSupply: "0",
        ownerAddress: null
      };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    const rpcBody = /* @__PURE__ */ __name((method, params) => ({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    }), "rpcBody");
    const totalSupplyHex = await rpcCall(rpcUrl, rpcBody("eth_call", [{
      to: contractAddress,
      data: "0x18160ddd"
    }, "latest"]), controller.signal);
    const ownerHex = await rpcCall(rpcUrl, rpcBody("eth_call", [{
      to: contractAddress,
      data: "0x8da5cb5b"
    }, "latest"]), controller.signal);
    const code = await rpcCall(rpcUrl, rpcBody("eth_getCode", [contractAddress, "latest"]), controller.signal);
    clearTimeout(timeout);
    const totalSupply = totalSupplyHex ? hexToNumber(totalSupplyHex) : 0;
    const ownerAddress = ownerHex && ownerHex !== "0x" && ownerHex !== "0x0000000000000000000000000000000000000000" ? `0x${ownerHex.slice(26)}` : null;
    const isContract = code && code !== "0x";
    let score = 75;
    if (!isContract) score = 0;
    if (ownerAddress === null) score += 15;
    if (totalSupply === 0) score -= 20;
    return {
      data: { source: "rpc", score: Math.max(0, Math.min(100, score)), isAvailable: true, duration: Date.now() - start },
      holderCount: 0,
      totalSupply: totalSupply.toString(),
      ownerAddress
    };
  } catch (error) {
    return {
      data: { source: "rpc", score: 50, isAvailable: false, duration: Date.now() - start, error: error.message },
      holderCount: 0,
      totalSupply: "0",
      ownerAddress: null
    };
  }
}
async function rpcCall(url, body, signal) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal
    });
    if (!res.ok) return null;
    const json2 = await res.json();
    return json2.result ?? null;
  } catch {
    return null;
  }
}
var RPC_URLS;
var init_rpc_service = __esm({
  "../../modules/core-analyzer/src/rpc.service.ts"() {
    "use strict";
    RPC_URLS = {
      bsc: "https://bsc-dataseed1.binance.org",
      ethereum: "https://cloudflare-eth.com"
    };
    __name(hexToNumber, "hexToNumber");
    __name(scanRPC, "scanRPC");
    __name(rpcCall, "rpcCall");
  }
});

// ../../modules/core-analyzer/src/cache.service.ts
function getCached(address, chain) {
  const key = `${chain}:${address.toLowerCase()}`;
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return { ...entry.data, cacheHit: true };
}
function setCache(address, chain, data) {
  const key = `${chain}:${address.toLowerCase()}`;
  store.set(key, {
    data: { ...data, cacheHit: true },
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION_MS
  });
}
function getCacheSize() {
  return store.size;
}
function clearExpired() {
  let cleared = 0;
  for (const [key, entry] of store) {
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      cleared++;
    }
  }
  return cleared;
}
var CACHE_DURATION_MS, store;
var init_cache_service = __esm({
  "../../modules/core-analyzer/src/cache.service.ts"() {
    "use strict";
    CACHE_DURATION_MS = 2 * 60 * 60 * 1e3;
    store = /* @__PURE__ */ new Map();
    __name(getCached, "getCached");
    __name(setCache, "setCache");
    __name(getCacheSize, "getCacheSize");
    __name(clearExpired, "clearExpired");
  }
});

// ../../modules/core-analyzer/src/scoring.engine.ts
function calculateScore(sources) {
  const active = sources.filter((s) => s.isAvailable);
  if (active.length === 0) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const s of active) {
    const w = WEIGHTS[s.source] ?? 0;
    weighted += s.score * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return 0;
  return Math.round(Math.max(0, Math.min(100, weighted / totalWeight)));
}
function getTrafficLight(score) {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}
function getRiskLevel(score) {
  if (score >= 80) return "safe";
  if (score >= 60) return "low";
  if (score >= 40) return "medium";
  if (score >= 20) return "high";
  return "critical";
}
function generateSummary(score, details) {
  if (details.isHoneypot) return "This is a honeypot! You CANNOT sell this token. Avoid at all costs.";
  if (score >= 80) return "This token appears safe to trade. All security checks passed with flying colors.";
  if (score >= 60) return "This token has minor risk factors. Trade with normal caution.";
  if (score >= 40) return "This token has several risk factors. Do your own research before investing.";
  if (score >= 20) return "This token is high risk. Significant red flags detected.";
  return "CRITICAL: This token shows severe scam indicators. Do not invest.";
}
function generateWarnings(details) {
  const w = [];
  if (details.isHoneypot) w.push("\u{1F6A8} Confirmed honeypot - you will not be able to sell");
  if (details.isProxy && !details.ownerRenounced) w.push("\u26A0\uFE0F Contract is upgradable - owner can change rules anytime");
  if (details.isMintable) w.push("\u{1F6A8} Owner can mint unlimited new tokens (dilutes your value)");
  if (details.hasBlacklist) w.push("\u{1F6A8} Owner can block addresses from selling");
  if (!details.ownerRenounced) w.push("\u26A0\uFE0F Owner has not renounced contract ownership");
  if (details.sellTax > 10) w.push(`\u26A0\uFE0F High sell tax (${details.sellTax}%) - you lose significant value on exit`);
  if (details.buyTax > 10) w.push(`\u26A0\uFE0F High buy tax (${details.buyTax}%)`);
  if (!details.liquidityLocked) w.push("\u26A0\uFE0F Liquidity is not locked - owner can remove it");
  if (!details.isVerified) w.push("\u26A0\uFE0F Contract source code is not verified on explorer");
  return w;
}
var WEIGHTS;
var init_scoring_engine = __esm({
  "../../modules/core-analyzer/src/scoring.engine.ts"() {
    "use strict";
    WEIGHTS = {
      goplus: 0.4,
      honeypot: 0.4,
      rpc: 0.2
    };
    __name(calculateScore, "calculateScore");
    __name(getTrafficLight, "getTrafficLight");
    __name(getRiskLevel, "getRiskLevel");
    __name(generateSummary, "generateSummary");
    __name(generateWarnings, "generateWarnings");
  }
});

// ../../modules/core-analyzer/src/types.ts
function plainEnglishDescription(key, value) {
  const descriptions = {
    isProxy: ["\u26A0\uFE0F The owner can change the contract code at any time (upgradable proxy)", "\u2705 Contract is not upgradable"],
    isMintable: ["\u{1F6A8} New tokens can be minted anytime, causing your holdings to devalue", "\u2705 Supply is fixed, no new tokens can be created"],
    hasBlacklist: ["\u{1F6A8} Owner can block you from selling (rug pull risk)", "\u2705 No blacklist function found"],
    ownerRenounced: ["\u2705 Ownership is renounced - contract cannot be modified", "\u26A0\uFE0F Owner still has control over the contract"],
    isVerified: ["\u2705 Source code is verified on the explorer", "\u26A0\uFE0F Source code is not verified - high risk"],
    isHoneypot: ["\u{1F6A8} This token cannot be sold! Classic honeypot scam", "\u2705 Token can be bought and sold normally"]
  };
  const pair = descriptions[key];
  if (!pair) return String(value);
  return value === true || value === "true" ? pair[0] : pair[1];
}
var FLAGS, TRAFFIC_LIGHT;
var init_types = __esm({
  "../../modules/core-analyzer/src/types.ts"() {
    "use strict";
    FLAGS = {
      safe: { label: "Safe", color: "#22c55e", emoji: "\u2705", description: "No issues detected" },
      low: { label: "Low Risk", color: "#eab308", emoji: "\u26A0\uFE0F", description: "Minor concerns" },
      medium: { label: "Medium Risk", color: "#f97316", emoji: "\u26A0\uFE0F", description: "Several risk factors" },
      high: { label: "High Risk", color: "#ef4444", emoji: "\u{1F6A8}", description: "Dangerous token" },
      critical: { label: "Critical", color: "#dc2626", emoji: "\u{1F6AB}", description: "Confirmed scam/honeypot" }
    };
    TRAFFIC_LIGHT = {
      green: { label: "Safe to Trade", color: "#22c55e", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)" },
      yellow: { label: "Use Caution", color: "#eab308", bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)" },
      red: { label: "High Risk - Avoid", color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)" }
    };
    __name(plainEnglishDescription, "plainEnglishDescription");
  }
});

// ../../modules/core-analyzer/src/index.ts
var src_exports = {};
__export(src_exports, {
  FLAGS: () => FLAGS,
  TRAFFIC_LIGHT: () => TRAFFIC_LIGHT,
  analyzeToken: () => analyzeToken,
  calculateScore: () => calculateScore,
  clearExpired: () => clearExpired,
  generateSummary: () => generateSummary,
  generateWarnings: () => generateWarnings,
  getCacheSize: () => getCacheSize,
  getCached: () => getCached,
  getRiskLevel: () => getRiskLevel,
  getTrafficLight: () => getTrafficLight,
  plainEnglishDescription: () => plainEnglishDescription,
  scanGoPlus: () => scanGoPlus,
  scanHoneypot: () => scanHoneypot,
  scanRPC: () => scanRPC,
  setCache: () => setCache
});
function isOpen(name) {
  const b = circuitBreakers[name];
  if (!b) return false;
  if (b.failures >= CB_THRESHOLD && Date.now() - b.lastFailure < CB_RESET_MS) return true;
  if (b.failures >= CB_THRESHOLD) {
    circuitBreakers[name] = { failures: 0, lastFailure: 0 };
  }
  return false;
}
function recordFail(name) {
  const b = circuitBreakers[name] ?? { failures: 0, lastFailure: 0 };
  b.failures++;
  b.lastFailure = Date.now();
  circuitBreakers[name] = b;
}
async function analyzeToken(contractAddress, chain = "bsc") {
  const traceId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return { success: false, error: { code: "INVALID_ADDRESS", message: "Invalid contract address format", traceId } };
    }
    const cached = getCached(contractAddress, chain);
    if (cached) {
      return { success: true, data: cached };
    }
    const sources = [];
    let buyTax = 0, sellTax = 0;
    let isHoneypot = false, isProxy = false, isMintable = false;
    let hasBlacklist = false, ownerRenounced = false, isVerified = false;
    let liquidityLocked = false, lpLockDays = 0;
    let totalSupply = "0", holderCount = 0;
    let ownerAddress = null;
    if (!isOpen("goplus")) {
      const r = await scanGoPlus(contractAddress, chain);
      sources.push(r.data);
      if (!r.data.isAvailable) recordFail("goplus");
      if (r.raw) {
        isHoneypot = r.raw.is_honeypot === "1";
        isProxy = r.raw.is_proxy === "1";
        isMintable = r.raw.is_mintable === "1";
        hasBlacklist = r.raw.is_in_blacklist === "1";
        ownerRenounced = r.raw.is_contract_renounced === "1";
        buyTax = parseFloat(r.raw.buy_tax ?? "0");
        sellTax = parseFloat(r.raw.sell_tax ?? "0");
        isVerified = r.raw.is_verified === "1";
        ownerAddress = r.raw.owner_address ?? null;
        totalSupply = r.raw.total_supply ?? "0";
        holderCount = parseInt(r.raw.holder_count ?? "0");
      }
    } else {
      sources.push({ source: "goplus", score: 0, isAvailable: false, duration: 0, error: "Circuit breaker active" });
    }
    if (!isOpen("honeypot")) {
      const r = await scanHoneypot(contractAddress, chain);
      sources.push(r.data);
      if (!r.data.isAvailable) recordFail("honeypot");
      if (r.isHoneypot) isHoneypot = true;
      if (r.buyTax > 0) buyTax = r.buyTax;
      if (r.sellTax > 0) sellTax = r.sellTax;
    } else {
      sources.push({ source: "honeypot", score: 0, isAvailable: false, duration: 0, error: "Circuit breaker active" });
    }
    if (!isOpen("rpc")) {
      const r = await scanRPC(contractAddress, chain);
      sources.push(r.data);
      if (!r.data.isAvailable) recordFail("rpc");
      if (r.ownerAddress) ownerAddress = r.ownerAddress;
      if (r.totalSupply !== "0") totalSupply = r.totalSupply;
      holderCount = r.holderCount;
    } else {
      sources.push({ source: "rpc", score: 0, isAvailable: false, duration: 0, error: "Circuit breaker active" });
    }
    const trustScore = calculateScore(sources);
    const trafficLight = getTrafficLight(trustScore);
    const riskLevel = getRiskLevel(trustScore);
    const details = {
      buyTax,
      sellTax,
      isHoneypot,
      isProxy,
      isMintable,
      hasBlacklist,
      ownerRenounced,
      isVerified,
      liquidityLocked,
      lpLockDays,
      totalSupply,
      holderCount,
      ownerAddress
    };
    const analysis = {
      contractAddress,
      chain,
      trustScore,
      riskLevel,
      trafficLight,
      summary: generateSummary(trustScore, details),
      warnings: generateWarnings(details),
      details,
      sources,
      cacheHit: false,
      scannedAt: Date.now()
    };
    setCache(contractAddress, chain, analysis);
    const available = sources.filter((s) => s.isAvailable).length;
    const errMsg = available < 3 ? `Only ${available}/3 sources available. Accuracy: ${Math.round(available / 3 * 100)}%` : void 0;
    return {
      success: true,
      data: analysis,
      error: errMsg ? { code: "PARTIAL_DATA", message: errMsg, traceId } : void 0
    };
  } catch (error) {
    return {
      success: false,
      error: { code: "ANALYSIS_FAILED", message: error.message, traceId }
    };
  }
}
var circuitBreakers, CB_THRESHOLD, CB_RESET_MS;
var init_src = __esm({
  "../../modules/core-analyzer/src/index.ts"() {
    "use strict";
    init_goplus_service();
    init_honeypot_service();
    init_rpc_service();
    init_cache_service();
    init_scoring_engine();
    init_goplus_service();
    init_honeypot_service();
    init_rpc_service();
    init_scoring_engine();
    init_cache_service();
    init_types();
    circuitBreakers = {};
    CB_THRESHOLD = 3;
    CB_RESET_MS = 6e4;
    __name(isOpen, "isOpen");
    __name(recordFail, "recordFail");
    __name(analyzeToken, "analyzeToken");
  }
});

// ../../modules/exit-calculator/src/calculator.ts
function calculateExit(input) {
  if (input.investmentAmount <= 0) {
    return { code: "INVALID_INPUT", message: "Investment amount must be greater than 0" };
  }
  if (input.sellTax < 0 || input.sellTax > 100) {
    return { code: "INVALID_INPUT", message: "Sell tax must be between 0 and 100" };
  }
  if (input.maxSellPerTx <= 0) {
    return { code: "INVALID_INPUT", message: "Max sell per transaction must be greater than 0" };
  }
  try {
    const blockTime = BLOCK_TIME[input.chain] ?? 3;
    const gasLimit = CHAIN_GAS_LIMIT[input.chain] ?? 21e3;
    const effectiveMaxSell = input.maxSellPerTx > 0 ? input.maxSellPerTx : input.investmentAmount / input.tokenPrice;
    const totalTransactions = Math.ceil(input.investmentAmount / (effectiveMaxSell * input.tokenPrice));
    const gasLimitPerTx = gasLimit;
    const gasPriceWei = input.gasPriceGwei * 1e9;
    const gasCostWeiPerTx = BigInt(gasLimitPerTx) * BigInt(Math.round(gasPriceWei));
    const gasCostEthPerTx = Number(gasCostWeiPerTx) / 1e18;
    const totalGasEth = gasCostEthPerTx * totalTransactions;
    const tokenPriceUsd = input.chain === "bsc" ? BNB_PRICE_USD : ETH_PRICE_USD;
    const totalGasCost = totalGasEth * tokenPriceUsd;
    const sellTaxAmount = input.investmentAmount * (input.sellTax / 100);
    const netReceiveable = input.investmentAmount - sellTaxAmount - totalGasCost;
    const estimatedTimeSeconds = totalTransactions * blockTime;
    const hours = Math.floor(estimatedTimeSeconds / 3600);
    const minutes = Math.floor(estimatedTimeSeconds % 3600 / 60);
    const seconds = estimatedTimeSeconds % 60;
    let estimatedTimeFormatted;
    if (hours > 0) {
      estimatedTimeFormatted = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      estimatedTimeFormatted = `${minutes}m ${seconds}s`;
    } else {
      estimatedTimeFormatted = `${seconds}s`;
    }
    return {
      investmentAmount: input.investmentAmount,
      totalTransactions,
      maxSellPerTx: effectiveMaxSell,
      sellTaxPercent: input.sellTax,
      sellTaxAmount: Math.round(sellTaxAmount * 100) / 100,
      totalGasCost: Math.round(totalGasCost * 100) / 100,
      totalGasEth: Math.round(totalGasEth * 1e6) / 1e6,
      netReceiveable: Math.round(netReceiveable * 100) / 100,
      netReceiveableUsd: Math.round(netReceiveable * 100) / 100,
      estimatedTimeSeconds,
      estimatedTimeFormatted,
      chain: input.chain
    };
  } catch (error) {
    return {
      code: "CALCULATION_ERROR",
      message: error instanceof Error ? error.message : "Unknown calculation error"
    };
  }
}
var BLOCK_TIME, CHAIN_GAS_LIMIT, ETH_PRICE_USD, BNB_PRICE_USD;
var init_calculator = __esm({
  "../../modules/exit-calculator/src/calculator.ts"() {
    "use strict";
    BLOCK_TIME = {
      bsc: 3,
      ethereum: 12
    };
    CHAIN_GAS_LIMIT = {
      bsc: 21e3,
      ethereum: 21e3
    };
    ETH_PRICE_USD = 3500;
    BNB_PRICE_USD = 600;
    __name(calculateExit, "calculateExit");
  }
});

// ../../modules/exit-calculator/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  calculateExit: () => calculateExit
});
var init_src2 = __esm({
  "../../modules/exit-calculator/src/index.ts"() {
    "use strict";
    init_calculator();
  }
});

// src/index.ts
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}
__name(json, "json");
function err(code, msg, status = 400) {
  return json({ success: false, error: { code, message: msg } }, status);
}
__name(err, "err");
async function supabase(env, path, opts = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...opts.headers ?? {}
    }
  });
}
__name(supabase, "supabase");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") return new Response(null, { headers: CORS });
    try {
      switch (true) {
        case (path === "/api/analyze" && method === "POST"):
          return handleAnalyze(request, env);
        case (path === "/api/calculator" && method === "POST"):
          return handleCalculator(request);
        case (path === "/api/portfolio/analyze" && method === "POST"):
          return handlePortfolio(request);
        case (path === "/api/launchpad/list" && method === "GET"):
          return handleLaunchpadList(env);
        case (path === "/api/launchpad/create" && method === "POST"):
          return handleLaunchpadCreate(request, env);
        case (path === "/api/admin/verify-ad" && method === "POST"):
          return handleVerifyAd(request, env);
        case (path === "/api/admin/metrics" && method === "GET"):
          return handleAdminMetrics(env);
        case (path === "/api/health" && method === "GET"):
          return json({ status: "ok", timestamp: Date.now() });
        default:
          return err("NOT_FOUND", "Route not found", 404);
      }
    } catch (error) {
      return err("INTERNAL_ERROR", error.message, 500);
    }
  }
};
async function handleAnalyze(request, env) {
  const body = await request.json();
  const address = body.contractAddress;
  const chain = body.chain ?? "bsc";
  if (!address) return err("INVALID_INPUT", "contractAddress required");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return err("INVALID_ADDRESS", "Invalid contract address");
  globalThis.GPLUS_API_KEY = env.GPLUS_API_KEY ?? "";
  const { analyzeToken: analyzeToken2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  const result = await analyzeToken2(address, chain);
  return json(result);
}
__name(handleAnalyze, "handleAnalyze");
async function handleCalculator(request) {
  const body = await request.json();
  const { calculateExit: calculateExit2 } = await Promise.resolve().then(() => (init_src2(), src_exports2));
  const input = {
    investmentAmount: Number(body.investmentAmount ?? 0),
    tokenPrice: Number(body.tokenPrice ?? 1),
    sellTax: Number(body.sellTax ?? 0),
    maxSellPerTx: Number(body.maxSellPerTx ?? 0),
    gasPerTx: 21e3,
    gasPriceGwei: Number(body.gasPriceGwei ?? 5),
    chain: body.chain ?? "bsc"
  };
  return json({ success: true, data: calculateExit2(input) });
}
__name(handleCalculator, "handleCalculator");
async function handlePortfolio(request) {
  const body = await request.json();
  const tokens = body.tokens;
  if (!tokens || !Array.isArray(tokens)) {
    return err("INVALID_INPUT", "tokens array required");
  }
  const { analyzeToken: analyzeToken2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  const results = [];
  let highRiskCount = 0;
  let totalValue = 0;
  for (const t of tokens) {
    try {
      const analysis = await analyzeToken2(t.address, t.chain);
      const bal = parseFloat(t.balance);
      totalValue += bal;
      if (analysis.success && analysis.data && analysis.data.trustScore < 40) {
        highRiskCount++;
      }
      results.push({ address: t.address, riskScore: analysis.success ? analysis.data.trustScore : 0, balance: bal, analysis });
    } catch {
      results.push({ address: t.address, riskScore: 0, balance: parseFloat(t.balance), analysis: null });
    }
  }
  return json({
    success: true,
    data: {
      totalTokens: tokens.length,
      highRiskCount,
      highRiskPercent: tokens.length > 0 ? Math.round(highRiskCount / tokens.length * 100) : 0,
      results
    }
  });
}
__name(handlePortfolio, "handlePortfolio");
async function handleLaunchpadList(env) {
  const res = await supabase(env, "presales?select=*&order=created_at.desc");
  const data = res.ok ? await res.json() : [];
  return json({ success: true, data });
}
__name(handleLaunchpadList, "handleLaunchpadList");
async function handleLaunchpadCreate(request, env) {
  const body = await request.json();
  const { tokenAddress, chain, name, symbol, totalSupply, presalePrice, softCap, hardCap, startDate, endDate, logoUrl, description } = body;
  if (!tokenAddress || !name || !symbol) {
    return err("INVALID_INPUT", "tokenAddress, name, and symbol required");
  }
  globalThis.GPLUS_API_KEY = env.GPLUS_API_KEY ?? "";
  const { analyzeToken: analyzeToken2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  const verification = await analyzeToken2(tokenAddress, chain);
  const isSafe = verification.success && verification.data && verification.data.trafficLight === "green";
  const presale = {
    token_address: tokenAddress,
    chain: chain ?? "bsc",
    name,
    symbol,
    total_supply: totalSupply ?? "0",
    presale_price: presalePrice ?? "0",
    soft_cap: softCap ?? "0",
    hard_cap: hardCap ?? "0",
    start_date: startDate ?? (/* @__PURE__ */ new Date()).toISOString(),
    end_date: endDate ?? new Date(Date.now() + 14 * 864e5).toISOString(),
    logo_url: logoUrl ?? "",
    description: description ?? "",
    is_verified: isSafe,
    risk_score: verification.success ? verification.data.trustScore : 0,
    tokens_sold: "0",
    status: "active",
    owner_renounced: verification.success ? verification.data.details.ownerRenounced : false,
    liquidity_locked: verification.success ? verification.data.details.liquidityLocked : false
  };
  await supabase(env, "presales", { method: "POST", body: JSON.stringify(presale) });
  if (!isSafe) {
    return json({
      success: true,
      data: presale,
      warning: "Token listed but FAILED safety checks. It will be marked as High Risk."
    }, 201);
  }
  return json({ success: true, data: presale }, 201);
}
__name(handleLaunchpadCreate, "handleLaunchpadCreate");
async function handleVerifyAd(request, env) {
  const body = await request.json();
  const address = body.contractAddress;
  const chain = body.chain ?? "bsc";
  if (!address) return err("INVALID_INPUT", "contractAddress required");
  globalThis.GPLUS_API_KEY = env.GPLUS_API_KEY ?? "";
  const { analyzeToken: analyzeToken2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  const result = await analyzeToken2(address, chain);
  const isScam = !result.success || result.data && (result.data.trafficLight === "red" || result.data.details.isHoneypot);
  return json({
    success: true,
    data: {
      contractAddress: address,
      isScam,
      trustScore: result.success ? result.data.trustScore : 0,
      trafficLight: result.success ? result.data.trafficLight : "red",
      warnings: result.success ? result.data.warnings : [],
      autoRejected: isScam,
      message: isScam ? "\u274C Ad REJECTED: Token flagged as High Risk/Scam by Triple-Consensus engine." : "\u2705 Ad approved: Token passed all security checks."
    }
  });
}
__name(handleVerifyAd, "handleVerifyAd");
async function handleAdminMetrics(env) {
  return json({
    success: true,
    data: {
      totalUsers: 0,
      activePresales: 0,
      pendingAds: 0,
      systemStatus: "operational",
      cacheSize: 0
    }
  });
}
__name(handleAdminMetrics, "handleAdminMetrics");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
