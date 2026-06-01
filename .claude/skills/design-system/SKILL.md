---
name: design-system
description: >-
  Aplica a direção visual cinematográfica-híbrida do FamilyFinance (Ink + Copper
  + Ivory, dark-first). Use ao estilizar, redesenhar ou criar telas/componentes,
  ajustar tokens, dar profundidade cinematográfica, micro-interações ou feeling
  nativo mobile. Garante uso dos tokens --ff-*, evita roxo/glass/neon legados e
  não quebra os guard tests.
---

# Design System — Ink + Copper + Ivory (cinematográfico-híbrido)

Direção adotada em PR #764. Spec canônica:
`docs/design/redesign-2026-ink-copper-ivory.md`. Regras de código/workflow:
`CLAUDE.md` na raiz. Esta skill é o guia prático de aplicação.

**Princípio:** base editorial quente intocável + profundidade cinematográfica
**governada**. Cobre como único metal de destaque. Restrição é o design.

## Tokens — cheatsheet (não usar hex solto)

Fonte única: `--ff-*` em `app/globals.css`. shadcn vars são aliases.

| Quer | Classe Tailwind |
|---|---|
| Fundo app / seção afundada | `bg-background` / `bg-ff-bg-soft` |
| Superfície (card, painel) | `bg-card` |
| Texto corpo / secundário / terciário | `text-foreground` / `text-muted-foreground` / `text-ff-subtle-foreground` |
| Borda padrão / forte | `border-border` / `border-ff-border-strong` |
| Ação primária (cobre) | `bg-primary text-primary-foreground hover:bg-ff-primary-hover` |
| Badge/realce cobre | `bg-ff-primary-soft text-ff-primary` |
| Sucesso / aviso / destrutivo / info | `text-ff-success` · `text-ff-warning` · `text-ff-destructive` · `text-ff-info` (cada um tem `-soft` p/ bg) |
| Raio | `rounded-ff-md` (botões/inputs) · `rounded-ff-xl` (cards) · `rounded-ff-2xl` (hero) |
| Sombra | `shadow-ff-xs/sm/md/lg` (quente, sem glow) |
| Motion | `duration-ff-fast/base/slow` + `ease-out` ou `ease-ff-spring` |
| Press tátil | classe `.app-soft-press` (= `active:scale-[0.98]`) |

## Permitido vs proibido (o "híbrido")

**Profundidade cinematográfica — SÓ em hero, overlays e backdrops:**
- Gradiente ink em camadas (ex.: `#1A1614 → #14110F → #0F0D0B`).
- **Um** glow de cobre em alpha baixa: `rgb(var(--ff-primary) / 0.18)` num
  `radial-gradient` no canto, atrás do conteúdo.
- `shadow-ff-lg`, borda `border-border`, `rounded-ff-2xl`.
- `backdrop-blur-sm` permitido **apenas** no *backdrop* de Dialog/Sheet.

**Proibido como identidade (anti-padrões rejeitados na spec):**
- `backdrop-blur` em superfície de conteúdo · glow neon · gradiente radial roxo.
- alpha-on-black: `bg-white/[0.0x]`, `border-white/10`, `text-white/25`.
- roxo `#8b72f8`/`#b09cff` · verde neon `#1de9b2` · vermelho `#f0506e` · preto
  puro `#000` · tokens `--app-*` (deprecados).

## Feeling nativo (mobile-first)

- Safe area inferior: `pb-[env(safe-area-inset-bottom)]` (já no bottom nav do
  AppShell — `components/app/app-shell.tsx`).
- Bottom nav flat iOS edge-to-edge; ativo em `--primary` + barra 2px no topo da
  tab. Não voltar a pill flutuante.
- Alvos de toque ≥ 44px; botão `lg` = 44px.
- Micro-feedback: `.app-soft-press` em itens pressionáveis; entrada com
  `app-fade-up` (já existe).

## Estado da migração

**Fases 1–3 concluídas.** Todo `components/dashboard/*`, Button, AppShell e
primitives estão em tokens `--ff-*`. Não reescrever nenhum arquivo já migrado
sem confirmar legado com grep primeiro.

**Fase 4 — demais telas** (próxima frente). Domínios: Pessoas, Gastos, Contas a
pagar/receber, Bancos, Relatórios, Configurações, Admin.

Alvo imediato ao abrir Fase 4:
- `components/app/app-form-sheet.tsx` → trigger `bg-[#8b72f8]` ⇒ `bg-primary`.
- `components/finance/*` — verificar com grep antes de editar.

## Receita de migração (Fase 4 em diante)

Antes de editar qualquer arquivo, confirme legado com grep:
```bash
grep -rn "#8b72f8\|#b09cff\|#1de9b2\|#f0506e\|#f7b84b\|#080810\|border-white/\|text-white/\|bg-white/" components/app/ components/finance/ app/
```

Mapa de troca (puramente visual — não mexer em props/lógica):

| Legado | Token |
|---|---|
| `#8b72f8` / `bg-[#8b72f8]` | `bg-primary` |
| `#b09cff` / `text-[#b09cff]` | `text-primary` |
| `#1de9b2` | `text-ff-success` / `bg-ff-success-soft` |
| `#f0506e` | `text-ff-destructive` / `bg-ff-destructive-soft` |
| `#f7b84b` | `text-ff-warning` / `bg-ff-warning-soft` |
| `border-white/10` | `border-border` |
| `bg-white/[0.04–0.07]` / `bg-[#080810]/45` | `bg-ff-bg-soft` |
| `text-white` (corpo) | `text-foreground` |
| `text-white/25–35` | `text-ff-subtle-foreground` |
| `text-white/30–45` | `text-muted-foreground` |
| `rounded-2xl` (superfície) | `rounded-ff-md` ou `rounded-ff-lg` |
| `shadow-[0_30px_90px_...]` | `shadow-ff-lg` |

## Antes de fazer push (obrigatório)

1. **Guard tests.** Migração de classe quebra `__tests__/unit/*-guard.test.ts`
   em silêncio (eles afirmam substrings literais). Rode:
   `grep -r "toContain.*<classe-antiga>" __tests__/unit/` e atualize a asserção
   no mesmo commit. Suspeitos da hero: `dashboard-ui-contract-guards.test.ts`,
   `dashboard-summary-visual-fixture-guards.test.ts`.
2. **Escopo visual puro.** Não alterar props, queries, RLS, rotas, billing ou
   regra de negócio num PR de design.
3. **Branch de `main` atualizada**, 1 fase = 1 PR pequeno (document-first).
4. Gate: `npm run lint && npm run typecheck && npm run test && npm run build`.

## Onde mexer

- Tokens: `app/globals.css` (`--ff-*`) + mapeamento em `tailwind.config.ts`.
- Primitives: `components/ui/*` (sem regra de negócio).
- Shell/genéricos: `components/app/*`.
- Telas: `components/<domínio>/*`, `features/protected-pages/*` (só classes).
- Nunca: hooks, `lib/*`, server actions, schema, migrations.
