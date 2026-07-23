import { Signer, BigNumberish } from "ethers";
import { CoverageType, type Policy, type ArbPolicy, type CreatePolicyParams, type CreateAllInclusivePolicyParams } from "../types/index.js";
export interface InsuranceClientConfig {
    rpcUrl: string;
    signer?: Signer;
    insuranceV2Address: string;
    arbitrationAddress: string;
}
/**
 * InsuranceClient — low-level client for ZeusInsuranceV2 + ZeusArbitrationRisk
 * on X Layer (chainId 196). Used by the OKX AI all-inclusive flow.
 */
export declare class InsuranceClient {
    private readonly cfg;
    private readonly provider;
    private readonly signer?;
    private readonly insurance;
    private readonly arbitration;
    constructor(cfg: InsuranceClientConfig);
    assertXLayer(): Promise<void>;
    quote(coverageMask: number, agent: string, amount: BigNumberish): Promise<bigint>;
    createPolicy(params: CreatePolicyParams): Promise<bigint>;
    createAllInclusivePolicy(params: CreateAllInclusivePolicyParams): Promise<bigint>;
    buyArbitrationInsurance(amount: BigNumberish, caseId: string, timeoutSeconds: number): Promise<bigint>;
    getPolicy(policyId: BigNumberish): Promise<Policy>;
    static buildMask(types: CoverageType[]): number;
    static hasCoverage(mask: number, type: CoverageType): boolean;
    getArbitrationPolicy(policyId: BigNumberish): Promise<ArbPolicy>;
}
export default InsuranceClient;
//# sourceMappingURL=insurance-client.d.ts.map