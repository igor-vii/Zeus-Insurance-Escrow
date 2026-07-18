import { Contract, Interface, type TransactionReceipt } from "ethers";
import { ZeusClient } from "./client.js";
import {
  CreatePolicySchema,
  ClaimPayoutSchema,
  GetPolicySchema,
  ZeusError,
  ZeusNotConnectedError,
  ZeusValidationError,
  ZeusTransactionError,
  ZeusContractError,
  type TransactionResult,
  type Policy,
} from "../types/index.js";

const INSURANCE_ABI = [
  "function createPolicy(address seller, uint256 amount, uint256 timeout, uint256 retries) external returns (uint256 policyId)",
  "function claimPayout(uint256 policyId) external returns (bool)",
  "function getPolicy(uint256 policyId) external view returns (tuple(uint256 id, address buyer, address seller, uint256 amount, uint256 timeout, uint256 retries, uint256 claims, bool active, bool claimed, uint256 createdAt))",
  "event PolicyCreated(uint256 indexed policyId, address indexed buyer, address indexed seller, uint256 amount, uint256 timeout, uint256 retries)",
  "event PayoutClaimed(uint256 indexed policyId, address indexed buyer, uint256 amount)",
] as const;

export class ZeusInsurance {
  constructor(private readonly client: ZeusClient) {}

  private getContract(): Contract {
    if (!this.client.isReady()) throw new ZeusNotConnectedError();
    const network = this.client.getNetwork();
    if (!network.insuranceAddress) {
      throw new ZeusContractError(
        `ZeusInsuranceV2 is not deployed on "${network.name}" yet.`,
      );
    }
    return new Contract(network.insuranceAddress, INSURANCE_ABI, this.client.getRunner());
  }

  private buildTxResult(receipt: TransactionReceipt): TransactionResult {
    return {
      hash: receipt.hash,
      status: receipt.status ?? 0,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  private parseEvent(
    receipt: TransactionReceipt,
    eventName: string,
  ): { args: Record<string, unknown> } | null {
    const iface = new Interface(INSURANCE_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
        if (parsed?.name === eventName) {
          return { args: parsed.args as unknown as Record<string, unknown> };
        }
      } catch {
        // skip non-matching logs
      }
    }
    return null;
  }

  /**
   * Create a new insurance policy.
   * Caller must have approved the insurance contract to spend `amount` of USDC.
   */
  async createPolicy(
    seller: string,
    amount: bigint,
    timeout: number,
    retries: number,
  ): Promise<{ policyId: number; tx: TransactionResult }> {
    const parsed = CreatePolicySchema.safeParse({ seller, amount, timeout, retries });
    if (!parsed.success) {
      throw new ZeusValidationError(
        "Invalid parameters for createPolicy",
        parsed.error.issues,
      );
    }

    const contract = this.getContract();

    try {
      const tx = await contract.createPolicy(
        parsed.data.seller,
        parsed.data.amount,
        BigInt(parsed.data.timeout),
        BigInt(parsed.data.retries),
      );
      const receipt: TransactionReceipt | null = await tx.wait();
      if (!receipt) {
        throw new ZeusTransactionError(
          "Transaction was submitted but no receipt was received.",
        );
      }
      if (receipt.status === 0) {
        throw new ZeusTransactionError("Transaction reverted.", receipt.hash);
      }

      const event = this.parseEvent(receipt, "PolicyCreated");
      if (!event) {
        throw new ZeusTransactionError(
          "PolicyCreated event not found in transaction logs.",
          receipt.hash,
        );
      }

      return {
        policyId: Number(event.args["policyId"]),
        tx: this.buildTxResult(receipt),
      };
    } catch (err) {
      if (err instanceof ZeusError) throw err;
      throw new ZeusTransactionError(
        `Failed to create insurance policy: ${(err as Error).message}`,
        undefined,
        err,
      );
    }
  }

  /** Claim payout for an active policy. */
  async claimPayout(policyId: number): Promise<TransactionResult> {
    const parsed = ClaimPayoutSchema.safeParse({ policyId });
    if (!parsed.success) {
      throw new ZeusValidationError(
        "Invalid parameters for claimPayout",
        parsed.error.issues,
      );
    }

    const contract = this.getContract();

    try {
      const tx = await contract.claimPayout(BigInt(parsed.data.policyId));
      const receipt: TransactionReceipt | null = await tx.wait();
      if (!receipt) {
        throw new ZeusTransactionError(
          "Transaction was submitted but no receipt was received.",
        );
      }
      if (receipt.status === 0) {
        throw new ZeusTransactionError("Transaction reverted.", receipt.hash);
      }
      return this.buildTxResult(receipt);
    } catch (err) {
      if (err instanceof ZeusError) throw err;
      throw new ZeusTransactionError(
        `Failed to claim payout: ${(err as Error).message}`,
        undefined,
        err,
      );
    }
  }

  /** Read policy state from chain. */
  async getPolicy(policyId: number): Promise<Policy> {
    const parsed = GetPolicySchema.safeParse({ policyId });
    if (!parsed.success) {
      throw new ZeusValidationError(
        "Invalid parameters for getPolicy",
        parsed.error.issues,
      );
    }

    const contract = this.getContract();

    try {
      const result = await contract.getPolicy(BigInt(parsed.data.policyId));
      return {
        id: Number(result[0]),
        buyer: String(result[1]),
        seller: String(result[2]),
        amount: BigInt(result[3]),
        timeout: Number(result[4]),
        retries: Number(result[5]),
        claims: Number(result[6]),
        active: Boolean(result[7]),
        claimed: Boolean(result[8]),
        createdAt: Number(result[9]),
      };
    } catch (err) {
      if (err instanceof ZeusError) throw err;
      throw new ZeusTransactionError(
        `Failed to fetch policy: ${(err as Error).message}`,
        undefined,
        err,
      );
    }
  }
}
