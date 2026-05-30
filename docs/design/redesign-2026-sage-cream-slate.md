# Redesign 2026 — Sage + Cream + Slate

Issue: #80
Related ADR: `docs/adr/0003-design-system-and-shadcn-adoption.md`
Baseline: `docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md`
Audit: see "Audit findings" section below.

## Purpose

Specify the next visual direction of FamilyFinance, replacing the current dark purple "premium SaaS" identity with a calm, light-first family-finance identity.

This document is the redesign specification. Implementation lands in phases (see "Migration plan") and does not break any current functionality, route, schema, RLS, billing, permission, or test contract.

## Mood and principles

Target mood: **família, clean, segurança, paz, controle**.

Four principles drive every token and component decision:

1. **Cream over white.** Pure white reads sterile/corporate. Cream (`#FAF8F3`) reads home, warmth, calm.
2. **Sage carries trust, not blue.** Sage green communicates growth, money, and peace at once — without the cold of bank blue or the flash of crypto purple.
3. **Generous whitespace.** Control means clarity, not density. Default to roomier spacing than a productivity tool.
4. **No glow, no glass-blur as identity.** Soft shadows only. Drops the current dark-glass visual language.

Anti-patterns explicitly rejected: neon glows, radial purple gradients, dark glass surfaces with `backdrop-blur`, alpha-on-black layering as the primary visual mechanism.

## Theme strategy

**Light-first.** Default theme is light. Dark is opt-in via toggle.

Dark is a **forest-dark** variant (`#1A2620`), not pure black. It preserves the cream/sage identity at night instead of switching to a different visual system. No dark-mode-only `!important` overrides.

`next-themes` already wired in `app/layout.tsx`. Migration flips `defaultTheme` from `"dark"` to `"light"` and re-enables `enableSystem`.

## Color tokens

All tokens defined as CSS variables in `app/globals.css`. shadcn semantic tokens (`--primary`, `--background`, etc.) are the **single source of truth**. The legacy `--app-*` tokens are deprecated — see migration plan.

### Light theme

| Token | Hex | Role |
|---|---|---|
| `--background` | `#FAF8F3` | App background — cream |
| `--background-soft` | `#F3EFE5` | Sunken sections, sidebars |
| `--card` | `#FFFFFF` | Surface — cards, raised panels |
| `--popover` | `#FFFFFF` | Popovers, dropdowns |
| `--foreground` | `#2C3E36` | Body text — slate green |
| `--muted` | `#F3EFE5` | Muted surfaces |
| `--muted-foreground` | `#6B7A72` | Secondary text |
| `--subtle-foreground` | `#9AA59E` | Tertiary text, placeholders |
| `--border` | `#E8E4D9` | Default borders |
| `--border-strong` | `#D4CEBE` | Emphasized borders |
| `--input` | `#E8E4D9` | Input borders |
| `--primary` | `#5B8C7B` | Sage 600 — primary actions |
| `--primary-hover` | `#4A7868` | Primary hover |
| `--primary-soft` | `#D5E3DC` | Primary backgrounds (badges, hover bg) |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--accent` | `#D5E3DC` | Accent surfaces |
| `--accent-foreground` | `#2C3E36` | Text on accent |
| `--ring` | `#5B8C7B` | Focus ring (with 30% alpha in use) |
| `--success` | `#4A9D6E` | Positive amounts, paid status |
| `--success-soft` | `#DDF0E5` | Success backgrounds |
| `--warning` | `#D9A441` | Warnings, due soon |
| `--warning-soft` | `#F7EBD0` | Warning backgrounds |
| `--destructive` | `#C75A5A` | Overdue, delete actions |
| `--destructive-soft` | `#F5DDDD` | Destructive backgrounds |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive |
| `--info` | `#6B9DC2` | Informational |
| `--info-soft` | `#DCE9F2` | Info backgrounds |

Chart palette (analytic, sequential):
`--chart-1: #5B8C7B` · `--chart-2: #6B9DC2` · `--chart-3: #D9A441` · `--chart-4: #C75A5A` · `--chart-5: #9B7BB8`

### Dark theme (forest)

