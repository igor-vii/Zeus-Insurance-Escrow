import { z } from "zod";
import type { Signer, Provider } from "ethers";

/* ──────────────────────────── Networks ──────────────────────────── */

export const NetworkSchema = z.enum([
  "mainnet",
  "base-sepolia",
  "sepolia",
  "localhost",
]);
export type Network = z.infer<typeof NetworkSchema>;

export interface NetworkConfig {
  name: string;
  chainId: number;
  /** ZeusEscrowBOT contract address */
  escrowAddress: string;
  /** ZeusInsuranceV2 contract address */
  insuranceAddress: string;
  /** ERC-20 token used by the escrow (USDC) */
  usdcAddress: string;
  rpcUrl: string;
}

export const NETWORKS: Record<Network, NetworkConfig> = {
  mainnet: {
    name: "mainnet",
    chainId: 1,
    escrowAddress: "",          // not yet deployed on mainnet
    insuranceAddress: "",       // not yet deployed on mainnet
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpcUrl: "https://eth.llamarpc.com",
  },
  "base-sepolia": {
    name: "base-sepolia",
    chainId: 84532,
    // Deployed 2026-07-18 — see contracts/scripts/deploy-escrow-bot.ts
    escrowAddress: "0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76",
    insuranceAddress: "0x1d9D90d2652296A2c89E3802d45B1F2132b30076", // Deployed 2026-07-18
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    rpcUrl: "https://sepolia.base.org",
  },
  sepolia: {
    name: "sepolia",
    chainId: 11155111,
    escrowAddress: "",
    insuranceAddress: "",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    rpcUrl: "https://rpc.sepolia.org",
  },
  localhost: {
    name: "localhost",
    chainId: 31337,
    escrowAddress: "",          // set after local `deploy:escrow-local`
    insuranceAddress: "",
    usdcAddress: "",
    rpcUrl: "http://127.0.0.1:8545",
  },
};

/* ──────────────────────────── Validation Schemas ──────────────────────────── */

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Proof is flexible: an IPFS CID, tx hash, URL, or any arbitrary bytes.
 * Pass as a hex string (0x-prefixed) or plain UTF-8 string.
 * The SDK converts plain strings to hex automatically.
 */
export const DepositAndCreateAgreementSchema = z.object({
  executor: z.string().regex(ADDRESS_REGEX, "Invalid Ethereum address for executor"),
  amount: z.bigint().positive("Amount must be a positive bigint (in token base units)"),
  timeout: z
    .number()
    .int("Timeout must be an integer")
    .positive("Timeout must be positive (seconds)"),
});

export const ConfirmExecutionSchema = z.object({
  agreementId: z
    .number()
    .int("Agreement ID must be an integer")
    .nonnegative("Agreement ID must be non-negative"),
  /** Arbitrary proof string (IPFS CID, tx hash, URL, etc.). Empty string is allowed. */
  proof: z.string(),
});

export const RequestRefundSchema = z.object({
  agreementId: z
    .number()
    .int("Agreement ID must be an integer")
    .nonnegative("Agreement ID must be non-negative"),
});

export const CreatePolicySchema = z.object({
  seller: z.string().regex(ADDRESS_REGEX, "Invalid Ethereum address for seller"),
  amount: z.bigint().positive("Amount must be a positive bigint (in token base units)"),
  timeout: z
    .number()
    .int("Timeout must be an integer")
    .positive("Timeout must be positive (seconds)"),
  retries: z
    .number()
    .int("Retries must be an integer")
    .nonnegative("Retries must be non-negative"),
});

export const ClaimPayoutSchema = z.object({
  policyId: z
    .number()
    .int("Policy ID must be an integer")
    .nonnegative("Policy ID must be non-negative"),
});

export const GetPolicySchema = z.object({
  policyId: z
    .number()
    .int("Policy ID must be an integer")
    .nonnegative("Policy ID must be non-negative"),
});

/* ──────────────────────────── Domain Types ──────────────────────────── */

/**
 * Mirrors ZeusEscrowBOT.AgreementStatus on-chain enum.
 */
export enum AgreementStatus {
  Active = 0,
  Completed = 1,
  Refunded = 2,
}

/**
 * On-chain Agreement struct from ZeusEscrowBOT.
 * Note: the contract uses `initiator` (not `buyer`) and stores `proof` as bytes.
 */
export interface Agreement {
  id: number;
  initiator: string;
  executor: string;
  amount: bigint;
  timeout: number;
  createdAt: number;
  status: AgreementStatus;
  /** Hex-encoded proof bytes, or null if not yet submitted */
  proof: string | null;
}

export interface Policy {
  /** Policy ID (mapping key in the contract). */
  id: number;
  buyer: string;
  seller: string;
  /** Coverage amount in USDC (6-decimal units). */
  amount: bigint;
  /** Premium paid in USDC (6-decimal units). */
  premium: bigint;
  /** Unix timestamp after which the buyer may claim a payout. */
  retryDeadline: number;
  maxRetries: number;
  isActive: boolean;
  isPaidOut: boolean;
  isExpired: boolean;
}

export interface TransactionResult {
  hash: string;
  status: number;
  blockNumber: number;
  gasUsed: bigint;
}

/* ──────────────────────────── Error Classes ──────────────────────────── */

export class ZeusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ZeusError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ZeusNotConnectedError extends ZeusError {
  constructor(
    message = "SDK is not connected. Call client.connect(network, signer) first.",
  ) {
    super(message, "NOT_CONNECTED");
    this.name = "ZeusNotConnectedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ZeusValidationError extends ZeusError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ZeusValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ZeusTransactionError extends ZeusError {
  constructor(
    message: string,
    public readonly txHash?: string,
    details?: unknown,
  ) {
    super(message, "TRANSACTION_ERROR", details);
    this.name = "ZeusTransactionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ZeusContractError extends ZeusError {
  constructor(message: string, details?: unknown) {
    super(message, "CONTRACT_ERROR", details);
    this.name = "ZeusContractError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
