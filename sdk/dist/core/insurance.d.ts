import { ZeusClient } from "./client.js";
import { type TransactionResult, type Policy } from "../types/index.js";
export declare class ZeusInsurance {
    private readonly client;
    constructor(client: ZeusClient);
    private getContract;
    private buildTxResult;
    private parseEvent;
    /**
     * Create a new insurance policy.
     * Caller must have approved the insurance contract to spend `amount` of USDC.
     */
    createPolicy(seller: string, amount: bigint, timeout: number, retries: number): Promise<{
        policyId: number;
        tx: TransactionResult;
    }>;
    /** Claim payout for an active policy. */
    claimPayout(policyId: number): Promise<TransactionResult>;
    /** Read policy state from chain. */
    getPolicy(policyId: number): Promise<Policy>;
}
//# sourceMappingURL=insurance.d.ts.map