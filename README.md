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

## 🔗 Live Contracts — Base Sepolia

| Contract | Address | Explorer |
|---|---|---|
| **ZeusInsuranceV2** | `0x1d9D90d2652296A2c89E3802d45B1F2132b30076` | [BaseScan ↗](https://sepolia.basescan.org/address/0x1d9D90d2652296A2c89E3802d45B1F2132b30076) |
| **ZeusReserveV2** | `0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47` | [BaseScan ↗](https://sepolia.basescan.org/address/0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47) |
| **USDC (Base Sepolia)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | — |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24, OpenZeppelin v5, Hardhat |
| Blockchain | Base Sepolia (L2 on Ethereum) |
| Token | USDC (6 decimals) |
| Frontend | React 18, wagmi v3, viem, Tailwind CSS |
| SDK | `@zeus/sdk` — ethers v6, ESM (NodeNext) |
| API Server | Express v5, TypeScript, viem, esbuild |
| AI Agent Payments | **x402** protocol (`x402-express`) |
| Agent Standard | **ERC-8004** compatible |
| Runtime | Node.js 20, pnpm workspaces |

---

## 📦 Monorepo Structure

```
Zeus-Insurance-Escrow/
├── contracts/          # Hardhat — Solidity contracts + tests
├── sdk/                # @zeus/sdk — TypeScript SDK (ESM)
├── api-server/         # Express REST API (port 8080)
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
| `BASESCAN_API_KEY` | `contracts/.env` | For contract verification |
| `SESSION_SECRET` | API server secret | Cookie signing |
| `ZEUS_TREASURY` | API server env var | Wallet receiving x402 fees |

### Compile & test contracts

```bash
cd contracts
pnpm install
npx hardhat compile
npx hardhat test        # 30+ tests
npx hardhat run scripts/deploy-v2.js --network baseSepolia
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
| ERC-8004 | 🔜 Next | Full on-chain agent payment interface compliance |
| Mainnet | 🔜 Next | Deploy to Base Mainnet |
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
