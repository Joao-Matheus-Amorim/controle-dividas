# Architecture Decision Records

Este diretório registra decisões arquiteturais, produto-técnicas e de governança que afetam o futuro do SaaS.

ADRs não substituem os documentos PMBOK do projeto. Eles complementam esses documentos com decisões curtas, rastreáveis e fáceis de manter.

## Quando criar um ADR

Criar um ADR quando a decisão:

- muda a direção do produto;
- afeta segurança, RLS, multi-tenant, permissões ou dados financeiros;
- cria ou altera padrões arquiteturais;
- define ordem de implementação entre blocos grandes;
- tem alternativas plausíveis e impacto futuro;
- precisa sobreviver ao contexto mental da pessoa que tomou a decisão.

Não criar ADR para:

- correção pequena de bug;
- ajuste visual isolado;
- refatoração sem mudança de padrão;
- atualização simples de dependência;
- documentação operacional temporária.

## Relação com PMBOK

Os documentos em `docs/pm/` continuam sendo usados para escopo, riscos, mudanças, progresso e governança do projeto.

Os ADRs registram a decisão técnica/produto de forma objetiva:

```txt
Contexto -> Decisão -> Consequências -> Relação com issues/PRs/PMBOK
```

Quando uma decisão representar mudança relevante de direção, o ADR deve referenciar a issue e, quando aplicável, o documento PMBOK relacionado.

## Formato

Usar o template:

```txt
docs/adr/TEMPLATE.md
```

Nome dos arquivos:

```txt
NNNN-titulo-curto-em-kebab-case.md
```

Exemplo:

```txt
0001-saas-first-production-positioning.md
```

## Status permitidos

```txt
Proposto
Aceito
Substituído
Rejeitado
```

Um ADR aceito não deve ser editado para mudar a decisão histórica. Se a decisão mudar, criar novo ADR e marcar o anterior como substituído.

## Índice

| ADR | Status | Decisão |
| --- | --- | --- |
| [0001](./0001-saas-first-production-positioning.md) | Aceito | O produto passa a ser conduzido como SaaS financeiro multi-tenant para produção massiva. |
| [0002](./0002-active-organization-ux-before-orgslug-routes.md) | Aceito | A UX deve exibir a organização ativa antes de selector, rotas por `orgSlug` e billing. |
| [0003](./0003-design-system-and-shadcn-adoption.md) | Aceito | shadcn/ui será o kit base oficial do design system, com adoção controlada por camadas. |
| [0004](./0004-initial-organization-onboarding-boundary.md) | Aceito | A primeira organização e owner membership devem ser criados por onboarding explícito, não por efeito colateral do bootstrap de perfil. |
| [0005](./0005-onboarding-route-layout-strategy.md) | Aceito | O onboarding inicial deve usar rota fora do layout protegido atual para não exigir organização ativa antes da criação. |
| [0006](./0006-current-saas-transition-architecture.md) | Aceito | O estado SaaS transicional atual deve ter registro arquitetural próprio. |
| [0007](./0007-orgslug-routing-contract.md) | Aceito | As rotas organization-aware usam `/org/[orgSlug]` com `/protected` mantido como compatibilidade transicional. |
