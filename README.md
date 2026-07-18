# ⚡ Zeus Insurance V2 – Decentralized Insurance Protocol for AI Agents

**Zeus Insurance** protects AI agents and Web3 projects from financial losses caused by API failures, technical downtime, and oracle risks. It provides a trustless, on-chain guarantee that if a service fails, the user is compensated.

---

## 🎯 The Problem & Solution

- **Problem**: AI agents and dApps lose money on failed API calls, unreliable oracles, and technical downtimes. Refunds are slow and require trust.
- **Solution**: Zeus Insurance offers a decentralized, transparent insurance layer. Users pay a premium, and if the service fails, they are automatically compensated from the reserve fund.

---

## 💡 How It Works

1.  **Buy Insurance**: The buyer pays a premium to insure a transaction or service call.
2.  **Service Fails**: If the seller doesn't deliver within the agreed timeout, the buyer becomes eligible for compensation.
3.  **Claim Payout**: The protocol automatically pays the compensation from the reserve fund (`ZeusReserveV2`).

**Key Features:**
- Fully on-chain, transparent, and auditable.
- Smart contract escrow ensures trustless execution.
- Premiums are pooled in a separate, secure reserve fund.
- No central authority – governed entirely by smart contracts.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| Smart Contracts | Solidity 0.8.24, OpenZeppelin v5 |
| Testnet | Base Sepolia (L2 on Ethereum) |
| Token | USDC (6 decimals) |
| Frontend | React, ethers.js, Tailwind CSS |
| Development | Hardhat, TypeScript, pnpm |
| Hosting | Replit / GitHub Codespaces / Netlify |

---

## 🔗 Live Contracts (Base Sepolia)

| Contract | Address | BaseScan |
| :--- | :--- | :--- |
| **ZeusInsuranceV2** | `0xE0b89E0DEa7Fc7AEa7CEcC62a0A14d52de42Ce3b` | [View](https://sepolia.basescan.org/address/0xE0b89E0DEa7Fc7AEa7CEcC62a0A14d52de42Ce3b) |
| **ZeusReserveV2** | `0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47` | [View](https://sepolia.basescan.org/address/0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47) |
| **USDC (Base Sepolia)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | - |

---

## 🏦 Reserve Fund

The protocol's security is underpinned by the `ZeusReserveV2` contract, which:

- Holds USDC and manages all payouts.
- Enforces a daily payout limit and a minimum reserve threshold.
- Can be paused in case of emergency.
- Is designed to be auditable and transparent.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/igor-vii/Zeus-insurance-v2.1.git
cd Zeus-insurance-v2.1
2. Install Dependencies
bash
cd contracts
npm install
3. Set Up Environment
Create a .env file in the contracts folder:

env
PRIVATE_KEY=0xyour_private_key
4. Compile Contracts
bash
npx hardhat compile
5. Run Tests
All 30+ tests should pass:

bash
npx hardhat test
6. Deploy to Base Sepolia
bash
npx hardhat run scripts/deploy-v2.js --network baseSepolia
🖥️ Frontend
The frontend interface allows users to connect their wallet, buy insurance, view policies, and submit claims. To run it locally:

bash
cd frontend
npm install
npm run dev
Open http://localhost:3000 in your browser.

📊 Testing the Full Flow
Fund the Reserve: Send USDC to the ZeusReserveV2 contract.

Buy Insurance: Use the frontend to create a policy.

Wait for Timeout: Simulate a failure.

Claim Payout: Submit a claim and verify the compensation.

🗺️ Roadmap
Phase	Status	Goal
Smart Contracts	✅	ZeusInsuranceV2 + ZeusReserveV2 deployed
Frontend	✅	Basic interface for testing
Reserve Fund	✅	USDC-based reserve with daily limits
SDK (JavaScript)	🔜	Client library for developers
Proxy API	🔜	HTTP endpoint for agent integration
Mainnet Deployment	🔜	Move to Base Mainnet
🤝 Contributing
We welcome contributions from the community. Please fork the repository and submit a Pull Request.

📞 Contacts
GitHub: igor-vii/Zeus-insurance-v2.1

Telegram: @IvanovVII

Website: https://zeus-insurance-v2.netlify.app

Email: zeusinsurance@mail.ru

📄 License
MIT © 2026 Zeus Insurance Team

⭐ Support the Project
If you find this project useful:

⭐ Star the repository on GitHub.

🔗 Share it with developers building AI agents.

💬 Join the discussion in our Telegram channel.

Built for AI agents. Powered by smart contracts. Protected by Zeus. ⚡
