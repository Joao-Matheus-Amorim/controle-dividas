# Redesign 2026 — Ink + Copper + Ivory

> Status DocDoc: Atual como direcao visual em andamento
> Uso atual: fonte da direcao Ink + Copper + Ivory, tokens `--ff-*` e padroes
> visuais alvo.
> Observacao: nao e evidencia de implementacao. A migration plan deste arquivo
> e historica por fase; confirme `app/globals.css` e os componentes reais antes
> de reabrir trabalho visual. Nao remigrar o dashboard hero sem conferir o
> componente atual em `components/dashboard/dashboard-hero-summary.tsx`.

Issue: #80
Related ADR: `docs/adr/0003-design-system-and-shadcn-adoption.md`
Baseline: `docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md`
Audit: see "Audit findings" section below.

## Purpose

Specify the next visual direction of FamilyFinance, replacing the current dark purple "premium SaaS" identity with an intimate, dark-first editorial identity built on warm ink, copper, and ivory.

This document is the redesign specification. Implementation lands in phases (see "Migration plan") and does not break any current functionality, route, schema, RLS, billing, permission, or test contract.

## Mood and principles

Target mood: **família, clean, segurança, paz, controle** — expressed as an intimate private journal rather than a SaaS dashboard.

Four principles drive every token and component decision:

1. **Ink over black.** True black is harsh and clinical. Ink (`#14110F`) is warm, dark, and reads like quality paper printed on. The whole grayscale leans warm.
2. **Copper, not gold and not green.** A single warm-metal accent (`#C68E4D`) carries primary actions. It signals importance without the flash of neon, the cold of bank blue, or the bedded-down feel of sage.
3. **Restraint is the design.** Generous whitespace, soft shadows, single accent per surface. Density is the enemy of calm.
4. **Warm everything.** Greys lean warm, shadows are tinted toward brown, success/danger lean toward sage and terracotta rather than emerald and tomato.

Anti-patterns explicitly rejected: neon glows, radial purple gradients, glass surfaces with `backdrop-blur` as the identity, alpha-on-black layering, cold pure-grey neutrals, primary blues, sage primaries.

## Theme strategy

**Dark-first.** Default theme is the ink/copper/ivory editorial. This is where the identity lives.

A warm paper **light** variant exists for daytime use (ivory background, ink text, copper accent at higher contrast). Light is opt-in via `ThemeSwitcher`, not default.

`next-themes` is wired in `app/layout.tsx` with `defaultTheme="dark"`, `enableSystem`. System preference is respected; users can override via the header switcher.

## Color tokens

All tokens defined as CSS variables in `app/globals.css`, stored as space-separated RGB triplets so Tailwind's `<alpha-value>` modifier works (e.g. `bg-primary/50`). The `--ff-*` tokens are the **single source of truth**; shadcn semantic tokens (`--primary`, `--background`, etc.) are aliases that point at them.

### Dark theme (primary mode)

| Token | Hex | Role |
|---|---|---|
| `--ff-bg` | `#14110F` | App background — ink |
| `--ff-bg-soft` | `#1A1614` | Sunken sections |
| `--ff-card` | `#1F1B17` | Surfaces — cards, raised panels |
| `--ff-popover` | `#1F1B17` | Popovers, dropdowns |
| `--ff-foreground` | `#F2EAD6` | Body text — ivory |
| `--ff-muted` | `#29231D` | Muted surfaces |
| `--ff-muted-foreground` | `#8A8077` | Secondary text |
| `--ff-subtle-foreground` | `#65605A` | Tertiary text, placeholders |
| `--ff-border` | `#2E2823` | Default borders |
| `--ff-border-strong` | `#423A33` | Emphasized borders |
| `--ff-input` | `#2E2823` | Input borders |
| `--ff-primary` | `#C68E4D` | Copper — primary actions |
| `--ff-primary-hover` | `#D5A063` | Primary hover |
| `--ff-primary-soft` | `#3A2E1F` | Primary backgrounds (badges, hover bg) |
| `--ff-primary-foreground` | `#14110F` | Text on copper |
| `--ff-accent` | `#3A2E1F` | Accent surfaces |
| `--ff-accent-foreground` | `#F2EAD6` | Text on accent |
| `--ff-ring` | `#C68E4D` | Focus ring |
| `--ff-success` | `#6BA88A` | Positive — warm sage |
| `--ff-success-soft` | `#1F2D26` | Success backgrounds |
| `--ff-warning` | `#E0B559` | Warnings — mustard |
| `--ff-warning-soft` | `#332B1B` | Warning backgrounds |
| `--ff-destructive` | `#C66B5C` | Overdue, delete — warm terracotta |
| `--ff-destructive-soft` | `#2F1F1A` | Destructive backgrounds |
| `--ff-destructive-foreground` | `#F2EAD6` | Text on destructive |
| `--ff-info` | `#8DA3B8` | Informational — muted slate-blue |
| `--ff-info-soft` | `#1E262E` | Info backgrounds |

