# ADR NNNN - Título da decisão

## Status

Proposto | Aceito | Substituído | Rejeitado

## Data

AAAA-MM-DD

## Contexto

Explique o problema, a motivação e o cenário atual.

Inclua somente o necessário para entender por que a decisão existe.

## Decisão

Registre a decisão de forma direta.

A decisão deve ser clara o suficiente para orientar implementação futura.

## Alternativas consideradas

### Alternativa 1

Resumo da alternativa e por que não foi escolhida.

### Alternativa 2

Resumo da alternativa e por que não foi escolhida.

## Consequências

### Positivas

- Consequência positiva relevante.

### Negativas / trade-offs

- Custo, risco ou limitação aceita.

### Riscos a monitorar

- Risco futuro criado ou mantido pela decisão.

## Impacto em segurança e dados

Descrever impacto em:

- RLS;
- multi-tenant;
- permissões;
- dados financeiros;
- privacidade;
- auditoria.

Quando não houver impacto, registrar explicitamente:

```txt
Sem impacto funcional em segurança/dados. Decisão documental ou de governança.
```

## Relação com PMBOK

Indicar documentos PMBOK relacionados, se houver.

Exemplo:

- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`

## Relação com issues/PRs

- Issue: #NNN
- PR: #NNN

## Critérios de revisão futura

Registrar quando a decisão deve ser revisitada.

Exemplos:

- antes de billing;
- antes de `organization_id NOT NULL`;
- antes de app nativo;
- quando houver múltiplas organizações reais em produção;
- quando houver equipe maior ou processo operacional formal.
