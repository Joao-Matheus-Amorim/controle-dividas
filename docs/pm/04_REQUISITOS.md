# Requisitos - FamilyFinance

> Status DocDoc: Historico/PM
> Uso seguro: requisitos de produto como contexto de gestao.
> Observacao: status de requisito pode estar defasado; confirme implementacao
> atual em codigo, testes, `docs/VALIDACAO_TECNICA.md` e
> `docs/SAAS_GAP_REGISTER.md`.

Este documento registra os requisitos vivos do FamilyFinance, alinhados ao estado atual do codigo.

Legenda de status:

```txt
Implementado  -> existe no codigo atual
Parcial       -> existe base funcional, mas falta completar
Planejado     -> ainda nao implementado
Futuro        -> fora do MVP atual
```

## Requisitos funcionais do MVP Web/PWA

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RF-001 | Login do usuario | Alta | Implementado |
| RF-002 | Cadastro de usuario | Alta | Implementado |
| RF-003 | Validar e-mail autorizado pelo Admin antes do cadastro | Alta | Implementado |
| RF-004 | Confirmacao de e-mail/token via Supabase | Alta | Implementado |
| RF-005 | Recuperacao/atualizacao de senha | Media | Implementado |
| RF-006 | Protecao global de rotas autenticadas | Alta | Implementado |
| RF-007 | Dashboard familiar/contextual | Alta | Implementado |
| RF-008 | Cadastro de pessoas/membros financeiros | Alta | Implementado |
| RF-009 | Edicao de pessoas/membros financeiros | Alta | Implementado |
| RF-010 | Ativar/desativar membros financeiros | Media | Implementado |
| RF-011 | Limite mensal por pessoa | Alta | Implementado |
| RF-012 | Cadastro de categorias de gastos | Alta | Implementado |
| RF-013 | Exclusao de categorias de gastos | Media | Implementado |
| RF-014 | Edicao de categorias de gastos | Media | Parcial |
| RF-015 | Cadastro de gastos | Alta | Implementado |
| RF-016 | Exclusao de gastos | Media | Implementado |
| RF-017 | Edicao completa de gastos | Alta | Implementado |
| RF-018 | Contas a pagar | Alta | Implementado |
| RF-019 | Alterar status de contas a pagar | Alta | Implementado |
| RF-020 | Excluir contas a pagar | Media | Implementado |
| RF-021 | Edicao completa de contas a pagar | Alta | Implementado |
| RF-022 | Contas a receber/rendas | Alta | Implementado |
| RF-023 | Alterar status de contas a receber | Alta | Implementado |
| RF-024 | Excluir contas a receber | Media | Implementado |
| RF-025 | Edicao completa de contas a receber | Alta | Implementado |
| RF-026 | Bancos por pessoa | Alta | Implementado |
| RF-027 | Atualizar saldo bancario | Alta | Implementado |
| RF-028 | Excluir banco/conta bancaria | Media | Implementado |
| RF-029 | Edicao completa de banco/conta bancaria | Alta | Implementado |
| RF-030 | Relatorios consolidados | Alta | Implementado |
| RF-031 | Filtros avancados de relatorios | Media | Planejado |
| RF-032 | Exportacao de relatorios | Media | Planejado |
| RF-033 | Configuracoes basicas | Alta | Implementado |
| RF-034 | Configuracao de moeda | Media | Implementado parcial |
| RF-035 | Configuracao de periodo financeiro | Media | Planejado |

## Requisitos de Admin familiar

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RF-036 | Criar perfil Admin pelo `ADMIN_EMAIL` | Alta | Implementado |
| RF-037 | Acessar painel Admin | Alta | Implementado |
| RF-038 | Criar usuarios familiares | Alta | Implementado |
| RF-039 | Editar usuarios familiares | Alta | Implementado |
| RF-040 | Excluir usuarios familiares | Media | Implementado |
| RF-041 | Ativar/desativar usuarios familiares | Alta | Implementado |
| RF-042 | Vincular usuario a membro financeiro | Alta | Implementado |
| RF-043 | Sincronizar usuario familiar com Auth user pelo e-mail | Alta | Implementado |
| RF-044 | Configurar permissoes por modulo | Alta | Implementado |
| RF-045 | Configurar permissao de visualizar | Alta | Implementado |
| RF-046 | Configurar permissao de criar | Alta | Implementado |
| RF-047 | Configurar permissao de editar | Alta | Implementado |
| RF-048 | Configurar permissao de excluir | Alta | Implementado |
| RF-049 | Configurar escopo `own` | Alta | Implementado |
| RF-050 | Configurar escopo `selected` | Alta | Implementado |
| RF-051 | Configurar escopo `family` | Alta | Implementado |
| RF-052 | Configurar membros liberados em `allowed_member_ids` | Alta | Implementado |
| RF-053 | Dashboard consolidado do Admin | Alta | Implementado |
| RF-054 | Dashboard individual do usuario | Alta | Implementado |
| RF-055 | Menu dinamico por permissao | Alta | Implementado |
| RF-056 | Permissoes por funcionalidade especifica | Media | Parcial |

