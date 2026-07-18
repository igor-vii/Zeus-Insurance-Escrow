"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeusContractError = exports.ZeusTransactionError = exports.ZeusValidationError = exports.ZeusNotConnectedError = exports.ZeusError = exports.AgreementStatus = exports.GetPolicySchema = exports.ClaimPayoutSchema = exports.CreatePolicySchema = exports.RequestRefundSchema = exports.ConfirmExecutionSchema = exports.DepositAndCreateAgreementSchema = exports.NETWORKS = exports.NetworkSchema = exports.ZeusInsurance = exports.ZeusEscrow = exports.ZeusClient = exports.ZeusSDK = void 0;
const client_js_1 = require("./core/client.js");
const escrow_js_1 = require("./core/escrow.js");
const insurance_js_1 = require("./core/insurance.js");
/**
 * ZeusSDK — unified entry point for the Zeus Insurance Protocol.
 *
 * @example
 * ```ts
 * import { ZeusSDK } from "@zeus/sdk";
 * import { ethers } from "ethers";
 *
 * const sdk = new ZeusSDK();
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 *
 * await sdk.connect("base-sepolia", signer);
 *
 * // Create an escrow agreement (approve USDC first)
 * const { agreementId } = await sdk.escrow.depositAndCreateAgreement(
 *   "0xExecutorAddress",
 *   1_000_000n,   // 1 USDC (6 decimals)
 *   86_400,        // 1 day timeout
 * );
 *
 * // Executor confirms with on-chain proof
 * await sdk.escrow.confirmExecution(agreementId, "ipfs://Qm...");
 * ```
 */
class ZeusSDK {
    client;
    escrow;
    insurance;
    constructor() {
        this.client = new client_js_1.ZeusClient();
        this.escrow = new escrow_js_1.ZeusEscrow(this.client);
        this.insurance = new insurance_js_1.ZeusInsurance(this.client);
    }
    /** Connect to a supported network with an ethers v6 Signer. */
    async connect(network, signer) {
        await this.client.connect(network, signer);
    }
    isReady() {
        return this.client.isReady();
    }
    disconnect() {
        this.client.disconnect();
    }
}
exports.ZeusSDK = ZeusSDK;
var client_js_2 = require("./core/client.js");
Object.defineProperty(exports, "ZeusClient", { enumerable: true, get: function () { return client_js_2.ZeusClient; } });
var escrow_js_2 = require("./core/escrow.js");
Object.defineProperty(exports, "ZeusEscrow", { enumerable: true, get: function () { return escrow_js_2.ZeusEscrow; } });
var insurance_js_2 = require("./core/insurance.js");
Object.defineProperty(exports, "ZeusInsurance", { enumerable: true, get: function () { return insurance_js_2.ZeusInsurance; } });
var index_js_1 = require("./types/index.js");
Object.defineProperty(exports, "NetworkSchema", { enumerable: true, get: function () { return index_js_1.NetworkSchema; } });
Object.defineProperty(exports, "NETWORKS", { enumerable: true, get: function () { return index_js_1.NETWORKS; } });
Object.defineProperty(exports, "DepositAndCreateAgreementSchema", { enumerable: true, get: function () { return index_js_1.DepositAndCreateAgreementSchema; } });
Object.defineProperty(exports, "ConfirmExecutionSchema", { enumerable: true, get: function () { return index_js_1.ConfirmExecutionSchema; } });
Object.defineProperty(exports, "RequestRefundSchema", { enumerable: true, get: function () { return index_js_1.RequestRefundSchema; } });
Object.defineProperty(exports, "CreatePolicySchema", { enumerable: true, get: function () { return index_js_1.CreatePolicySchema; } });
Object.defineProperty(exports, "ClaimPayoutSchema", { enumerable: true, get: function () { return index_js_1.ClaimPayoutSchema; } });
Object.defineProperty(exports, "GetPolicySchema", { enumerable: true, get: function () { return index_js_1.GetPolicySchema; } });
Object.defineProperty(exports, "AgreementStatus", { enumerable: true, get: function () { return index_js_1.AgreementStatus; } });
Object.defineProperty(exports, "ZeusError", { enumerable: true, get: function () { return index_js_1.ZeusError; } });
Object.defineProperty(exports, "ZeusNotConnectedError", { enumerable: true, get: function () { return index_js_1.ZeusNotConnectedError; } });
Object.defineProperty(exports, "ZeusValidationError", { enumerable: true, get: function () { return index_js_1.ZeusValidationError; } });
Object.defineProperty(exports, "ZeusTransactionError", { enumerable: true, get: function () { return index_js_1.ZeusTransactionError; } });
Object.defineProperty(exports, "ZeusContractError", { enumerable: true, get: function () { return index_js_1.ZeusContractError; } });
//# sourceMappingURL=index.js.map