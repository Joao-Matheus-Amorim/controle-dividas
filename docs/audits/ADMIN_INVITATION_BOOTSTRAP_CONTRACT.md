# Admin Invitation Bootstrap Contract

> Status DocDoc: Atual como contrato pre-runtime com schema/preflight versionado
> Uso atual: contrato para substituir futuramente `ADMIN_EMAIL` por um
> modelo SaaS de convite/admin por organizacao, sem falso verde.
> Fonte-base: `docs/audits/ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md`.

Atualizado em: 2026-06-08

## 1. Objetivo

Este contrato define o alvo final para administracao inicial, convites e
recuperacao de ownership antes de qualquer runtime que remova a dependencia
transicional de `ADMIN_EMAIL`.

Ele nao altera runtime, UI, billing, seeds ou deploy.

## 2. Estado atual permitido

O estado atual permitido continua sendo transicional:

```txt
ADMIN_EMAIL apenas como bootstrap emergencial/transicional.
```

O estado final desejado e:

```txt
organizacao + organization_memberships(role owner/admin) + convite auditado.
```

Estado proibido como conclusao:

```txt
ADMIN_EMAIL como modelo SaaS final de administracao.
```

## 3. Autoridade final de acesso admin

O modelo final deve usar a organizacao ativa e a membership ativa como fonte de
autorizacao:

| Decisao | Contrato |
| --- | --- |
| Autoridade admin | `organization_memberships.role in ('owner', 'admin')` para a organizacao ativa. |
| Primeiro owner | criado pelo onboarding transacional `create_initial_organization_onboarding`. |
| Admin convidado | criado por convite aceito, com membership ativa na organizacao alvo. |
| Perfil financeiro | `profiles.organization_id` e `linked_family_member_id` resolvidos dentro da organizacao alvo. |
| Email | normalizado para convite/linking, nunca como unica garantia de admin. |
| `ADMIN_EMAIL` | fallback emergencial/dev-only ate a transicao estar validada. |

## 4. Contrato de convite

Antes de implementar runtime de convites, um PR dedicado deve definir ou criar:

1. armazenamento do convite ou RPC equivalente;
2. email convidado normalizado;
3. organizacao alvo resolvida no servidor;
4. emissor do convite como owner/admin ativo da organizacao;
5. token ou codigo com expiracao, uso unico e redacao segura;
6. estados minimos: pendente, aceito, revogado e expirado;
7. aceite criando ou ativando membership na organizacao alvo;
8. linking de perfil sem confiar em `organization_id` enviado pelo cliente;
9. auditoria para criar, reenviar, aceitar, revogar e expirar convite;
10. rate limit para criar, reenviar e aceitar convite;
11. rollback que mantenha `ADMIN_EMAIL` emergencial ate validacao completa.

## 5. Recuperacao de ownership

Antes de remover o fallback transicional, deve existir decisao explicita para:

- organizacao sem owner ativo;
- transferencia de ownership;
- ultimo owner tentando sair, desativar ou excluir a propria membership;
- conta suspensa/inativa;
- perda de acesso ao email do owner;
- suporte operacional sem service role exposto ao app client.

Nenhum runtime deve permitir que uma organizacao ativa fique sem owner sem um
fluxo documentado de recuperacao.

## 6. Gates antes de remover `ADMIN_EMAIL`

`ADMIN_EMAIL` so pode deixar de ser fallback transicional depois de todos os
gates:

1. RLS Live Gate verde com artifact apos a fixture admin multi-org;
2. runtime de convite implementado em PR proprio;
3. audit events de convite/admin preservados;
4. rate limits de convite/admin preservados;
5. testes unitarios e gated proporcionais ao risco;
6. docs de validacao e gap register atualizados;
7. rollback documentado;
8. evidencia de que admin/access-control nao depende de `adminProfile.owner_id`
   para autorizar a organizacao ativa.

## 7. Sequencia segura

| Ordem | PR | Escopo | Fora de escopo |
| --- | --- | --- | --- |
| 1 | contrato convite/admin | este documento, mapas DocDoc e guard | runtime |
| 2 | schema/preflight de convites | `supabase/migrations/044_admin_invitations_schema.sql` e guard unitario | UI ampla |
| 3 | runtime criar/revogar/reenviar convite | server actions, audit e rate limit | remover `ADMIN_EMAIL` |
| 4 | runtime aceitar convite | membership/profile linking por organizacao | owner_id retirement |
| 5 | read path admin organization-first | leituras admin sem `adminProfile.owner_id` como filtro primario | writes admin |
| 6 | write path admin organization-first | writes admin preservando audit/rate-limit | schema final |
| 7 | access-control organization-first | permissoes por organization/membership | remover coluna |
| 8 | deprecacao `ADMIN_EMAIL` | fallback dev-only/emergencia documentado | mudanca sem rollback |

## 8. Guardrails

- Convite/admin nao pode confiar em `organization_id` do cliente.
- Convite/admin nao pode gravar token, segredo ou payload bruto em audit log.
- `ADMIN_EMAIL` nao pode ser usado para conceder admin normal em multiplas
  organizacoes.
- Membership owner/admin deve ser organization-scoped.
- Remover `ADMIN_EMAIL` e remover `owner_id` nao podem ocorrer no mesmo PR.
- Webhook, billing, visual migration e RLS final ficam fora deste contrato.

## 9. Decisao operacional

Estado atual:

```txt
contrato criado; schema/preflight versionado em `supabase/migrations/044_admin_invitations_schema.sql`; runtime final de convite/admin ainda nao implementado.
```

Proximo PR seguro:

```txt
iniciar runtime de criar/revogar/reenviar convite em PR dedicado, com audit
events e rate limit, sem remover ADMIN_EMAIL e sem retirar owner_id.
```
