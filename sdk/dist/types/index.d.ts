import { z } from "zod";
export declare const XLAYER_CHAIN_ID: 196;
export declare const ALL_INCLUSIVE_MASK = 31;
export declare enum CoverageType {
    APIFailure = 0,
    NetworkError = 1,
    WalletLimit = 2,
    GasShortage = 3,
    MCPError = 4,
    ArbitrationRisk = 5
}
export declare const NetworkSchema: z.ZodEnum<["mainnet", "base-mainnet", "base-sepolia", "sepolia", "localhost"]>;
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
export declare const NETWORKS: Record<Network, NetworkConfig>;
/**
 * Proof is flexible: an IPFS CID, tx hash, URL, or any arbitrary bytes.
 * Pass as a hex string (0x-prefixed) or plain UTF-8 string.
 * The SDK converts plain strings to hex automatically.
 */
export declare const DepositAndCreateAgreementSchema: z.ZodObject<{
    executor: z.ZodString;
    amount: z.ZodBigInt;
    timeout: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    executor: string;
    amount: bigint;
    timeout: number;
}, {
    executor: string;
    amount: bigint;
    timeout: number;
}>;
export declare const ConfirmExecutionSchema: z.ZodObject<{
    agreementId: z.ZodNumber;
    /** Arbitrary proof string (IPFS CID, tx hash, URL, etc.). Empty string is allowed. */
    proof: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agreementId: number;
    proof: string;
}, {
    agreementId: number;
    proof: string;
}>;
export declare const RequestRefundSchema: z.ZodObject<{
    agreementId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    agreementId: number;
}, {
    agreementId: number;
}>;
export declare const CreatePolicySchema: z.ZodObject<{
    seller: z.ZodString;
    amount: z.ZodBigInt;
    timeout: z.ZodNumber;
    retries: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: bigint;
    timeout: number;
    seller: string;
    retries: number;
}, {
    amount: bigint;
    timeout: number;
    seller: string;
    retries: number;
}>;
export declare const ClaimPayoutSchema: z.ZodObject<{
    policyId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    policyId: number;
}, {
    policyId: number;
}>;
export declare const GetPolicySchema: z.ZodObject<{
    policyId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    policyId: number;
}, {
    policyId: number;
}>;
export declare const SubmitObservationSchema: z.ZodObject<{
    policyId: z.ZodNumber;
    observation: z.ZodObject<{
        /** keccak256(buyer, seller, timestamp) — unique per health-check round. */
        requestId: z.ZodString;
        /** Unix timestamp of the observation (±120 s tolerance on-chain). */
        timestamp: z.ZodNumber;
        /**
         * Service health code:
         *   0 = OK
         *   1 = TIMEOUT  (counts toward payout quorum)
         *   2 = ERROR_500
         *   3 = LATE
         */
        status: z.ZodNumber;
        /** Arbitrary metadata digest (e.g. IPFS CID of raw logs). */
        metadataHash: z.ZodString;
        /** Per-watcher anti-replay nonce. */
        nonce: z.ZodNumber;
        /** EIP-191 personal_sign over (requestId, timestamp, status, metadataHash, nonce). */
        signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: number;
        requestId: string;
        timestamp: number;
        metadataHash: string;
        nonce: number;
        signature: string;
    }, {
        status: number;
        requestId: string;
        timestamp: number;
        metadataHash: string;
        nonce: number;
        signature: string;
    }>;
}, "strip", z.ZodTypeAny, {
    policyId: number;
    observation: {
        status: number;
        requestId: string;
        timestamp: number;
        metadataHash: string;
        nonce: number;
        signature: string;
    };
}, {
    policyId: number;
    observation: {
        status: number;
        requestId: string;
        timestamp: number;
        metadataHash: string;
        nonce: number;
        signature: string;
    };
}>;
/**
 * Mirrors ZeusEscrowBOT.AgreementStatus on-chain enum.
 */