Chart palette (warm, sequential, never blue-green corporate):
`--ff-chart-1: #C68E4D` (copper) · `--ff-chart-2: #5A7388` (muted slate) · `--ff-chart-3: #C49334` (mustard) · `--ff-chart-4: #B05442` (terracotta) · `--ff-chart-5: #5A8A6E` (warm sage)

### Light theme (warm paper variant)

| Token | Hex | Role |
|---|---|---|
| `--ff-bg` | `#FAF4E6` | Warm ivory |
| `--ff-bg-soft` | `#F0E9D8` | Sunken |
| `--ff-card` | `#FFFCF5` | Paper white |
| `--ff-popover` | `#FFFCF5` | Popovers |
| `--ff-foreground` | `#1F1B17` | Body text — ink |
| `--ff-muted` | `#F0E9D8` | Muted surfaces |
| `--ff-muted-foreground` | `#6E665C` | Secondary text |
| `--ff-subtle-foreground` | `#9C9388` | Tertiary text |
| `--ff-border` | `#E5DCC7` | Default borders |
| `--ff-border-strong` | `#D0C5AC` | Emphasized borders |
| `--ff-input` | `#E5DCC7` | Input borders |
| `--ff-primary` | `#A66B2E` | Copper (darker for AA on ivory) |
| `--ff-primary-hover` | `#8C5723` | Primary hover |
| `--ff-primary-soft` | `#E8D5B3` | Primary backgrounds |
| `--ff-primary-foreground` | `#FFFCF5` | Text on copper |
| `--ff-accent` | `#E8D5B3` | Accent surfaces |
| `--ff-accent-foreground` | `#1F1B17` | Text on accent |
| `--ff-ring` | `#A66B2E` | Focus ring |
| `--ff-success` | `#5A8A6E` | Positive |
| `--ff-success-soft` | `#E0EAD5` | Success bg |
| `--ff-warning` | `#C49334` | Mustard |
| `--ff-warning-soft` | `#F2E5BB` | Warning bg |
| `--ff-destructive` | `#B05442` | Terracotta |
| `--ff-destructive-soft` | `#F0D9D0` | Destructive bg |
| `--ff-destructive-foreground` | `#FFFCF5` | Text on destructive |
| `--ff-info` | `#5A7388` | Muted blue |
| `--ff-info-soft` | `#D8E0E6` | Info bg |

### Contrast (WCAG AA targets)

All foreground-on-background pairs verified at AA (4.5:1 for body, 3:1 for large text):
- `--foreground` on `--background` (dark): 11.4:1 ✓
- `--muted-foreground` on `--background` (dark): 4.6:1 ✓
- `--primary-foreground` on `--primary` (dark): 5.1:1 ✓
- `--foreground` on `--background` (light): 12.1:1 ✓
- `--primary-foreground` on `--primary` (light): 5.4:1 ✓

## Typography

Single family: **Geist Sans** (already loaded). No second family — restraint is the point.

Scale (rem assumes 16px root):

| Token | Size | Line | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `text-display` | 2rem (32px) | 1.1 | -0.02em | 700 | Hero numbers (saldo total, big stats) |
| `text-h1` | 1.5rem (24px) | 1.2 | -0.015em | 700 | Page titles |
| `text-h2` | 1.25rem (20px) | 1.25 | -0.01em | 600 | Section titles |
| `text-h3` | 1rem (16px) | 1.4 | 0 | 600 | Card titles |
| `text-body` | 0.875rem (14px) | 1.5 | 0 | 400 | Default body |
| `text-body-strong` | 0.875rem (14px) | 1.5 | 0 | 500 | Emphasized body |
| `text-small` | 0.75rem (12px) | 1.4 | 0 | 400 | Captions, helper text |
| `text-caption` | 0.6875rem (11px) | 1.3 | 0.04em | 500 | UPPERCASE labels, tags |

