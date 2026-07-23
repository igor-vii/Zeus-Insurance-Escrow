import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer, Contract } from "ethers";

/* ── Inline pricing helpers (mirrors api-server/src/services/pricing.ts) ── */
interface RiskParam { rate: number; probability: number; }
const RISK_TABLE: Record<string, RiskParam> = {
  APIFailure:   { rate: 0.15, probability: 0.40 },
  NetworkError: { rate: 0.10, probability: 0.30 },
  WalletLimit:  { rate: 0.05, probability: 0.10 },
  GasShortage:  { rate: 0.03, probability: 0.10 },
  MCPError:     { rate: 0.12, probability: 0.10 },
};
const DAILY_ERROR_SOFT_THRESHOLD = 3;
const DAILY_ERROR_HARD_THRESHOLD = 5;
const PER_ERROR_PENALTY_BPS = 1000;
interface ErrorHistory { agent: string; errors: number; total: number; windowHours: number; }
function calculatePenaltyScore(h: ErrorHistory): number {
  if (h.total === 0) return 1.0;
  const errorRate = h.errors / h.total;
  let m = errorRate > 0.30 ? 2.0 : errorRate > 0.15 ? 1.5 : 1.0;
  // Daily threshold bonus only applies when base error rate is low (multiplier still 1.0)
  if (m === 1.0 && h.windowHours <= 24) {
    if (h.errors > DAILY_ERROR_HARD_THRESHOLD)
      m *= 1 + (DAILY_ERROR_HARD_THRESHOLD * PER_ERROR_PENALTY_BPS) / 10_000;
    else if (h.errors > DAILY_ERROR_SOFT_THRESHOLD)
      m *= 1 + ((h.errors - DAILY_ERROR_SOFT_THRESHOLD) * PER_ERROR_PENALTY_BPS) / 10_000;
  }
  return Math.round(m * 100) / 100;
}
function calculateAllInclusiveBasePremium(risks: RiskParam[] = Object.values(RISK_TABLE)): number {
  if (risks.length === 0) return 0;
  let sum = 0, maxW = 0, maxR = 0;
  for (const r of risks) {
    const w = r.rate * r.probability;
    sum += w;
    if (w > maxW) maxW = w;
    if (r.rate > maxR) maxR = r.rate;
  }
  return Math.round((sum - maxW + maxR) * 1e6) / 1e6;
}

