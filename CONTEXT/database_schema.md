# Database Schema Reference: Coin Caret (PostgreSQL / Prisma)

This document contains the complete database schema design, entity relationships, constraints, and double-entry accounting models for **Coin Caret**.

---

## 1. Schema Design Principles

1. **PostgreSQL Relational Foreign Keys:** Uses `relationMode = "foreignKeys"` to guarantee hard relational integrity.
2. **Double-Entry Ledger Invariance:** All account balance updates are derived from immutable `LedgerEntry` rows. Balances are never modified via an un-audited `UPDATE wallet SET balance = ...`.
3. **Fixed-Point Numerical Precision:** All financial amounts are stored as `Decimal(28, 8)` or `BigInt` (smallest denomination) to avoid floating-point errors.
4. **Authoritative State Transitions:** Transaction states are strictly validated and tracked via an immutable `TransactionEvent` timeline.
5. **Multi-Currency Asset Pairs & Swaps:** Every user is provisioned separate wallets for each supported asset (`CC`, `BTC`, `ETH`, `SOL`, `BNB`, `LTC`, `XRP`, `DOGE`). Cross-asset swaps are atomically executed across dual double-entry ledger legs.

---

## 2. Complete Prisma Schema Definition

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// --------------------------------------------------------
// ENUMS
// --------------------------------------------------------

enum UserStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

// ---- Phase 9 additions ----
enum KycDocumentType {
  SSN_CARD
  FEDERAL_ID
  DRIVING_LICENSE
}

enum KycVerificationStatus {
  NOT_SUBMITTED
  SUBMITTED
  PENDING_REVIEW
  APPROVED
  REJECTED
}
// ----------------------------

enum RoleName {
  PLATFORM_OWNER
  OPERATIONS_ADMIN
  FINANCE_OPERATOR
  AUDITOR
  USER
}

enum AssetType {
  NATIVE_COIN
  STABLECOIN
  TOKEN
}

enum AccountType {
  AVAILABLE
  RESERVED_PENDING
  SYSTEM_TREASURY
  SYSTEM_GAS_FEE
  SYSTEM_BURN
}

enum TransactionType {
  TRANSFER
  TREASURY_MINT
  SWAP
  WITHDRAWAL
  GAS_FEE
  ADMIN_ADJUSTMENT
}

enum TransactionStatus {
  QUEUED
  IN_MEMPOOL
  BLOCK_ASSIGNED
  CONFIRMING
  CONFIRMED
  FAILED
  CANCELLED
}

enum WithdrawalStatus {
  REQUESTED
  UNDER_REVIEW
  APPROVED
  PROCESSING
  SETTLED
  REJECTED
  CANCELLED
}

enum BlockStatus {
  PROPOSED
  SEALED
  FINALIZED
}

// --------------------------------------------------------
// IDENTITY & ACCESS (RBAC)
// --------------------------------------------------------

model User {
  id                String         @id @default(uuid())
  email             String         @unique
  passwordHash      String
  displayName       String
  status            UserStatus     @default(ACTIVE)
  kycRequired       Boolean        @default(true)   // Phase 9: per-user KYC override
  emailVerifiedAt   DateTime?
  twoFactorEnabled  Boolean        @default(false)
  twoFactorSecret   String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  profile           Profile?
  roles             UserRole[]
  wallets           Wallet[]
  sessions          Session[]
  auditLogs         AuditLog[]
  transactions      Transaction[]  @relation("InitiatedTransactions")
  withdrawalRequests WithdrawalRequest[]
  issuanceRequests  TreasuryIssuanceRequest[] @relation("RequestedIssuances")
  approvedIssuances TreasuryIssuanceRequest[] @relation("ApprovedIssuances")
  platformConfigs   PlatformConfig[]
  assetPairRates    AssetPairRate[]
  verification      UserVerification?          // Phase 9
  kycReviews        UserVerification[]         @relation("KycReviewedBy") // Phase 9

  @@map("users")
}

