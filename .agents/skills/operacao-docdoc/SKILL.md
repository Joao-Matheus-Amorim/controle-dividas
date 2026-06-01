---
name: operacao-docdoc
description: >-
  Reconcile FamilyFinance project documentation after merges. Use when the user
  says "Operacao DocDoc", "DocDoc", "atualize a documentacao", "documentos
  atrasados", or asks to mark stale docs, update docs status, reconcile docs
  with current code/CI/migrations, or invalidate outdated documentation without
  deleting historical records.
---

# Operacao DocDoc

Use this skill to keep `docs/` aligned with the current codebase after merged
PRs. The goal is to reduce stale instructions for humans, Codex, Claude, and CI
review without deleting useful history.

## Default workflow

1. Fetch `origin/main`, inspect the latest merge point, and branch from current
   `origin/main`. Use a clean worktree when the main checkout has user changes.
2. Do not read or print `.env*` files.
3. Inventory the relevant documentation before editing:
   - `docs/README.md`
   - `docs/DOCUMENTATION_STATUS.md`
   - `docs/VALIDACAO_TECNICA.md`
   - `docs/SAAS_GAP_REGISTER.md`
   - `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_*.md`
   - docs directly touched by the latest PRs.
4. Prefer status labels over deletion:
   - `Atual`
   - `Parcialmente superado`
   - `Superado`
   - `Historico`
   - `Proposta`
5. When a document is stale, add or update a top note that says:
   - current status;
   - what supersedes it;
   - what it is still safe to use for.
6. Keep ADRs as historical decision records. If a decision changes, add a new
   ADR or mark the old ADR as superseded by a later ADR; do not rewrite history
   as if the older decision never existed.
7. Keep runtime evidence separate from product plans:
   - implementation state goes in `docs/VALIDACAO_TECNICA.md`;
   - gaps go in `docs/SAAS_GAP_REGISTER.md`;
   - active checklist work goes in `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_*.md`;
   - strategy/proposal docs must not be presented as production evidence.
8. Add or update a focused guard test when a new documentation contract matters.
9. Run only focused validation unless the user asks for a full suite.

## Scope boundaries

- Documentation/status/guard only by default.
- No product behavior changes.
- No migrations or RLS changes.
- No dependency updates.
- No broad formatting churn.
- No deletion unless the user explicitly asks and the replacement is clear.

## Output shape

For PR text, include:

```txt
## Contexto
## O que muda
## Validacao
## Escopo
```

Keep wording operational and neutral. Attribute branch/PR state to Joao Matheus
when writing handoff text.
