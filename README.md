# Coin Caret (`CC`) Platform

> **Institutional-grade Web3 Fintech Monolith & Autonomous Consensus Engine**

---

## 1. System Architecture & Runtime Topology

Coin Caret is designed as a **Modular Monolith** with an **Adapter-Based Blockchain Engine**. The local development and production environments run two primary processes:

1. **Next.js 16 Web Application Server** (App Router, UI, API Routes, NextAuth Session Guard, Explorer).
2. **Autonomous Consensus Block Generator Worker** (10-second ticker packaging Mempool transactions, computing SHA-256 Merkle roots, and advancing 3-tier confirmations).

```text
+========================================================================================+
|                              CLIENT / WEB BROWSER LAYER                                |
|                                                                                        |
|   [ Portal (/) ]     [ Wallet (/wallet) ]     [ Explorer (/explorer) ]     [ Admin ]   |
+============================================+===========================================+
                                             | HTTP / REST / JSON
                                             v
+========================================================================================+
|                        PROCESS #1: NEXT.JS WEB SERVER (Port 3847)                      |
|                                    Command: `npm run dev`                              |
|                                                                                        |
|   +---------------------+  +---------------------+  +------------------------------+   |
|   |   NextAuth RBAC     |  |   Atomic Balance    |  |   Block / Tx Live Feed       |   |
|   |   /api/auth/*       |  |   /api/wallet/send  |  |   /api/explorer/*            |   |
|   +----------+----------+  +----------+----------+  +--------------+---------------+   |
|              |                        |                            |                   |
|   +----------v------------------------v----------------------------v---------------+   |
|   |                 CORE SERVICE & STRICT DOUBLE-ENTRY LEDGER                      |   |
|   |         (LedgerService, MempoolService, IdentityService, Decimal 28.8)          |   |
|   +-----------------------------------+--------------------------------------------+   |
+=======================================|================================================+
                                        | Reads & Writes (Pool 5432)
                                        v
+========================================================================================+
|                       PERSISTENT STORAGE: POSTGRESQL DATABASE                          |
|                                                                                        |
|   - Database: `coin_caret_dev` (Port 5432)                                             |
|   - Tables: users, wallets, accounts, transactions, blocks, block_transactions         |
+========================================================================================+
                                        ^
                                        | Autonomous DB Polling & Block Mining
+=======================================|================================================+
|                   PROCESS #2: AUTONOMOUS BLOCK GENERATOR WORKER                        |
|                               Command: `npm run worker:dev`                            |
|                                                                                        |
|   +--------------------------------------------------------------------------------+   |
|   | 10-Second Continuous Cadence Worker (src/worker/block-generator.ts)            |   |
|   |                                                                                |   |
|   |  [ 1. Fetch Mempool Txs ] ---> [ 2. Compute SHA-256 Merkle Root & Seal Block ] |   |
|   |                                               |                                |   |
|   |  [ 4. Double-Entry Final Settlement ] <--- [ 3. Advance Confirmations 1->2->3 ]|   |
|   +--------------------------------------------------------------------------------+   |
+========================================================================================+
```

---

## 2. Why Two Processes Run Concurrently

In a live blockchain and crypto-financial platform, transaction submission is **asynchronous** from block minting:

```text
  [ Client Browser ]          [ Next.js Server (Port 3847) ]          [ PostgreSQL DB ]          [ Block Worker (worker:dev) ]
         |                                  |                                 |                                 |
   1.    |--- POST /api/wallet/send ------->|                                 |                                 |
         |   (Amount: 100 CC)               |                                 |                                 |
   2.    |                                  |--- Atomically Reserve 100 CC -->|                                 |
         |                                  |    (status: RESERVED_PENDING)   |                                 |
   3.    |                                  |--- Insert Tx (status: QUEUED) ->|                                 |
         |                                  |    (0/3 Confirmations)          |                                 |
   4.    |<-- Return Tx Hash 0x7119... -----|                                 |                                 |
         |    (Status: In Mempool)          |                                 |                                 |
         |                                  |                                 |                                 |
         |                                  |               [ T = 10s Cadence Trigger ]                         |
   5.    |                                  |                                 |<-- Poll Queued Mempool Txs -----|
   6.    |                                  |                                 |    Compute SHA-256 Merkle Root  |
   7.    |                                  |                                 |<-- Mint Block #N (1/3 Conf) ----|
         |                                  |                                 |                                 |
         |                                  |               [ T = 20s Next Block ]                              |
   8.    |                                  |                                 |<-- Mint Block #N+1 (2/3 Conf) --|
         |                                  |                                 |                                 |
         |                                  |               [ T = 30s 3rd Block (Finality) ]                    |
   9.    |                                  |                                 |<-- Mint Block #N+2 (3/3 Conf) --|
   10.   |                                  |                                 |<-- Double-Entry Settlement -----|
         |                                  |                                 |    (Debit Sender / Credit Recv) |
         |                                  |                                 |                                 |
   11.   |--- Polling /api/wallet/summary ->|                                 |                                 |
   12.   |                                  |--- Query Settled Balance ------>|                                 |
   13.   |<-- Updated Balance & Confirmed --|                                 |                                 |
         |                                  |                                 |                                 |
```