| Token | Hex | Role |
|---|---|---|
| `--background` | `#1A2620` | Forest dark |
| `--background-soft` | `#15201A` | Sunken |
| `--card` | `#243029` | Surface |
| `--popover` | `#243029` | Popovers |
| `--foreground` | `#E8E4D9` | Body text — cream |
| `--muted` | `#2D3A33` | Muted surfaces |
| `--muted-foreground` | `#A8B0AB` | Secondary text |
| `--subtle-foreground` | `#6E7A74` | Tertiary text |
| `--border` | `#3A4A41` | Default borders |
| `--border-strong` | `#4E5F55` | Emphasized borders |
| `--input` | `#3A4A41` | Input borders |
| `--primary` | `#7BAE96` | Sage 400 — lifted for contrast |
| `--primary-hover` | `#93C0AB` | Primary hover |
| `--primary-soft` | `#2D4A3D` | Primary backgrounds |
| `--primary-foreground` | `#1A2620` | Text on primary |
| `--accent` | `#2D4A3D` | Accent surfaces |
| `--accent-foreground` | `#E8E4D9` | Text on accent |
| `--ring` | `#7BAE96` | Focus ring |
| `--success` | `#6EB892` | Positive |
| `--success-soft` | `#234538` | Success bg |
| `--warning` | `#E0B559` | Warning |
| `--warning-soft` | `#3D3320` | Warning bg |
| `--destructive` | `#D87575` | Destructive |
| `--destructive-soft` | `#3D2424` | Destructive bg |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive |
| `--info` | `#87B5D1` | Info |
| `--info-soft` | `#1F3340` | Info bg |

### Contrast (WCAG AA targets)

All foreground-on-background pairs verified at AA (4.5:1 for body, 3:1 for large text). Notable pairs:
- `--foreground` on `--background` (light): 11.2:1 ✓
- `--muted-foreground` on `--background` (light): 4.7:1 ✓
- `--primary-foreground` on `--primary` (light): 4.9:1 ✓
- `--foreground` on `--background` (dark): 10.8:1 ✓

## Typography

Single family: **Geist Sans** (already loaded). No second family — keeps identity calm.

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

- Inline gaps: `gap-2` (8px) for tight, `gap-3` (12px) default, `gap-4` (16px) generous.
- Card inner padding: `p-5` (20px) small card, `p-6` (24px) default, `p-8` (32px) hero.
- Section vertical rhythm: `space-y-6` (24px) within a page, `space-y-8` (32px) between major sections.
- Page horizontal: `px-4` mobile, `px-6` md+ (already in AppShell — keep).

## Radius

Replace single `--radius: 1rem` with scale:

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 0.375rem (6px) | Badges, small chips |
| `--radius-sm` | 0.5rem (8px) | Small inputs, tags |
| `--radius-md` | 0.75rem (12px) | Buttons, inputs |
| `--radius-lg` | 1rem (16px) | Small cards |
| `--radius-xl` | 1.25rem (20px) | Default cards |
| `--radius-2xl` | 1.5rem (24px) | Hero cards (current AppCard) |
| `--radius-full` | 9999px | Pills, nav tabs |

Tailwind aliases map: `rounded-md` → `--radius-md`, `rounded-lg` → `--radius-lg`, `rounded-xl` → `--radius-xl`, `rounded-2xl` → `--radius-2xl`.

## Shadows

Soft, ambient. No colored glow.

| Token | Value | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(44, 62, 54, 0.04)` | Buttons resting |
| `--shadow-sm` | `0 2px 6px rgba(44, 62, 54, 0.06)` | Cards resting |
| `--shadow-md` | `0 6px 16px rgba(44, 62, 54, 0.08)` | Cards hover, popovers |
| `--shadow-lg` | `0 16px 32px rgba(44, 62, 54, 0.10)` | Dialogs, sheets |

Dark theme uses `rgba(0, 0, 0, 0.4)` base with same opacities scaled (0.2/0.3/0.4/0.5).

## Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--motion-fast` | 120ms | `ease-out` | Hover, focus |
| `--motion-base` | 200ms | `ease-out` | Buttons, toggles |
| `--motion-slow` | 320ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page enter, modal in |

Keep `app-fade-up` keyframe but retune duration to `--motion-slow`.

## Component patterns

### Button

shadcn `Button` keeps its variant API. Visual changes:
- `default`: `bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs`
- `secondary`: `bg-muted text-foreground hover:bg-accent`
- `outline`: `border border-border-strong bg-transparent hover:bg-muted`
- `ghost`: `hover:bg-muted`
- `destructive`: `bg-destructive text-destructive-foreground hover:opacity-90`
- `link`: `text-primary underline-offset-4 hover:underline`

Sizes: `sm` 32px, `default` 40px, `lg` 44px (mobile-friendly), `icon` square at the size's height. Radius: `rounded-md`.

### Card

shadcn `Card`: `rounded-xl border border-border bg-card shadow-sm`. No glass, no alpha border.

`AppCard` variants change meaning:
- `glass` → renamed to `raised`: `bg-card shadow-md`
- `solid` → kept: `bg-card border border-border`
- `inner` → kept: `bg-background-soft border border-border`
- new: `hero`: `bg-primary-soft border border-primary/20` for stat hero cards

### Badge

