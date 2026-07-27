import { test, describe, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ── We test pure/exported functions directly ──────────────────────────────────
// fetchHumi makes a real network call, so we mock globalThis.fetch per test.

import {
  fetchHumi,
  getHumiMultiplier,
  calculateRiskScore,
  getBaseRate,
  calculatePremium,
  type SellerHistory,
} from "../src/services/pricing.js";

const VALID_ADDR = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const ZERO_HISTORY: SellerHistory = { totalPolicies: 0, failedPolicies: 0, avgRiskScore: 0 };

// ── getBaseRate ───────────────────────────────────────────────────────────────
describe("getBaseRate", () => {
  const cases: [number, number][] = [
    [0,  0.15],  // no history → 15%
    [1,  0.10],  // < 25 → 10%
    [24, 0.10],
    [25, 0.10],  // 25–49 → 10%
    [49, 0.10],
    [50, 0.07],  // >= 50 → 7%
    [100,0.07],
  ];

  for (const [totalPolicies, expected] of cases) {
    test(`totalPolicies=${totalPolicies} → baseRate=${expected}`, () => {
      const history: SellerHistory = { totalPolicies, failedPolicies: 0, avgRiskScore: 0 };
      assert.equal(getBaseRate(history), expected);
    });
  }
});

// ── calculatePremium ──────────────────────────────────────────────────────────
describe("calculatePremium", () => {
  beforeEach(() => { mock.restoreAll(); });

  const h0:  SellerHistory = { totalPolicies: 0,   failedPolicies: 0, avgRiskScore: 0 };
  const h30: SellerHistory = { totalPolicies: 30,  failedPolicies: 0, avgRiskScore: 0 };
  const h50: SellerHistory = { totalPolicies: 50,  failedPolicies: 0, avgRiskScore: 0 };

  test("new seller (0 policies, rate=15%), riskScore=1.0, amount=$1", async () => {
    // multiplier = round(0.15 * 0.6 * 10_000) = 900
    // premium = 1_000_000 * 900 / 10_000 = 90_000
    const p = await calculatePremium(1_000_000n, 1.0, h0);
    assert.equal(p, 90_000n);
  });

  test("early seller (30 policies, rate=10%), riskScore=1.0, amount=$1", async () => {
    // multiplier = round(0.10 * 0.6 * 10_000) = 600
    // premium = 1_000_000 * 600 / 10_000 = 60_000
    const p = await calculatePremium(1_000_000n, 1.0, h30);
    assert.equal(p, 60_000n);
  });

  test("established seller (50 policies, rate=7%), riskScore=1.0, amount=$1", async () => {
    // multiplier = round(0.07 * 0.6 * 10_000) = 420
    // premium = 1_000_000 * 420 / 10_000 = 42_000
    const p = await calculatePremium(1_000_000n, 1.0, h50);
    assert.equal(p, 42_000n);
  });

  test("rate=7%, riskScore=5.0 (max), amount=$1", async () => {
    // multiplier = round(0.07 * 1.0 * 10_000) = 700
    // premium = 1_000_000 * 700 / 10_000 = 70_000
    const p = await calculatePremium(1_000_000n, 5.0, h50);
    assert.equal(p, 70_000n);
  });

  test("min premium enforced: small policy ($0.10) with low risk yields $0.02", async () => {
    // amount=100_000 (<$1), rate=0.07, riskScore=1.0
    // calculated = 100_000 * 420 / 10_000 = 4_200 < MIN_PREMIUM(20_000)
    const p = await calculatePremium(100_000n, 1.0, h50);
    assert.equal(p, 20_000n);
  });

  test("min premium not applied: small policy with high enough rate exceeds $0.02", async () => {
    // amount=500_000 ($0.50 < $1), rate=0.15, riskScore=5.0
    // multiplier = round(0.15 * 1.0 * 10_000) = 1500
    // calculated = 500_000 * 1500 / 10_000 = 75_000 > 20_000 → no min
    const p = await calculatePremium(500_000n, 5.0, h0);
    assert.equal(p, 75_000n);
  });

  test("min premium not applied: amount >= $1 even if calculated < $0.02", async () => {
    // amount=1_000_000 (=$1, not < threshold), rate=0.07, riskScore=0.1
    // multiplier = round(0.07 * 0.51 * 10_000) = round(357) = 357
    // calculated = 1_000_000 * 357 / 10_000 = 35_700 > 20_000 anyway
    const p = await calculatePremium(1_000_000n, 0.1, h50);
    assert.equal(p, 35_700n);
  });

  test("throws on zero amount", async () => {
    await assert.rejects(
      () => calculatePremium(0n, 1.0, h0),
      /Amount must be greater than 0/,
    );
  });

  test("throws on riskScore below 0.1", async () => {
    await assert.rejects(
      () => calculatePremium(1_000_000n, 0.05, h0),
      /Risk score must be between 0.1 and 5.0/,
    );
  });

  test("throws on riskScore above 5.0", async () => {
    await assert.rejects(
      () => calculatePremium(1_000_000n, 5.1, h0),
      /Risk score must be between 0.1 and 5.0/,
    );
  });
});

// ── fetchHumi ─────────────────────────────────────────────────────────────────
describe("fetchHumi", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    mock.restoreAll();
  });

  test("returns HUMI value from successful API response", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({ humi: 75 }),
    }));
    const humi = await fetchHumi(VALID_ADDR);
    assert.equal(humi, 75);
  });

  test("returns fallback 50 when API returns non-ok status", async () => {
    mock.method(globalThis, "fetch", async () => ({ ok: false, status: 503 }));
    const humi = await fetchHumi(VALID_ADDR);
    assert.equal(humi, 50);
  });

  test("returns fallback 50 when fetch throws (network error)", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new Error("network error");
    });
    const humi = await fetchHumi(VALID_ADDR);
    assert.equal(humi, 50);
  });

  test("returns fallback 50 when humi field is missing in response", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({ someOtherField: 42 }),
    }));
    const humi = await fetchHumi(VALID_ADDR);
    assert.equal(humi, 50);
  });

  test("returns fallback 50 when humi value is out of range", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({ humi: 150 }),
    }));
    const humi = await fetchHumi(VALID_ADDR);
    assert.equal(humi, 50);
  });
});

