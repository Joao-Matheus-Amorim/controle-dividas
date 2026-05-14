# FamilyFinance - Visao do Produto

## Definicao

FamilyFinance e uma solucao financeira familiar personalizada para uma familia especifica.

O projeto nao sera tratado, nesta fase, como SaaS, produto publico, sistema para multiplas familias ou aplicacao comercial por assinatura.

## Produto final

O produto final desejado e um aplicativo nativo Android e iOS, com painel web administrativo de apoio.

## Papel do painel web atual

O painel web em Next.js continua importante e sera usado como:

- backoffice administrativo;
- ambiente de validacao das regras financeiras;
- painel do Admin familiar;
- referencia funcional para o app mobile;
- ferramenta de suporte e configuracao.

## Papel do app nativo

O app nativo sera o principal canal de uso diario da familia.

Ele deve priorizar:

- lancamento rapido de gastos;
- consulta de saldo individual;
- notificacoes de vencimento;
- dashboard simples;
- experiencia mobile-first;
- login persistente;
- navegacao simples por permissoes.

## Admin familiar

O Admin familiar permanece como pilar central do sistema.

Ele podera:

- ver tudo;
- criar usuarios familiares;
- vincular usuarios a membros financeiros;
- definir limites;
- gerenciar categorias;
- gerenciar bancos;
- definir permissoes por modulo;
- definir permissoes de ver, criar, editar e excluir;
- visualizar dashboard consolidado;
- acompanhar relatorios.

## Usuarios familiares

Usuarios familiares terao acesso limitado conforme configuracao do Admin.

Exemplos:

- Pai: ver e criar gastos.
- Mae: ver contas da casa e editar lancamentos autorizados.
- Gabryel: ver saldo proprio e lancar gastos.
- Caleb: pode existir como membro financeiro sem login obrigatorio.

## Principio de produto

O sistema deve ser simples para uso familiar, mas estruturado o suficiente para controle real de permissoes, seguranca e evolucao futura.
