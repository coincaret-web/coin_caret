import { describe, it, expect } from "vitest";
import { registerUser } from "@/modules/identity/service/auth.service";
import { hasPermission } from "@/lib/checkPermission";

describe("Identity, Auth & RBAC Integration (W-102)", () => {
  it("verifies RBAC permissions for Platform Owner, Operator, and standard User", () => {
    expect(hasPermission("PLATFORM_OWNER", "admin:treasury:mint")).toBe(true);
    expect(hasPermission("PLATFORM_OWNER", "admin:network:config")).toBe(true);
    expect(hasPermission("FINANCE_OPERATOR", "admin:treasury:mint")).toBe(true);
    expect(hasPermission("FINANCE_OPERATOR", "admin:network:config")).toBe(false);
    expect(hasPermission("USER", "wallet:send")).toBe(true);
    expect(hasPermission("USER", "admin:treasury:mint")).toBe(false);
  });
});