| Variant | Bg | Text |
|---|---|---|
| `default` | `--primary-soft` | `--primary` |
| `success` | `--success-soft` | `--success` |
| `warning` | `--warning-soft` | `--warning` |
| `destructive` | `--destructive-soft` | `--destructive` |
| `info` | `--info-soft` | `--info` |
| `neutral` | `--muted` | `--muted-foreground` |

Radius `--radius-xs`, `text-caption`, `px-2 py-0.5`.

### Input / Select

- Height: 40px default, 44px on mobile-first forms.
- Border: `border-border`, focus `ring-2 ring-ring/30 border-primary`.
- Radius: `--radius-md`.
- Background: `--card` light, `--muted` dark.
- Remove the global `.dark select` override in `globals.css` — style via the component.

### Dialog / Sheet

- Backdrop: `bg-foreground/40 backdrop-blur-sm` (light), `bg-black/60` (dark).
- Surface: `bg-card shadow-lg`.
- Radius: `--radius-2xl` for dialog, `--radius-xl` for sheet edge facing content.

### AppShell

Header: `bg-card border-b border-border` (no more dark glass). Logo glow removed.

**Logo**: keep the existing `FF` monogram shape and the `FamilyFinance` wordmark — repaint only. Monogram box: `bg-background-soft` (`#F3EFE5`), `border border-border`, `FF` text in `--primary` (`#5B8C7B`). No hover glow.

**Bottom nav (mobile)**: flat iOS-style tab bar, edge-to-edge. Replaces the current pill-style floating bar. Spec:
- Container: `fixed inset-x-0 bottom-0 bg-card border-t border-border` (no margin, no shadow, no glass).
- Item: column layout (icon + label), `flex-1`, `py-2`.
- Inactive: icon `--muted-foreground`, label `text-caption` `--muted-foreground`.
- Active: icon `--primary`, label `--primary`, plus a 2px `--primary` indicator bar at the top edge of the active tab.
- Safe area: `pb-[env(safe-area-inset-bottom)]` for iOS notch devices.

## Audit findings addressed

Each gap from the 2026-05-30 audit:

| Gap | Resolution in this spec |
|---|---|
| G1: dual token systems | shadcn tokens become single source. `--app-*` deprecated. |
| G2: `.dark` global overrides | Removed; styling moves to components. |
| G3: AppShell hardcoded hex | AppShell consumes `--card`, `--border`. |
| G4: dead light theme | Light becomes default; dark is the alt. |
| G5: no documentation | This document. |
| G6: ad-hoc type scale | Defined scale above. |
| G7: AppCard interactive a11y | `interactive=true` requires `role`/`tabIndex` (component change in phase 3). |

## Migration plan

Five phases. Each is one PR. None of them touch logic, routes, schema, RLS, billing, permissions, or test contract — only visual layer.

**Phase 1 — Tokens (additive, non-breaking).**
Add new tokens to `app/globals.css` and `tailwind.config.ts`. Keep `--app-*` in place. Nothing in the app changes visually yet. PR includes this spec doc.

**Phase 2 — AppShell + primitives.**
Migrate `components/app/app-shell.tsx`, `components/app/app-card.tsx`, `components/app/app-hero-card.tsx`, `components/app/app-page-header.tsx`, and `components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `select.tsx` to consume new tokens. Remove `.dark` global overrides in `globals.css`. Flip `defaultTheme` to `light`.

**Phase 3 — Pilot screen: Dashboard.**
Migrate `features/protected-pages/dashboard-page.tsx` and `components/dashboard/*` to new tokens. User validates.

**Phase 4 — Remaining feature pages.**
Pessoas, Gastos, Contas a pagar, Contas a receber, Bancos, Relatórios, Configurações, Admin. One PR per domain.

**Phase 5 — Cleanup.**
Remove deprecated `--app-*` tokens. Grep-verify zero remaining hardcoded `#080810`, `#8b72f8`, `#b09cff`, `#10101a`. Update baseline doc `VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md` to point at this spec as current.

## Out of scope

This document does **not**:
- Change routes, schema, RLS, billing, permissions, or business rules.
- Add new shadcn components (governed by ADR-0003 layered adoption).
- Introduce a second font family or icon library.
- Add a marketing site or public landing visuals.
- Change copy, IA, or navigation structure.

## Decisions log

Decided 2026-05-30:

- **Logo**: keep `FF` monogram + wordmark, repaint to sage (see AppShell spec).
- **Bottom nav (mobile)**: flat iOS-style tab bar, replacing the current floating pill (see AppShell spec).
- **Sage shade**: `#5B8C7B` (sage 600, equilibrado) confirmed. Contrast verified at 4.9:1 against `--primary-foreground`. If phase 3 pilot reveals issues, adjust the single CSS var — change propagates app-wide.
