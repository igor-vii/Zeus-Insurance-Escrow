import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const BASE_SEPOLIA_RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const BASE_MAINNET_RPC_URL =
  process.env.BASE_MAINNET_RPC_URL ?? "https://mainnet.base.org";
const BASESCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY ?? process.env.BASESCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.27",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "cancun",   // required for OZ 5.x (mcopy opcode)
        },
      },
      {
        // ZeusEscrowBOT.sol — pinned to 0.8.24 for BOT Chain compatibility
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "cancun",   // required for OZ 5.x (mcopy opcode)
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 196, // X Layer chain ID — required for onlyXLayer modifier in tests
    },
    "base-sepolia": {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
    },
    "base-mainnet": {
      url: BASE_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  etherscan: {
    // Etherscan V2 unified API — requires an etherscan.io key (not basescan.org)
    apiKey: BASESCAN_API_KEY,
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=84532",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base-mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=8453",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
