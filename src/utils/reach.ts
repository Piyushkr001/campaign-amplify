import { Config } from '@/constants/config';
import { formatCompactNumber } from './formatters';

export interface UseOfFunds {
  advertising: number;
  platformFee: number;
  paymentProcessing: number;
}

export interface ReachEstimate {
  min: number;
  max: number;
  advertisingBudget: number;
  fundingGoal: number;
}

/**
 * Calculates the exact allocation breakdown for a given funding goal.
 * Uses the centralized fee policy from Config (85% ads, 10% platform, 5% processing).
 */
export function calculateUseOfFunds(fundingGoal: number): UseOfFunds {
  const safeGoal = Math.max(0, fundingGoal);
  const adsPct = Config.feeStructure.advertisingPercentage / 100;
  const platformPct = Config.feeStructure.platformFeePercentage / 100;
  const processingPct = Config.feeStructure.paymentProcessingPercentage / 100;

  return {
    advertising: Math.round(safeGoal * adsPct),
    platformFee: Math.round(safeGoal * platformPct),
    paymentProcessing: Math.round(safeGoal * processingPct),
  };
}

/**
 * Calculates estimated impressions from an advertising allocation.
 */
export function estimateDirectReach(advertisingBudget: number): { min: number; max: number } {
  const safeBudget = Math.max(0, advertisingBudget);
  const min = Math.round(safeBudget * Config.reachPerDollarEstimate.min);
  const max = Math.round(safeBudget * Config.reachPerDollarEstimate.max);
  return { min, max };
}

/**
 * Central reach estimation utility.
 * Calculates advertising allocation from total funding goal first,
 * then calculates impression estimates based on advertising allocation.
 */
export function estimateReach(fundingGoal: number): ReachEstimate {
  const safeGoal = Math.max(0, fundingGoal);
  const { advertising: advertisingBudget } = calculateUseOfFunds(safeGoal);
  const { min, max } = estimateDirectReach(advertisingBudget);

  return {
    min,
    max,
    advertisingBudget,
    fundingGoal: safeGoal,
  };
}

/**
 * Formats reach numbers into an eye-friendly range, e.g. "17K–25K" or "850–1.2K".
 */
export function formatReachEstimate(min: number, max: number): string {
  if (min <= 0 && max <= 0) return '0';
  return `${formatCompactNumber(min)}–${formatCompactNumber(max)}`;
}
