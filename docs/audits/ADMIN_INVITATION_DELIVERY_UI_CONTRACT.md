# Admin Invitation Delivery and UI Contract

> Status DocDoc: Atual como contrato com delivery adapter e UI de aceite
> Uso atual: contrato para delivery server-only e UI de aceite de
> convite admin sem armazenar, logar ou expor token bruto.
> Fonte-base: `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md`.

Atualizado em: 2026-06-09

## 1. Objetivo

Este contrato define a fronteira segura entre o runtime ja versionado de
convites admin e a futura entrega do link de aceite.

Ele registra o delivery adapter server-only versionado em
`lib/admin-invitations/delivery.ts` e a UI de aceite versionada em
`app/auth/convite/page.tsx` e `components/admin-invitation-acceptance-form.tsx`,
alem do cron de expiracao versionado em
`app/api/cron/admin-invitations/expire/route.ts`. Ele nao implementa fila,
provider novo, remocao de `ADMIN_EMAIL`, retirement de `owner_id` ou mudanca de
billing.

## 2. Estado atual

O estado atual permitido e:

```txt
schema/preflight de convite, create/revoke/resend runtime, accept/linking runtime, delivery adapter server-only, UI de aceite e cron de expiracao existem; remocao de ADMIN_EMAIL ainda e pendente.
```

O estado proibido e:

```txt
retornar token bruto em server action state, JSON, audit metadata, log, toast, query de admin ou payload persistido.
```

## 3. Token bruto

O proximo runtime de delivery deve preservar estas regras:

1. token bruto deve ser gerado no servidor;
2. `organization_invitations` deve armazenar somente token hash;
3. token bruto so pode existir em memoria pelo tempo minimo necessario para
   montar o link de convite;
4. server actions de criar e reenviar convite nao podem retornar token bruto ao
   client;
5. audit metadata, logs, erros, rate-limit keys e mensagens de UI nao podem
   conter token bruto, token hash ou link completo;
6. qualquer resend deve gerar novo token bruto e substituir apenas o hash
   persistido;
7. rollback deve manter convites pendentes revogaveis sem exigir token bruto
   antigo.

## 4. Delivery de email

O delivery adapter atual usa provider server-only via webhook configurado por
ambiente, sem adicionar dependencia de email. A entrega so roda quando:

```txt
ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY=true
ADMIN_INVITATION_EMAIL_WEBHOOK_URL configurado
NEXT_PUBLIC_APP_URL configurado
```

Sem essa configuracao, a criacao/reenvio continua podendo preparar convites
sem enviar email. Quando a flag esta ligada, o delivery falha fechado se
provider ou env estiver ausente.

Antes de trocar para outro provider real, o PR de runtime deve decidir
explicitamente:

- provider server-only e dependencias permitidas;
- variaveis de ambiente obrigatorias;
- feature flag de delivery;
- comportamento fail closed quando provider, env ou template estiver ausente;
- compensacao para convite preparado mas nao entregue;
- redacao segura de erro operacional;
- template sem dados financeiros ou permissao alem de organizacao e papel.

O delivery nao pode aceitar email, organization id, role ou link vindos do
cliente como fonte de verdade. Esses valores devem vir da organizacao ativa e
do convite resolvido no servidor.

Se o provider falhar depois da escrita ou rotacao do convite com delivery
habilitado, o runtime usa a estrategia abaixo:

```txt
rollback transacional/compensatorio que revoga o convite preparado
```

## 5. UI de aceite

A UI de aceite usa a rota:

```txt
/auth/convite?token=...
```

Regras:

- a pagina nao pode imprimir token bruto;
- a pagina nao pode salvar token em localStorage, sessionStorage ou cookie
  criado pelo app;
- se o usuario nao estiver autenticado, o fluxo deve preservar a intencao do
  convite sem expor token em estado client-side persistente;
- o POST de aceite deve continuar passando pelo server action
  `acceptAdminInvitation`;
- erros devem ser genericos para token invalido, expirado, aceito ou revogado;
- email mismatch pode informar que a conta autenticada nao corresponde ao
  convite, sem exibir o email convidado completo.

## 6. Audit, rate limit e privacidade

O runtime existente ja cobre:

- `admin.invitation.create`;
- `admin.invitation.revoke`;
- `admin.invitation.resend`;
- `admin.invitation.accept`.

O delivery deve manter:

- rate-limit keys sem raw email, token bruto, token hash ou link completo;
- audit metadata redigida para dominio do email, role, status e categoria de
  falha;
- nenhuma gravacao de email completo quando dominio e suficiente;
- nenhum audit event anonimo que dependa de service role para mascarar ausencia
  de membership.

## 7. Sequencia segura

| Ordem | PR | Escopo | Fora de escopo |
| --- | --- | --- | --- |
| 1 | contrato delivery/UI | este documento, mapas DocDoc e guard | provider/UI runtime |
| 2 | delivery adapter | `lib/admin-invitations/delivery.ts`, env validation, fail closed e compensacao | UI ampla |
| 3 | UI de aceite | `app/auth/convite/page.tsx`, `components/admin-invitation-acceptance-form.tsx`, estados e POST seguro | remover `ADMIN_EMAIL` |
| 4 | cron de expiracao | `supabase/migrations/046_admin_invitation_expiry_cleanup.sql`, rota cron e agenda Vercel para expirar convites pendentes | owner_id retirement |

A rota de cron deve exigir `CRON_SECRET` e falhar fechado quando o segredo
estiver ausente ou o header `Authorization: Bearer ...` nao bater.

## 8. Guardrails

- Raw invitation token must never be stored, logged, audited, returned, or
  exposed outside the invite link sent to the invited email.
- Email delivery must fail closed when provider configuration is missing.
- Invitation UI must not persist invitation tokens in browser storage.
- Invitation expiry cron must not expose a public cleanup endpoint.
- Admin email fallback and owner_id retirement stay out of delivery/UI PRs.
- No provider dependency may be added without env validation and rollback.

## 9. Decisao operacional

Estado atual:

```txt
contrato delivery/UI criado; delivery adapter server-only versionado em `lib/admin-invitations/delivery.ts`; UI de aceite versionada em `app/auth/convite/page.tsx` e `components/admin-invitation-acceptance-form.tsx`; cron de expiracao versionado em `supabase/migrations/046_admin_invitation_expiry_cleanup.sql`, `app/api/cron/admin-invitations/expire/route.ts` e `vercel.json`; remocao de ADMIN_EMAIL e owner_id retirement seguem pendentes.
```

Proximo PR seguro:

```txt
planejar remocao de ADMIN_EMAIL em PR dedicado, mantendo owner_id retirement fora do escopo.
```
