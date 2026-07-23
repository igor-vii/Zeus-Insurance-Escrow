import { ErrorHistory, PriceQuote } from "../../../sdk/src/types";

export interface RiskParam {
  rate: number;
  probability: number;
}

export const RISK_TABLE: Record<string, RiskParam> = {
  APIFailure:   { rate: 0.15, probability: 0.40 },
  NetworkError: { rate: 0.10, probability: 0.30 },
  WalletLimit:  { rate: 0.05, probability: 0.10 },
  GasShortage:  { rate: 0.03, probability: 0.10 },
  MCPError:     { rate: 0.12, probability: 0.10 },
};

export const DAILY_ERROR_SOFT_THRESHOLD = 3;
export const DAILY_ERROR_HARD_THRESHOLD = 5;
export const PER_ERROR_PENALTY_BPS = 1000;

export function calculatePenaltyScore(errorHistory: ErrorHistory): number {
  if (errorHistory.total === 0) return 1.0;
  const errorRate = errorHistory.errors / errorHistory.total;

  let multiplier: number;
  if (errorRate > 0.30) multiplier = 2.0;
  else if (errorRate > 0.15) multiplier = 1.5;
  else multiplier = 1.0;

  // Daily threshold bonus only applies when the base error rate is low (multiplier === 1.0)
  if (multiplier === 1.0 && errorHistory.windowHours <= 24) {
    if (errorHistory.errors > DAILY_ERROR_HARD_THRESHOLD) {
      multiplier *= 1 + (DAILY_ERROR_HARD_THRESHOLD * PER_ERROR_PENALTY_BPS) / 10_000;
    } else if (errorHistory.errors > DAILY_ERROR_SOFT_THRESHOLD) {
      const extra = errorHistory.errors - DAILY_ERROR_SOFT_THRESHOLD;
      multiplier *= 1 + (extra * PER_ERROR_PENALTY_BPS) / 10_000;
    }
  }
  return Math.round(multiplier * 100) / 100;
}

export function calculateAllInclusiveBasePremium(risks: RiskParam[] = Object.values(RISK_TABLE)): number {
  if (risks.length === 0) return 0;
  let sumWeighted = 0;
  let maxWeighted = 0;
  let maxRate = 0;
  for (const r of risks) {
    const weighted = r.rate * r.probability;
    sumWeighted += weighted;
    if (weighted > maxWeighted) maxWeighted = weighted;
    if (r.rate > maxRate) maxRate = r.rate;
  }
  return Math.round((sumWeighted - maxWeighted + maxRate) * 1e6) / 1e6;
}

export function quoteAllInclusive(amount: bigint, errorHistory: ErrorHistory | null): PriceQuote {
  const base = calculateAllInclusiveBasePremium();

  if (errorHistory && errorHistory.errors > DAILY_ERROR_HARD_THRESHOLD && errorHistory.windowHours <= 24) {
    return {
      basePremium: Number(amount) * base,
      penaltyScore: 0,
      finalPremium: 0,
      rejected: true,
      retryAfterSeconds: 24 * 3600,
    };
  }

  const penalty = errorHistory ? calculatePenaltyScore(errorHistory) : 1.0;
  const finalPremium = Number(amount) * base * penalty;
  return {
    basePremium: Number(amount) * base,
    penaltyScore: penalty,
    finalPremium,
    rejected: false,
  };
}

export function quoteArbitration(amount: bigint): bigint {
  return (amount * 800n) / 10_000n;
}

/* ──────────────────── Legacy risk-score API (backward compat) ──────────────────── */

export interface SellerHistory {
  totalPolicies: number;
  failedPolicies: number;
  avgRiskScore: number;
}

/**
 * Calculate Risk Score for a seller.
 * Range: 0.1 – 5.0
 * Formula: (oracleRisk * 0.4) + (executionRisk * 0.3) + (modelRisk * 0.2) + (gasVolatility * 0.1)
 */
export async function calculateRiskScore(
  sellerAddress: string,
  _amount: bigint,
  retries: number,
  history: SellerHistory,
): Promise<number> {
  if (!sellerAddress.startsWith("0x") || sellerAddress.length !== 42) {
    throw new Error("Invalid seller address format");
  }
  const oracleRisk = 2.0;
  const gasVolatility = 2.0;
  let executionRisk = 2.0;
  if (history.totalPolicies > 0) {
    const failureRate = history.failedPolicies / history.totalPolicies;
    executionRisk = 1.0 + failureRate * 4.0;
  }
  let modelRisk = 2.0;
  if (history.avgRiskScore > 0) {
    modelRisk = history.avgRiskScore;
  } else {
    modelRisk = Math.min(5.0, 1.0 + retries * 0.5);
  }
  const rawScore =
    oracleRisk * 0.4 + executionRisk * 0.3 + modelRisk * 0.2 + gasVolatility * 0.1;
  return Math.max(0.1, Math.min(5.0, rawScore));
}

/**
 * Calculate premium based on amount and Risk Score.
 * Formula: amount × (0.05 + 0.01 × riskScore)
 */
export async function calculatePremium(amount: bigint, riskScore: number): Promise<bigint> {
  if (amount <= 0n) throw new Error("Amount must be greater than 0");
  if (riskScore < 0.1 || riskScore > 5.0) throw new Error("Risk score must be between 0.1 and 5.0");
  const multiplier = Math.round((5 + riskScore) * 100);
  return (amount * BigInt(multiplier)) / 10_000n;
}

/**
 * Bayesian update of Risk Score after a payout event.
 */
export async function updateRiskScore(
  sellerAddress: string,
  payoutFactor: number,
  currentRiskScore: number,
): Promise<number> {
  if (!sellerAddress.startsWith("0x") || sellerAddress.length !== 42) {
    throw new Error("Invalid seller address format");
  }
  if (payoutFactor < 0 || payoutFactor > 5.0) throw new Error("Payout factor must be between 0 and 5.0");
  const N = 10;
  const newScore = (currentRiskScore * N + payoutFactor) / (N + 1);
  return Math.max(0.1, Math.min(5.0, newScore));
}
