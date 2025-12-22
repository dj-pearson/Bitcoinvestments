// DCA Calculator exports
export {
  calculateDCA,
  projectFutureDCA,
  compareLumpSumVsDCA,
} from './dcaCalculator';

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

// Staking Calculator exports
export {
  calculateStakingRewards,
  compareCompoundingStrategies,
  calculateDoubleTime,
  calculateToReachTarget,
  getPopularStakingRates,
  calculateValidatorVsDelegator,
} from './stakingCalculator';

// Tax Calculator exports
export {
  calculateCapitalGainsTax,
  calculateMultipleTransactionsTax,
  findTaxLossHarvestingOpportunities,
  calculateWashSaleImpact,
  estimateQuarterlyPayment,
  getStateTaxInfo,
} from './taxCalculator';

// Premium Calculator Features exports
export {
  checkFeatureAccess,
  runMonteCarloSimulation,
  compareMultipleAssets,
  analyzeTaxOptimization,
  analyzePortfolioRisk,
  getAvailablePremiumFeatures,
  type MonteCarloResult,
  type MultiAssetComparison,
  type TaxOptimizationResult,
  type RiskAnalysisResult,
  type PremiumCalculatorError,
} from './premiumCalculatorFeatures';
