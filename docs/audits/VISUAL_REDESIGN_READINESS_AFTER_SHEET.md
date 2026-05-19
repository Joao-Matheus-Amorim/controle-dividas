# Visual redesign readiness after Sheet rollout

## Status

Documental audit for the next safe visual-design steps.

Related issue: #283
Correction issue: #285
Sync issue: #291

References:

- ADR 0003: `docs/adr/0003-design-system-and-shadcn-adoption.md`
- Broad redesign backlog: #80
- Sheet primitive rollout: #272
- Create form migration: #274
- Edit form migration: #276
- Destructive confirmation guard: #278
- Expense delete guard target fix: #280
- Unused expense delete dialog cleanup: #282
- Active expense edit Sheet migration: #288
- Unused expense edit dialog cleanup: #290

## Context

The product is now positioned as a SaaS-first, multi-tenant financial platform. Visual consistency is a product quality requirement, but the project should keep evolving through small, reviewable PRs.

ADR 0003 defines that shadcn/ui adoption must be controlled by layers and real usage. The recent Sheet rollout followed that rule:

- `Sheet` was added because it had immediate use in mobile form flows.
- Create form wrappers were migrated to `AppFormSheet`.
- Finance edit form dialog components were migrated to `Sheet` where they are active paths.
- The active expense edit flow in `components/finance/expense-list-client.tsx` was migrated to `Sheet`.
- Destructive delete confirmations were intentionally kept as `Dialog` and guarded.
- Unused expense delete/edit dialog components were removed after the active flows were identified and protected.

This means the project is ready for the next visual-design step, but not yet for a broad redesign PR.

## Current UI primitives

Versioned primitives currently include:

- `Alert`
- `Skeleton`
- `Separator`
- `Sheet`

Existing primitives already used before the Sheet rollout include:

- `Button`
- `Badge`
- `Card`
- `Checkbox`
- `Dialog`
- `DropdownMenu`
- `Input`
- `Label`
- `Select`
- `Table`

## Current Sheet and Dialog policy

### Use Sheet for creation and edition forms

Creation and edit form containers should use Sheet where they are active user-facing form flows. Sheet improves mobile ergonomics and keeps long forms scrollable without feeling like desktop-centered modals.

Covered create flows:

- family member
- expenses
- payable bills / debts
- bank accounts
- receivable incomes
- family users

Covered active edit flows:

- expenses, via `components/finance/expense-list-client.tsx`
- payable bills / debts
- bank accounts
- expense categories
- receivable incomes

### Keep Dialog for destructive confirmations

Destructive flows remain Dialog-based for now.

Reasoning:

- deletion is not a normal form flow;
- the UI requires explicit confirmation;
- the centered modal reinforces the seriousness of the action;
- changing this pattern should be a specific UX decision, not a side effect of Sheet rollout.

Current protected destructive flows:

- active expense deletion inside `components/finance/expense-list-client.tsx`;
- payable bill deletion inside `components/finance/payable-bill-delete-dialog.tsx`.

## What is ready

The project now has a clearer baseline for mobile financial forms:

- form containers are more consistent;
- create flows have a shared Sheet direction;
- active financial edit flows have a shared Sheet direction;
- destructive confirmations are intentionally separate;
- tests guard the current form-container choices;
- the broad #80 redesign issue can now be split into smaller, safer follow-up issues.

## What is not ready yet

The project is not ready for a single broad redesign PR.

Remaining risks:

- visual tokens are not formally documented;
- spacing, radius, shadows and color usage are still mostly implicit in components;
- dashboard, lists and cards have not been audited as a full visual system;
- empty, loading and error states may still vary across modules;
- mobile navigation and advanced SaaS flows still need separate UX decisions;
- destructive-confirmation UX has an intentional but narrow guard, not a full design decision record.

## Recommended next PRs

### 1. Document visual tokens and component conventions

Create a small documentation-only PR that records current conventions:

- primary accent;
- surface colors;
- card radius;
- button radius;
- form container behavior;
- Sheet vs Dialog policy;
- spacing guidelines for mobile-first screens.

No UI changes.

### 2. Audit dashboard visual hierarchy

Audit the dashboard separately before changing it.

Expected output:

- current cards and summaries;
- hierarchy problems;
- mobile readability risks;
- proposed small PR sequence.

No broad redesign.

### 3. Audit financial list visual consistency

Audit list patterns across:

- expenses;
- payable bills / debts;
- receivable incomes;
- banks;
- people.

Expected output:

- repeated patterns;
- inconsistencies;
- candidate shared components;
- risks if abstracted too early.

### 4. Decide destructive confirmation UX explicitly

Keep current Dialog behavior for now.

Only revisit if there is a clear UX reason and a dedicated issue.

## Recommendation for #80

Do not close #80 yet.

Treat #80 as the broad umbrella for the future visual redesign system. The next work should decompose it into small issues and PRs, starting with documentation/audit before visual changes.

Recommended immediate follow-up:

```txt
Document visual design tokens and component conventions
```

That follow-up should be documentation-only and should not include broad visual redesign.
