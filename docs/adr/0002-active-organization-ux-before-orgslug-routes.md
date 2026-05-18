# ADR 0002 - Active organization UX before orgSlug routes

## Status

Aceito

## Data

2026-05-18

## Contexto

O produto foi reposicionado oficialmente como SaaS financeiro multi-tenant para producao massiva no ADR 0001.

A base tecnica ja possui `organizations`, `organization_memberships`, `organization_id`, RLS organization-aware transicional e runtime access-control escopado por organizacao ativa.

Mesmo assim, a interface ainda nao comunica de forma explicita qual organizacao esta ativa. Isso cria risco de confusao operacional antes de qualquer evolucao para multiplas organizacoes reais, troca de organizacao, rotas por `orgSlug` ou billing.

Como o produto lida com dados financeiros sensiveis, a UX precisa tornar o contexto de organizacao visivel antes de avancar para mudancas mais profundas de navegacao e cobranca.

## Decisao

A evolucao de UX multi-org deve seguir a seguinte ordem:

```txt
1. Exibir a organizacao ativa no layout protegido.
2. Evoluir para selector/troca de organizacao quando houver suporte seguro.
3. Migrar para rotas por orgSlug somente depois da UX de organizacao ativa estar clara.
4. Implementar billing apenas depois de isolamento, permissoes e UX multi-org estarem maduros.
```

A primeira entrega funcional apos esta ADR deve ser pequena e limitada a um indicador de contexto da organizacao ativa.

Essa primeira entrega nao deve alterar:

- RLS;
- migrations;
- billing;
- rotas por `orgSlug`;
- selector/troca de organizacao;
- modelo de permissao;
- schema de banco.

## Alternativas consideradas

### Implementar rotas por orgSlug imediatamente

Rejeitada.

Rotas por `orgSlug` tornam a organizacao explicita na URL, mas tambem aumentam a superficie de autorizacao, navegacao, links, redirects, testes e compatibilidade. Fazer isso antes de uma UX clara de organizacao ativa aumenta risco.

### Implementar selector/troca de organizacao imediatamente

Rejeitada por enquanto.

A troca de organizacao exige decisao sobre persistencia, fallback, permissao, estado de sessao, comportamento em multiplas organizations e testes. Antes disso, o usuario precisa ao menos visualizar com clareza a organizacao ativa atual.

### Exibir primeiro a organizacao ativa no layout protegido

Aceita.

E a menor mudanca segura para reduzir ambiguidade de contexto sem alterar navegacao, banco, RLS ou billing.

## Consequencias

### Positivas

- Reduz confusao de contexto para usuarios e desenvolvimento.
- Cria base visual para futuras multiplas organizacoes.
- Mantem PR funcional pequeno e testavel.
- Evita pular prematuramente para `orgSlug` ou billing.
- Alinha UX com a arquitetura multi-tenant ja existente.

### Negativas / trade-offs

- Ainda nao resolve troca de organizacao.
- Ainda nao torna a URL organization-aware.
- Pode exigir evolucao posterior quando houver multiplas organizacoes reais.

### Riscos a monitorar

- Indicador virar selector sem decisao propria.
- Criar comportamento implicito de troca de organizacao sem testes.
- Avancar para billing antes da UX multi-org estar madura.
- Rotas por `orgSlug` serem implementadas sem plano de autorizacao e fallback.

## Impacto em seguranca e dados

Esta ADR nao altera codigo, banco, RLS ou dados.

A decisao reduz risco operacional futuro ao exigir que o contexto de organizacao ativa fique explicito antes de:

- rotas por `orgSlug`;
- billing;
- onboarding multi-org;
- suporte a multiplas organizacoes por usuario;
- hardening final de `organization_id NOT NULL`.

## Relacao com PMBOK

Relaciona-se com:

- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md`

Esta ADR detalha a ordem de uma decisao produto-tecnica dentro da transicao SaaS multi-tenant.

## Relacao com issues/PRs

- Issue: #253
- PR: a ser criado

## Criterios de revisao futura

Revisar esta decisao quando:

- houver selector/troca de organizacao;
- houver rotas por `orgSlug` propostas;
- houver onboarding multi-org;
- houver billing/plans em implementacao;
- usuarios reais participarem de multiplas organizacoes em producao.
