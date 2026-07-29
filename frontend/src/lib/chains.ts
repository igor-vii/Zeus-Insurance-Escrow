import { defineChain } from "viem";
import { baseSepolia } from "wagmi/chains";

// ─── Custom chain definitions ─────────────────────────────────────────────────

export const xLayer = defineChain({
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
    public:  { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
  },
});

export const botChain = defineChain({
  id: 677,
  name: "BOT Chain Mainnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.botchain.ai"] },
    public:  { http: ["https://rpc.botchain.ai"] },
  },
  blockExplorers: {
    default: { name: "BOT Explorer", url: "https://explorer.botchain.ai" },
  },
});

// ─── Supported chains with per-chain contract addresses ───────────────────────

export interface ChainContracts {
  ZeusEscrowBOT:   string;
  ZeusInsuranceV2: string;
  ZeusReserveV2:   string;
  USDC:            string;
}

export interface SupportedChain {
  id: number;
  name: string;
  rpcUrl: string;
  contracts: ChainContracts;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    id: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    contracts: {
      ZeusEscrowBOT:   "0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76",
      ZeusInsuranceV2: "0x58038Df01A824C94F3D2fEd6d4e1bEf2211Ad8F4",
      ZeusReserveV2:   "0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47",
      USDC:            "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    },
  },
  {
    id: 196,
    name: "X Layer Mainnet",
    rpcUrl: "https://rpc.xlayer.tech",
    contracts: {
      ZeusEscrowBOT:   "0x0d4AD4C6b60F445d0e478E0AF48075340AC51Cf5",
      ZeusInsuranceV2: "0x8D10C2c6C92b613C1938fe532f0e391044e76188",
      ZeusReserveV2:   "0xadED902c2C6dD7D1B5b72A6a0A3358a9b9d4A79c",
      USDC:            "0x74b7f16337b8972027f6196a17a631ac6de26d22",
    },
  },
  {
    id: 677,
    name: "BOT Chain Mainnet",
    rpcUrl: "https://rpc.botchain.ai",
    contracts: {
      ZeusEscrowBOT:   "0x0d4AD4C6b60F445d0e478E0AF48075340AC51Cf5",
      ZeusInsuranceV2: "0x8D10C2c6C92b613C1938fe532f0e391044e76188",
      ZeusReserveV2:   "0xadED902c2C6dD7D1B5b72A6a0A3358a9b9d4A79c",
      USDC:            "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
    },
  },
];

/** Default network — X Layer Mainnet */
export const DEFAULT_CHAIN = SUPPORTED_CHAINS.find((c) => c.id === 196)!;

/** Chain IDs accepted by Zeus Insurance */
export const SUPPORTED_CHAIN_IDS = new Set(SUPPORTED_CHAINS.map((c) => c.id));

/** Resolve per-chain contract addresses. Falls back to DEFAULT_CHAIN if unsupported. */
export function getChainContracts(chainId: number): ChainContracts {
  return (
    SUPPORTED_CHAINS.find((c) => c.id === chainId)?.contracts ??
    DEFAULT_CHAIN.contracts
  );
}

/** Viem chain objects indexed by chain ID */
export const VIEM_CHAINS = {
  84532: baseSepolia,
  196:   xLayer,
  677:   botChain,
} as const;
