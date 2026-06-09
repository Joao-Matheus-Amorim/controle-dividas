# Admin Invitation Bootstrap Contract

> Status DocDoc: Atual como contrato com schema/preflight e runtime de bootstrap final
> Uso atual: contrato que substitui o gate runtime de `ADMIN_EMAIL` por
> onboarding explicito e convite/admin por organizacao, sem falso verde.
> Fonte-base: `docs/audits/ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md`.

Atualizado em: 2026-06-08

## 1. Objetivo

Este contrato define o alvo final para administracao inicial, convites e
recuperacao de ownership antes de qualquer runtime que remova a dependencia
transicional de `ADMIN_EMAIL`.

Ele registra schema/preflight e runtime para criar, revogar, preparar reenvio,
aceitar convites com linking/criacao de profile antes da membership por
organizacao e remover o gate runtime de `ADMIN_EMAIL` dos helpers server-side.
Ele nao altera billing, seeds, email delivery ou retirement de `owner_id`.

O contrato de delivery/UI fica separado em
`docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md` para bloquear vazamento
de token bruto antes de qualquer provider ou tela de aceite.

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
| Admin convidado | criado por convite aceito, com profile e membership ativa na organizacao alvo. |
| Perfil financeiro | `profiles.organization_id` resolvido dentro da organizacao alvo antes da membership ativa, criando profile quando nao houver linha compativel. |
| Email | normalizado para convite/linking, nunca como unica garantia de admin. |
| `ADMIN_EMAIL` | nao pode ser gate runtime de admin/onboarding; qualquer uso futuro deve ser dev-only/emergencia documentada. |

## 4. Contrato de convite

Antes de implementar runtime de convites, um PR dedicado deve definir ou criar:

1. armazenamento do convite ou RPC equivalente;
2. email convidado normalizado;
3. organizacao alvo resolvida no servidor;
4. emissor do convite como owner/admin ativo da organizacao;
5. token ou codigo com expiracao, uso unico e redacao segura;
6. estados minimos: pendente, aceito, revogado e expirado;
7. aceite criando ou linkando profile na organizacao alvo antes da membership;
8. aceite criando ou ativando membership na organizacao alvo sem confiar em `organization_id` enviado pelo cliente;
9. auditoria para criar, reenviar, aceitar, revogar e expirar convite;
10. rate limit para criar, reenviar e aceitar convite;
11. rollback documentado sem reintroduzir `ADMIN_EMAIL` como autoridade normal.

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

## 6. Gates antes de manter `ADMIN_EMAIL` fora do runtime

`ADMIN_EMAIL` so pode ficar fora dos helpers server-side depois de todos os
gates abaixo:

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
| 3 | runtime criar/revogar/reenviar convite | `app/protected/admin/invitation-actions.ts`, audit e rate limit | remover `ADMIN_EMAIL` |
| 4 | runtime aceitar convite | `supabase/migrations/045_accept_admin_invitation_rpc.sql`, `supabase/migrations/047_accept_admin_invitation_profile_creation.sql` e `app/auth/convite/actions.ts` para profile/membership linking por organizacao antes do onboarding | owner_id retirement |
| 5 | contrato delivery/UI de convite | `docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md`, mapas DocDoc e guard | provider/UI runtime |
| 6 | cron de expiracao | `supabase/migrations/046_admin_invitation_expiry_cleanup.sql`, `app/api/cron/admin-invitations/expire/route.ts` e agenda Vercel | remover `ADMIN_EMAIL` |
| 7 | read path admin organization-first | `lib/finance/admin-server.ts` com `requireOrganizationAdmin(orgSlug)` e sem `adminProfile.owner_id` como filtro primario | writes admin |
| 8 | write path admin organization-first | `app/protected/admin/actions.ts` com `requireOrganizationAdmin` e validates/writes por organization-first | access-control |
| 9 | access-control organization-first | `lib/finance/access-control.ts` resolve permissoes e membros por organizacao ativa | remover coluna |
| 10 | deprecacao runtime de `ADMIN_EMAIL` | `lib/finance/access-control.ts` e `lib/finance/admin-server.ts` redirecionam usuario autenticado sem perfil para `/onboarding/organizacao` sem comparar email com env | mudanca sem rollback |

## 8. Guardrails

- Convite/admin nao pode confiar em `organization_id` do cliente.
- Convite/admin nao pode gravar token, segredo ou payload bruto em audit log.
- Delivery/UI de convite deve seguir
  `docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md` antes de provider ou
  tela publica.
- `ADMIN_EMAIL` nao pode ser usado para conceder admin normal ou bloquear
  onboarding em runtime.
- Membership owner/admin deve ser organization-scoped.
- Remover `ADMIN_EMAIL` e remover `owner_id` nao podem ocorrer no mesmo PR.
- Webhook, billing, visual migration e RLS final ficam fora deste contrato.

## 9. Decisao operacional

Estado atual:

```txt
contrato criado; schema/preflight versionado em `supabase/migrations/044_admin_invitations_schema.sql`; runtime criar/revogar/reenviar versionado em `app/protected/admin/invitation-actions.ts`; runtime aceitar/linking versionado em `supabase/migrations/045_accept_admin_invitation_rpc.sql` e `app/auth/convite/actions.ts`; contrato delivery/UI versionado em `docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md`; delivery adapter server-only versionado em `lib/admin-invitations/delivery.ts`; UI de aceite versionada em `app/auth/convite/page.tsx` e `components/admin-invitation-acceptance-form.tsx`; cron de expiracao versionado em `supabase/migrations/046_admin_invitation_expiry_cleanup.sql`, `app/api/cron/admin-invitations/expire/route.ts` e `vercel.json`; read/write/access-control admin organization-first versionado; gate runtime de `ADMIN_EMAIL` removido de `lib/finance/access-control.ts` e `lib/finance/admin-server.ts`.
aceite de convite agora tambem versiona `supabase/migrations/047_accept_admin_invitation_profile_creation.sql` para criar ou linkar profile antes de ativar membership, evitando queda indevida em `/onboarding/organizacao`.
```

Proximo PR seguro:

```txt
seguir com o proximo consumidor de `owner_id` em PR dedicado,
sem reintroduzir `ADMIN_EMAIL` como gate runtime.
```
