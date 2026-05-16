# Feedback de actions e confirmacao de exclusao

## Objetivo

Melhorar a seguranca e a experiencia do modulo `Contas a pagar / Dividas`, evitando actions silenciosas e reduzindo risco de exclusao acidental.

## O que foi melhorado

- Alteracao de status agora retorna `success` ou `error`.
- Exclusao agora retorna `success` ou `error`.
- Exclusao exige confirmacao explicita antes do envio.
- A listagem usa componentes client para mostrar feedback ao usuario.

## Arquivos principais

```txt
app/protected/contas-a-pagar/actions.ts
components/finance/payable-bill-status-form.tsx
components/finance/payable-bill-delete-dialog.tsx
app/protected/contas-a-pagar/page.tsx
```

## Regra de status

A action `updatePayableBillStatus` valida:

- id da conta;
- status permitido;
- permissao `can_edit`;
- `owner_id` da familia atual.

Status validos:

```txt
pago
pendente
atrasado
```

## Regra de exclusao

A action `deletePayableBill` valida:

- id da conta;
- confirmacao enviada pelo formulario;
- permissao `can_delete`;
- `owner_id` da familia atual.

A exclusao so segue quando o formulario envia:

```txt
confirm_delete=confirmado
```

## Fora do escopo

- Toast global;
- historico de exclusoes;
- undo/restore de exclusao;
- auditoria de alteracoes;
- feedback global compartilhado entre todos os modulos.

Esses pontos podem evoluir em uma fase futura.
