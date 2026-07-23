import { ethers, Contract, Signer, BigNumberish } from "ethers";
import { XLAYER_CHAIN_ID, ALL_INCLUSIVE_MASK, CoverageType, type Policy, type ArbPolicy, type CreatePolicyParams, type CreateAllInclusivePolicyParams } from "../types/index.js";

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
export class InsuranceClient {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly signer?: Signer;
  private readonly insurance: Contract;
  private readonly arbitration: Contract;

  constructor(private readonly cfg: InsuranceClientConfig) {
    this.provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    this.signer = cfg.signer;
    this.insurance = new Contract(cfg.insuranceV2Address, [
      "function buyPolicy(address,uint256,uint256,uint256,string) payable",
      "function buyAllInclusivePolicy(address,uint256,uint256,string) payable",
      "function quote(uint256,address,uint256) view returns (uint256)",
      "function getPolicy(uint256) view returns (tuple(address,address,uint256,uint256,uint256,uint256,uint8,string))",
      "function setPenaltyScore(address,uint256)",
    ], this.signer ?? this.provider);
    this.arbitration = new Contract(cfg.arbitrationAddress, [
      "function buyArbitrationInsurance(uint256,bytes32,uint256) payable",
      "function quote(uint256) pure returns (uint256)",
      "function getPolicy(uint256) view returns (tuple(address,uint256,uint256,bytes32,uint256,uint8,string))",
    ], this.signer ?? this.provider);
  }

  public async assertXLayer(): Promise<void> {
    const net = await this.provider.getNetwork();
    if (Number(net.chainId) !== XLAYER_CHAIN_ID) {
      throw new Error(`Expected X Layer (chainId ${XLAYER_CHAIN_ID}), got ${net.chainId}`);
    }
  }

  public async quote(coverageMask: number, agent: string, amount: BigNumberish): Promise<bigint> {
    return BigInt(await this.insurance.quote.staticCall(coverageMask, agent, amount));
  }

  public async createPolicy(params: CreatePolicyParams): Promise<bigint> {
    await this.assertXLayer();
    if (!this.signer) throw new Error("Signer required to create policy");
    const premium = await this.quote(params.coverageMask, await this.signer.getAddress(), params.amount);
    const tx = await this.insurance.buyPolicy(
      params.seller,
      params.amount,
      params.coverageMask,
      params.timeoutSeconds,
      params.metadata ?? "",
      { value: premium }
    );
    const receipt = await tx.wait();
    const evt = receipt.logs
      .map((log: any) => {
        try { return this.insurance.interface.parseLog(log); } catch { return null; }
      })
      .find((e: any) => e && e.name === "PolicyCreated");
    if (!evt) throw new Error("PolicyCreated event not found");
    return BigInt(evt.args.policyId);
  }

  public async createAllInclusivePolicy(params: CreateAllInclusivePolicyParams): Promise<bigint> {
    await this.assertXLayer();
    if (!this.signer) throw new Error("Signer required");
    const premium = await this.quote(ALL_INCLUSIVE_MASK, await this.signer.getAddress(), params.amount);
    const tx = await this.insurance.buyAllInclusivePolicy(
      params.seller,
      params.amount,
      params.timeoutSeconds,
      params.metadata ?? "",
      { value: premium }
    );
    const receipt = await tx.wait();
    const evt = receipt.logs
      .map((log: any) => {
        try { return this.insurance.interface.parseLog(log); } catch { return null; }
      })
      .find((e: any) => e && e.name === "PolicyCreated");
    if (!evt) throw new Error("PolicyCreated event not found");
    return BigInt(evt.args.policyId);
  }

  public async buyArbitrationInsurance(amount: BigNumberish, caseId: string, timeoutSeconds: number): Promise<bigint> {
    await this.assertXLayer();
    if (!this.signer) throw new Error("Signer required");
    const premium = BigInt(await this.arbitration.quote.staticCall(amount));
    const tx = await this.arbitration.buyArbitrationInsurance(amount, caseId, timeoutSeconds, { value: premium });
    const receipt = await tx.wait();
    const evt = receipt.logs
      .map((log: any) => {
        try { return this.arbitration.interface.parseLog(log); } catch { return null; }
      })
      .find((e: any) => e && e.name === "ArbitrationPolicyPurchased");
    if (!evt) throw new Error("ArbitrationPolicyPurchased event not found");
    return BigInt(evt.args.policyId);
  }

  public async getPolicy(policyId: BigNumberish): Promise<Policy> {
    const raw = await this.insurance.getPolicy(policyId);
    return {
      buyer: raw[0],
      seller: raw[1],
      amount: BigInt(raw[2]),
      premium: BigInt(raw[3]),
      timeout: BigInt(raw[4]),
      coverageMask: BigInt(raw[5]),
      status: Number(raw[6]),
      metadata: raw[7],
    };
  }

  public static buildMask(types: CoverageType[]): number {
    return types.reduce((acc, t) => acc | (1 << t), 0);
  }

  public static hasCoverage(mask: number, type: CoverageType): boolean {
    return (mask & (1 << type)) !== 0;
  }

  public async getArbitrationPolicy(policyId: BigNumberish): Promise<ArbPolicy> {
    const raw = await this.arbitration.getPolicy(policyId);
    return {
      buyer: raw[0],
      amount: BigInt(raw[1]),
      premium: BigInt(raw[2]),
      caseId: raw[3],
      timeout: BigInt(raw[4]),
      status: Number(raw[5]),
      metadata: raw[6],
    };
  }
}

export default InsuranceClient;
