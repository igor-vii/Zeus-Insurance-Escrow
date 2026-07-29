import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { xLayer, botChain } from "@/lib/chains";

/**
 * WalletConnect v2 requires a projectId from https://cloud.walletconnect.com
 * Set VITE_WALLETCONNECT_PROJECT_ID in your .env to enable it.
 * Without it, Injected + Coinbase Wallet still work fine.
 */
const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({ appName: "Zeus Insurance", appLogoUrl: "/favicon.svg" }),
  ...(wcProjectId
    ? [walletConnect({ projectId: wcProjectId, metadata: {
        name: "Zeus Insurance",
        description: "Decentralized insurance for AI agent payments",
        url: "https://zeus-insurance-v2.netlify.app",
        icons: ["https://zeus-insurance-v2.netlify.app/favicon.svg"],
      }})]
    : []),
];

export const wagmiConfig = createConfig({
  // X Layer Mainnet is the primary/default chain; Base Sepolia and BOT Chain also supported
  chains: [xLayer, botChain, baseSepolia],
  connectors,
  transports: {
    [xLayer.id]:       http("https://rpc.xlayer.tech"),
    [botChain.id]:     http("https://rpc.botchain.ai"),
    [baseSepolia.id]:  http("https://sepolia.base.org"),
  },
});
