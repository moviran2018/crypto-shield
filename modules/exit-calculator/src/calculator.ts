import type { ExitCalculationInput, ExitCalculationResult, CalculatorError } from './types.js';

const BLOCK_TIME: Record<string, number> = {
  bsc: 3,
  ethereum: 12,
};

const CHAIN_GAS_LIMIT: Record<string, number> = {
  bsc: 21000,
  ethereum: 21000,
};

const ETH_PRICE_USD = 3500;
const BNB_PRICE_USD = 600;

export function calculateExit(input: ExitCalculationInput): ExitCalculationResult | CalculatorError {
  if (input.investmentAmount <= 0) {
    return { code: 'INVALID_INPUT', message: 'Investment amount must be greater than 0' };
  }

  if (input.sellTax < 0 || input.sellTax > 100) {
    return { code: 'INVALID_INPUT', message: 'Sell tax must be between 0 and 100' };
  }

  if (input.maxSellPerTx <= 0) {
    return { code: 'INVALID_INPUT', message: 'Max sell per transaction must be greater than 0' };
  }

  try {
    const blockTime = BLOCK_TIME[input.chain] ?? 3;
    const gasLimit = CHAIN_GAS_LIMIT[input.chain] ?? 21000;

    const effectiveMaxSell = input.maxSellPerTx > 0 ? input.maxSellPerTx : input.investmentAmount / input.tokenPrice;

    const totalTransactions = Math.ceil(input.investmentAmount / (effectiveMaxSell * input.tokenPrice));

    const gasLimitPerTx = gasLimit;
    const gasPriceWei = input.gasPriceGwei * 1e9;
    const gasCostWeiPerTx = BigInt(gasLimitPerTx) * BigInt(Math.round(gasPriceWei));
    const gasCostEthPerTx = Number(gasCostWeiPerTx) / 1e18;
    const totalGasEth = gasCostEthPerTx * totalTransactions;

    const tokenPriceUsd = input.chain === 'bsc' ? BNB_PRICE_USD : ETH_PRICE_USD;
    const totalGasCost = totalGasEth * tokenPriceUsd;

    const sellTaxAmount = input.investmentAmount * (input.sellTax / 100);
    const netReceiveable = input.investmentAmount - sellTaxAmount - totalGasCost;

    const estimatedTimeSeconds = totalTransactions * blockTime;
    const hours = Math.floor(estimatedTimeSeconds / 3600);
    const minutes = Math.floor((estimatedTimeSeconds % 3600) / 60);
    const seconds = estimatedTimeSeconds % 60;

    let estimatedTimeFormatted: string;
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
      chain: input.chain,
    };
  } catch (error) {
    return {
      code: 'CALCULATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown calculation error',
    };
  }
}