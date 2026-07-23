import { ethers, Contract, Signer, BigNumberish } from "ethers";
import { XLAYER_CHAIN_ID, EscrowType, EscrowStatus, type EscrowAgreement, type CreateEscrowAgreementParams } from "../types/index.js";

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
export class EscrowClient {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly signer?: Signer;
  private readonly escrow: Contract;

  constructor(private readonly cfg: EscrowClientConfig) {
    this.provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    this.signer = cfg.signer;
    this.escrow = new Contract(cfg.escrowAddress, [
      "function createClassicEscrow(address,uint256,uint256) payable returns (uint256)",
      "function createConditionalEscrow(address,uint256,uint256,bytes32) payable returns (uint256)",
      "function createRecurringEscrow(address,uint256,uint256,uint256) payable returns (uint256)",
      "function createMultiSigEscrow(address,uint256,uint256,address[],uint256) payable returns (uint256)",
      "function release(uint256)",
      "function refund(uint256)",
      "function sign(uint256)",
      "function dispute(uint256)",
      "function resolveCondition(uint256,bool,bytes32)",
      "function getEscrow(uint256) view returns (tuple(address,address,address,uint256,uint256,uint8,bytes32,uint256,uint256,uint8,uint256,uint256,uint256))",
      "function getSigners(uint256) view returns (address[])",
      "function currentEscrowId() view returns (uint256)",
    ], this.signer ?? this.provider);
  }

  public async assertXLayer(): Promise<void> {
    const net = await this.provider.getNetwork();
    if (Number(net.chainId) !== XLAYER_CHAIN_ID) {
      throw new Error(`Expected X Layer (${XLAYER_CHAIN_ID}), got ${net.chainId}`);
    }
  }

  public async createEscrowAgreement(params: CreateEscrowAgreementParams): Promise<bigint> {
    await this.assertXLayer();
    if (!this.signer) throw new Error("Signer required");
    const amount = BigInt(params.amount);
    let tx: any;

    switch (params.escrowType) {
      case EscrowType.Classic:
        tx = await this.escrow.createClassicEscrow(params.executor, amount, params.timeoutSeconds, { value: amount });
        break;
      case EscrowType.Conditional:
        if (!params.conditionHash) throw new Error("conditionHash required for Conditional escrow");
        tx = await this.escrow.createConditionalEscrow(
          params.executor, amount, params.timeoutSeconds, params.conditionHash, { value: amount }
        );
        break;
      case EscrowType.Recurring:
        if (!params.intervalSeconds) throw new Error("intervalSeconds required for Recurring escrow");
        tx = await this.escrow.createRecurringEscrow(
          params.executor, amount, params.timeoutSeconds, params.intervalSeconds, { value: amount }
        );
        break;
      case EscrowType.MultiSig:
        if (!params.signers?.length || !params.requiredSignatures) {
          throw new Error("signers and requiredSignatures required for MultiSig escrow");
        }
        tx = await this.escrow.createMultiSigEscrow(
          params.executor, amount, params.timeoutSeconds, params.signers, params.requiredSignatures, { value: amount }
        );
        break;
      default:
        throw new Error(`Unknown escrow type ${params.escrowType}`);
    }

    const receipt = await tx.wait();
    const evt = receipt.logs
      .map((log: any) => {
        try { return this.escrow.interface.parseLog(log); } catch { return null; }
      })
      .find((e: any) => e && e.name === "EscrowCreated");
    if (!evt) throw new Error("EscrowCreated event not found");
    return BigInt(evt.args.escrowId);
  }

  public async release(escrowId: BigNumberish): Promise<void> {
    const tx = await this.escrow.release(escrowId);
    await tx.wait();
  }

  public async refund(escrowId: BigNumberish): Promise<void> {
    const tx = await this.escrow.refund(escrowId);
    await tx.wait();
  }

  public async sign(escrowId: BigNumberish): Promise<void> {
    const tx = await this.escrow.sign(escrowId);
    await tx.wait();
  }

  public async dispute(escrowId: BigNumberish): Promise<void> {
    const tx = await this.escrow.dispute(escrowId);
    await tx.wait();
  }

  public async getEscrow(escrowId: BigNumberish): Promise<EscrowAgreement> {
    const raw = await this.escrow.getEscrow(escrowId);
    return {
      buyer: raw[0],
      executor: raw[1],
      token: raw[2],
      amount: BigInt(raw[3]),
      timeout: BigInt(raw[4]),
      escrowType: Number(raw[5]) as EscrowType,
      conditionHash: raw[6],
      interval: BigInt(raw[7]),
      requiredSignatures: BigInt(raw[8]),
      status: Number(raw[9]) as EscrowStatus,
      createdAt: BigInt(raw[10]),
      lastReleasedAt: BigInt(raw[11]),
      signaturesCount: BigInt(raw[12]),
    };
  }

  public async getSigners(escrowId: BigNumberish): Promise<string[]> {
    return await this.escrow.getSigners(escrowId);
  }
}

export default EscrowClient;
