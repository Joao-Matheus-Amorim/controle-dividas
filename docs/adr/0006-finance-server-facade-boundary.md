# ADR 0006: Finance server facade boundary

## Status

Accepted.

## Context

GAP-013 reduced `lib/finance/server.ts` by extracting finance relations, seed payloads, seed orchestration, read helpers, and dashboard aggregation helpers into dedicated modules.

After those extractions, `lib/finance/server.ts` still exports the public finance server functions currently used by the app. Removing that file or migrating all call sites now would add risk without clear product value.

## Decision

`lib/finance/server.ts` remains the official finance compatibility facade and orchestration boundary.

It may keep:

- public finance server exports used by current call sites;
- auth/user lookup required by those exports;
- seed-before-read orchestration;
- profile and access orchestration;
- composition of dedicated domain helpers.

It must not own:

- raw finance table queries;
- dashboard aggregation calculations;
- schema or policy decisions;
- UI behavior;
- route-specific behavior;
- end-to-end test setup.

New finance business boundaries must be implemented in focused modules first. The facade may import those modules only to preserve compatibility for existing call sites.

## Guardrails

The boundary is protected by `__tests__/unit/finance-server-facade-guards.test.ts`.

The guard verifies that:

- public async facade exports remain intentional and stable;
- `lib/finance/server.ts` does not directly access finance tables;
- dashboard aggregation tokens do not return to the facade;
- the facade delegates to dedicated domain helpers.

## Consequences

This closes the remaining GAP-013 strategy decision without risky call-site migration.

Future migrations away from the facade are still allowed, but they must be justified by a new issue and implemented by small domain-specific PRs with explicit compatibility coverage.