model Profile {
  id                String         @id @default(uuid())
  userId            String         @unique
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  phoneNumber       String         // Phase 9: required at registration
  address           String         // Phase 9: required at registration
  themePreference   String         @default("dark")
  currencyDisplay   String         @default("USD")
  timezone          String         @default("UTC")
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@map("profiles")
}

model Role {
  id                String         @id @default(uuid())
  name              RoleName       @unique
  description       String?
  permissions       RolePermission[]
  users             UserRole[]

  @@map("roles")
}

model Permission {
  id                String         @id @default(uuid())
  code              String         @unique // e.g., 'wallet:send', 'admin:treasury:mint'
  description       String
  roles             RolePermission[]

  @@map("permissions")
}

model RolePermission {
  roleId            String
  permissionId      String
  role              Role           @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission        Permission     @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  userId            String
  roleId            String
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  role              Role           @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model Session {
  id                String         @id @default(uuid())
  userId            String
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionToken      String         @unique
  ipAddress         String?
  userAgent         String?
  expiresAt         DateTime
  createdAt         DateTime       @default(now())

  @@map("sessions")
}

// --------------------------------------------------------
// ASSETS & WALLETS
// --------------------------------------------------------

model Asset {
  id                String         @id @default(uuid())
  symbol            String         @unique // e.g. "CC", "BTC", "ETH"
  name              String         // "Coin Caret", "Bitcoin", "Ethereum"
  type              AssetType      @default(NATIVE_COIN)
  decimals          Int            @default(8)
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())

  wallets           Wallet[]
  ledgerAccounts    LedgerAccount[]
  transactions      Transaction[]
  fromPairRates     AssetPairRate[] @relation("FromAssetRates")
  toPairRates       AssetPairRate[] @relation("ToAssetRates")

  @@map("assets")
}

model Wallet {
  id                String         @id @default(uuid())
  userId            String?        // Nullable for system treasury wallets
  user              User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  assetId           String
  asset             Asset          @relation(fields: [assetId], references: [id])
  label             String         @default("Main Wallet")
  isFrozen          Boolean        @default(false)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  addresses         WalletAddress[]
  ledgerAccounts    LedgerAccount[]
  withdrawalRequests WithdrawalRequest[]

  @@map("wallets")
}

model WalletAddress {
  id                String         @id @default(uuid())
  walletId          String
  wallet            Wallet         @relation(fields: [walletId], references: [id], onDelete: Cascade)
  address           String         @unique // e.g., "BTC0x7F2a89C1e92DbA440F61E1b380295E8d58c1E4D9"
  isPrimary         Boolean        @default(true)
  createdAt         DateTime       @default(now())

  @@map("wallet_addresses")
}

// --------------------------------------------------------
// DOUBLE-ENTRY LEDGER
// --------------------------------------------------------

model LedgerAccount {
  id                String         @id @default(uuid())
  walletId          String?
  wallet            Wallet?        @relation(fields: [walletId], references: [id], onDelete: Cascade)
  assetId           String
  asset             Asset          @relation(fields: [assetId], references: [id])
  accountType       AccountType    @default(AVAILABLE)
  createdAt         DateTime       @default(now())

  entries           LedgerEntry[]

  @@unique([walletId, accountType, assetId])
  @@map("ledger_accounts")
}

model LedgerEntry {
  id                String         @id @default(uuid())
  transactionId     String
  transaction       Transaction    @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  accountId         String
  account           LedgerAccount  @relation(fields: [accountId], references: [id], onDelete: Restrict)
  debit             Decimal        @default(0) @db.Decimal(28, 8)
  credit            Decimal        @default(0) @db.Decimal(28, 8)
  createdAt         DateTime       @default(now())

  @@index([transactionId])
  @@index([accountId])
  @@map("ledger_entries")
}

// --------------------------------------------------------
// TRANSACTIONS & MEMPOOL
// --------------------------------------------------------

