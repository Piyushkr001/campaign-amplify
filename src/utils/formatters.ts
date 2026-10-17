import { Config } from '@/constants/config';

export function formatCurrency(amount: number): string {
  const symbol = Config.currency.symbol;
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${symbol}${formatted}`;
}

export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('en-US');
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val : val.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `${val % 1 === 0 ? val : val.toFixed(0)}K`;
  }
  return num.toString();
}

export function formatReachRange(min: number, max: number): string {
  return `${formatCompactNumber(min)}–${formatCompactNumber(max)}`;
}

export function calculateFundingProgress(raised: number, goal: number): {
  percentage: number;
  clampedPercentage: number;
} {
  if (goal <= 0) return { percentage: 0, clampedPercentage: 0 };
  const percentage = Math.round((raised / goal) * 100);
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  return { percentage, clampedPercentage };
}

export function formatDaysRemaining(days: number): string {
  if (days <= 0) return 'Campaign completed';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}
