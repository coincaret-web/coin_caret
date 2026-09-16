import { PrismaClient, RoleName, AccountType, TransactionType, TransactionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Coin Caret Database Seeding...");

  // 1. Ensure Roles exist
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
      create: {
        name: r,
        description: `Institutional role: ${r}`,
      },
    });
  }

  // 2. Ensure Native CC Asset exists
  const asset = await prisma.asset.upsert({
    where: { symbol: "CC" },
    update: {},
    create: {
      symbol: "CC",
      name: "Coin Caret Native Currency",
      type: "NATIVE_COIN",
      decimals: 8,
      isActive: true,
    },
  });

  // 3. Ensure System Treasury & Fee Accounts exist (walletId: null)
  let treasuryAcc = await prisma.ledgerAccount.findFirst({
    where: {
      walletId: null,
      accountType: AccountType.SYSTEM_TREASURY,
      assetId: asset.id,
    },
  });

  if (!treasuryAcc) {
    treasuryAcc = await prisma.ledgerAccount.create({
      data: {
        walletId: null,
        accountType: AccountType.SYSTEM_TREASURY,
        assetId: asset.id,
      },
    });
  }

  let gasFeeAcc = await prisma.ledgerAccount.findFirst({
    where: {
      walletId: null,
      accountType: AccountType.SYSTEM_GAS_FEE,
      assetId: asset.id,
    },
  });

  if (!gasFeeAcc) {
    gasFeeAcc = await prisma.ledgerAccount.create({
      data: {
        walletId: null,
        accountType: AccountType.SYSTEM_GAS_FEE,
        assetId: asset.id,
      },
    });
  }

  // 4. Create Platform Owner (Admin)
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
        profile: {
          create: {
            themePreference: "dark",
            currencyDisplay: "USD",
          },
        },
        roles: {
          create: {
            roleId: adminRole!.id,
          },
        },
      },
    });
  }

  // 5. Create Demo User
  const demoEmail = "user@coincaret.com";
  const demoPassHash = await bcrypt.hash("Password123!", 12);
  const userRole = await prisma.role.findUnique({ where: { name: RoleName.USER } });

  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
    include: { wallets: { include: { addresses: true, ledgerAccounts: true } } },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: demoPassHash,
        displayName: "Apex Digital Capital",
        profile: {
          create: {
            themePreference: "dark",
            currencyDisplay: "USD",
          },
        },
        roles: {
          create: {
            roleId: userRole!.id,
          },
        },
      },
      include: { wallets: { include: { addresses: true, ledgerAccounts: true } } },
    });
  }

  // Ensure Demo User has a Wallet and CC0x address
  let userWallet = await prisma.wallet.findFirst({
    where: { userId: demoUser.id },
    include: { addresses: true, ledgerAccounts: true },
  });

  if (!userWallet) {
    userWallet = await prisma.wallet.create({
      data: {
        userId: demoUser.id,
        assetId: asset.id,
        label: "Primary Institutional Vault",
        addresses: {
          create: {
            address: "CC0x7a89bc234def567890123456789abcdef0123456",
            isPrimary: true,
          },
        },
        ledgerAccounts: {
          createMany: {
            data: [
              { accountType: AccountType.AVAILABLE, assetId: asset.id },
              { accountType: AccountType.RESERVED_PENDING, assetId: asset.id },
            ],
          },
        },
      },
      include: { addresses: true, ledgerAccounts: true },
    });
  }

  // Fund Demo Wallet with 5,000 CC Available
  const availableAcc = userWallet.ledgerAccounts.find((a) => a.accountType === AccountType.AVAILABLE);

  const existingEntries = await prisma.ledgerEntry.findMany({
    where: { accountId: availableAcc?.id },
  });

  if (existingEntries.length === 0 && availableAcc && treasuryAcc) {
    const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
    const fundingTx = await prisma.transaction.create({
      data: {
        txHash,
        idempotencyKey: `seed-mint-${Date.now()}`,
        type: TransactionType.TREASURY_MINT,
        status: TransactionStatus.CONFIRMED,
        assetId: asset.id,
        fromAddress: "SYSTEM_TREASURY",
        toAddress: userWallet.addresses[0]?.address ?? "CC0x7a89bc234def567890123456789abcdef0123456",
        amount: 5000.0,
        fee: 0.0,
        totalDebit: 5000.0,
        note: "Institutional Genesis Allocation",
        confirmations: 3,
        blockHeight: BigInt(14280),
      },
    });

    await prisma.ledgerEntry.createMany({
      data: [
        {
          transactionId: fundingTx.id,
          accountId: treasuryAcc.id,
          debit: 0,
          credit: 5000.0,
        },
        {
          transactionId: fundingTx.id,
          accountId: availableAcc.id,
          debit: 5000.0,
          credit: 0,
        },
      ],
    });

    console.log("💰 Funded user@coincaret.com with 5,000.00000000 CC!");
  }

  console.log("✅ Coin Caret Database Seeding Completed Successfully.");
  console.log("-------------------------------------------------------");
  console.log("Demo Credentials:");
  console.log("1. User:  user@coincaret.com  / Password123!");
  console.log("2. Admin: admin@coincaret.com / AdminPassword123!");
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
