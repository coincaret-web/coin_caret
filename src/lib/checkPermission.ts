export type PermissionCode =
  | "wallet:read:own"
  | "wallet:send"
  | "explorer:read"
  | "admin:users:manage"
  | "admin:treasury:mint"
  | "admin:withdraw:review"
  | "admin:network:config"
  | "admin:audit:read";

export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  PLATFORM_OWNER: [
    "wallet:read:own",
    "wallet:send",
    "explorer:read",
    "admin:users:manage",
    "admin:treasury:mint",
    "admin:withdraw:review",
    "admin:network:config",
    "admin:audit:read",
  ],
  OPERATIONS_ADMIN: [
    "wallet:read:own",
    "wallet:send",
    "explorer:read",
    "admin:users:manage",
    "admin:withdraw:review",
    "admin:audit:read",
  ],
  FINANCE_OPERATOR: [
    "wallet:read:own",
    "wallet:send",
    "explorer:read",
    "admin:treasury:mint",
    "admin:withdraw:review",
    "admin:audit:read",
  ],
  AUDITOR: [
    "explorer:read",
    "admin:audit:read",
  ],
  USER: [
    "wallet:read:own",
    "wallet:send",
    "explorer:read",
  ],
};

export function hasPermission(userRole: string, permission: PermissionCode): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}
