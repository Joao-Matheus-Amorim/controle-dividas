# ADR 0005 - Onboarding route layout strategy

## Status

Aceito

## Data

2026-05-19

## Contexto

A ADR 0004 definiu que a primeira organização e o primeiro owner membership devem ser criados por um fluxo explícito de onboarding.

O roadmap de onboarding inicial propôs uma rota user-facing em `/protected/onboarding/organizacao`.

O problema é que `app/protected/layout.tsx` carrega permissões e organização atual antes de renderizar `children`. Um usuário sem organização pode precisar do onboarding, mas pode não conseguir renderizar uma rota dentro desse layout.

## Decisão

A primeira implementação do onboarding inicial deve ficar fora do layout protegido atual.

A rota user-facing escolhida é:

```txt
/onboarding/organizacao
```

Essa rota deve continuar exigindo usuário autenticado, mas não deve depender de `app/protected/layout.tsx` nem exigir organização ativa antes de renderizar.

Não criar `/protected/onboarding/organizacao` na primeira implementação.

Não adicionar exceção especial no `ProtectedLayout` neste momento.

## Alternativas consideradas

### Usar `/protected/onboarding/organizacao`

Rejeitada. O layout de `/protected` depende de organização ativa e pode impedir o acesso de quem ainda precisa criar a primeira organização.

### Criar exceção no `ProtectedLayout`

Rejeitada para a primeira versão. Aumenta complexidade em um layout crítico.

### Criar route group/layout próprio

Aceitável no futuro, especialmente se existirem várias telas de onboarding.

### Usar `/onboarding/organizacao`

Aceita. É mais simples e evita dependência de organization context antes da criação da primeira organização.

## Consequências

### Positivas

- Evita página de onboarding inalcançável.
- Mantém o layout financeiro protegido sem exceções especiais.
- Separa onboarding inicial da navegação financeira comum.

### Negativas / trade-offs

- A rota fica fora do prefixo `/protected`.
- A implementação futura deve garantir autenticação explicitamente.
- Pode exigir layout visual próprio para onboarding.

### Riscos a monitorar

- Rota de onboarding ficar acessível sem autenticação.
- Permitir criar segunda organização antes do selector existir.
- Misturar onboarding inicial com billing cedo demais.

## Impacto em segurança e dados

Sem mudança funcional nesta ADR.

A implementação futura deve validar:

- usuário autenticado;
- perfil ativo;
- ausência de membership ativa;
- slug válido e disponível;
- criação server-side de organization e owner membership.

## Relação com PMBOK

Relaciona-se com:

- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md`

## Relação com issues/PRs

- Issue: #319
- Relacionado: #313
- Relacionado: #317
- PR: a ser criado

## Critérios de revisão futura

Revisar quando houver:

- múltiplas telas de onboarding;
- selector de organização ativa;
- rotas por `orgSlug`;
- billing;
- suporte a múltiplas organizações por usuário.