model Transaction {
  id                String             @id @default(uuid())
  txHash            String             @unique // Cryptographic synthetic hash (e.g. 0x4f8a...)
  idempotencyKey    String             @unique
  type              TransactionType    @default(TRANSFER)
  status            TransactionStatus  @default(QUEUED)
  assetId           String
  asset             Asset              @relation(fields: [assetId], references: [id])
  initiatorUserId   String?
  initiatorUser     User?              @relation("InitiatedTransactions", fields: [initiatorUserId], references: [id])
  fromAddress       String
  toAddress         String
  amount            Decimal            @db.Decimal(28, 8)
  fee               Decimal            @default(0.50) @db.Decimal(28, 8)
  totalDebit        Decimal            @db.Decimal(28, 8)
  blockId           String?
  block             Block?             @relation(fields: [blockId], references: [id])
  blockHeight       BigInt?
  confirmations     Int                @default(0)
  note              String?
  linkedTransactionId String?
  linkedTransaction   Transaction?     @relation("LinkedSwapTransaction", fields: [linkedTransactionId], references: [id])
  linkedByTransactions Transaction[]   @relation("LinkedSwapTransaction")
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  ledgerEntries     LedgerEntry[]
  events            TransactionEvent[]
  blockTransactions BlockTransaction[]

  @@index([fromAddress])
  @@index([toAddress])
  @@index([status])
  @@index([blockHeight])
  @@map("transactions")
}

model TransactionEvent {
  id                String             @id @default(uuid())
  transactionId     String
  transaction       Transaction        @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  fromStatus        TransactionStatus?
  toStatus          TransactionStatus
  metadata          Json?
  createdAt         DateTime           @default(now())

  @@index([transactionId])
  @@map("transaction_events")
}

// --------------------------------------------------------
// BLOCKS & BLOCKCHAIN ENGINE
// --------------------------------------------------------

model Block {
  id                String             @id @default(uuid())
  height            BigInt             @unique
  blockHash         String             @unique
  parentHash        String
  merkleRoot        String
  status            BlockStatus        @default(SEALED)
  transactionCount  Int                @default(0)
  gasUsed           Decimal            @default(0) @db.Decimal(28, 8)
  createdAt         DateTime           @default(now())

  transactions      Transaction[]
  blockTransactions BlockTransaction[]

  @@index([height])
  @@map("blocks")
}

model BlockTransaction {
  id                String             @id @default(uuid())
  blockId           String
  block             Block              @relation(fields: [blockId], references: [id], onDelete: Cascade)
  transactionId     String
  transaction       Transaction        @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  txIndex           Int

  @@unique([blockId, txIndex])
  @@map("block_transactions")
}

// --------------------------------------------------------
// TREASURY & WITHDRAWAL REQUESTS
// --------------------------------------------------------

model WithdrawalRequest {
  id                String             @id @default(uuid())
  userId            String
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  walletId          String
  wallet            Wallet             @relation(fields: [walletId], references: [id])
  destinationAddress String
  amount            Decimal            @db.Decimal(28, 8)
  fee               Decimal            @db.Decimal(28, 8)
  status            WithdrawalStatus   @default(REQUESTED)
  reviewNotes       String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([userId])
  @@index([status])
  @@map("withdrawal_requests")
}

model TreasuryIssuanceRequest {
  id                String             @id @default(uuid())
  requesterId       String
  requester         User               @relation("RequestedIssuances", fields: [requesterId], references: [id])
  approverId        String?
  approver          User?              @relation("ApprovedIssuances", fields: [approverId], references: [id])
  recipientWalletId String
  amount            Decimal            @db.Decimal(28, 8)
  reason            String
  isApproved        Boolean            @default(false)
  createdAt         DateTime           @default(now())
  approvedAt        DateTime?

  @@map("treasury_issuance_requests")
}

// --------------------------------------------------------
// NETWORK CONFIGURATION & AUDIT
// --------------------------------------------------------

