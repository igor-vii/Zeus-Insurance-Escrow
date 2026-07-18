import { Contract, Interface } from "ethers";
import { CreatePolicySchema, ClaimPayoutSchema, GetPolicySchema, ZeusError, ZeusNotConnectedError, ZeusValidationError, ZeusTransactionError, ZeusContractError, } from "../types/index.js";
// Matches the deployed ZeusInsuranceV2 contract exactly.
const INSURANCE_ABI = [
    // buyInsurance(seller, amount, timeoutSeconds, maxRetries)
    "function buyInsurance(address seller, uint256 amount, uint256 timeoutSeconds, uint256 maxRetries) external",
    "function claimPayout(uint256 policyId) external",
    // getPolicy returns the on-chain Policy struct
    "function getPolicy(uint256 policyId) external view returns (tuple(address buyer, address seller, uint256 amount, uint256 premium, uint256 retryDeadline, uint256 maxRetries, bool isActive, bool isPaidOut, bool isExpired))",
    // Events
    "event PolicyCreated(uint256 indexed policyId, address indexed buyer, address indexed seller, uint256 amount, uint256 premium, uint256 retryDeadline)",
    "event PayoutExecuted(uint256 indexed policyId, uint256 amount)",
    "event PolicyExpired(uint256 indexed policyId)",
];
const USDC_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
];
/**
 * Premium formula mirrors the contract:
 *   premiumBps = 700 + (maxRetries − 1) × 200
 *   premium    = amount × premiumBps / 10 000
 */
function calcPremium(amount, maxRetries) {
    const bps = 700n + (BigInt(maxRetries) - 1n) * 200n;
    return (amount * bps) / 10000n;
}
export class ZeusInsurance {
    client;
    constructor(client) {
        this.client = client;
    }
    getContract() {
        if (!this.client.isReady())
            throw new ZeusNotConnectedError();
        const network = this.client.getNetwork();
        if (!network.insuranceAddress) {
            throw new ZeusContractError(`ZeusInsuranceV2 is not deployed on "${network.name}" yet.`);
        }
        return new Contract(network.insuranceAddress, INSURANCE_ABI, this.client.getRunner());
    }
    buildTxResult(receipt) {
        return {
            hash: receipt.hash,
            status: receipt.status ?? 0,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
        };
    }
    parseEvent(receipt, eventName) {
        const iface = new Interface(INSURANCE_ABI);
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
                if (parsed?.name === eventName) {
                    return { args: parsed.args };
                }
            }
            catch {
                // skip non-matching logs
            }
        }
        return null;
    }
    /**
     * Purchase an insurance policy.
     *
     * This method automatically approves the USDC premium transfer before
     * calling `buyInsurance` on the contract, so callers do not need a
     * separate approve step.
     *
     * Premium formula (mirrors the contract):
     *   premium = amount × (700 + (maxRetries − 1) × 200) / 10 000
     *
     * @param seller   - Counterparty address being insured against.
     * @param amount   - Coverage amount in USDC (6-decimal bigint, e.g. 5_000_000n = 5 USDC).
     * @param timeout  - Per-retry timeout window in seconds (e.g. 86_400 = 24 h).
     * @param retries  - Number of retry windows allowed (1–10).
     */
    async createPolicy(seller, amount, timeout, retries) {
        const parsed = CreatePolicySchema.safeParse({ seller, amount, timeout, retries });
        if (!parsed.success) {
            throw new ZeusValidationError("Invalid parameters for createPolicy", parsed.error.issues);
        }
        const network = this.client.getNetwork();
        if (!network.usdcAddress) {
            throw new ZeusContractError(`USDC address not configured for "${network.name}".`);
        }
        const contract = this.getContract();
        const premium = calcPremium(parsed.data.amount, parsed.data.retries);
        // --- Approve USDC premium transfer if allowance is insufficient ---
        try {
            const usdc = new Contract(network.usdcAddress, USDC_ABI, this.client.getRunner());
            const owner = this.client.getAddress();
            const allowance = await usdc.allowance(owner, network.insuranceAddress);
            if (allowance < premium) {
                const approveTx = await usdc.approve(network.insuranceAddress, premium);
                await approveTx.wait();
            }
        }
        catch (err) {
            if (err instanceof ZeusError)
                throw err;
            throw new ZeusTransactionError(`USDC approval failed: ${err.message}`, undefined, err);
        }
        // --- Call buyInsurance on-chain ---
        try {
            const tx = await contract.buyInsurance(parsed.data.seller, parsed.data.amount, BigInt(parsed.data.timeout), BigInt(parsed.data.retries));
            const receipt = await tx.wait();
            if (!receipt) {
                throw new ZeusTransactionError("Transaction was submitted but no receipt was received.");
            }
            if (receipt.status === 0) {
                throw new ZeusTransactionError("Transaction reverted.", receipt.hash);
            }
            const event = this.parseEvent(receipt, "PolicyCreated");
            if (!event) {
                throw new ZeusTransactionError("PolicyCreated event not found in transaction logs.", receipt.hash);
            }
            return {
                policyId: Number(event.args["policyId"]),
                tx: this.buildTxResult(receipt),
            };
        }
        catch (err) {
            if (err instanceof ZeusError)
                throw err;
            throw new ZeusTransactionError(`Failed to create insurance policy: ${err.message}`, undefined, err);
        }
    }
    /**
     * Claim a USDC payout once the retryDeadline has passed.
     * Only the policy buyer can call this.
     */
    async claimPayout(policyId) {
        const parsed = ClaimPayoutSchema.safeParse({ policyId });
        if (!parsed.success) {
            throw new ZeusValidationError("Invalid parameters for claimPayout", parsed.error.issues);
        }
        const contract = this.getContract();
        try {
            const tx = await contract.claimPayout(BigInt(parsed.data.policyId));
            const receipt = await tx.wait();
            if (!receipt) {
                throw new ZeusTransactionError("Transaction was submitted but no receipt was received.");
            }
            if (receipt.status === 0) {
                throw new ZeusTransactionError("Transaction reverted.", receipt.hash);
            }
            return this.buildTxResult(receipt);
        }
        catch (err) {
            if (err instanceof ZeusError)
                throw err;
            throw new ZeusTransactionError(`Failed to claim payout: ${err.message}`, undefined, err);
        }
    }
    /** Read policy state from chain. */
    async getPolicy(policyId) {
        const parsed = GetPolicySchema.safeParse({ policyId });
        if (!parsed.success) {
            throw new ZeusValidationError("Invalid parameters for getPolicy", parsed.error.issues);
        }
        const contract = this.getContract();
        try {
            const p = await contract.getPolicy(BigInt(parsed.data.policyId));
            return {
                id: parsed.data.policyId,
                buyer: String(p.buyer),
                seller: String(p.seller),
                amount: BigInt(p.amount),
                premium: BigInt(p.premium),
                retryDeadline: Number(p.retryDeadline),
                maxRetries: Number(p.maxRetries),
                isActive: Boolean(p.isActive),
                isPaidOut: Boolean(p.isPaidOut),
                isExpired: Boolean(p.isExpired),
            };
        }
        catch (err) {
            if (err instanceof ZeusError)
                throw err;
            throw new ZeusTransactionError(`Failed to fetch policy: ${err.message}`, undefined, err);
        }
    }
}
//# sourceMappingURL=insurance.js.map