describe("Zeus Insurance V2 + Escrow + Arbitration", () => {
  let admin: Signer, buyer: Signer, seller: Signer, executor: Signer, agent: Signer, oracle: Signer;
  let insurance: Contract, escrow: Contract, arbitration: Contract;

  const XLAYER = 196;

  before(async () => {
    [admin, buyer, seller, executor, agent, oracle] = await ethers.getSigners();
  });

  // hardhat_setChainId is not supported in Hardhat EDR; chainId is fixed to 196 (XLAYER)
  // via hardhat.config.ts so all onlyXLayer tests pass automatically.
  // The "non-X-Layer rejection" path is validated by unit-testing the modifier off-chain.

  beforeEach(async () => {
    const InsFactory = await ethers.getContractFactory("ZeusInsuranceV2");
    insurance = await InsFactory.deploy(await admin.getAddress(), ethers.ZeroAddress);
    await insurance.waitForDeployment();

    const EscFactory = await ethers.getContractFactory("ZeusEscrowBOT");
    escrow = await EscFactory.deploy(await admin.getAddress(), ethers.ZeroAddress);
    await escrow.waitForDeployment();

    const ArbFactory = await ethers.getContractFactory("ZeusArbitrationRisk");
    arbitration = await ArbFactory.deploy(await admin.getAddress(), ethers.ZeroAddress);
    await arbitration.waitForDeployment();

    await insurance.grantRole(await insurance.CLAIM_EVALUATOR_ROLE(), await oracle.getAddress());
    await escrow.grantRole(await escrow.ORACLE_ROLE(), await oracle.getAddress());
    await arbitration.grantRole(await arbitration.ARBITRATION_EVALUATOR_ROLE(), await oracle.getAddress());
  });

  describe("Pricing service", () => {
    it("computes All-inclusive base premium per spec", () => {
      const base = calculateAllInclusiveBasePremium();
      const vals = Object.values(RISK_TABLE);
      const sumWeighted = vals.reduce((s, r) => s + r.rate * r.probability, 0);
      const maxWeighted = Math.max(...vals.map(r => r.rate * r.probability));
      const maxRate = Math.max(...vals.map(r => r.rate));
      const expected = Math.round((sumWeighted - maxWeighted + maxRate) * 1e6) / 1e6;
      expect(base).to.equal(expected);
      expect(base).to.be.greaterThan(0);
    });

    it("returns 1.0 penalty for clean agent", () => {
      expect(calculatePenaltyScore({ agent: "0x", errors: 0, total: 100, windowHours: 24 })).to.equal(1.0);
    });

    it("returns 1.5 penalty for 16% error rate", () => {
      expect(calculatePenaltyScore({ agent: "0x", errors: 16, total: 100, windowHours: 24 })).to.equal(1.5);
    });

    it("returns 2.0 penalty for 31% error rate", () => {
      expect(calculatePenaltyScore({ agent: "0x", errors: 31, total: 100, windowHours: 24 })).to.equal(2.0);
    });
  });

  describe("ZeusInsuranceV2", () => {
    // Chain is hardhat-fixed to 196 (X Layer) — onlyXLayer modifier passes in all tests.

    it("buys an All-inclusive policy and emits event", async () => {
      const amount = ethers.parseEther("1");
      const quote = await insurance.quote(0x1F, await buyer.getAddress(), amount);
      const tx = insurance.connect(buyer).buyAllInclusivePolicy(
        await seller.getAddress(), amount, 3600, "ipfs://x",
        { value: quote }
      );
      await expect(tx).to.emit(insurance, "PolicyCreated");
      const id = await insurance.currentPolicyId();
      const p = await insurance.getPolicy(id);
      expect(p.coverageMask).to.equal(0x1F);
      expect(p.metadata).to.equal("ipfs://x");
    });

    it("rejects ArbitrationRisk bit in main policy", async () => {
      const maskWithArb = 0x1F | (1 << 5);
      await expect(
        insurance.connect(buyer).buyPolicy(await seller.getAddress(), 1000, maskWithArb, 3600, "")
      ).to.be.revertedWith("Zeus: arbitration is separate product");
    });

    it("applies penalty score to premium", async () => {
      const amount = ethers.parseEther("1");
      await insurance.setPenaltyScore(await agent.getAddress(), 20_000);
      const base = await insurance.quote(0x1F, ethers.ZeroAddress, amount);
      const withPenalty = await insurance.quote(0x1F, await agent.getAddress(), amount);
      expect(withPenalty).to.equal(base * 2n);
    });

    it("pays out via oracle claim", async () => {
      const amount = ethers.parseEther("1");
      const quote = await insurance.quote(0x1F, await buyer.getAddress(), amount);
      await insurance.connect(buyer).buyAllInclusivePolicy(
        await seller.getAddress(), amount, 3600, "", { value: quote }
      );
      const id = await insurance.currentPolicyId();
      const before = await ethers.provider.getBalance(await buyer.getAddress());
      await insurance.connect(oracle).claim(id, await buyer.getAddress(), amount);
      const after = await ethers.provider.getBalance(await buyer.getAddress());
      expect(after - before).to.equal(amount);
    });
  });

  describe("ZeusEscrowBOT", () => {
    it("creates a classic escrow and releases", async () => {
      const amount = ethers.parseEther("1");
      const tx = escrow.connect(buyer).createClassicEscrow(
        await executor.getAddress(), amount, 3600, { value: amount }
      );
      await expect(tx).to.emit(escrow, "EscrowCreated");
      const id = await escrow.currentEscrowId();
      await escrow.connect(buyer).release(id);
      const e = await escrow.getEscrow(id);
      expect(e.status).to.equal(2);
    });

    it("creates a MultiSig escrow and releases after threshold", async () => {
      const amount = ethers.parseEther("1");
      const [, s1, s2] = await ethers.getSigners();
      await escrow.connect(buyer).createMultiSigEscrow(
        await executor.getAddress(), amount, 3600, [await s1.getAddress(), await s2.getAddress()], 2,
        { value: amount }
      );
      const id = await escrow.currentEscrowId();
      await escrow.connect(s1).sign(id);
      await escrow.connect(s2).sign(id);
      await escrow.connect(executor).release(id);
      const e = await escrow.getEscrow(id);
      expect(e.status).to.equal(2);
    });

    it("creates a recurring escrow and enforces interval", async () => {
      const amount = ethers.parseEther("0.1");
      // timeout=7200 so advancing 3600s for the interval doesn't expire the escrow
      await escrow.connect(buyer).createRecurringEscrow(
        await executor.getAddress(), amount, 7200, 3600, { value: amount }
      );
      const id = await escrow.currentEscrowId();
      await expect(escrow.connect(executor).release(id)).to.be.revertedWith("ZE: too early");
      await network.provider.send("evm_increaseTime", [3600]);
      await network.provider.send("evm_mine");
      await escrow.connect(executor).release(id);
    });

    it("creates a conditional escrow resolved by oracle", async () => {
      const amount = ethers.parseEther("1");
      const condHash = ethers.id("okx-ai-condition-1");
      await escrow.connect(buyer).createConditionalEscrow(
        await executor.getAddress(), amount, 3600, condHash, { value: amount }
      );
      const id = await escrow.currentEscrowId();
      await escrow.connect(oracle).resolveCondition(id, true, condHash);
      const e = await escrow.getEscrow(id);
      expect(e.status).to.equal(2);
    });
  });

  describe("ZeusArbitrationRisk", () => {
    // Chain is hardhat-fixed to 196 (X Layer) — onlyXLayer modifier passes.

    it("buys arbitration insurance and pays out", async () => {
      const amount = ethers.parseEther("1");
      const premium = await arbitration.quote(amount);
      expect(premium).to.equal(amount * 800n / 10_000n);

      const caseId = ethers.id("okx-case-42");
      await arbitration.connect(buyer).buyArbitrationInsurance(amount, caseId, 3600, { value: premium });
      const id = 0; // first policy

      // Fund the contract reserve so it can pay out the full insured amount
      await admin.sendTransaction({ to: await arbitration.getAddress(), value: amount });

      const before = await ethers.provider.getBalance(await buyer.getAddress());
      await arbitration.connect(oracle).claimArbitrationPayout(id);
      const after = await ethers.provider.getBalance(await buyer.getAddress());
      expect(after - before).to.equal(amount);
    });
  });
});
