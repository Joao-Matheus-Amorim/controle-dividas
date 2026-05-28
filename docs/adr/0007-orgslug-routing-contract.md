# ADR 0007 - orgSlug routing contract

## Status

Aceito

## Data

2026-05-28

## Contexto

O app ja possui organizacao ativa, selector/troca de organizacao, RLS por membership e helpers server-side que aceitam `orgSlug` opcional.

Mesmo assim, as rotas de runtime ainda usam `/protected`:

```txt
/protected
/protected/pessoas
/protected/gastos
/protected/contas-a-pagar
/protected/contas-a-receber
/protected/bancos
/protected/relatorios
/protected/configuracoes
/protected/admin
/protected/admin/usuarios
/protected/admin/permissoes
```

Migrar todas as telas diretamente para uma rota dinamica sem contrato previo aumentaria o risco em auth, proxy, links, redirects, Server Actions, revalidacao e E2E.

## Decisao

A rota organization-aware futura deve usar o prefixo explicito:

```txt
/org/[orgSlug]
```

Exemplos:

```txt
/org/amorim
/org/amorim/pessoas
/org/amorim/gastos
/org/amorim/contas-a-pagar
/org/amorim/contas-a-receber
/org/amorim/bancos
/org/amorim/relatorios
/org/amorim/configuracoes
/org/amorim/admin
/org/amorim/admin/usuarios
/org/amorim/admin/permissoes
```

O prefixo `/org` evita colisao com rotas publicas e autenticacao:

```txt
/
/auth/*
/onboarding/organizacao
/protected/*
```

`/protected` permanece como rota compativel durante a transicao. Ele continua usando a organizacao ativa por cookie/fallback de membership.

Nas rotas `/org/[orgSlug]`, o slug da URL deve ser a fonte primaria do contexto de organizacao. O cookie de organizacao ativa pode ser atualizado como efeito de navegacao/autorizacao, mas nao deve sobrepor o slug da URL.

## Contrato de autorizacao

Toda rota `/org/[orgSlug]` deve validar acesso no servidor com o slug recebido da rota:

```txt
requireOrganizationAccess(orgSlug)
requireOrganizationAdmin(orgSlug)
getCurrentOrganization(orgSlug)
```

Regras:

- slug valido e com membership ativa: renderiza a tela da organizacao solicitada;
- slug valido sem membership ativa: nao renderiza dados; redireciona ou mostra erro autorizado pelo servidor;
- slug inexistente: nao renderiza dados; redireciona ou mostra erro autorizado pelo servidor;
- ausencia de sessao: redireciona para `/auth/login`;
- `/protected` continua funcionando como fallback compativel ate a migracao ser concluida.

## Contrato de links e redirects

Quando uma pagina estiver dentro de `/org/[orgSlug]`, os links internos devem preservar o slug.

Server Actions que revalidam caminhos devem revalidar o caminho com slug quando estiverem em rota organization-aware. Enquanto `/protected` existir, a compatibilidade pode revalidar tambem o caminho legado.

Redirects de auth continuam usando `/protected` como fallback ate existir decisao propria para deep links organization-aware.

## Sequencia de implementacao

1. Versionar este contrato.
2. Criar helpers centralizados para montar caminhos organization-aware.
3. Criar a primeira rota `/org/[orgSlug]` para dashboard sem remover `/protected`.
4. Provar por E2E gated:
   - slug valido abre dashboard;
   - slug sem acesso nao mostra dados;
   - troca de organizacao preserva contexto esperado;
   - `/protected` continua compativel.
5. Migrar rotas de modulo em PRs pequenos.
6. Atualizar links internos e revalidacoes por superficie.
7. So depois avaliar redirect automatico de `/protected` para `/org/[orgSlug]`.

## Fora de escopo

Este ADR nao altera runtime, schema, RLS, migrations, UI, billing, E2E ou dados.

Nao cria `app/org/[orgSlug]`.

Nao remove `/protected`.

Nao remove `owner_id`.

## Alternativas consideradas

### Usar rota top-level `/[orgSlug]`

Rejeitada por enquanto.

Essa rota e mais curta, mas aumenta risco de colisao com rotas publicas, auth, assets futuros e nomes reservados. Pode ser reconsiderada depois de `/org/[orgSlug]` estar estavel.

### Usar `/protected/[orgSlug]`

Rejeitada.

Mantem a rota sob um nome que hoje significa contexto por cookie/fallback. Isso confunde o contrato entre organizacao ativa implicita e organizacao explicita na URL.

### Remover `/protected` junto com a primeira rota por slug

Rejeitada.

Remover a rota legada no mesmo PR aumentaria risco de regressao em auth, E2E, links, revalidacoes e bookmarks.

## Relacao com issues/PRs

- Status vivo: `docs/SAAS_RLS_LIVE_STATUS.md`
- Roadmap operacional: `docs/SAAS_OPERATIONAL_ROADMAP.md`
- Arquitetura: `docs/ARCHITECTURE.md`
