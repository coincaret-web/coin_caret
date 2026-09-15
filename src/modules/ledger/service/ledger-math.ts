import { Decimal } from "@prisma/client/runtime/library";

export interface LedgerPostingInstruction {
  accountId: string;
  debit: Decimal;
  credit: Decimal;
}

export interface CalculateTransferEntriesInput {
  senderAvailableAccountId: string;
  recipientAvailableAccountId: string;
  feeAccountId: string;
  amount: Decimal;
  fee: Decimal;
}

/**
 * Computes double-entry journal entries for a transfer, ensuring:
 * Total Debits == Total Credits (Zero-sum balance invariant)
 */
export function calculateTransferEntries(
  input: CalculateTransferEntriesInput
): LedgerPostingInstruction[] {
  const totalDebit = input.amount.plus(input.fee);

  return [
    // 1. Debit total from Sender's Account
    {
      accountId: input.senderAvailableAccountId,
      debit: new Decimal(0),
      credit: totalDebit, // Credit decreases an asset/liability account depending on convention
    },
    // 2. Credit transfer amount to Recipient's Account
    {
      accountId: input.recipientAvailableAccountId,
      debit: input.amount,
      credit: new Decimal(0),
    },
    // 3. Credit fee to Network Gas Fee Pool Account
    {
      accountId: input.feeAccountId,
      debit: input.fee,
      credit: new Decimal(0),
    },
  ];
}

/**
 * Derives the active balance of an account from immutable journal postings.
 */
export function deriveAccountBalance(
  entries: Array<{ debit: Decimal | number | string; credit: Decimal | number | string }>
): Decimal {
  let balance = new Decimal(0);

  for (const entry of entries) {
    const debit = new Decimal(entry.debit);
    const credit = new Decimal(entry.credit);
    balance = balance.plus(debit).minus(credit);
  }

  return balance;
}
