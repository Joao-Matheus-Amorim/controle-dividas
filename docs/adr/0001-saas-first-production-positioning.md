# ADR 0001 - SaaS-first production positioning

## Status

Aceito

## Data

2026-05-18

## Contexto

O projeto começou a partir de uma necessidade de controle financeiro familiar, mas a direção vigente não é mais construir uma solução privada, single-tenant ou personalizada para uma única família.

A decisão estratégica atual é conduzir o produto como um SaaS financeiro multi-tenant, mobile-first, seguro e preparado para produção massiva.

Essa decisão é necessária porque decisões de arquitetura, segurança, documentação, permissões, RLS, onboarding, billing, suporte e operação mudam significativamente quando o alvo deixa de ser uso privado e passa a ser operação SaaS real.

## Decisão

O produto passa a ser conduzido oficialmente como:

```txt
SaaS financeiro multi-tenant para produção massiva.
```

A origem familiar privada permanece apenas como contexto histórico. Ela não deve mais guiar roadmap, escopo, arquitetura, decisões de segurança ou documentação futura.

Todas as novas decisões relevantes devem assumir que:

- existem múltiplas organizações/clientes;
- dados financeiros são sensíveis;
- isolamento entre organizações é requisito central;
- permissões precisam ser explícitas, testadas e auditáveis;
- a operação futura pode envolver onboarding, planos, billing, suporte e auditoria;
- mudanças devem ser feitas com PRs pequenos, gates obrigatórios e segurança excessiva;
- documentação deve ser curta, rastreável e alinhada ao PMBOK no que compete ao projeto.

## Alternativas consideradas

### Manter o produto como solução familiar privada

Rejeitada.

Essa alternativa reduz complexidade no curto prazo, mas conflita com a ambição atual de produto, multi-tenant, planos comerciais e produção massiva.

### Manter linguagem híbrida: família privada + SaaS futuro

Rejeitada.

Essa alternativa gera ambiguidade. Ambiguidade em produto financeiro multi-tenant aumenta risco de decisões inconsistentes, documentação conflitante e implementação insegura.

### Assumir SaaS-first imediatamente, com evolução incremental

Aceita.

Essa alternativa mantém disciplina e permite evolução gradual sem reescrita, sem SQL destrutivo e sem implementar billing antes de isolamento, permissões e UX estarem maduros.

## Consequências

### Positivas

- Clareza estratégica para decisões futuras.
- Menos ambiguidade entre origem histórica e direção atual.
- Melhor alinhamento entre arquitetura, segurança, PMBOK e roadmap.
- Base documental mais sustentável por meio de ADRs.
- Priorização correta: isolamento, permissões, UX, auditoria e onboarding antes de billing.

### Negativas / trade-offs

- Mais rigor antes de entregar novas features.
- Mais etapas obrigatórias para qualquer mudança sensível.
- Menos espaço para atalhos de produto privado.
- Necessidade de atualizar documentos antigos que ainda tratam a origem privada como direção relevante.

### Riscos a monitorar

- Complexidade crescer mais rápido que a capacidade de manutenção.
- Documentação longa ficar desatualizada.
- Misturar escopo de produto, RLS, UX e billing no mesmo PR.
- Pressa para implementar billing antes de isolamento e UX multi-org maduros.
- Manter compatibilidade legada por tempo excessivo sem plano de hardening final.

## Impacto em segurança e dados

Esta ADR não altera código, banco, RLS ou dados.

Mas ela define que toda evolução futura deve tratar segurança e dados financeiros como requisitos centrais:

- isolamento por organização;
- RLS e testes gated;
- permissões runtime por organização ativa;
- validação server-side;
- auditoria futura;
- menor privilégio para usuários, admins de organização e futuro platform admin.

## Relação com PMBOK

Relaciona-se com:

- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md`

Esta ADR funciona como registro objetivo da decisão estratégica. Os documentos PMBOK continuam tratando escopo, mudança, riscos, qualidade e acompanhamento.

## Relação com issues/PRs

- Issue: #251
- PR: a ser criado

## Critérios de revisão futura

Revisar esta decisão somente se houver mudança estratégica formal, como:

- pivot para produto não-SaaS;
- venda white-label single-tenant;
- abandono de multi-tenant;
- mudança de mercado-alvo;
- exigência regulatória que altere arquitetura operacional;
- entrada de equipe/processo formal que exija governança adicional.

Até lá, esta decisão deve orientar todas as próximas decisões relevantes do produto.
