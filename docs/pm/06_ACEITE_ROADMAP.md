# Aceite e Roadmap - FamilyFinance

## Criterios de aceite do MVP web

- Login funcionando.
- Dashboard familiar abrindo sem erro.
- Pessoas padrao sem duplicacao.
- Limites mensais editaveis.
- Gastos cadastrados reduzem saldo mensal.
- Contas a pagar vencidas aparecem como atrasadas.
- Contas a receber podem ser marcadas como recebidas.
- Bancos podem ser cadastrados e ter saldo atualizado.
- Relatorios refletem dados reais.
- Configuracoes permitem gerenciar limites e categorias.
- npm run lint aprovado.
- npm run build aprovado.

## Criterios de aceite do Admin familiar

- Admin consegue criar usuario familiar.
- Admin consegue vincular usuario a membro financeiro.
- Admin consegue liberar ou bloquear modulo.
- Admin consegue definir permissao de ver, criar, editar e excluir.
- Usuario familiar ve apenas modulos liberados.
- Usuario familiar nao consegue executar acao bloqueada.
- Admin ve dashboard consolidado.
- Usuario ve dashboard individual.

## Criterios de aceite do app nativo

- App Android gera build.
- App iOS gera build.
- Login mobile funciona.
- Sessao permanece ativa.
- Usuario consegue lancar gasto rapido.
- Usuario consegue consultar saldo.
- Admin consegue acessar area administrativa permitida.
- Permissoes sao respeitadas no app.

## Roadmap

### Release 0.1 - MVP web financeiro

Status: em validacao.

Inclui dashboard, pessoas, gastos, contas a pagar, contas a receber, bancos, relatorios e configuracoes.

### Release 0.2 - Estabilizacao

Inclui limpeza de duplicados, melhorias de UI, validacao de fluxo, teste manual, deploy web e documentacao de uso.

### Release 0.3 - Admin familiar

Inclui profiles, usuarios familiares, vinculo com membros financeiros, permissoes por modulo e acoes.

### Release 0.4 - App mobile MVP

Inclui app Android/iOS com login, dashboard, lancamento rapido de gastos, contas, bancos e relatorios simples.

### Release 0.5 - Recursos avancados

Inclui notificacoes, dividas, metas, investimentos simples e exportacoes.

## Definition of Done

Uma entrega so sera considerada pronta quando:

- codigo implementado;
- dados persistidos corretamente;
- permissoes respeitadas quando aplicavel;
- lint aprovado;
- build aprovado;
- teste manual realizado;
- criterio de aceite validado;
- documentacao atualizada.
