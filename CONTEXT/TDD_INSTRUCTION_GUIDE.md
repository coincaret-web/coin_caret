# TDD Instruction Guide: Coin Caret
## How to Write Checklists That Produce Rock-Solid, Fully Wired Financial Features

> **Who is this for?** Anyone — developer, tech lead, or AI assistant — working on the **Coin Caret** platform. If a new engineer reads this guide, they should be able to write an airtight, executable implementation checklist by the end of it.
>
> **Why does this exist?** Financial and Web3 applications cannot afford "phantom features" — code that appears green in loosely mocked tests but corrupts balances, drops transactions, or breaks in production. This guide enforces an uncompromising Test-Driven Development (TDD) protocol across backend ledger mechanics, background block generation, and frontend wallet UX.

---

## Part 1: The 5 Core Principles of Coin Caret TDD

### Principle 1: Bookend with "Root Cause" and "Verification Chain"

Every work item in `current_state.md` must be bookended:
- **Root Cause:** Answers *Why does this work item exist?* What ledger integrity, network lifecycle, or user experience problem does this solve?
- **Verification Chain:** Answers *What does end-to-end success look like from the user or blockchain explorer perspective?* (e.g., `User submits 50 CC send -> Available balance decrements immediately -> Transaction enters Mempool -> Block Generator packages Tx into Block #120 -> 3 confirmations occur -> Explorer displays Confirmed -> Recipient balance increases by 50 CC`).

---

### Principle 2: Demand a Confirmed RED State Before Implementation

- **The Rule:** A test must be written, executed, and confirmed **failing (RED)** before any feature logic or controller code is written.
- **Why?** A test that passes before implementation is either testing nothing or improperly mocked.
- **The Gate:** Every test instruction concludes with: `"Run — confirm RED."` Never proceed to GREEN without verifying the failure.

---

### Principle 3: Require Unit Tests AND Integration Tests

| Test Type | Scope & Purpose | Isolated? |
|:---|:---|:---:|
| **Unit Test (`*.service.test.ts`)** | Tests mathematical invariants in isolation (e.g., fee calculation, address checksum validation, fixed-point rounding, double-entry balance derivation). | Yes |
| **Integration Test (`*.integration.test.ts`)** | Tests the entire database transaction, API routes, Prisma transaction rollbacks, and queue event emission against the isolated test DB (`coin_caret_test`). | Real Test DB |
| **E2E Test (`*.spec.ts`)** | Tests browser user interaction, wallet connection, send/receive modals, and explorer verification using Playwright. | Full Stack |

---

### Principle 4: Explicit Architectural Tiers (DB -> Service -> API -> UI)

Checklists must explicitly outline each layer touched:
1. **Schema / Migration (`prisma/schema.prisma`):** Explicit migration name (e.g., `--name add_block_merkle_root`).
2. **Repository (`src/modules/*/repository/`):** Database queries using Prisma client; no direct business logic.
3. **Service (`src/modules/*/service/`):** Core business logic, balance validation, double-entry ledger postings (`Debits == Credits`), idempotency enforcement.
4. **Controller / Route Handler (`src/app/api/*/route.ts`):** Zod request validation, session/auth check, status codes, error serialization.
5. **Types (`src/types/`):** Shared TypeScript types for API payloads and ledger entities.
6. **Frontend Component (`src/components/`):** Responsive React UI components, forms, balance cards, animations (GSAP/Lenis), and modals.

---

### Principle 5: The "No Fake Pass" Rule

An item is only checked `[x]` when:
1. The test failed first (RED).
2. The code was implemented.
3. The test passed (GREEN) against the test database without mock compromises.
4. The **verification chain** passed in the browser or via automated E2E testing.

---

## Part 2: Standard Work Item Template for `current_state.md`

```markdown
#### W-[Phase][Index] — [Feature Name]

**Root cause:**
[1-2 sentences explaining why this feature/fix is needed]

**Goal:**
[Clear statement of what the system can do once completed]

**Approach:**
[High-level technical strategy across Repository, Service, API, and UI layers]

---

- [ ] **RED — Integration (`src/tests/integration/[feature].integration.test.ts`):**
  - [ ] Test: [Detailed test description: API endpoint / service call with inputs and expected outputs]
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend:**
  - [ ] [Schema] [Prisma model/field changes + migration name]
  - [ ] [Repository] [Query implementation in `src/modules/[module]/repository/[name].repository.ts`]
  - [ ] [Service] [Business logic, double-entry check, fee computation in `src/modules/[module]/service/[name].service.ts`]
  - [ ] [Controller] [Zod validation, RBAC/auth guard, API route in `src/app/api/[path]/route.ts`]
  - [ ] Run integration test — **confirm GREEN.**

- [ ] **RED — Unit / Component (`src/tests/unit/[feature].test.ts` or `src/tests/components/[component].test.tsx`):**
  - [ ] Test: [Math/invariant test or UI component render/interaction test]
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend:**
  - [ ] [Type] Update `src/types/[module].ts` with new API and DTO interfaces.
  - [ ] [Component] Implement/update UI component in `src/components/[path]/[name].tsx`.
  - [ ] Run unit/component test — **confirm GREEN.**

- [ ] **Verification chain:**
  - [ ] Step 1: [User action in UI or API request]
  - [ ] Step 2: [System ledger mutation and background block processing]
  - [ ] Step 3: [Observed UI state and Explorer confirmation]
  - [ ] ✅ Done.
```

---

## Part 3: Coin Caret Core Domain Rules (Must Enforce in Tests)

### Rule 1: Zero Float Arithmetic (Fixed-Point or BigInt Only)
- Never use JavaScript standard floating point numbers (`0.1 + 0.2 !== 0.3`) for currency calculations.
- All CC balances and fees must be stored as fixed-point integers in the smallest denomination (e.g., satoshis / micro-CC) or `Prisma.Decimal` / `BigInt`.

### Rule 2: Double-Entry Balancing on Every Financial Mutation
- Every transaction mutation MUST balance to zero: $\sum \text{Debits} == \sum \text{Credits}$.
- When User A sends 100 CC with a 0.50 CC fee:
  - Sender Available Account: `-100.50 CC`
  - Recipient Available Account: `+100.00 CC`
  - Network Gas/Fee Account: `+0.50 CC`
- Net ledger delta = `0.00 CC`.

### Rule 3: Atomic Balance Reservations (No Double-Spending)
- When a send request is accepted, the sender's funds (`amount + fee`) are immediately moved to a `Pending/Reserved` state within a single atomic database transaction (`prisma.$transaction`).
- The user cannot initiate a secondary transfer that spends the reserved balance.

### Rule 4: Idempotency Key Required on Financial Endpoints
- Every `POST /api/wallet/send` or withdrawal mutation must require an `Idempotency-Key` header.
- Resubmitting the same key must return the existing transaction payload without double-debiting.

### Rule 5: Pure Test Database Isolation (`.env.test`)
- Integration tests must NEVER run against development or production databases.
- Test runners (Vitest/Jest) must explicitly load `.env.test` with connection to `postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test`.
