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

## Receita: migrar a Dashboard hero (Fase 3 — ainda legada)

`components/dashboard/dashboard-hero-summary.tsx` hoje usa roxo/glass legado.
Alvo (puramente visual, sem mexer em props/lógica):

```tsx
// container hero — troca o gradiente roxo + alpha-on-black por ink+cobre
<section className="relative overflow-hidden rounded-ff-2xl border border-border bg-card p-6 shadow-ff-lg">
  {/* glow de cobre governado, atrás do conteúdo */}
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage:
        "radial-gradient(circle at 85% 12%, rgb(var(--ff-primary) / 0.18), transparent 38%), linear-gradient(145deg, rgb(var(--ff-bg-soft)) 0%, rgb(var(--ff-card)) 60%, rgb(var(--ff-bg)) 100%)",
    }}
  />
  <div className="relative">
    {/* número herói */}
    <p className="text-4xl font-black tracking-[-0.04em] text-foreground md:text-6xl">…</p>
    {/* tiles: trocar bg-white/[0.055] border-white/10 por: */}
    <div className="rounded-ff-lg border border-border bg-ff-bg-soft p-3">
      <p className="text-caption text-ff-subtle-foreground">Gasto</p>
      <p className="mt-1 text-sm font-bold text-foreground">…</p>
    </div>
    {/* badge saudável/atenção: */}
    <span className="rounded-full bg-ff-success-soft px-3 py-1.5 text-caption font-bold text-ff-success">saudável</span>
    {/* barra de progresso: bg-white/10 → bg-muted ; fill bg-[#8b72f8] → bg-primary */}
  </div>
</section>
```

Mapa de troca direto:
`#8b72f8`→`bg-primary` · `#1de9b2`→`text-ff-success` · `#f0506e`→`text-ff-destructive`
· `#f7b84b`→`text-ff-warning` · `border-white/10`→`border-border` ·
`bg-white/[0.055]`→`bg-ff-bg-soft` · `text-white/25|35`→`text-ff-subtle-foreground`.

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
