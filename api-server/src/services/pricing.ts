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

  // 1. Oracle_Risk (40%) — constant 2.0 until GSA oracle is integrated
  const oracleRisk = 2.0;

  // 2. Gas_Volatility (10%) — constant 2.0 until gas oracle is integrated
  const gasVolatility = 2.0;

  // 3. Execution_Risk (30%) — derived from seller's on-chain failure rate
  let executionRisk = 2.0;
  if (history.totalPolicies > 0) {
    const failureRate = history.failedPolicies / history.totalPolicies;
    executionRisk = 1.0 + failureRate * 4.0; // 1.0 – 5.0
  }

  // 4. Model_Risk (20%) — from historical avg score if available, else from retries
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
  if (amount <= 0n) {
    throw new Error("Amount must be greater than 0");
  }
  if (riskScore < 0.1 || riskScore > 5.0) {
    throw new Error("Risk score must be between 0.1 and 5.0");
  }

  // (0.05 + 0.01 * riskScore) * 10000 → integer multiplier for BigInt arithmetic
  const multiplier = Math.round((5 + riskScore) * 100);
  return (amount * BigInt(multiplier)) / 10_000n;
}

/**
 * Bayesian update of Risk Score after a payout event.
 * Formula: newScore = (currentScore × N + payoutFactor) / (N + 1), N = 10
 */
export async function updateRiskScore(
  sellerAddress: string,
  payoutFactor: number,
  currentRiskScore: number,
): Promise<number> {
  if (!sellerAddress.startsWith("0x") || sellerAddress.length !== 42) {
    throw new Error("Invalid seller address format");
  }
  if (payoutFactor < 0 || payoutFactor > 5.0) {
    throw new Error("Payout factor must be between 0 and 5.0");
  }

  const N = 10;
  const newScore = (currentRiskScore * N + payoutFactor) / (N + 1);
  return Math.max(0.1, Math.min(5.0, newScore));
}
