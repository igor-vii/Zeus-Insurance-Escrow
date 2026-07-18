---
name: Insurance deployment
description: ZeusInsuranceV2 deployment details on Base Sepolia.
---

# ZeusInsuranceV2 on Base Sepolia

- **Address:** `0x1d9D90d2652296A2c89E3802d45B1F2132b30076`
- **Constructor args:** `(usdcAddress, reserveAddress)` — 2 args only
  - USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
  - Reserve (ZeusReserveV2): `0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47`
- **Verified:** yes, on BaseScan via Etherscan V2 API
- **SDK:** `NETWORKS["base-sepolia"].insuranceAddress` set in `sdk/src/types/index.ts`
- **Env var:** `ZEUS_INSURANCE_ADDRESS` set in shared environment

**Why recorded:** The deploy script originally had a 5-arg constructor (from an older design); the actual contract takes 2. Future redeploys must use 2 args.