// ── getHumiMultiplier ─────────────────────────────────────────────────────────
describe("getHumiMultiplier", () => {
  const cases: [number, number][] = [
    [100, 0.70],  // HUMI >= 80 → very reliable
    [80,  0.70],
    [79,  0.85],  // HUMI >= 60
    [60,  0.85],
    [59,  1.00],  // HUMI >= 40 → neutral
    [40,  1.00],
    [39,  1.50],  // HUMI >= 20
    [20,  1.50],
    [19,  2.00],  // HUMI < 20 → high risk
    [0,   2.00],
  ];

  for (const [humi, expected] of cases) {
    test(`HUMI ${humi} → multiplier ${expected}`, () => {
      assert.equal(getHumiMultiplier(humi), expected);
    });
  }
});

// ── calculateRiskScore with HUMI integration ──────────────────────────────────
describe("calculateRiskScore — HUMI integration", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  function mockHumi(humi: number) {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({ humi }),
    }));
  }

  test("fallback HUMI=50 produces neutral mid-range score", async () => {
    // Simulate API failure → fallback 50 → weight 0.20, multiplier 1.00
    mock.method(globalThis, "fetch", async () => { throw new Error("down"); });
    const score = await calculateRiskScore(VALID_ADDR, 1_000_000n, 0, ZERO_HISTORY);
    assert.ok(score >= 0.1 && score <= 5.0, `score ${score} out of range`);
  });

  test("HUMI=90 (multiplier 0.70, weight 0.25) lowers risk score vs HUMI=10 (2.00, weight 0.15)", async () => {
    mockHumi(90);
    const highHumi = await calculateRiskScore(VALID_ADDR, 1_000_000n, 0, ZERO_HISTORY);

    mock.restoreAll();
    mockHumi(10);
    const lowHumi = await calculateRiskScore(VALID_ADDR, 1_000_000n, 0, ZERO_HISTORY);

    assert.ok(
      highHumi < lowHumi,
      `Expected highHumi (${highHumi}) < lowHumi (${lowHumi})`,
    );
  });

  test("HUMI weight HUMI_WEIGHT_HIGH: score shifts by 0.25 factor", async () => {
    // humi = 75 → weight 0.25, multiplier 0.85
    // With ZERO_HISTORY and retries=0: modelRisk = min(5, 1+0*0.5) = 1.0
    // baseScore = 2*0.4 + 2*0.3 + 1*0.2 + 2*0.1 = 0.8+0.6+0.2+0.2 = 1.80
    // rawScore  = 1.80 * 0.75 + 0.85 * 0.25 = 1.35 + 0.2125 = 1.5625
    mockHumi(75);
    const score = await calculateRiskScore(VALID_ADDR, 1_000_000n, 0, ZERO_HISTORY);
    assert.ok(Math.abs(score - 1.5625) < 0.001, `Expected ~1.5625, got ${score}`);
  });

  test("HUMI weight HUMI_WEIGHT_MEDIUM: score shifts by 0.20 factor", async () => {
    // humi = 40 → weight 0.20, multiplier 1.00
    // baseScore = 1.80; rawScore = 1.80 * 0.80 + 1.00 * 0.20 = 1.44 + 0.20 = 1.64
    mockHumi(40);
    const score = await calculateRiskScore(VALID_ADDR, 1_000_000n, 0, ZERO_HISTORY);
    assert.ok(Math.abs(score - 1.64) < 0.001, `Expected ~1.64, got ${score}`);
  });

  test("HUMI weight HUMI_WEIGHT_LOW: score shifts by 0.15 factor", async () => {
    // humi = 10 → weight 0.15, multiplier 2.00
    // baseScore = 1.80; rawScore = 1.80 * 0.85 + 2.00 * 0.15 = 1.53 + 0.30 = 1.83
    mockHumi(10);
    const score = await calculateRiskScore(VALID_ADDR, 1_000_000n, 0, ZERO_HISTORY);
    assert.ok(Math.abs(score - 1.83) < 0.001, `Expected ~1.83, got ${score}`);
  });

  test("score stays within [0.1, 5.0] for extreme inputs", async () => {
    mockHumi(0);
    const history: SellerHistory = { totalPolicies: 100, failedPolicies: 100, avgRiskScore: 5.0 };
    const score = await calculateRiskScore(VALID_ADDR, 1_000_000n, 10, history);
    assert.ok(score >= 0.1 && score <= 5.0, `score ${score} out of bounds`);
  });

  test("rejects invalid seller address", async () => {
    await assert.rejects(
      () => calculateRiskScore("invalid", 1_000_000n, 0, ZERO_HISTORY),
      /Invalid seller address format/,
    );
  });
});