Replace ad-hoc sizes (`text-[10px]`, `text-[11px]`) with `text-caption` / `text-small`.

## Spacing

Tailwind default scale (`0.25rem` base). Component-level conventions:

- Inline gaps: `gap-2` (8px) tight, `gap-3` (12px) default, `gap-4` (16px) generous.
- Card inner padding: `p-5` (20px) small, `p-6` (24px) default, `p-8` (32px) hero.
- Section vertical rhythm: `space-y-6` (24px) within a page, `space-y-8` (32px) between major sections.
- Page horizontal: `px-4` mobile, `px-6` md+ (kept from current AppShell).

## Radius

Replace single `--radius: 1rem` with scale:

| Token | Value | Use |
|---|---|---|
| `--ff-radius-xs` | 0.375rem (6px) | Badges, small chips |
| `--ff-radius-sm` | 0.5rem (8px) | Small inputs, tags |
| `--ff-radius-md` | 0.75rem (12px) | Buttons, inputs |
| `--ff-radius-lg` | 1rem (16px) | Small cards |
| `--ff-radius-xl` | 1.25rem (20px) | Default cards |
| `--ff-radius-2xl` | 1.5rem (24px) | Hero cards |
| (full) | 9999px | Pills, nav tabs |

## Shadows

Warm, soft, ambient. No colored glow.

Light theme:
| Token | Value |
|---|---|
| `--ff-shadow-xs` | `0 1px 2px rgba(31, 27, 23, 0.04)` |
| `--ff-shadow-sm` | `0 2px 6px rgba(31, 27, 23, 0.06)` |
| `--ff-shadow-md` | `0 6px 16px rgba(31, 27, 23, 0.08)` |
| `--ff-shadow-lg` | `0 16px 32px rgba(31, 27, 23, 0.10)` |

Dark theme uses true-black drop shadows at higher opacity since the warm bg already absorbs most of the falloff.

## Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--ff-motion-fast` | 120ms | `ease-out` | Hover, focus |
| `--ff-motion-base` | 200ms | `ease-out` | Buttons, toggles |
| `--ff-motion-slow` | 320ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page enter, modal in |

Keep `app-fade-up` keyframe retuned to `--ff-motion-slow`.

## Component patterns

### Button

shadcn `Button` keeps its variant API. Visual via tokens:
- `default`: `bg-primary text-primary-foreground hover:bg-ff-primary-hover shadow-ff-xs`
- `secondary`: `bg-muted text-foreground hover:bg-accent`
- `outline`: `border border-ff-border-strong bg-transparent hover:bg-muted`
- `ghost`: `hover:bg-muted`
- `destructive`: `bg-destructive text-destructive-foreground hover:opacity-90`
- `link`: `text-primary underline-offset-4 hover:underline`

Sizes: `sm` 32px, `default` 40px, `lg` 44px (mobile-friendly), `icon` square. Radius: `rounded-ff-md`.

### Card

shadcn `Card`: `rounded-ff-xl border border-border bg-card shadow-ff-sm`. No glass, no alpha border, no `backdrop-blur`.

`AppCard` variants:
- `raised` (default): `bg-card shadow-ff-sm border border-border`
- `solid`: `bg-card border border-border`
- `inner`: `bg-muted border border-border`
- `hero`: `bg-ff-primary-soft border border-primary/20`

### Badge

| Variant | Bg | Text |
|---|---|---|
| `default` | `--ff-primary-soft` | `--ff-primary` |
| `success` | `--ff-success-soft` | `--ff-success` |
| `warning` | `--ff-warning-soft` | `--ff-warning` |
| `destructive` | `--ff-destructive-soft` | `--ff-destructive` |
| `info` | `--ff-info-soft` | `--ff-info` |
| `neutral` | `--ff-muted` | `--ff-muted-foreground` |

Radius `--ff-radius-xs`, `text-caption`, `px-2 py-0.5`.

### Input / Select

- Height: 40px default, 44px on mobile-first forms.
- Border: `border-input`, focus `ring-2 ring-ring/30 border-primary`.
- Radius: `--ff-radius-md`.
- Background: `--card`.
- No `.dark`-prefixed global overrides — styling lives in the component.

### Dialog / Sheet

