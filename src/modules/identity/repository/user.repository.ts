import { prisma } from "@/lib/prisma";
import { User, RoleName } from "@prisma/client";

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      roles: {
        include: { role: true },
      },
      profile: true,
      wallets: {
        include: {
          addresses: true,
          ledgerAccounts: true,
        },
      },
    },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
    include: {
      roles: {
        include: { role: true },
      },
      profile: true,
    },
  });
}

export async function createUserWithRole(data: {
  email: string;
  passwordHash: string;
  displayName: string;
  roleName?: RoleName;
}) {
  const roleName = data.roleName ?? RoleName.USER;

  // Find or create the role
  let role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleName,
        description: `Standard ${roleName} role`,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      profile: {
        create: {
          themePreference: "dark",
          currencyDisplay: "USD",
        },
      },
      roles: {
        create: {
          roleId: role.id,
        },
      },
    },
    include: {
      roles: {
        include: { role: true },
      },
      profile: true,
    },
  });
}
