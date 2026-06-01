---
name: ui-ux-expert
description: >-
  Padrões de interação e UX do FamilyFinance (mobile-first, dark editorial).
  Use ao construir/ajustar formulários financeiros, decidir Dialog vs Sheet,
  estados (loading/empty/erro), feedback de ação, otimismo com useOptimistic,
  acessibilidade financeira e micro-interações táteis. Reutiliza os wrappers
  components/app/* e components/finance/* — não inventa um segundo sistema.
---

# UI/UX expert — FamilyFinance

Trabalha junto com `design-system` (tokens/visual) e `CLAUDE.md` (regras). Aqui
o foco é **comportamento e composição**, reusando os componentes que já existem.

## Use o que já existe (não duplique)

`components/app/*` é o vocabulário genérico do app:
- `AppShell` — layout protegido (header sticky + nav desktop pill + bottom nav
  mobile com safe-area). Não recriar navegação.
- `AppPageHeader`, `AppCard` (+ `AppHeroCard`, `AppStatCard`), `AppEmptyState`,
  `AppSkeleton`, `AppDataTable`, `AppActionFeedback`.
- `AppFormDialog` / `AppFormSheet` — gatilho + container de formulário.

`components/finance/*` tem os forms de domínio reais (expense, payable-bill,
bank-account, family-member, receivable-income, permissions…). Reaproveite e
componha; só crie em `components/finance` o que for **realmente compartilhado**
entre módulos.

## Dialog vs Sheet (regra do projeto)

- **Dialog** → confirmação focada ou form compacto.
- **Sheet** → fluxo com mais altura ou cara de painel mobile/lateral. No mobile,
  `AppFormSheet` abre de baixo (`side="bottom"`, `max-h-[88vh]`), no desktop
  vira painel à direita.
- Não converter Dialog↔Sheet por gosto visual — só com razão de UX.
- Forms data-changing **preservam validação, cleanup e expectativas de teste**.

## Formulários financeiros

- Validação e erro **sempre visíveis**; nada de submit silencioso.
- Estados destrutivos sem ambiguidade (ex.: `payable-bill-delete-dialog`
  confirma explicitamente). Use cor `ff-destructive`, nunca vermelho neon.
- **`useOptimistic` (React 19)** cabe em listas/toggles de escrita (ex.: marcar
  conta como paga) para resposta instantânea — mas o estado real vem da server
  action; otimismo é só UI. **Não** esconda mudança de lógica/dados num PR de
  design.
- Botão de submit no mobile ≥ 44px (`size="lg"`), `.app-soft-press` para feedback.

## Estados de tela (sempre os três)

1. **Loading** → `AppSkeleton` / `Skeleton`, nunca tela em branco.
2. **Empty** → `AppEmptyState` com ação clara para o primeiro registro.
3. **Erro** → mensagem legível + caminho de recuperação; preservar contraste dark.

Feedback de ação concluída → `AppActionFeedback` (não usar alert nativo).

## Acessibilidade financeira (não-negociável)

- Contraste AA (tokens já garantem); foco visível (`ring-ring/30`).
- **Contexto de organização ativa sempre explícito** (`ActiveOrganizationIndicator`
  no shell) — usuário nunca em dúvida sobre qual org está editando.
- `AppCard interactive` exige `role` + `tabIndex` (a11y).
- Sem estado sensível de permissão escondido; ação destrutiva sempre confirmada.

## Dívidas de UI conhecidas (legado, migrar ao tocar)

Spots ainda no roxo/glass legado — ao editar a área, confirme a ocorrência por
busca local e migre para tokens (ver skill `design-system`):
- `components/app/app-form-sheet.tsx` → trigger `bg-[#8b72f8]` ⇒ `bg-primary`.
- `components/dashboard/*` → somente seções que ainda contenham `--app-*`,
  `backdrop-blur`, `bg-white/*`, `border-white/*`, `text-white/*`,
  hex roxo/indigo/violet fixo ou superfícies glass. Preserve
  `components/dashboard/dashboard-hero-summary.tsx`, que já está migrado.

## Antes do push

- Escopo **visual/UX puro** num PR de design; lógica/dados em PR separado.
- Rode os guard tests de contrato: `dashboard-ui-contract-guards`,
  `finance-form-ui-contract-guards`, `finance-list-ui-contract-guards`,
  `create-form-sheet-guards`, `edit-form-sheet-guards`, `delete-dialog-guards`,
  `ui-primitives-guards` — eles afirmam substrings literais; atualize asserções
  no mesmo commit se mudar classes/estrutura.
- `npm run lint && npm run typecheck && npm run test && npm run build`.