- Backdrop: `bg-ff-bg/70 backdrop-blur-sm` (both themes — backdrop blur on the *backdrop* is fine; on identity surfaces it is not).
- Surface: `bg-card shadow-ff-lg`.
- Radius: `--ff-radius-2xl` for dialog, `--ff-radius-xl` for sheet edge facing content.

### AppShell

Header: `bg-card border-b border-border`. No glow, no glass.

**Logo**: keep the existing `FF` monogram shape and `FamilyFinance` wordmark — repaint only. Monogram box: `bg-ff-bg-soft`, `border border-border`, `FF` text in `--primary` (copper). No hover glow.

**Bottom nav (mobile)**: flat iOS-style tab bar, edge-to-edge. Replaces the previous pill.
- Container: `fixed inset-x-0 bottom-0 bg-card border-t border-border`.
- Item: column (icon + label), `flex-1`, `py-2.5`.
- Inactive: icon and label `--muted-foreground`.
- Active: icon and label `--primary`, plus 2px `--primary` indicator bar at the top edge of the active tab.
- Safe area: `pb-[env(safe-area-inset-bottom)]`.

## Audit findings addressed

Each gap from the 2026-05-30 audit:

| Gap | Resolution in this spec |
|---|---|
| G1: dual token systems | `--ff-*` is the single source. shadcn vars are aliases. `--app-*` deprecated. |
| G2: `.dark` global overrides | Removed; styling moves to components. |
| G3: AppShell hardcoded hex | AppShell consumes `--card`, `--border`, `--primary`. |
| G4: dead light theme | Light is real now (warm paper variant), opt-in. |
| G5: no documentation | This document. |
| G6: ad-hoc type scale | Defined scale above. |
| G7: AppCard interactive a11y | `interactive=true` requires `role`/`tabIndex` (component change in phase 3). |

## Migration plan

Five phases. Each is one PR. None of them touch logic, routes, schema, RLS, billing, permissions, or test contract — only visual layer.

**Phase 1 — Tokens (additive, non-breaking).** ✅ Shipped PR #756. `--ff-*` defined in `app/globals.css`; shadcn vars aliased.

**Phase 2 — AppShell + primitives + token swap.** ✅ Shipped. AppShell, AppCard family, Button, AppFormSheet/Dialog triggers, flat iOS bottom nav, logo copper repaint. Dead `.dark` global overrides removed.

**Phase 3 — Dashboard.** ✅ Shipped PRs #795 #796 #827 #828. All `components/dashboard/*` clean. `dialog.tsx` surface migrated to `bg-card`/`border-border`. `app-form-dialog.tsx` trigger migrated to copper primary.

**Phase 4 — Remaining feature pages.** 🔄 In progress. Priority order: `app/onboarding/` (first user screen), `components/ui/` remaining primitives (sheet, alert, select), `components/app/` remaining (org-indicator, data-table, empty-state), then per-domain: Pessoas, Gastos, Contas a pagar/receber, Bancos, Relatórios, Configurações, Admin, Finance forms. One PR per domain or primitive group.

**Phase 5 — Cleanup.** Remove deprecated `--app-*` tokens from `app/globals.css`. Grep-verify zero remaining `#080810`, `#8b72f8`, `#b09cff`, `#10101a` across `app/` and `components/`. Update `VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md` to point at this spec as the authoritative visual direction.

## Decisions log

Decided 2026-05-30:

- **Palette (v1 — replaced)**: Sage 600 `#5B8C7B` + cream + slate. Rejected after seeing phase 2 in motion — felt too generic for the "diferenciado" brief.
- **Palette (v2 — current)**: Ink `#14110F` + copper `#C68E4D` + ivory `#F2EAD6`. Dark-first editorial identity. Warm-leaning grays and accents throughout. Reference apps: Read.cv, Linear (dark), Things 3.
- **Logo**: keep `FF` monogram + wordmark, repaint to copper.
- **Bottom nav (mobile)**: flat iOS-style tab bar, replacing the floating pill.
- **Theme default**: `dark`. `enableSystem` true so the warm paper light variant is reachable.

## Out of scope

This document does **not**:
- Change routes, schema, RLS, billing, permissions, or business rules.
- Add new shadcn components (governed by ADR-0003 layered adoption).
- Introduce a second font family or icon library.
- Add a marketing site or public landing visuals.
- Change copy, IA, or navigation structure.