model NetworkSetting {
  id                String             @id @default(uuid())
  key               String             @unique // e.g., 'BLOCK_INTERVAL_MS', 'FEE_CC', 'FEE_BTC'
  value             String
  description       String?
  updatedAt         DateTime           @updatedAt

  @@map("network_settings")
}

model AuditLog {
  id                String             @id @default(uuid())
  actorUserId       String?
  actorUser         User?              @relation(fields: [actorUserId], references: [id], onDelete: SetNull)
  action            String             // e.g. "TREASURY_MINT", "SET_EXCHANGE_RATE"
  entityType        String             // e.g. "Wallet", "AssetPairRate"
  entityId          String
  beforeState       Json?
  afterState        Json?
  ipAddress         String?
  createdAt         DateTime           @default(now())

  @@index([action])
  @@index([entityType, entityId])
  @@map("audit_logs")
}

// --------------------------------------------------------
// PLATFORM CONFIGURATION (W-603)
// --------------------------------------------------------

model PlatformConfig {
  id          String   @id @default(uuid())
  key         String   @unique // e.g. "CC_USD_RATE", "MAINTENANCE_MODE"
  value       String   // Always stored as String; parsed to correct type in service layer
  description String?  // Human-readable description of the config key
  updatedByUserId String?
  updatedByUser User?  @relation(fields: [updatedByUserId], references: [id], onDelete: SetNull)
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@map("platform_config")
}

// --------------------------------------------------------
// EXTERNAL PRICE FEED CACHE (W-604)
// --------------------------------------------------------

model ExternalPriceFeedCache {
  id        String   @id @default(uuid())
  coinId    String   @unique // CoinGecko coin ID, e.g. "bitcoin", "ethereum", "solana"
  symbol    String   // Ticker symbol, e.g. "BTC", "ETH"
  name      String   // Display name, e.g. "Bitcoin", "Ethereum"
  usdPrice  Decimal  @db.Decimal(28, 8) // Latest fetched USD price
  fetchedAt DateTime // Timestamp of the last successful CoinGecko API fetch
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([coinId])
  @@index([fetchedAt])
  @@map("external_price_feed_cache")
}

// --------------------------------------------------------
// ASSET PAIR EXCHANGE RATES (W-801)
// --------------------------------------------------------

model AssetPairRate {
  id          String   @id @default(uuid())
  fromAssetId String
  fromAsset   Asset    @relation("FromAssetRates", fields: [fromAssetId], references: [id], onDelete: Cascade)
  toAssetId   String
  toAsset     Asset    @relation("ToAssetRates", fields: [toAssetId], references: [id], onDelete: Cascade)
  rate        Decimal  @db.Decimal(28, 8) // Exchange rate: 1 FromAsset = rate ToAsset
  setByUserId String?
  setByUser   User?    @relation(fields: [setByUserId], references: [id], onDelete: SetNull)
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@unique([fromAssetId, toAssetId])
  @@index([fromAssetId])
  @@index([toAssetId])
  @@map("asset_pair_rates")
}

// --------------------------------------------------------
// KYC IDENTITY VERIFICATION (Phase 9)
// --------------------------------------------------------

