import { ZeusClient } from "./client.js";
import { type TransactionResult, type Policy } from "../types/index.js";
export declare class ZeusInsurance {
    private readonly client;
    constructor(client: ZeusClient);
    private getContract;
    private buildTxResult;
    private parseEvent;
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
    createPolicy(seller: string, amount: bigint, timeout: number, retries: number): Promise<{
        policyId: number;
        tx: TransactionResult;
    }>;
    /**
     * Claim a USDC payout once the retryDeadline has passed.
     * Only the policy buyer can call this.
     */
    claimPayout(policyId: number): Promise<TransactionResult>;
    /** Read policy state from chain. */
    getPolicy(policyId: number): Promise<Policy>;
}
//# sourceMappingURL=insurance.d.ts.map