### Local Development Commands:
| Process | Terminal Command | Port / Role |
|:---|:---|:---|
| **Web Server** | `npm run dev` | `http://127.0.0.1:3847` (User Interface & REST APIs) |
| **Consensus Engine** | `npm run worker:dev` | Background ticker sealing blocks every 10 seconds |

---

## 3. V1 (Simulation Adapter) vs V2 (Real Web3 / EVM) Architecture Swap Map

The platform implements the **Adapter Pattern** via `INetworkEngine` (`src/modules/network/engine.interface.ts`). When transitioning from V1 (client demonstration) to V2 (real on-chain mainnet/testnet), only the engine implementation is swapped:

```text
+========================================================================================+
|                        APPLICATION CORE & USER INTERFACE LAYER                         |
|                             (Zero Changes When Migrating)                              |
|                                                                                        |
|      [ Next.js Web Wallet ]      [ Strict Double-Entry Ledger ]      [ REST APIs ]     |
+===========================================+============================================+
                                            |
                                            v
+========================================================================================+
|                             NETWORK ENGINE ADAPTER LAYER                               |
|                  Interface: `INetworkEngine` (engine.interface.ts)                     |
|                                                                                        |
|     * broadcastTx()     * getBlockByHeight()     * getReceipt()     * estimateGas()    |
+===========================================+============================================+
                                            |
                    +-----------------------+-----------------------+
                    |                                               |
                    v (CURRENT V1 IMPLEMENTATION)                   v (FUTURE V2 WEB3 SWAP)
+===========================================+   +========================================+
|             V1 INTERNAL ENGINE            |   |          V2 REAL WEB3 ADAPTER          |
|                                           |   |                                        |
| * Local PostgreSQL Mempool (`tx_queued`)  |   | * Real EVM / Solana RPC Nodes          |
| * Autonomous 10s Block Worker (TypeScript)|   |   (Alchemy / Infura / QuickNode)       |
| * In-Memory SHA-256 Merkle Calculation    |   | * Real Proof-of-Stake Validator Blocks |
| * Internal Double-Entry Ledger DB         |   | * EIP-1559 Live Gas Pricing            |
| * Simulated CC0x... SHA Checksum Addr     |   | * Smart Contract On-Chain Settlement   |
|                                           |   | * MetaMask / Hardware Wallet Signing   |
+===========================================+   +========================================+
```

### Component Comparison Table:

| Component | V1 Implementation (Current) | V2 Real Web3 Implementation (Future Swap) |
|:---|:---|:---|
| **Consensus Mechanism** | 10-second autonomous worker (`block-generator.ts`) | Real Ethereum / EVM Proof-of-Stake / Solana validators |
| **Mempool** | PostgreSQL `transactions` table with `status: QUEUED` | P2P node mempool via `eth_sendRawTransaction` |
| **Block Storage** | PostgreSQL relational `blocks` & `block_transactions` | Real blockchain nodes queried via RPC (`eth_getBlockByNumber`) |
| **Address Generation** | SHA-256 checksummed `CC0x...` cryptographic addresses | Real secp256k1 / ed25519 private-public key pairs |
| **Transaction Signing** | Session-authenticated atomic DB transactions | Web3 Provider / MetaMask / Hardware Wallet signature verification |
| **Double-Entry Ledger** | Internal strict double-entry ledger (`Debits == Credits`) | Unspent transaction outputs / On-chain ERC-20 smart contract balances |
| **UI & Explorer** | Next.js 16 App Router UI (`/wallet`, `/explorer`) | **Identical UI** (0 rewrites required due to `INetworkEngine` abstraction) |

---

## 4. Quick Start Guide

```bash
# 1. Install dependencies
npm install

# 2. Run Database Migrations
npx prisma migrate dev

# 3. Seed Demo Accounts & Treasury Funds
npm run db:seed

# 4. Start the Web Server
npm run dev

# 5. Start the Autonomous Block Worker (Separate Terminal)
npm run worker:dev
```

- **Web Application:** [http://127.0.0.1:3847](http://127.0.0.1:3847)
- **Block Explorer:** [http://127.0.0.1:3847/explorer](http://127.0.0.1:3847/explorer)
- **Demo User:** `user@coincaret.com` / `Password123!` (Funded with 5,000 CC)
- **Platform Owner:** `admin@coincaret.com` / `Password123!`
