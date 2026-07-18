"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeusClient = void 0;
const ethers_1 = require("ethers");
const index_js_1 = require("../types/index.js");
class ZeusClient {
    _signer = null;
    _provider = null;
    _network = null;
    _address = null;
    /**
     * Connect to a network with a signer.
     * @param network  One of "mainnet" | "base-sepolia" | "sepolia" | "localhost"
     * @param signer   ethers v6 Signer (wallet, injected provider, etc.)
     */
    async connect(network, signer) {
        if (!(network in index_js_1.NETWORKS)) {
            throw new index_js_1.ZeusValidationError(`Unknown network "${network}". Supported networks: ${Object.keys(index_js_1.NETWORKS).join(", ")}`);
        }
        const networkConfig = index_js_1.NETWORKS[network];
        if (!signer || typeof signer.getAddress !== "function") {
            throw new index_js_1.ZeusValidationError("Invalid signer: must be an ethers v6 Signer with a getAddress() method.");
        }
        const provider = signer.provider
            ? signer.provider
            : networkConfig.rpcUrl
                ? new ethers_1.JsonRpcProvider(networkConfig.rpcUrl)
                : null;
        let address;
        try {
            address = await signer.getAddress();
        }
        catch (err) {
            throw new index_js_1.ZeusError(`Failed to retrieve address from signer: ${err.message}`, "SIGNER_ERROR", err);
        }
        this._network = networkConfig;
        this._signer = signer;
        this._provider = provider;
        this._address = address;
    }
    isReady() {
        return this._signer !== null && this._network !== null && this._address !== null;
    }
    getAddress() {
        if (!this._address)
            throw new index_js_1.ZeusNotConnectedError();
        return this._address;
    }
    getNetwork() {
        if (!this._network)
            throw new index_js_1.ZeusNotConnectedError();
        return this._network;
    }
    getSigner() {
        if (!this._signer)
            throw new index_js_1.ZeusNotConnectedError();
        return this._signer;
    }
    getProvider() {
        return this._provider;
    }
    getRunner() {
        if (!this._signer)
            throw new index_js_1.ZeusNotConnectedError();
        return this._signer;
    }
    disconnect() {
        this._signer = null;
        this._provider = null;
        this._network = null;
        this._address = null;
    }
}
exports.ZeusClient = ZeusClient;
//# sourceMappingURL=client.js.map