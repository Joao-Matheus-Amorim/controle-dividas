# Admin Access-Control Owner ID Retirement Contract

> Status DocDoc: Atual como contrato com read/write/access-control admin organization-first
> Uso atual: contrato para retirar futuramente `owner_id` de Admin e
> access-control sem falso verde.
> Fonte-base: `docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md`.
> Gate relacionado: `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md`.

Atualizado em: 2026-06-01

## 1. Objetivo

Este contrato define o que precisa estar provado antes de mexer em:

- `lib/finance/admin-server.ts`;
- `app/protected/admin/actions.ts`;
- `lib/finance/access-control.ts`;
- `ADMIN_EMAIL`;
- permissoes por modulo e feature.

Ele registra os primeiros runtimes admin organization-first em
`lib/finance/admin-server.ts`, `app/protected/admin/actions.ts` e
`lib/finance/access-control.ts`. Reads/writes admin sao gated por
`requireOrganizationAdmin`; access-control resolve permissoes e membros por
organizacao ativa. Ele nao altera schema, RLS, UI, seeds, billing, remocao de
`ADMIN_EMAIL` ou drop de `owner_id`.

## 2. Estado atual permitido

Admin continua sendo a excecao owner-based ativa do G-005.

Estado transicional permitido:

```txt
organization admin gate + organization.id, preservando owner_id transicional em payloads a partir de `organization.owner_auth_user_id`
```

Bootstrap permitido:

```txt
ADMIN_EMAIL apenas como mecanismo transicional/emergencial.
```

Estado proibido como conclusao:

```txt
admin/access-control pronto para remover owner_id agora.
```

## 3. Dependencias atuais

| Superficie | Uso atual de `owner_id` | Risco |
| --- | --- | --- |
| `lib/finance/admin-server.ts` | leituras de dashboard admin exigem admin da organizacao ativa e filtram profiles, membros, module permissions e feature permissions por `organizationId` | preserva owner transicional apenas nos campos selecionados |
| `app/protected/admin/actions.ts` | writes admin exigem admin da organizacao ativa, validam email, membro e perfil por `organization.id`, e preservam `owner_id` apenas em payloads transicionais usando `organization.owner_auth_user_id` da organizacao alvo | audit/rate-limit seguem obrigatorios antes de qualquer retirada final |
| `lib/finance/access-control.ts` | calcula permissoes e membros acessiveis por `organizationId`, sem filtro `profile.owner_id` para membros ativos | `owner_id` segue no tipo transicional ate schema final |
| `ADMIN_EMAIL` | bootstrap global enquanto onboarding/admin final nao esta fechado | nao escala como modelo SaaS final |

## 4. Criterios antes de runtime

Nenhum PR pode retirar `owner_id` do schema final
sem:

1. RLS Live Gate verde com artifact;
2. fixture RLS cobrindo admin em duas organizacoes;
3. contrato de convite/admin final aprovado em `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md`;
4. definicao de substituto para `ADMIN_EMAIL`;
5. prova de que `profile_id`, `linked_family_member_id`, module permissions e feature permissions sao resolvidos por `organization_id`;
6. manutencao dos audit events admin;
7. manutencao dos rate limits admin;
8. rollback documentado.

## 5. Sequencia segura

| Ordem | PR | Escopo | Fora de escopo |
| --- | --- | --- | --- |
| 1 | contrato admin/access-control | este documento e guard | runtime |
| 2 | fixture RLS admin multi-org | `__tests__/integration/rls/admin-multi-org.rls.test.ts` prova leitura RLS admin em duas organizacoes sem `owner_id` compartilhado | alterar policies |
| 3 | modelo de convite/admin | definir bootstrap final e papel de `ADMIN_EMAIL` em `ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md` | remover coluna |
| 4 | read path admin | `lib/finance/admin-server.ts` com `requireOrganizationAdmin(orgSlug)` e sem `adminProfile.owner_id` como filtro primario de leitura | writes admin |
| 5 | write path admin | `app/protected/admin/actions.ts` com `requireOrganizationAdmin` e validates/writes por organization-first | access-control |
| 6 | access-control | `lib/finance/access-control.ts` calcula membros/permissoes por `organizationId`, sem filtro `profile.owner_id` para membros ativos | schema drop |
| 7 | schema final | retirar dependencias residuais de `owner_id` | qualquer runtime pendente |

## 6. Guardrails

- Admin pages podem importar `@/lib/finance/admin-server`.
- Admin pages nao podem importar `@/lib/finance/server`, `banks-server` ou `reports-server`.
- `ADMIN_EMAIL` nao pode ser tratado como modelo SaaS final.
- `owner_id` nao pode ser removido de admin/access-control antes dos gates acima.
- Writes admin devem continuar auditados e rate-limited em qualquer refactor.

## 7. Decisao operacional

Estado atual:

```txt
read/write path admin em `lib/finance/admin-server.ts` e `app/protected/admin/actions.ts` exige admin da organizacao ativa e esta organization-first; access-control tambem calcula permissoes e membros por organizacao. O gate runtime de ADMIN_EMAIL foi removido dos helpers server-side; owner_id permanece transicional.
```

Contrato de convite/admin criado:

```txt
docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md
```

Fixture criada:

```txt
__tests__/integration/rls/admin-multi-org.rls.test.ts
```

Proximo PR seguro:

```txt
proximo PR dedicado deve tratar outro consumidor de `owner_id`, sem
reintroduzir ADMIN_EMAIL como gate runtime e sem remover owner_id antes dos
gates de schema/RLS.
```
