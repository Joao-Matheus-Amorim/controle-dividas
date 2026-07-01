# Visual tokens and component conventions

> Status DocDoc: Parcialmente superado/historico
> Uso seguro: contexto de baseline anterior e limites de componentes/shadcn.
> Superado por / observacao: nao usar este documento como fonte atual de cores,
> superficies ou estilo do app protegido. A direcao atual esta em
> `docs/design/redesign-2026-ink-copper-ivory.md`, `app/globals.css` e nos
> componentes reais.

Issues: #293, #80
Related ADR: `docs/adr/0003-design-system-and-shadcn-adoption.md`

## Purpose

Document the current visual tokens and component conventions before any future broad visual redesign.

This document records the current state. It is not a redesign specification and does not change UI, components, runtime, schema, RLS, billing, permissions, or E2E coverage.

## Current design system position

The official design direction is defined by ADR 0003:

- shadcn/ui is the base kit;
- adoption must be controlled by layers;
- components should be added only when there is real use;
- `components/ui` must not contain business rules;
- domain components should remain in their domain folders.

The project currently uses shadcn with:

```txt
style: new-york
rsc: true
tsx: true
baseColor: neutral
cssVariables: true
iconLibrary: lucide
```

## Token sources

Current visual tokens come from:

- `tailwind.config.ts` for Tailwind token mapping;
- `app/globals.css` for `--ff-*` CSS variables, shadcn aliases, layout utilities and theme overrides;
- shadcn primitives in `components/ui`;
- app/domain components that compose those primitives.

## Color tokens

### Semantic Tailwind tokens

Tailwind maps these semantic tokens to CSS variables:

```txt
background
foreground
card
card-foreground
popover
popover-foreground
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
accent
accent-foreground
destructive
destructive-foreground
border
input
ring
chart-1..chart-5
```

Use semantic tokens for reusable primitives and generic UI.

### FamilyFinance tokens

`app/globals.css` defines FamilyFinance visual tokens under the `--ff-*`
namespace. These are the source of truth for the Ink + Copper + Ivory visual
direction; shadcn variables are aliases over them.

```txt
--ff-bg
--ff-bg-soft
--ff-card
--ff-border
--ff-primary
--ff-primary-soft
--ff-success
--ff-warning
--ff-destructive
--ff-info
```

Use Tailwind semantic classes (`bg-card`, `text-foreground`, `border-border`,
`bg-primary`) and the extended `ff-*` classes (`bg-ff-bg-soft`,
`text-ff-subtle-foreground`, `bg-ff-primary-soft`) instead of raw hex values or
deprecated token names.

## Current visual direction

The current protected app visual style is:

- dark-first;
- high contrast;
- copper primary accent;
- warm governed surfaces with semantic borders;
- rounded cards and controls;
- mobile-first layout;
- explicit active organization context;
- financial SaaS tone, not casual family-app tone.

The canonical current direction is `docs/design/redesign-2026-ink-copper-ivory.md`.

## Radius and surfaces

Current radius token:

```txt
--radius: 1rem
```

Tailwind radius aliases:

```txt
lg: var(--radius)
md: calc(var(--radius) - 2px)
sm: calc(var(--radius) - 4px)
```

Common current conventions:

- shadcn `Card` uses `rounded-xl border bg-card text-card-foreground shadow`;
- app-level surfaces use `rounded-ff-*`, `border-border`, `bg-card` or
  `bg-ff-bg-soft`;
- cinematic depth is reserved for hero, overlay and backdrop surfaces;
- avoid alpha-on-black classes, neon accents and legacy purple tokens.

## Spacing and layout

Current app layout conventions:

- mobile-first;
- avoid horizontal overflow;
- use `app-no-x-scroll` for full protected surfaces;
- use `app-container` for centered responsive content;
- protected shell uses max width around `max-w-7xl`;
- mobile bottom navigation remains fixed and compact.

Do not introduce wide desktop-only layouts without mobile review.

## Buttons

Current base button variants come from `components/ui/button.tsx`:

```txt
default
destructive
outline
secondary
ghost
link
```

Current sizes:

```txt
default
sm
lg
icon
```

Guidelines:

- use shadcn `Button` for generic actions;
- use domain-specific wrappers only when needed by a real domain pattern;
- do not create duplicate button systems;
- submit buttons inside dark forms currently inherit rounded app conventions.

## Cards and containers

Use shadcn `Card` for generic structured surfaces.

For domain dashboards, current UI may use richer app surfaces and governed
cinematic depth. These must use the `ff-*` token namespace and should not expand
into a second design system without a dedicated issue.

## Forms

Current conventions:

- use existing form controls and shadcn primitives;
- keep validation and error feedback visible;
- maintain dark-mode contrast;
- avoid business logic inside `components/ui`;
- shared finance forms may live in `components/finance` only when truly shared across modules.

## Dialog vs Sheet

Current rule before a redesign:

- use Dialog for focused confirmation or compact forms;
- use Sheet for flows that need more vertical space or feel like a side/mobile panel;
- do not convert Dialog to Sheet as a visual preference without a UX reason;
- data-changing forms must preserve existing validation and cleanup/test expectations.

## Component folder boundaries

Current folder conventions from ADR 0003:

```txt
components/ui        -> reusable primitives, no business rules
components/app       -> generic internal application components
components/finance   -> shared finance forms/dialogs only when truly shared
components/<domain>  -> visual sections specific to each domain
```

Do not turn `components/finance` into a generic visual bucket.

## Accessibility and safety expectations

Financial UI must preserve:

- readable text contrast;
- visible focus states;
- clear error states;
- explicit organization context;
- no ambiguous destructive actions;
- no hidden permission-sensitive state.

## Explicitly out of scope

This document does not:

- redesign screens;
- change components;
- install dependencies;
- refactor UI;
- alter RLS;
- alter migrations;
- change routes;
- change billing;
- change permissions;
- change business rules;
- change E2E coverage.

## Historical redesign notes for #80

This document is historical context for the earlier baseline. The current source
of truth is `docs/design/redesign-2026-ink-copper-ivory.md`, `app/globals.css`
and the implemented components.

## Selective visual snapshots

Trabalho de snapshot visual deve seguir `docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md`.

Snapshots visuais seletivos nao substituem contratos de UI. Eles apenas complementam superficies estaveis, ja documentadas e com fixtures deterministicas.
