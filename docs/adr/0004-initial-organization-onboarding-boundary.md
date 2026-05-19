# ADR 0004 - Initial organization onboarding boundary

## Status

Aceito

## Data

2026-05-19

## Contexto

O produto segue como SaaS financeiro multi-tenant.

O banco já possui `organizations` e `organization_memberships`, criados pela migration `006_organizations_memberships.sql`.

O runtime atual em `lib/organizations/server.ts` lê memberships e organizations existentes para obter a organização ativa. Ele não cria a primeira organização.

O bootstrap de perfil admin em `lib/finance/access-control.ts` e `lib/finance/admin-server.ts` ainda é transicional e usa `ADMIN_EMAIL`. Esse bootstrap resolve/cria perfil, mas não deve criar organization nem membership.

A auditoria `docs/audits/FIRST_ORGANIZATION_RUNTIME_ONBOARDING_AUDIT.md` registrou o gap entre perfil admin e membership owner existente. A PR #312 adicionou guard para impedir criação escondida de organization/membership dentro do bootstrap de perfil.

## Decisão

A primeira organização e o primeiro owner membership devem ser criados por um fluxo explícito de onboarding.

Eles não devem ser criados como efeito colateral de:

- `getCurrentProfile()`;
- `ensureAdminProfile()`;
- helpers de resolução de perfil;
- páginas admin.

Enquanto o onboarding explícito não existir:

- bootstrap de perfil pode continuar transicional;
- `ADMIN_EMAIL` pode continuar como gate temporário;
- organization context deve continuar vindo de `lib/organizations/server.ts`;
- ausência de organization/membership deve falhar claramente;
- criação de tenant não deve ficar escondida em helpers de perfil.

Ordem segura:

```txt
1. manter guards contra criação escondida;
2. registrar esta fronteira arquitetural;
3. desenhar onboarding inicial explícito;
4. implementar criação controlada de organization + owner membership;
5. só depois avançar para selector, orgSlug, billing e remoção de legado.
```

## Alternativas consideradas

### Criar organization dentro de `getCurrentProfile()`

Rejeitada. Mistura autenticação, perfil e criação de tenant no mesmo caminho crítico.

### Criar organization dentro de `ensureAdminProfile()`

Rejeitada. Faz a área admin ter efeito colateral estrutural no tenant.

### Manter apenas SQL manual para sempre

Rejeitada como solução final. O SQL manual é útil na transição, mas não escala como onboarding SaaS.

### Fluxo explícito de onboarding

Aceita. É mais claro, testável e seguro.

## Consequências

### Positivas

- Evita criação implícita de tenants.
- Mantém perfil separado de onboarding de organização.
- Facilita futura integração com billing.
- Mantém PRs pequenos e rastreáveis.

### Negativas / trade-offs

- Ainda será necessário criar o fluxo de onboarding.
- Usuários sem membership continuarão sem organization context.
- `ADMIN_EMAIL` permanece temporariamente.

### Riscos a monitorar

- Criar tenant escondido em helper de perfil.
- Avançar para billing antes do onboarding.
- Manter `ADMIN_EMAIL` por tempo demais.
- Criar slug/nome de organization sem regra clara.

## Impacto em segurança e dados

Sem mudança funcional nesta ADR.

A decisão reduz risco futuro ao exigir fronteira explícita entre:

- profile bootstrap;
- organization onboarding;
- membership owner;
- dados financeiros.

## Relação com PMBOK

Relaciona-se com:

- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md`

## Relação com issues/PRs

- Issue: #313
- Relacionado: #309
- Relacionado: #311
- PR: a ser criado

## Critérios de revisão futura

Revisar antes de:

- implementar onboarding inicial;
- criar selector de organização;
- adicionar rotas por `orgSlug`;
- implementar billing;
- remover `owner_id`;
- tornar `organization_id` obrigatório.
