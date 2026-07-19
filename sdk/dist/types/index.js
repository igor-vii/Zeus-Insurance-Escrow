import { z } from "zod";
/* ──────────────────────────── Networks ──────────────────────────── */
export const NetworkSchema = z.enum([
    "mainnet",
    "base-mainnet",
    "base-sepolia",
    "sepolia",
    "localhost",
]);
export const NETWORKS = {
    mainnet: {
        name: "mainnet",
        chainId: 1,
        escrowAddress: "", // not yet deployed on Ethereum mainnet
        insuranceAddress: "", // not yet deployed on Ethereum mainnet
        usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        rpcUrl: "https://eth.llamarpc.com",
    },
    "base-mainnet": {
        name: "base-mainnet",
        chainId: 8453,
        escrowAddress: "0x8D10C2c6C92b613C1938fe532f0e391044e76188",
        insuranceAddress: "", // Not yet deployed on mainnet
        usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Native USDC on Base
        rpcUrl: "https://mainnet.base.org",
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
        escrowAddress: "", // set after local `deploy:escrow-local`
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
export var AgreementStatus;
(function (AgreementStatus) {
    AgreementStatus[AgreementStatus["Active"] = 0] = "Active";
    AgreementStatus[AgreementStatus["Completed"] = 1] = "Completed";
    AgreementStatus[AgreementStatus["Refunded"] = 2] = "Refunded";
})(AgreementStatus || (AgreementStatus = {}));
/* ──────────────────────────── Error Classes ──────────────────────────── */
export class ZeusError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "ZeusError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class ZeusNotConnectedError extends ZeusError {
    constructor(message = "SDK is not connected. Call client.connect(network, signer) first.") {
        super(message, "NOT_CONNECTED");
        this.name = "ZeusNotConnectedError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class ZeusValidationError extends ZeusError {
    constructor(message, details) {
        super(message, "VALIDATION_ERROR", details);
        this.name = "ZeusValidationError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class ZeusTransactionError extends ZeusError {
    txHash;
    constructor(message, txHash, details) {
        super(message, "TRANSACTION_ERROR", details);
        this.txHash = txHash;
        this.name = "ZeusTransactionError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class ZeusContractError extends ZeusError {
    constructor(message, details) {
        super(message, "CONTRACT_ERROR", details);
        this.name = "ZeusContractError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=index.js.map