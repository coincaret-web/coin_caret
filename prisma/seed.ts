import { PrismaClient, RoleName, AccountType, TransactionType, TransactionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePrefixedAddress(prefix: string): string {
  const cleanPrefix = (prefix || "CC").toUpperCase();
  const randomBytes = crypto.randomBytes(20);
  const hex = randomBytes.toString("hex");
  const hash = crypto.createHash("sha256").update(hex).digest("hex");
  let checksummed = "";
  for (let i = 0; i < hex.length; i++) {
    checksummed += parseInt(hash[i], 16) >= 8 ? hex[i].toUpperCase() : hex[i].toLowerCase();
  }
  return `${cleanPrefix}0x${checksummed}`;
}

// ─── Asset + Demo Balance Definitions ─────────────────────────────────────────

const SUPPORTED_ASSET_DEFS = [
  { symbol: "CC",   name: "Coin Caret Native Currency", type: "NATIVE_COIN" as const, decimals: 8,  seedAmount: 5000.0    },
  { symbol: "BTC",  name: "Bitcoin",                    type: "TOKEN"       as const, decimals: 8,  seedAmount: 0.15      },
  { symbol: "ETH",  name: "Ethereum",                   type: "TOKEN"       as const, decimals: 18, seedAmount: 2.5       },
  { symbol: "SOL",  name: "Solana",                     type: "TOKEN"       as const, decimals: 9,  seedAmount: 35.0      },
  { symbol: "BNB",  name: "BNB",                        type: "TOKEN"       as const, decimals: 18, seedAmount: 8.0       },
  { symbol: "LTC",  name: "Litecoin",                   type: "TOKEN"       as const, decimals: 8,  seedAmount: 12.5      },
  { symbol: "XRP",  name: "XRP",                        type: "TOKEN"       as const, decimals: 6,  seedAmount: 1500.0    },
  { symbol: "DOGE", name: "Dogecoin",                   type: "TOKEN"       as const, decimals: 8,  seedAmount: 8000.0    },
];

async function main() {
  console.log("🌱 Starting Coin Caret Database Seeding...");

  // ── 1. Ensure Roles exist ──────────────────────────────────────────────────
  const roles: RoleName[] = [
    RoleName.PLATFORM_OWNER,
    RoleName.OPERATIONS_ADMIN,
    RoleName.FINANCE_OPERATOR,
    RoleName.AUDITOR,
    RoleName.USER,
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r, description: `Institutional role: ${r}` },
    });
  }
  console.log("✅ Roles ensured.");

  // ── 2. Ensure all 8 Assets + System Treasury / Gas Fee accounts ───────────
  const assetMap: Record<string, { id: string; treasuryAccId: string; gasFeeAccId: string }> = {};

  for (const aDef of SUPPORTED_ASSET_DEFS) {
    const asset = await prisma.asset.upsert({
      where: { symbol: aDef.symbol },
      update: { name: aDef.name, decimals: aDef.decimals, type: aDef.type, isActive: true },
      create: { symbol: aDef.symbol, name: aDef.name, decimals: aDef.decimals, type: aDef.type, isActive: true },
    });

    // System Treasury account
    let tAcc = await prisma.ledgerAccount.findFirst({
      where: { walletId: null, accountType: AccountType.SYSTEM_TREASURY, assetId: asset.id },
    });
    if (!tAcc) {
      tAcc = await prisma.ledgerAccount.create({
        data: { walletId: null, accountType: AccountType.SYSTEM_TREASURY, assetId: asset.id },
      });
    }

    // System Gas Fee account
    let gAcc = await prisma.ledgerAccount.findFirst({
      where: { walletId: null, accountType: AccountType.SYSTEM_GAS_FEE, assetId: asset.id },
    });
    if (!gAcc) {
      gAcc = await prisma.ledgerAccount.create({
        data: { walletId: null, accountType: AccountType.SYSTEM_GAS_FEE, assetId: asset.id },
      });
    }

    assetMap[aDef.symbol] = { id: asset.id, treasuryAccId: tAcc.id, gasFeeAccId: gAcc.id };
  }
  console.log("✅ All 8 assets + system accounts ensured.");

  // ── 3. Network Fee Settings ────────────────────────────────────────────────
  const feeDefaults = [
    { key: "FEE_CC",   value: "0.50",     desc: "Coin Caret transfer fee"    },
    { key: "FEE_BTC",  value: "0.000015", desc: "Bitcoin network transfer fee" },
    { key: "FEE_ETH",  value: "0.0005",   desc: "Ethereum network transfer fee" },
    { key: "FEE_SOL",  value: "0.0005",   desc: "Solana network transfer fee"  },
    { key: "FEE_BNB",  value: "0.0005",   desc: "BNB Chain transfer fee"       },
    { key: "FEE_LTC",  value: "0.001",    desc: "Litecoin transfer fee"        },
    { key: "FEE_XRP",  value: "0.1",      desc: "Ripple transfer fee"          },
    { key: "FEE_DOGE", value: "1.0",      desc: "Dogecoin transfer fee"        },
  ];

  for (const feeDef of feeDefaults) {
    await prisma.networkSetting.upsert({
      where: { key: feeDef.key },
      update: {},
      create: { key: feeDef.key, value: feeDef.value, description: feeDef.desc },
    });
  }
  console.log("✅ Network fee settings ensured.");

  // ── 4. Platform Owner (Admin) ──────────────────────────────────────────────
  const adminEmail = "admin@coincaret.com";
  const adminPassHash = await bcrypt.hash("AdminPassword123!", 12);
  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.PLATFORM_OWNER } });

  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassHash,
        displayName: "Sovereign Treasury Officer",
        kycRequired: false,
        profile: {
          create: {
            themePreference: "dark",
            currencyDisplay: "USD",
            phoneNumber: "+1-555-000-0001",
            address: "1 Sovereign Treasury Plaza, New York, NY 10001",
          },
        },
        roles: { create: { roleId: adminRole!.id } },
      },
    });
    console.log("✅ Admin user created.");
  } else {
    console.log("ℹ️  Admin user already exists, skipping.");
  }

  // ── 5. Demo User ───────────────────────────────────────────────────────────
  const demoEmail = "user@coincaret.com";
  const demoPassHash = await bcrypt.hash("Password123!", 12);
  const userRole = await prisma.role.findUnique({ where: { name: RoleName.USER } });

  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: demoPassHash,
        displayName: "Apex Digital Capital",
        kycRequired: false,
        profile: {
          create: {
            themePreference: "dark",
            currencyDisplay: "USD",
            phoneNumber: "+1-555-000-0002",
            address: "456 Apex Capital Tower, Austin, TX 78701",
          },
        },
        roles: { create: { roleId: userRole!.id } },
      },
    });
    console.log("✅ Demo user created.");
  } else {
    console.log("ℹ️  Demo user already exists, skipping user creation.");
  }

  // ── 6. Provision ALL 8 asset wallets + seed demo balances for demo user ────
  console.log("🔧 Provisioning all 8 asset wallets for demo user...");

  for (const aDef of SUPPORTED_ASSET_DEFS) {
    const assetInfo = assetMap[aDef.symbol];

    // Find or create the wallet for this asset
    let wallet = await prisma.wallet.findFirst({
      where: { userId: demoUser.id, assetId: assetInfo.id },
      include: { addresses: true, ledgerAccounts: true },
    });

    if (!wallet) {
      const address = generatePrefixedAddress(aDef.symbol);
      wallet = await prisma.wallet.create({
        data: {
          userId: demoUser.id,
          assetId: assetInfo.id,
          label: `${aDef.name} Vault`,
          addresses: {
            create: { address, isPrimary: true },
          },
          ledgerAccounts: {
            createMany: {
              data: [
                { accountType: AccountType.AVAILABLE,        assetId: assetInfo.id },
                { accountType: AccountType.RESERVED_PENDING, assetId: assetInfo.id },
              ],
            },
          },
        },
        include: { addresses: true, ledgerAccounts: true },
      });
      console.log(`  ✅ Created ${aDef.symbol} wallet → ${wallet.addresses[0]?.address}`);
    } else {
      console.log(`  ℹ️  ${aDef.symbol} wallet already exists.`);
    }

    // Fund demo wallet if the AVAILABLE account has no entries yet
    const availableAcc = wallet.ledgerAccounts.find((a) => a.accountType === AccountType.AVAILABLE);
    const treasuryAccId = assetInfo.treasuryAccId;

    if (!availableAcc) {
      console.warn(`  ⚠️  No AVAILABLE ledger account found for ${aDef.symbol}, skipping funding.`);
      continue;
    }

    const existingEntries = await prisma.ledgerEntry.findMany({
      where: { accountId: availableAcc.id },
    });

    if (existingEntries.length === 0) {
      const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
      const toAddress = wallet.addresses[0]?.address ?? `${aDef.symbol}0xSYSTEM`;

      const fundingTx = await prisma.transaction.create({
        data: {
          txHash,
          idempotencyKey: `seed-mint-${aDef.symbol.toLowerCase()}-${demoUser.id}`,
          type: TransactionType.TREASURY_MINT,
          status: TransactionStatus.CONFIRMED,
          assetId: assetInfo.id,
          fromAddress: "SYSTEM_TREASURY",
          toAddress,
          amount: aDef.seedAmount,
          fee: 0.0,
          totalDebit: aDef.seedAmount,
          note: `Genesis Demo Allocation — ${aDef.name}`,
          confirmations: 3,
          blockHeight: BigInt(14280),
        },
      });

      await prisma.ledgerEntry.createMany({
        data: [
          {
            transactionId: fundingTx.id,
            accountId: treasuryAccId,
            debit: 0,
            credit: aDef.seedAmount, // Treasury gives
          },
          {
            transactionId: fundingTx.id,
            accountId: availableAcc.id,
            debit: aDef.seedAmount,  // User receives
            credit: 0,
          },
        ],
      });

      console.log(`  💰 Funded with ${aDef.seedAmount} ${aDef.symbol}`);
    } else {
      console.log(`  ℹ️  ${aDef.symbol} already has ledger entries, skipping funding.`);
    }
  }

  // ── 9. Platform Configuration Seed ────────────────────────────────────────
  await prisma.platformConfig.upsert({
    where: { key: "CC_USD_RATE" },
    update: {},
    create: {
      key: "CC_USD_RATE",
      value: "0.25",
      description: "Admin-controlled CC to USD exchange rate",
    },
  });
  console.log("✅ CC/USD rate platform config ensured.");

  // KYC_REQUIRED — default: false (platform starts with KYC disabled)
  await prisma.platformConfig.upsert({
    where: { key: "KYC_REQUIRED" },
    update: {},
    create: {
      key: "KYC_REQUIRED",
      value: "false",
      description: "Platform-wide KYC enforcement toggle. true = KYC required, false = all users bypass KYC.",
    },
  });

  // KYC_REVIEW_MODE — default: automatic (uploaded docs are instantly approved)
  await prisma.platformConfig.upsert({
    where: { key: "KYC_REVIEW_MODE" },
    update: {},
    create: {
      key: "KYC_REVIEW_MODE",
      value: "automatic",
      description: "KYC document review mode. automatic = instant approval on upload, manual = admin must review and approve.",
    },
  });
  console.log("✅ KYC platform config keys ensured.");

  console.log("");
  console.log("✅ Coin Caret Database Seeding Completed Successfully.");
  console.log("-------------------------------------------------------");
  console.log("Demo Credentials:");
  console.log("  User:  user@coincaret.com  / Password123!");
  console.log("  Admin: admin@coincaret.com / AdminPassword123!");
  console.log("  KYC Status: EXEMPT (kycRequired = false for demo accounts)");
  console.log("  KYC_REQUIRED: false (platform default — toggle in /admin/settings)");
  console.log("  KYC_REVIEW_MODE: automatic (platform default — toggle in /admin/settings)");
  console.log("-------------------------------------------------------");
  console.log("Demo Portfolio (user@coincaret.com):");
  console.log("  CC:   5,000.00000000");
  console.log("  BTC:     0.15000000");
  console.log("  ETH:     2.50000000");
  console.log("  SOL:    35.00000000");
  console.log("  BNB:     8.00000000");
  console.log("  LTC:    12.50000000");
  console.log("  XRP:  1,500.00000000");
  console.log("  DOGE: 8,000.00000000");
  console.log("-------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
