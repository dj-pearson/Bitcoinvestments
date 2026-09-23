// Staking math (shared by /staking-calculator and the staking tab on /calculators)
export { calculateStaking, yearsToDouble, type StakingInput, type StakingResult, type RateType } from './stakingCalculator';

// Fee Calculator exports
export {
  calculateTradeFees,
  compareExchangeFees,
  calculateRoundTripFees,
  calculateCryptoWithdrawalFee,
  findCheapestExchange,
  compareMakerTakerFees,
  calculateVolumeBasedFees,
} from './feeCalculator';

// Tax Calculator exports
export {
  calculateCapitalGainsTax,
  calculateMultipleTransactionsTax,
  estimateCryptoSaleTax,
  findTaxLossHarvestingOpportunities,
  calculateWashSaleImpact,
  estimateQuarterlyPayment,
  getStateTaxInfo,
  type CryptoSaleTaxInput,
  type CryptoSaleTaxResult,
} from './taxCalculator';
