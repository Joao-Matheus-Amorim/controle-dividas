# ADR 0003 - Design system and shadcn/ui adoption

## Status

Aceito

## Data

2026-05-18

## Contexto

O produto foi reposicionado como SaaS financeiro multi-tenant para producao massiva.

Nesse contexto, design nao e detalhe secundario. Em um SaaS financeiro, a interface precisa transmitir confianca, clareza, consistencia, seguranca e maturidade operacional.

O projeto ja possui `components.json` configurado para shadcn/ui e ja usa primitives em `components/ui`. Porem, instalar todos os componentes disponiveis de uma vez aumentaria a superficie de manutencao sem garantir qualidade visual final.

Como shadcn/ui copia componentes para dentro do repositorio, cada componente instalado passa a ser codigo do projeto. Portanto, a estrategia correta deve equilibrar ambicao visual com manutencao solo, PRs pequenos, gates e uso real.

## Decisao

shadcn/ui passa a ser o kit base oficial do design system do produto.

A adocao deve ser controlada por camadas, nao por instalacao completa indiscriminada.

O objetivo nao e ter todos os componentes instalados. O objetivo e ter um design system completo, consistente e sustentavel para um SaaS financeiro em producao.

A regra oficial passa a ser:

```txt
Adicionar componentes shadcn/ui somente quando houver uso real, decisao visual clara e PR pequeno validado pelos gates.
```

## Estrategia de camadas

### Camada 1 - Base essencial

Componentes essenciais para formularios, cards, dialogs e navegacao basica.

Exemplos:

- button;
- card;
- input;
- label;
- checkbox;
- select;
- dialog;
- dropdown-menu;
- table;
- badge.

### Camada 2 - SaaS UI essencial

Componentes que provavelmente serao necessarios para UX SaaS madura, onboarding, organizacao ativa, feedback e estados de tela.

Exemplos:

- tabs;
- separator;
- sheet;
- popover;
- tooltip;
- avatar;
- skeleton;
- alert;
- sonner/toast;
- form.

### Camada 3 - Fluxos avancados

Componentes para fluxos mais ricos, busca, calendario, navegacao contextual e listas longas.

Exemplos:

- command;
- calendar;
- date-picker;
- breadcrumb;
- pagination;
- drawer;
- accordion;
- collapsible;
- scroll-area.

### Camada 4 - Uso especifico

Componentes que so devem entrar quando houver necessidade clara e PR proprio.

Exemplos:

- chart;
- data-table avancada;
- combobox complexo;
- navigation-menu;
- sidebar.

## Alternativas consideradas

### Instalar todos os componentes shadcn/ui de uma vez

Rejeitada.

Essa alternativa cria sensacao de completude, mas aumenta manutencao, revisao, superficie de bugs e codigo nao usado.

### Nao ampliar o kit shadcn/ui

Rejeitada.

O design final e requisito central do produto. Um SaaS financeiro em producao precisa de UI consistente, acessivel, confiavel e escalavel.

### Adocao controlada por camadas

Aceita.

Permite evoluir o design system com seguranca, sem travar o produto e sem transformar `components/ui` em uma pasta grande sem uso real.

## Relacao entre diretorios de componentes

A separacao vigente continua valida:

```txt
components/ui       -> primitives reutilizaveis do design system
components/<dominio> -> secoes visuais especificas de cada modulo
components/finance  -> formularios/dialogs compartilhados por modulos financeiros
components/app      -> componentes internos genericos da aplicacao
```

`components/ui` nao deve conter regra de negocio.

`components/finance` nao deve virar pasta generica para qualquer componente financeiro visual. Quando um componente pertence claramente a um dominio, deve ficar no diretorio daquele dominio.

## Consequencias

### Positivas

- Design system evolui com intencao e governanca.
- Menor risco de instalar codigo nao usado.
- Mantem controle visual sem depender de biblioteca fechada.
- Melhora consistencia para SaaS financeiro.
- Permite PRs pequenos e revisaveis.

### Negativas / trade-offs

- A evolucao visual sera gradual.
- Algumas telas podem continuar com primitives limitadas ate o componente necessario ser formalmente adicionado.
- Exige disciplina para nao criar componentes customizados duplicados sem necessidade.

### Riscos a monitorar

- `components/ui` crescer sem uso real.
- `components/finance` virar pasta gaveta.
- Componentes shadcn serem alterados sem criterio visual.
- Design visual ficar inconsistente entre dominios.
- Instalar componentes sem testes/gates.

## Impacto em seguranca e dados

Sem impacto funcional em seguranca/dados. Decisao documental ou de governanca.

Mesmo assim, componentes visuais usados em fluxos financeiros devem respeitar:

- clareza de estados;
- feedback de erro;
- acessibilidade;
- legibilidade mobile;
- ausencia de ambiguidade em organizacao ativa, permissoes e dados financeiros.

## Relacao com PMBOK

Relaciona-se com:

- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md`

Esta ADR trata qualidade visual, manutenibilidade e governanca de mudancas de UI.

## Relacao com issues/PRs

- Issue: #255
- PR: a ser criado

## Criterios de revisao futura

Revisar esta decisao quando:

- houver design system documentado com tokens e exemplos visuais;
- houver landing page/public marketing site;
- houver onboarding multi-org;
- houver billing/plans;
- houver equipe de design ou padrao visual externo;
- `components/ui` crescer a ponto de exigir auditoria propria.
