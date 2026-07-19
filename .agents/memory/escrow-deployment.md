---
name: Escrow deployment
description: ZeusEscrowBOT addresses, token addresses, and getLogs pagination constraint for both Base Sepolia and Base Mainnet
---

## Base Sepolia (testnet)
- Contract: `0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76`
- Token (testnet USDC): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Deploy block: `44268060`
- Treasury: `address(0)` — fee logic disabled on testnet

## Base Mainnet
- Contract: `0xadED902c2C6dD7D1B5b72A6a0A3358a9b9d4A79c`
- Token (native USDC): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Treasury (fee recipient): `0xaF8c45345e79dA97Dd41db5FE04d13ad4BEB1640`
- Verified: https://basescan.org/address/0xadED902c2C6dD7D1B5b72A6a0A3358a9b9d4A79c#code
- Protocol fee: 0.7% (70 bps) + $0.02 fixed per agreement

## getLogs constraint
Public Base RPC returns `InvalidParamsRpcError` if `toBlock` exceeds the current head by even 1 block.
Always paginate in chunks ≤ 2000 blocks and clamp `toBlock` to `latestBlock - 1` before querying.

## Hardhat config API key
`contracts/hardhat.config.ts` reads `ETHERSCAN_API_KEY` (falling back to `BASESCAN_API_KEY`) for BaseScan V2 verification via `https://api.etherscan.io/v2/api?chainid=<id>`.
