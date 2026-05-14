# FamilyFinance - Admin Familiar e Permissoes

## Decisao de escopo

O sistema tera Admin familiar.

O Admin nao sera um administrador de SaaS comercial. Ele sera o responsavel principal da familia e controlara o que cada usuario familiar pode ver, criar, editar ou excluir.

## Objetivo do Admin

Garantir que cada membro da familia tenha acesso apenas ao necessario para sua rotina financeira.

## Papeis

### Admin familiar

Pode:

- ver dashboard consolidado;
- criar usuarios familiares;
- criar membros financeiros;
- vincular usuario a membro financeiro;
- editar limites mensais;
- gerenciar categorias;
- gerenciar bancos;
- configurar permissoes;
- ver relatorios;
- editar ou excluir registros conforme necessario.

### Usuario familiar

Pode executar apenas o que o Admin permitir.

Exemplos:

- ver apenas seu proprio dashboard;
- lancar gastos proprios;
- ver contas autorizadas;
- editar apenas seus lancamentos;
- nao excluir dados sensiveis.

### Membro financeiro sem login

Algumas pessoas podem existir apenas para controle financeiro, sem acesso ao app.

Exemplo:

- Caleb pode ter limite e gastos controlados, mas nao necessariamente ter login.

## Modulos permissionaveis

- DASHBOARD
- PESSOAS
- GASTOS
- CONTAS_A_PAGAR
- CONTAS_A_RECEBER
- BANCOS
- RELATORIOS
- CONFIGURACOES
- DIVIDAS futuro
- INVESTIMENTOS futuro
- METAS futuro

## Acoes permissionaveis

Para cada modulo, o Admin podera configurar:

- can_view: pode visualizar;
- can_create: pode criar;
- can_edit: pode editar;
- can_delete: pode excluir.

## Exemplo de permissao

| Usuario | Modulo | Ver | Criar | Editar | Excluir |
|---|---|---:|---:|---:|---:|
| Pai | GASTOS | Sim | Sim | Sim | Nao |
| Mae | CONTAS_A_PAGAR | Sim | Sim | Sim | Nao |
| Gabryel | GASTOS | Sim | Sim | Nao | Nao |
| Caleb | DASHBOARD | Nao | Nao | Nao | Nao |

## Modelo de dados proposto

```sql
profiles
- id
- auth_user_id
- name
- email
- role: admin | user
- linked_family_member_id
- is_active
- created_at

user_module_permissions
- id
- profile_id
- module
- can_view
- can_create
- can_edit
- can_delete
- granted_by
- created_at
```

## Regras

1. Admin sempre tem acesso total.
2. Usuario familiar so acessa modulos liberados.
3. Permissao deve ser aplicada no frontend e no backend/RLS.
4. Menu deve esconder modulos sem permissao de visualizacao.
5. Botoes de criar, editar e excluir devem respeitar permissoes.
6. Dados sensiveis devem ser protegidos no banco, nao apenas na tela.

## Impacto na implementacao

Antes de criar novos modulos avancados, implementar:

1. profiles;
2. user_module_permissions;
3. admin guard;
4. permission guard;
5. menu dinamico;
6. dashboard individual;
7. dashboard consolidado do Admin.
