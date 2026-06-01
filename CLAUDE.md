# CLAUDE.md — FamilyFinance (controle-dividas)

Guia operacional para agentes neste repo. Específico desta stack e deste
estado. Quando este arquivo divergir de um doc vivo em `docs/`, o doc vivo
vence (ver README → "Fontes oficiais de decisão").

## O que é

SaaS financeiro **multi-tenant, mobile-first**, dark-first editorial. Origem
familiar é só contexto histórico; a direção é ADR 0001 (SaaS-first).

Stack: **Next.js 16.2.6 (App Router) · React 19 · TypeScript 5.9 · Tailwind 3.4
· shadcn/ui sobre Radix · Supabase (Auth + Postgres + RLS organization-aware) ·
Vitest/Playwright/MSW · Vercel + GitHub Actions**. Stripe está cabeado em
`lib/billing/stripe-config.ts` mas **billing não roda** — não ative.

## Regras não-negociáveis (da fase atual)

```
Segurança acima de velocidade.
PR pequeno. Issue antes do PR.
Sem mudança funcional escondida em PR documental.
Sem billing antes de isolamento, UX multi-org e permissões amadurecerem.
Rotas por orgSlug seguem ADR 0007; /protected fica como compat transicional.
Sem remover owner_id antes de preflight, dry-run, gates e rollback.
```

## Direção de design — Ink + Copper + Ivory (HÍBRIDO cinematográfico)

Adotada e shippada em PR #764. Spec completa:
`docs/design/redesign-2026-ink-copper-ivory.md`. Baseline:
`docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md`.

- **Base intocável:** ink `#14110F` (bg), copper `#C68E4D` (primary), ivory
  `#F2EAD6` (texto). Cinzas e acentos **quentes**. Dark é a identidade; o tema
  paper claro é opt-in via `ThemeSwitcher`.
- **Tokens = fonte única.** `--ff-*` em `app/globals.css` são a verdade; os
  tokens shadcn (`--primary`, `--background`, …) são **aliases**. Trocar paleta
  = editar `--ff-*`, nunca os aliases nem hex no componente.
- **Namespace Tailwind:** use semânticos (`bg-card`, `text-foreground`,
  `border-border`, `bg-primary`) e os estendidos `ff-*`
  (`bg-ff-bg-soft`, `text-ff-subtle-foreground`, `bg-ff-primary-soft`,
  `border-ff-border-strong`, `text-ff-success`, etc). Radius `rounded-ff-*`,
  sombra `shadow-ff-*`, motion `duration-ff-*` / `ease-ff-spring`.
- **Cinematográfico = profundidade quente governada, NÃO glass/neon.**
  Permitido **só em superfícies hero, overlays e backdrops**: gradiente ink em
  camadas + 1 glow de **cobre** em alpha baixa (`rgb(var(--ff-primary)/0.18)`),
  `shadow-ff-lg`, `active:scale-[0.98]` (use `.app-soft-press`).
  **Proibido como identidade geral:** `backdrop-blur` em superfície (ok só no
  *backdrop* de dialog/sheet), glow neon, gradiente radial roxo, alpha-on-black
  (`bg-white/[0.0x]`, `border-white/10`), roxo `#8b72f8`/`#b09cff`, verde neon
  `#1de9b2`, preto puro `#000`.
- **Feeling nativo:** safe areas (`pb-[env(safe-area-inset-bottom)]`), bottom
  nav flat iOS já no AppShell, micro-feedback `active:scale-95/98`, alvos de
  toque ≥ 44px no mobile.

### Estado da migração (importante)

Fases 1–2 feitas (tokens + AppShell + primitives). **Fase 3 = Dashboard ainda
NÃO migrada:** `components/dashboard/*` (sobretudo `dashboard-hero-summary.tsx`)
ainda usa a identidade roxa/glass legada e os tokens `--app-*` (deprecados,
removidos na Fase 5). Migrá-los para `--ff-*` + profundidade de cobre é o
trabalho cinematográfico real. Fase 4 = demais telas. Fase 5 = remover `--app-*`
e grep-verificar zero hex legado.

## Convenções de código

- **Server Components por padrão** (RSC ligado). `"use client"` só quando há
  estado/efeito/interação. `useOptimistic` (React 19) cabe em forms client de
  escrita — sem esconder mudança de lógica num PR de design.
- **Fronteiras de pasta (ADR 0003):**
  - `components/ui` → primitives shadcn, **sem regra de negócio**.
  - `components/app` → componentes internos genéricos (AppShell, AppCard…).
  - `components/finance` → forms/dialogs financeiros **só quando realmente
    compartilhados**; não virar balde visual genérico.
  - `components/<domínio>` → seções visuais daquele domínio.
  - Lógica/dados (hooks, server actions, `lib/*`, queries, schema) é território
    funcional — não misturar com PR de design.
- **Isolamento design × código.** Trabalho de design toca:
  `app/globals.css`, `tailwind.config.ts`, `components/ui/*`,
  `components/app/*`, listas de classe JSX (visual) e `docs/design/*`. Se um
  arquivo mistura visual + lógica, **pare e extraia o visual** para um novo
  componente antes de editar.
- **Multi-tenant sempre.** Toda query/action financeira é escopada pela
  organização ativa; `organization_id` é obrigatório; RLS é por membership.

## Guard tests — leia antes de migrar tokens

`__tests__/unit/*-guard.test.ts` leem o **código-fonte** e afirmam substrings
literais de classe Tailwind (ex.: `expect(source).toContain("border-white/10")`)
e invariantes de doc (`visual-tokens-doc-guards`, `dashboard-ui-contract-guards`,
`ui-primitives-guards`). Uma migração de token **quebra esses testes em
silêncio**. Antes de push de PR de design:

1. `grep -r "toContain.*<classe-antiga>" __tests__/unit/`.
2. Se houver match, atualize a asserção **no mesmo commit/PR** da troca.
3. Ofensores comuns: `border-white/10`, `bg-white/5`, `bg-white/[0.045]`,
   `text-white/25`, `bg-[#080810]`, `text-[#b09cff]`, `#8b72f8`.

## Workflow (PMBOK, document-first)

1. Branch sempre a partir de `main` atualizada (`git checkout main && git pull`).
   Em divergência: rebase em `origin/main` + `push --force-with-lease`. Nunca
   merge-commit, nunca misturar código e design.
2. Document-first: escreve/ajusta `docs/design/*`, valida com o usuário, depois
   migra AppShell/uma tela piloto, depois o resto. Cada fase = 1 PR pequeno.
3. Antes de PR de design, confirme que o escopo é **puramente visual**.

## Comandos

```bash
npm run dev          # next dev
npm run lint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (inclui guard tests)
npm run build
npm run test:e2e     # playwright (fluxos autenticados são gated/off por padrão)
```

Gate antes de qualquer PR: `npm audit --audit-level=moderate && npm run lint &&
npm run typecheck && npm run test && npm run build`.

## Skills deste projeto

- `.claude/skills/design-system/` — direção visual cinematográfica-híbrida,
  cheatsheet de tokens `--ff-*` e receitas de profundidade governada.
- `.claude/skills/ui-ux-expert/` — padrões de interação/UX, Dialog vs Sheet,
  estados de tela, `useOptimistic`, a11y financeira; reusa `components/app/*`.
- `.claude/skills/supabase-master/` — dados/segurança multi-tenant: escopo por
  organização ativa, RLS por membership, migrations, gates de hardening.
