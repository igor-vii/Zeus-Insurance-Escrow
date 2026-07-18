---
name: Escrow deployment
description: ZeusEscrowBOT contract addresses, token, and RPC quirks on Base Sepolia
---

## Deployed contract

| Key | Value |
|---|---|
| Network | Base Sepolia (chainId 84532) |
| ZeusEscrowBOT | `0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76` |
| Token (USDC) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Deployer | `0xaF8c45345e79dA97Dd41db5FE04d13ad4BEB1640` |
| Deploy block | ~44268060 |
| Basescan | https://sepolia.basescan.org/address/0x87365462353bCBAB2CF0DF57c7Cb15519C5B7c76#code |

## Env vars set (shared)

- `ZEUS_ESCROW_BOT_ADDRESS` — read by api-server at startup
- `VITE_ESCROW_BOT_ADDRESS` — read by Vite frontend build
- `ESCROW_DEPLOY_BLOCK` — getLogs start block; update if contract is redeployed
- `TOKEN_ADDRESS` — used by the deploy script

## Secrets set

- `PRIVATE_KEY` — deployer EOA private key
- `BASESCAN_API_KEY` — for contract verification

## RPC quirk

**Why:** Base Sepolia public RPC (`https://sepolia.base.org`) rejects `eth_getLogs` requests
spanning more than 2000 blocks.

**How to apply:** In `api-server/src/routes/escrow.ts`, `fetchLogsInChunks()` paginates
from `ESCROW_DEPLOY_BLOCK` in 1999-block steps. If the contract is redeployed, update
`ESCROW_DEPLOY_BLOCK` env var and restart the API server.
