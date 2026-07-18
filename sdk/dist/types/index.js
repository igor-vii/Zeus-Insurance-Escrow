"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeusContractError = exports.ZeusTransactionError = exports.ZeusValidationError = exports.ZeusNotConnectedError = exports.ZeusError = exports.AgreementStatus = exports.GetPolicySchema = exports.ClaimPayoutSchema = exports.CreatePolicySchema = exports.RequestRefundSchema = exports.ConfirmExecutionSchema = exports.DepositAndCreateAgreementSchema = exports.NETWORKS = exports.NetworkSchema = void 0;
const zod_1 = require("zod");
/* ──────────────────────────── Networks ──────────────────────────── */
exports.NetworkSchema = zod_1.z.enum([
    "mainnet",
    "base-sepolia",
    "sepolia",
    "localhost",
]);
exports.NETWORKS = {
    mainnet: {
        name: "mainnet",
        chainId: 1,
        escrowAddress: "", // not yet deployed on mainnet
        insuranceAddress: "",
        usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        rpcUrl: "https://eth.llamarpc.com",
    },
    "base-sepolia": {
        name: "base-sepolia",
        chainId: 84532,
        // Deployed 2026-07-18 — see contracts/scripts/deploy-escrow-bot.ts
        escrowAddress: "0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76",
        insuranceAddress: "", // ZeusInsuranceV2 not yet deployed on Base Sepolia
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
exports.DepositAndCreateAgreementSchema = zod_1.z.object({
    executor: zod_1.z.string().regex(ADDRESS_REGEX, "Invalid Ethereum address for executor"),
    amount: zod_1.z.bigint().positive("Amount must be a positive bigint (in token base units)"),
    timeout: zod_1.z
        .number()
        .int("Timeout must be an integer")
        .positive("Timeout must be positive (seconds)"),
});
exports.ConfirmExecutionSchema = zod_1.z.object({
    agreementId: zod_1.z
        .number()
        .int("Agreement ID must be an integer")
        .nonnegative("Agreement ID must be non-negative"),
    /** Arbitrary proof string (IPFS CID, tx hash, URL, etc.). Empty string is allowed. */
    proof: zod_1.z.string(),
});
exports.RequestRefundSchema = zod_1.z.object({
    agreementId: zod_1.z
        .number()
        .int("Agreement ID must be an integer")
        .nonnegative("Agreement ID must be non-negative"),
});
exports.CreatePolicySchema = zod_1.z.object({
    seller: zod_1.z.string().regex(ADDRESS_REGEX, "Invalid Ethereum address for seller"),
    amount: zod_1.z.bigint().positive("Amount must be a positive bigint (in token base units)"),
    timeout: zod_1.z
        .number()
        .int("Timeout must be an integer")
        .positive("Timeout must be positive (seconds)"),
    retries: zod_1.z
        .number()
        .int("Retries must be an integer")
        .nonnegative("Retries must be non-negative"),
});
exports.ClaimPayoutSchema = zod_1.z.object({
    policyId: zod_1.z
        .number()
        .int("Policy ID must be an integer")
        .nonnegative("Policy ID must be non-negative"),
});
exports.GetPolicySchema = zod_1.z.object({
    policyId: zod_1.z
        .number()
        .int("Policy ID must be an integer")
        .nonnegative("Policy ID must be non-negative"),
});
/* ──────────────────────────── Domain Types ──────────────────────────── */
/**
 * Mirrors ZeusEscrowBOT.AgreementStatus on-chain enum.
 */
var AgreementStatus;
(function (AgreementStatus) {
    AgreementStatus[AgreementStatus["Active"] = 0] = "Active";
    AgreementStatus[AgreementStatus["Completed"] = 1] = "Completed";
    AgreementStatus[AgreementStatus["Refunded"] = 2] = "Refunded";
})(AgreementStatus || (exports.AgreementStatus = AgreementStatus = {}));
/* ──────────────────────────── Error Classes ──────────────────────────── */
class ZeusError extends Error {
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
exports.ZeusError = ZeusError;
class ZeusNotConnectedError extends ZeusError {
    constructor(message = "SDK is not connected. Call client.connect(network, signer) first.") {
        super(message, "NOT_CONNECTED");
        this.name = "ZeusNotConnectedError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ZeusNotConnectedError = ZeusNotConnectedError;
class ZeusValidationError extends ZeusError {
    constructor(message, details) {
        super(message, "VALIDATION_ERROR", details);
        this.name = "ZeusValidationError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ZeusValidationError = ZeusValidationError;
class ZeusTransactionError extends ZeusError {
    txHash;
    constructor(message, txHash, details) {
        super(message, "TRANSACTION_ERROR", details);
        this.txHash = txHash;
        this.name = "ZeusTransactionError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ZeusTransactionError = ZeusTransactionError;
class ZeusContractError extends ZeusError {
    constructor(message, details) {
        super(message, "CONTRACT_ERROR", details);
        this.name = "ZeusContractError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ZeusContractError = ZeusContractError;
//# sourceMappingURL=index.js.map