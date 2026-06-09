# Admin Access-Control Owner ID Retirement Contract

> Status DocDoc: Atual como contrato com read/write path admin organization-first
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
`lib/finance/admin-server.ts` e `app/protected/admin/actions.ts`, gated por
`requireOrganizationAdmin`. Ele nao altera access-control, schema, RLS, UI,
seeds, billing, remocao de `ADMIN_EMAIL` ou drop de `owner_id`.

## 2. Estado atual permitido

Admin continua sendo a excecao owner-based ativa do G-005.

Estado transicional permitido:

```txt
organization admin gate + organization.id, preservando owner_id transicional em payloads
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
| `app/protected/admin/actions.ts` | writes admin exigem admin da organizacao ativa, validam email, membro e perfil por `organization.id`, e preservam `owner_id` apenas em payloads transicionais | audit/rate-limit seguem obrigatorios antes de qualquer retirada final |
| `lib/finance/access-control.ts` | calcula membros acessiveis usando `profile.owner_id` e `organizationId` | permissoes de usuario podem divergir se owner sair antes do modelo final |
| `ADMIN_EMAIL` | bootstrap global enquanto onboarding/admin final nao esta fechado | nao escala como modelo SaaS final |

## 4. Criterios antes de runtime

Nenhum PR pode trocar `adminProfile.owner_id` em access-control ou schema final
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
| 6 | access-control | trocar calculo de membros/permissoes para organization-first | schema drop |
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
read/write path admin em `lib/finance/admin-server.ts` e `app/protected/admin/actions.ts` exige admin da organizacao ativa e esta organization-first; access-control, ADMIN_EMAIL e owner_id permanecem transicionais.
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
access-control organization-first em PR dedicado,
preservando audit/rate-limit, sem remover ADMIN_EMAIL e sem retirar owner_id.
```
