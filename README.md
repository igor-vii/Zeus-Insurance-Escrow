# ⚡ Zeus Insurance — Decentralized Insurance Protocol for AI Agents

**Zeus Insurance** protects AI agents and Web3 projects from financial losses caused by API failures, technical downtime, and oracle risks. It provides a trustless, on-chain guarantee: if a service fails, the buyer is automatically compensated from the reserve fund.

> 🔗 **Live app:** [zeus-insurance-v2.netlify.app](https://zeus-insurance-v2.netlify.app)  
> 📦 **Repo:** [github.com/igor-vii/Zeus-Insurance-Escrow](https://github.com/igor-vii/Zeus-Insurance-Escrow)

---

## 🎯 Problem & Solution

| Problem | Solution |
|---|---|
| AI agents lose money on failed API calls | On-chain policy guarantees automatic compensation |
| Refunds require trust in a third party | Smart contract escrow — fully trustless |
| No standard way for agents to pay for APIs | x402 protocol + ERC-8004 compatible payment flow |

---

## 💡 How It Works

```
Agent                   ZeusInsuranceV2          ZeusReserveV2
  │                           │                        │
  ├─ buyInsurance(seller, amount, timeout, retries) ──▶│
  │   (pays USDC premium)     │                        │
  │                           │◀── premium pooled ─────┤
  │                           │                        │
  │   [service fails / timeout expires]                │
  │                           │                        │
  ├─ claimPayout(policyId) ──▶│                        │
  │                           ├─ verify + pay ────────▶│
  │◀──────── USDC refund ──────────────────────────────┤
```

**Premium formula:** `premium = amount × (700 + (retries − 1) × 200) bps`

---

## 🔗 Live Contracts

### X Layer (OKX L2) — mainnet ✅
| Contract | Address | Explorer |
|---|---|---|
| **ZeusReserveV2** | `0xadED902c2C6dD7D1B5b72A6a0A3358a9b9d4A79c` | [OKLink ↗](https://www.oklink.com/xlayer/address/0xadED902c2C6dD7D1B5b72A6a0A3358a9b9d4A79c) |
| **ZeusInsuranceV2** | `0x8D10C2c6C92b613C1938fe532f0e391044e76188` | [OKLink ↗](https://www.oklink.com/xlayer/address/0x8D10C2c6C92b613C1938fe532f0e391044e76188) |
| **ZeusEscrowBOT** | `0x0d4AD4C6b60F445d0e478E0AF48075340AC51Cf5` | [OKLink ↗](https://www.oklink.com/xlayer/address/0x0d4AD4C6b60F445d0e478E0AF48075340AC51Cf5) |
| **USDC (X Layer)** | `0x74b7f16337b8972027f6196a17a631ac6de26d22` | — |

### Base Sepolia (testnet)
| Contract | Address | Explorer |
|---|---|---|
| **ZeusInsuranceV2** | `0x1d9D90d2652296A2c89E3802d45B1F2132b30076` | [BaseScan ↗](https://sepolia.basescan.org/address/0x1d9D90d2652296A2c89E3802d45B1F2132b30076) |
| **ZeusReserveV2** | `0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47` | [BaseScan ↗](https://sepolia.basescan.org/address/0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47) |
| **ZeusEscrowBOT** | `0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76` | [BaseScan ↗](https://sepolia.basescan.org/address/0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76) |
| **USDC (Base Sepolia)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | — |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.27, OpenZeppelin v5, Hardhat |
| Blockchain | **X Layer** (OKX L2), Base Sepolia / Base Mainnet |
| Token | USDC / OKB (6 decimals) |
| Frontend | React 18, wagmi v3, viem, Tailwind CSS |
| SDK | `@zeus/sdk` — ethers v6, ESM (NodeNext) |
| API Server | Express v5, TypeScript, viem, esbuild |
| AI Agent Payments | **x402** protocol (`x402-express`) |
| AI Integration | **OKX AI** — MCP tools, agent-native payment flow |
| Agent Standard | **ERC-8004** compatible |
| Runtime | Node.js 20, pnpm workspaces |

---

## 📦 Monorepo Structure

```
Zeus-Insurance-Escrow/
├── contracts/          # Hardhat — Solidity contracts + tests
│   └── scripts/
│       ├── deploy-all.ts           # Deploy all contracts (any network)
│       ├── deploy-insurance-v2.ts  # Deploy ZeusInsuranceV2 only
│       └── deploy-escrow-bot.ts    # Deploy ZeusEscrowBOT only
├── sdk/                # @zeus/sdk — TypeScript SDK (ESM)
├── api-server/         # Express REST API (port 8080)
├── watcher/            # Oracle watcher node
└── frontend/           # React app (port 5000)
```

---

## 🤖 @zeus/sdk — JavaScript SDK

Install in your agent or dApp:

```bash
npm install @zeus/sdk ethers
```

### Buy a policy

```typescript
import { ZeusSDK } from "@zeus/sdk";
import { ethers } from "ethers";

const sdk = new ZeusSDK();
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

await sdk.connect("base-sepolia", signer);

// Creates policy — auto-approves USDC internally
await sdk.insurance.createPolicy(
  "0xSellerAddress",   // seller
  5_000_000n,          // 5 USDC (6 decimals)
  86_400,              // 24h timeout
  3,                   // max retries
);
```

### Claim a payout

```typescript
await sdk.insurance.claimPayout(policyId);
```

### Read a policy

```typescript
const policy = await sdk.insurance.getPolicy(policyId);
console.log(policy.isPaidOut, policy.amount.toString());
```

---

## 🌐 REST API

Base URL: `https://<your-replit-domain>/api`

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/quote` | — | Calculate premium for given amount + retries |
| `POST` | `/insurance/prepare-buy` | **x402** | Prepare `buyInsurance` calldata |
| `GET` | `/insurance/policies?buyer=` | — | List policies for an address |
| `GET` | `/insurance/policies/:id` | — | Get single policy |
| `POST` | `/insurance/claim` | — | Prepare `claimPayout` calldata |
| `GET` | `/insurance/reserve` | — | Reserve fund status |
| `GET` | `/x402/info` | — | x402 payment terms discovery |

### x402 — AI Agent Payment Flow (ERC-8004)

`POST /api/insurance/prepare-buy` requires a **0.001 USDC** x402 payment (Base Sepolia).

**Step 1 — Discover payment terms:**
```bash
curl https://<api>/api/x402/info
# → { "network": "base-sepolia", "asset": "0x036C...", "payTo": "0x...", ... }
```

**Step 2 — Call the protected endpoint (agent pays via x402 header):**
```bash
curl -X POST https://<api>/api/insurance/prepare-buy \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: <x402-payment-header>" \
  -d '{"seller":"0xSeller","amount":"5000000","timeoutSeconds":86400,"maxRetries":3}'
# → { "to": "0x1d9D...", "data": "0x...", "premiumAmount": "350000" }
```

**Step 3 — Agent submits the transaction on-chain using the returned calldata.**

> Facilitator: [x402.org/facilitator](https://x402.org/facilitator) (Coinbase, testnet free)

---

## 🤖 MCP Server — AI Agent Integration

The API server exposes a **Model Context Protocol (MCP)** endpoint over Streamable HTTP, enabling any MCP-compatible agent (Claude, GPT-4, custom agents) to interact with the Zeus protocol natively — no custom integration code required.

### Endpoint

```
POST https://api.zeus-insurance.com/mcp
```

Required headers: `Content-Type: application/json`, `Accept: application/json, text/event-stream`

### 7 Available Tools

| Tool | Description |
|---|---|
| `insurance_quote` | Dynamic premium quote — returns risk score + USDC premium |
| `insurance_prepare_buy` | Calldata for `buyInsurance` (agent signs + broadcasts) |
| `insurance_claim` | Calldata for `claimPayout` (buyer signs + broadcasts) |
| `insurance_get_policies` | List all policies for a buyer (cache → chain fallback) |
| `insurance_reserve_stats` | Reserve fund balance, thresholds, funding adequacy |
| `escrow_prepare_deposit` | Calldata to create an escrow agreement on-chain |
| `escrow_prepare_confirm` | Calldata to confirm execution and release escrow funds |

### Quick Example

```bash
# Get a price quote via MCP
curl -X POST https://api.zeus-insurance.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: agent-1" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": "1",
    "params": {
      "name": "insurance_quote",
      "arguments": { "seller": "0xSELLER", "amount": "5000000", "maxRetries": 3 }
    }
  }'
# → { "riskScore": 1.25, "premiumAmount": "75000" }
```

### Claude Desktop Integration

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "zeus-insurance": {
      "url": "https://api.zeus-insurance.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

> Full MCP documentation: [`api-server/README.md`](./api-server/README.md)

---

## 🚀 Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
git clone https://github.com/igor-vii/Zeus-Insurance-Escrow.git
cd Zeus-Insurance-Escrow
pnpm install
```

### Run

```bash
# API server (port 8080)
cd api-server && pnpm dev

# Frontend (port 5000)
cd frontend && pnpm dev

# Build SDK
cd sdk && pnpm build
```

### Environment variables

| Variable | Where | Description |
|---|---|---|
| `PRIVATE_KEY` | `contracts/.env` | Deployer wallet private key |
| `USDC_ADDRESS` | `contracts/.env` | USDC (or stablecoin) address on target network |
| `TOKEN_ADDRESS` | `contracts/.env` | ERC-20 token for ZeusEscrowBOT |
| `TREASURY_ADDRESS` | `contracts/.env` | Fee recipient for escrow (defaults to deployer) |
| `ETHERSCAN_API_KEY` | `contracts/.env` | For Base contract verification |
| `OKLINK_API_KEY` | `contracts/.env` | For X Layer contract verification |
| `XLAYER_MAINNET_RPC_URL` | `contracts/.env` | X Layer RPC (default: `https://rpc.xlayer.tech`) |
| `SESSION_SECRET` | API server secret | Cookie signing |
| `ZEUS_TREASURY` | API server env var | Wallet receiving x402 fees |

### Compile & test contracts

```bash
cd contracts
npx hardhat compile
npx hardhat test        # 96 tests, all passing
```

### Deploy to X Layer

```bash
cd contracts
PRIVATE_KEY=0x... \
USDC_ADDRESS=0x... \
TOKEN_ADDRESS=0x... \
npx hardhat run scripts/deploy-all.ts --network xlayer
```

### Deploy to Base Sepolia

```bash
PRIVATE_KEY=0x... \
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e \
npx hardhat run scripts/deploy-all.ts --network base-sepolia
```

---

## 🔐 Escrow Types

Zeus supports multiple escrow modes through **ZeusEscrowBOT**:

| Type | Description |
|---|---|
| **Standard escrow** | Initiator locks tokens; executor claims on `confirmExecution()` |
| **Timeout refund** | Initiator reclaims funds after deadline if executor doesn't confirm |
| **All-inclusive** | Deploy with `deploy-all.ts` — Reserve + Insurance + Escrow in one transaction sequence |
| **AI agent escrow** | Agent acts as initiator or executor; proof bytes carry signed off-chain attestations |

Proof bytes in `confirmExecution(agreementId, proof)` are opaque — store any signed attestation, job receipt, or MCP tool result hash as evidence of work completion.

---

## 🤖 OKX AI Integration

Zeus is natively compatible with **OKX AI** agents via MCP and the x402 payment protocol:

- **MCP tools** (`insurance_quote`, `insurance_prepare_buy`, `escrow_prepare_deposit`, …) let OKX AI agents purchase coverage and create escrow agreements in a single tool call.
- **x402 payment header** allows agents to pay API fees autonomously in USDC — no wallet pop-ups, no human approval.
- **X Layer deployment** brings ultra-low fees (< $0.001 per transaction) and OKB-native settlement, ideal for high-frequency AI agent workflows.

```bash
# OKX AI agent buys insurance via MCP in one call
curl -X POST https://api.zeus-insurance.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0", "method": "tools/call", "id": "1",
    "params": {
      "name": "insurance_prepare_buy",
      "arguments": {
        "seller": "0xOKX_API_SELLER",
        "amount": "5000000",
        "timeoutSeconds": 86400,
        "maxRetries": 3
      }
    }
  }'
```

---

## 🗺️ Roadmap

| Phase | Status | Goal |
|---|---|---|
| Smart Contracts | ✅ Done | ZeusInsuranceV2 + ZeusReserveV2 on Base Sepolia |
| Frontend | ✅ Done | React app — buy, claim, dashboard |
| SDK | ✅ Done | `@zeus/sdk` — ESM, ethers v6, insurance + escrow |
| REST API | ✅ Done | Express server with caching + event listener |
| x402 Integration | ✅ Done | AI agents pay per API call in USDC |
| OKX AI / MCP | ✅ Done | MCP server with 7 tools, OKX AI compatible |
| X Layer Support | ✅ Done | Hardhat config + `deploy-all.ts` for X Layer L2 |
| X Layer Mainnet | ✅ Done | Reserve + Insurance + Escrow live on X Layer |
| All-inclusive Deploy | ✅ Done | One-script deploy: Reserve + Insurance + Escrow |
| ERC-8004 | 🔜 Next | Full on-chain agent payment interface compliance |
| Base Mainnet | 🔜 Next | Deploy to Base Mainnet |
| X Layer Mainnet | 🔜 Next | Live deployment on X Layer with OKB settlement |
| Audit | 🔜 Next | Security audit of core contracts |

---

## 🤝 Contributing

Fork the repo, create a feature branch, submit a Pull Request.  
Please run `pnpm typecheck` in `api-server/` and `frontend/` before submitting.

---

## 📞 Contacts

- **Telegram:** [@IvanovVII](https://t.me/IvanovVII)
- **GitHub:** [igor-vii/Zeus-Insurance-Escrow](https://github.com/igor-vii/Zeus-Insurance-Escrow)
- **Email:** zeusinsurance@mail.ru

---

## 📄 License

MIT © 2026 Zeus Insurance Team

---

*Built for AI agents. Powered by smart contracts. Protected by Zeus. ⚡*
