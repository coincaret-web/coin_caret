# Database Schema Reference: Coin Caret (PostgreSQL / Prisma)

This document contains the complete database schema design, entity relationships, constraints, and double-entry accounting models for **Coin Caret**.

---

## 1. Schema Design Principles

1. **PostgreSQL Relational Foreign Keys:** Uses `relationMode = "foreignKeys"` to guarantee hard relational integrity.
2. **Double-Entry Ledger Invariance:** All account balance updates are derived from immutable `LedgerEntry` rows. Balances are never modified via an un-audited `UPDATE wallet SET balance = ...`.
3. **Fixed-Point Numerical Precision:** All financial amounts are stored as `Decimal(28, 8)` or `BigInt` (smallest denomination) to avoid floating-point errors.
4. **Authoritative State Transitions:** Transaction states are strictly validated and tracked via an immutable `TransactionEvent` timeline.

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

  @@map("users")
}

model Profile {
  id                String         @id @default(uuid())
  userId            String         @unique
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
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
  symbol            String         @unique // e.g. "CC"
  name              String         // "Coin Caret"
  type              AssetType      @default(NATIVE_COIN)
  decimals          Int            @default(8)
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())

  wallets           Wallet[]
  ledgerAccounts    LedgerAccount[]
  transactions      Transaction[]

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
  address           String         @unique // e.g., "CC0x7F2a89C1e92DbA440F61E1b380295E8d58c1E4D9"
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
  key               String             @unique // e.g., 'BLOCK_INTERVAL_MS', 'STANDARD_FEE_CC'
  value             String
  description       String?
  updatedAt         DateTime           @updatedAt

  @@map("network_settings")
}

model AuditLog {
  id                String             @id @default(uuid())
  actorUserId       String?
  actorUser         User?              @relation(fields: [actorUserId], references: [id], onDelete: SetNull)
  action            String             // e.g. "TREASURY_MINT", "WALLET_FROZEN"
  entityType        String             // e.g. "Wallet", "Transaction"
  entityId          String
  beforeState       Json?
  afterState        Json?
  ipAddress         String?
  createdAt         DateTime           @default(now())

  @@index([action])
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```