model UserVerification {
  id               String                @id @default(uuid())
  userId           String                @unique
  user             User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  ssnEncrypted     String                // AES-256-GCM ciphertext — NEVER plaintext
  ssnIv            String                // Initialization vector for AES-GCM decryption
  ssnAuthTag       String                // GCM authentication tag for tamper detection
  status           KycVerificationStatus @default(NOT_SUBMITTED)
  reviewNotes      String?               // Admin's written approval or rejection reason
  reviewedByUserId String?
  reviewedByUser   User?                 @relation("KycReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull)
  reviewedAt       DateTime?
  submittedAt      DateTime?
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  documents        KycDocument[]

  @@map("user_verifications")
}

model KycDocument {
  id                 String           @id @default(uuid())
  userVerificationId String
  userVerification   UserVerification @relation(fields: [userVerificationId], references: [id], onDelete: Cascade)
  documentType       KycDocumentType
  originalFileName   String
  mimeType           String           // "image/jpeg" | "image/png" | "application/pdf"
  fileSizeBytes      Int
  storageBackend     String           @default("postgres") // "postgres" | "r2" | "railway_volume"
  storageRef         String           // DB mode: same as id | R2 mode: S3 object key
  base64Data         String?          @db.Text // Only populated when storageBackend = "postgres"
  uploadedAt         DateTime         @default(now())

  @@unique([userVerificationId, documentType])
  @@index([userVerificationId])
  @@map("kyc_documents")
}
```

---

## 3. Schema Migration History

| Migration Name | Phase | Description |
|:---|:---:|:---|
| `20260916000000_init_coin_caret_schema` | 1 | Initial full schema: Users, Wallets, Ledger, Transactions, Blocks, Audit |
| `20260916214127_add_platform_config_and_price_cache` | 6 | Adds `platform_config` key-value table and `external_price_feed_cache` table |
| `20260917152223_add_asset_pair_rate_and_swap_support` | 8 | Adds `asset_pair_rates` table, `SWAP` enum to `TransactionType`, and self-referential `linkedTransactionId` on `Transaction` |
| `20260918000000_add_kyc_and_extended_profile` | 9 | Adds `phoneNumber` + `address` to `profiles`; adds `kycRequired` to `users`; adds `user_verifications` and `kyc_documents` tables; adds `KycDocumentType` and `KycVerificationStatus` enums |

---

## 4. Key Design Notes for New Models

### `AssetPairRate`
- **Purpose:** Stores admin-configured exchange rates for direct asset-to-asset swaps (e.g., CC ➔ BTC, ETH ➔ SOL).
- **Exchange Rate Semantics:** `rate` specifies how many units of `toAsset` are received for 1 unit of `fromAsset` (`toAmount = fromAmount × rate`).
- **CoinGecko Dynamic Fallback:** If no direct `AssetPairRate` row exists in the database for a requested pair, the system dynamically derives the cross-rate using the CoinGecko price cache: `(fromUsdPrice / toUsdPrice)`.
- **RBAC:** Managed by `PLATFORM_OWNER` and `FINANCE_OPERATOR` roles via `PATCH /api/admin/exchange-rates`.
- **Audit Trail:** Every rate mutation generates an immutable `AuditLog` entry tracking actor, old rate, and new rate.

---

### `UserVerification` (Phase 9)
- **Purpose:** Tracks the KYC identity verification lifecycle for each user. One row per user (unique on `userId`).
- **SSN Encryption:** `ssnEncrypted`, `ssnIv`, `ssnAuthTag` store the AES-256-GCM ciphertext, IV, and authentication tag separately. Decryption requires all three fields plus the `KYC_ENCRYPTION_KEY` environment variable. The plain SSN is NEVER stored.
- **Status State Machine:** `NOT_SUBMITTED → SUBMITTED → PENDING_REVIEW → APPROVED | REJECTED`. Rejected users can resubmit, which resets to `SUBMITTED`.
- **Review Mode Integration:** The `status` after submission is determined by the `KYC_REVIEW_MODE` platform config. `automatic` → immediately sets `APPROVED`. `manual` → sets `PENDING_REVIEW` until admin action.

### `KycDocument` (Phase 9)
- **Purpose:** Stores one uploaded file per document type per user verification. Unique constraint on `[userVerificationId, documentType]` prevents duplicate uploads per type.
- **Storage Abstraction:** `storageBackend` field (`"postgres"`, `"r2"`, `"railway_volume"`) and `storageRef` field enable zero-refactor migration between storage backends. In PostgreSQL mode, `base64Data` holds the file. In R2 mode, `base64Data` is nulled and `storageRef` is the S3 object key.
- **Supported MIME Types:** `image/jpeg`, `image/png`, `application/pdf`. Maximum file size: 10 MB (validated in route handler).
- **Access Control:** Only admins with `admin:users:manage` permission can retrieve document binaries via `GET /api/admin/kyc/document/[documentId]`.
