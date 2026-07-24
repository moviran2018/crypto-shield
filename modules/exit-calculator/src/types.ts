export interface ExitCalculationInput {
  investmentAmount: number;
  tokenPrice: number;
  sellTax: number;
  maxSellPerTx: number;
  gasPerTx: number;
  gasPriceGwei: number;
  chain: 'bsc' | 'ethereum';
}

export interface ExitCalculationResult {
  investmentAmount: number;
  totalTransactions: number;
  maxSellPerTx: number;
  sellTaxPercent: number;
  sellTaxAmount: number;
  totalGasCost: number;
  totalGasEth: number;
  netReceiveable: number;
  netReceiveableUsd: number;
  estimatedTimeSeconds: number;
  estimatedTimeFormatted: string;
  chain: 'bsc' | 'ethereum';
}

export interface CalculatorError {
  code: 'INVALID_INPUT' | 'CALCULATION_ERROR';
  message: string;
}