## Requisitos de permissao e seguranca

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RS-001 | Separar `profiles` de `family_members` | Alta | Implementado |
| RS-002 | Perfil inativo nao acessa dados | Alta | Implementado |
| RS-003 | Usuario sem sessao nao acessa `/protected` | Alta | Implementado |
| RS-004 | Usuario comum ve apenas dados do escopo permitido | Alta | Implementado |
| RS-005 | Admin ve todos os membros ativos da familia | Alta | Implementado |
| RS-006 | Server Actions validam permissao antes de mutar | Alta | Implementado |
| RS-007 | Queries financeiras filtram por membros acessiveis | Alta | Implementado |
| RS-008 | Service role usada apenas server-side | Alta | Implementado |
| RS-009 | RLS habilitada nas tabelas principais | Alta | Implementado |
| RS-010 | RLS fina por perfil/membro | Media | Parcial |
| RS-011 | Nunca expor secrets no client | Alta | Obrigatorio permanente |

## Requisitos de testes

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RT-001 | Testes unitarios de calculos | Alta | Implementado |
| RT-002 | Testes unitarios de RBAC/permissoes | Alta | Implementado |
| RT-003 | Testes unitarios de mock data | Media | Implementado |
| RT-004 | Teste de integracao de Dashboard | Alta | Implementado |
| RT-005 | Teste de integracao de fluxo de permissoes | Alta | Implementado |
| RT-006 | Testes de Server Actions reais | Media | Planejado |
| RT-007 | Testes E2E | Media | Futuro |

## Requisitos mobile

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RM-001 | Web/PWA instalavel no celular | Alta | Implementado |
| RM-002 | Manifest PWA | Alta | Implementado |
| RM-003 | Navegacao mobile no Web/PWA | Alta | Implementado |
| RM-004 | App Android React Native/Expo | Alta | Planejado |
| RM-005 | App iOS React Native/Expo | Alta | Planejado |
| RM-006 | Login persistente mobile nativo | Alta | Planejado |
| RM-007 | Navegacao mobile nativa | Alta | Planejado |
| RM-008 | Lancamento rapido de gastos no app nativo | Alta | Planejado |
| RM-009 | Consulta de saldo individual no app nativo | Alta | Planejado |
| RM-010 | Notificacoes de vencimento | Media | Futuro |

## Requisitos nao funcionais

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RNF-001 | Dados protegidos por autenticacao | Alta | Implementado |
| RNF-002 | Regras de acesso validadas no backend | Alta | Implementado |
| RNF-003 | Interface simples para uso familiar | Alta | Implementado |
| RNF-004 | Build sem erros antes de entrega | Alta | Obrigatorio por release |
| RNF-005 | Lint sem erros antes de entrega | Alta | Obrigatorio por release |
| RNF-006 | Testes aprovados antes de entrega | Alta | Obrigatorio por release |
| RNF-007 | Banco sem duplicacao de seed | Alta | Implementado |
| RNF-008 | Preparado para app nativo | Media | Parcial |
| RNF-009 | Deploy automatico controlado | Media | Implementado |
| RNF-010 | Documentacao atualizada junto com codigo | Alta | Obrigatorio permanente |

## Requisitos de modulos futuros

| ID | Requisito | Prioridade | Status |
|---|---|---:|---|
| RFUT-001 | Contas fixas | Alta | Planejado |
| RFUT-002 | Alertas financeiros | Alta | Planejado |
| RFUT-003 | Dividas | Media | Planejado |
| RFUT-004 | Metas | Media | Planejado |
| RFUT-005 | Investimentos | Media | Planejado |
| RFUT-006 | Acoes/cotacoes | Media | Planejado |
| RFUT-007 | Graficos financeiros avancados | Media | Planejado |
| RFUT-008 | Exportacao PDF/Excel | Media | Planejado |
| RFUT-009 | Convites por e-mail | Media | Planejado |

## Regra de rastreabilidade

Toda nova funcionalidade deve possuir:

- requisito;
- modulo;
- acao de permissao necessaria;
- escopo de dados afetado;
- impacto em Server Actions;
- impacto em queries server-side;
- impacto em RLS, se aplicavel;
- criterio de aceite;
- impacto em mobile, se aplicavel;
- teste automatizado ou plano de teste manual;
- atualizacao de documentacao.
