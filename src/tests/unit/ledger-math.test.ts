import { describe, it, expect } from "vitest";
import { calculateTransferEntries, deriveAccountBalance } from "@/modules/ledger/service/ledger-math";
import { Decimal } from "@prisma/client/runtime/library";

describe("Double-Entry Ledger Invariants & Precision (W-104)", () => {
  it("ensures transfer ledger entries strictly balance to zero (Debits == Credits)", () => {
    const amount = new Decimal("100.00000000");
    const fee = new Decimal("0.50000000");

    const entries = calculateTransferEntries({
      senderAvailableAccountId: "acc-sender-avail",
      recipientAvailableAccountId: "acc-recipient-avail",
      feeAccountId: "acc-fee-pool",
      amount,
      fee,
    });

    expect(entries).toHaveLength(3);

    // Sum of debits and credits across the transaction
    const totalDebits = entries.reduce((sum, e) => sum.plus(e.debit), new Decimal(0));
    const totalCredits = entries.reduce((sum, e) => sum.plus(e.credit), new Decimal(0));

    // In double-entry: sum of all debits must equal sum of all credits
    expect(totalDebits.toFixed(8)).toBe("100.50000000");
    expect(totalCredits.toFixed(8)).toBe("100.50000000");
    expect(totalDebits.minus(totalCredits).isZero()).toBe(true);
  });

  it("accurately derives balance from debit and credit journal postings", () => {
    const postings = [
      { debit: new Decimal("500.00000000"), credit: new Decimal("0") }, // +500 received
      { debit: new Decimal("0"), credit: new Decimal("100.50000000") }, // -100.50 sent
      { debit: new Decimal("25.00000000"), credit: new Decimal("0") },  // +25 received
    ];

    const balance = deriveAccountBalance(postings);
    expect(balance.toFixed(8)).toBe("424.50000000");
  });
});
