# Dashboard UI contract

> Status DocDoc: Atual
> Uso atual: contrato textual vigente para a superficie principal do dashboard.
> Observacao: protege estrutura e permissao de UI; nao substitui RLS nem
> validacao visual seletiva.

Atualizado em: 2026-06-15

## Objetivo

Este contrato protege a superficie critica de UI financeira do GAP-011 sem criar snapshot amplo.
O dashboard agora registra uma baseline mais compacta e acionavel, com menos
texto, metricas mais fortes e acoes rapidas com hierarquia visual clara.

Escopo coberto neste PR:

- dashboard principal em `features/protected-pages/dashboard-page.tsx`;
- componentes em `components/dashboard/**`;
- compatibilidade com `/protected` e `/org/[orgSlug]`;
- textos e secoes criticas que E2E, permissao e navegacao usam como contrato.

## Contrato funcional de UI

O dashboard deve manter:

- heading principal `Visão do mês`;
- aviso limitado quando o usuario nao possui todos os modulos;
- resumo hero com leitura de limite, gastos, dividas e valores a receber conforme permissao;
- hero compacto com `Saldo do mês`, status curto e indicadores numericos;
- acoes rapidas usando `getOrgPathFromProtectedPath` para preservar `orgSlug`;
- acoes rapidas com o mesmo tratamento primario de app para todos os atalhos;
- resumo financeiro em carrossel compacto, com setas e cards laterais menores/opacos;
- contas e dividas;
- proximos vencimentos;
- categorias;
- bancos;
- rendas.

Os detalhes financeiros continuam vindo dos helpers organization-aware em `lib/organizations/**`.

## Contrato de permissao

A UI nao deve renderizar blocos financeiros fora do escopo permitido:

- gastos dependem de `GASTOS`;
- contas dependem de `CONTAS_A_PAGAR`;
- valores a receber dependem de `CONTAS_A_RECEBER`;
- bancos dependem de `BANCOS`;
- admin depende de `ADMIN`.

Esse contrato complementa os testes de dados e permissao existentes. Ele nao substitui RLS.

## Contrato de rota

O dashboard compartilhado deve continuar sendo usado por:

- `app/protected/page.tsx`;
- `app/org/[orgSlug]/page.tsx`.

Links internos do dashboard devem preservar slug quando a pagina estiver em `/org/[orgSlug]`.

## Contrato visual

Baseline atual:

- layout mobile-first dentro de `app-container`;
- secoes do dashboard em `components/dashboard`;
- componentes app-level como `AppCard` e `AppSectionTitle`;
- icones `lucide-react`;
- superficies escuras, bordas sutis e cards compactos.
- texto curto, metricas fortes e acoes visiveis acima da dobra.

## Fora de escopo

Este contrato nao:

- adiciona dependencias;
- cria snapshot visual amplo;
- muda tokens;
- redesenha telas;
- altera schema, RLS, billing ou permissoes;
- remove `/protected`;
- remove `owner_id`.

## Proxima expansao segura

Depois deste contrato, a cobertura de UI deve ser expandida em PRs pequenos para:

1. listas financeiras criticas;
2. formularios data-changing;
3. estados vazios e erro;
4. futuros graficos do dashboard quando GAP-018 for implementado.

Status: listas financeiras primarias agora possuem contrato proprio em `docs/audits/FINANCE_LIST_UI_CONTRACT.md`.
