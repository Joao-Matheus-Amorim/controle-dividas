# Admin Access-Control Owner ID Retirement Contract

> Status DocDoc: Atual como contrato pre-runtime
> Uso atual: contrato para retirar futuramente `owner_id` de Admin e
> access-control sem falso verde.
> Fonte-base: `docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md`.

Atualizado em: 2026-06-01

## 1. Objetivo

Este contrato define o que precisa estar provado antes de mexer em:

- `lib/finance/admin-server.ts`;
- `app/protected/admin/actions.ts`;
- `lib/finance/access-control.ts`;
- `ADMIN_EMAIL`;
- permissoes por modulo e feature.

Ele nao altera runtime, schema, RLS, UI, seeds ou billing.

## 2. Estado atual permitido

Admin continua sendo a excecao owner-based ativa do G-005.

Estado transicional permitido:

```txt
adminProfile.owner_id + organization.id
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
| `lib/finance/admin-server.ts` | filtra profiles, membros, module permissions e feature permissions por `adminProfile.owner_id` + `organizationId` | admin multi-org pode ser restringido pelo owner transicional |
| `app/protected/admin/actions.ts` | valida email, membro, perfil e writes com `adminProfile.owner_id` + `organization.id` | write path admin e sensivel; nao pode mudar sem audit/rate-limit preservados |
| `lib/finance/access-control.ts` | calcula membros acessiveis usando `profile.owner_id` e `organizationId` | permissoes de usuario podem divergir se owner sair antes do modelo final |
| `ADMIN_EMAIL` | bootstrap global enquanto onboarding/admin final nao esta fechado | nao escala como modelo SaaS final |

## 4. Criterios antes de runtime

Nenhum PR pode trocar `adminProfile.owner_id` sem:

1. RLS Live Gate verde com artifact;
2. fixture RLS cobrindo admin em duas organizacoes;
3. contrato de convite/admin final aprovado;
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
| 3 | modelo de convite/admin | definir bootstrap final e papel de `ADMIN_EMAIL` | remover coluna |
| 4 | read path admin | trocar leituras admin para organization-first | writes admin |
| 5 | write path admin | trocar validates/writes admin para organization-first | schema drop |
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
admin/access-control permanece transicional.
```

Proximo PR seguro:

```txt
fixture RLS admin multi-org, sem alterar runtime.
```

Fixture criada:

```txt
__tests__/integration/rls/admin-multi-org.rls.test.ts
```
