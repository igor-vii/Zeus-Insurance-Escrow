import { Signer, BigNumberish } from "ethers";
import { type EscrowAgreement, type CreateEscrowAgreementParams } from "../types/index.js";
export interface EscrowClientConfig {
    rpcUrl: string;
    signer?: Signer;
    escrowAddress: string;
}
/**
 * EscrowClient — low-level client for ZeusEscrowBOT (upgraded)
 * supporting Classic, Conditional, Recurring, and MultiSig escrow types.
 * Used by the OKX AI all-inclusive flow on X Layer (chainId 196).
 */
export declare class EscrowClient {
    private readonly cfg;
    private readonly provider;
    private readonly signer?;
    private readonly escrow;
    constructor(cfg: EscrowClientConfig);
    assertXLayer(): Promise<void>;
    createEscrowAgreement(params: CreateEscrowAgreementParams): Promise<bigint>;
    release(escrowId: BigNumberish): Promise<void>;
    refund(escrowId: BigNumberish): Promise<void>;
    sign(escrowId: BigNumberish): Promise<void>;
    dispute(escrowId: BigNumberish): Promise<void>;
    getEscrow(escrowId: BigNumberish): Promise<EscrowAgreement>;
    getSigners(escrowId: BigNumberish): Promise<string[]>;
}
export default EscrowClient;
//# sourceMappingURL=escrow-client.d.ts.map