export declare enum AgreementStatus {
    Active = 0,
    Completed = 1,
    Refunded = 2
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
/**
 * On-chain PolicyStatus enum (ZeusInsuranceV2).
 * Updated for OKX AI / All-inclusive: Cancelled replaces Rejected.
 */
export declare enum PolicyStatus {
    Active = 0,
    Claimed = 1,
    Expired = 2,
    Cancelled = 3
}
/**
 * Off-chain observation submitted by a watcher node.
 * Mirrors the `Observation` struct in ZeusInsuranceV2.
 */
export interface Observation {
    /** keccak256(buyer, seller, timestamp) */
    requestId: string;
    /** Unix timestamp of the check (±120 s tolerance on-chain). */
    timestamp: number;
    /** 0=OK 1=TIMEOUT 2=ERROR_500 3=LATE */
    status: 0 | 1 | 2 | 3;
    /** Arbitrary metadata digest. */
    metadataHash: string;
    /** Per-watcher anti-replay nonce. */
    nonce: number;
    /** EIP-191 personal_sign over (requestId, timestamp, status, metadataHash, nonce). */
    signature: string;
}
export interface Policy {
    buyer: string;
    seller: string;
    amount: bigint;
    premium: bigint;
    timeout: bigint;
    coverageMask: bigint;
    status: PolicyStatus;
    metadata: string;
}
export interface ArbPolicy {
    buyer: string;
    amount: bigint;
    premium: bigint;
    caseId: string;
    timeout: bigint;
    status: number;
    metadata: string;
}
export interface TransactionResult {
    hash: string;
    status: number;
    blockNumber: number;
    gasUsed: bigint;
}
export declare enum EscrowType {
    Classic = 0,
    Conditional = 1,
    Recurring = 2,
    MultiSig = 3
}
export declare enum EscrowStatus {
    Pending = 0,
    Active = 1,
    Released = 2,
    Refunded = 3,
    Disputed = 4,
    Expired = 5
}
export interface EscrowAgreement {
    buyer: string;
    executor: string;
    token: string;
    amount: bigint;
    timeout: bigint;
    escrowType: EscrowType;
    conditionHash: string;
    interval: bigint;
    requiredSignatures: bigint;
    status: EscrowStatus;
    createdAt: bigint;
    lastReleasedAt: bigint;
    signaturesCount: bigint;
}
export interface CreatePolicyParams {
    seller: string;
    amount: bigint;
    coverageMask: number;
    timeoutSeconds: number;
    metadata?: string;
}
export interface CreateAllInclusivePolicyParams {
    seller: string;
    amount: bigint;
    timeoutSeconds: number;
    metadata?: string;
}
export interface CreateEscrowAgreementParams {
    executor: string;
    amount: bigint;
    timeoutSeconds: number;
    escrowType: EscrowType;
    conditionHash?: string;
    intervalSeconds?: number;
    signers?: string[];
    requiredSignatures?: number;
}
export interface ErrorHistory {
    agent: string;
    errors: number;
    total: number;
    windowHours: number;
}
export interface PriceQuote {
    basePremium: number;
    penaltyScore: number;
    finalPremium: number;
    rejected: boolean;
    retryAfterSeconds?: number;
}
export interface BuyPolicyRequest {
    seller: string;
    amount: string;
    coverageMask: number;
    timeoutSeconds: number;
    metadata?: string;
    agent?: string;
}
export interface BuyAllInclusiveRequest {
    seller: string;
    amount: string;
    timeoutSeconds: number;
    metadata?: string;
    agent?: string;
}
export interface CreateEscrowRequest {
    executor: string;
    amount: string;
    timeoutSeconds: number;
    escrowType: EscrowType;
    conditionHash?: string;
    intervalSeconds?: number;
    signers?: string[];
    requiredSignatures?: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    retryAfterSeconds?: number;
}
export declare class ZeusError extends Error {
    readonly code: string;
    readonly details?: unknown | undefined;
    constructor(message: string, code: string, details?: unknown | undefined);
}
export declare class ZeusNotConnectedError extends ZeusError {
    constructor(message?: string);
}
export declare class ZeusValidationError extends ZeusError {
    constructor(message: string, details?: unknown);
}
export declare class ZeusTransactionError extends ZeusError {
    readonly txHash?: string | undefined;
    constructor(message: string, txHash?: string | undefined, details?: unknown);
}
export declare class ZeusContractError extends ZeusError {
    constructor(message: string, details?: unknown);
}
//# sourceMappingURL=index.d.ts.map