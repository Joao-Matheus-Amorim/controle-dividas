# FamilyFinance - Diretriz Mobile First e UX

## Decisao oficial

O FamilyFinance deve ser desenhado como aplicativo familiar mobile-first.

A web atual nao deve parecer landing page de SaaS nem template generico. Ela deve funcionar como painel Admin privado do Danyel, mas a linguagem visual do produto deve nascer pensando no celular.

## Principios de interface

- Simples antes de completo.
- Mobile antes de desktop.
- Pouco texto.
- Acoes claras.
- Botao grande para acao principal.
- Cards limpos e arredondados.
- Navegacao curta.
- Hierarquia visual forte.
- Linguagem familiar, nao corporativa.
- Sem copy de marketing na autenticacao.

## Telas de autenticacao

As telas de login e cadastro devem ser objetivas.

### Login

Deve conter apenas:

- nome do app;
- titulo curto: Entrar;
- campo email;
- campo senha;
- botao Entrar;
- link Criar conta;
- mensagens de erro simples.

Nao deve conter:

- headline de marketing;
- texto institucional;
- cards de resumo financeiro ficticio;
- linguagem de SaaS;
- layout desktop pesado.

### Cadastro

Deve conter apenas:

- nome do app;
- titulo curto: Criar conta;
- email;
- senha;
- repetir senha;
- botao Continuar;
- link Ja tenho conta.

## App mobile familiar

O app mobile deve priorizar:

- dashboard individual;
- lancamento rapido de gasto;
- saldo atual;
- contas proximas;
- atalhos simples;
- permissao aplicada no menu e nas acoes.

## Danyel no app

Danyel usa o app como membro financeiro da familia.

Por ter perfil Admin, o app dele tambem exibe um atalho Admin.

Esse atalho abre o painel web Admin. A administracao nao sera recriada dentro do app mobile.

## Navegacao mobile sugerida

### Usuario familiar

- Inicio
- Gastos
- Contas
- Bancos
- Perfil

### Danyel/Admin

- Inicio
- Gastos
- Contas
- Bancos
- Perfil
- Admin

O item Admin deve ser exibido apenas quando `profile.role = admin`.

## Web Admin

A web Admin pode ter mais informacoes, mas ainda deve manter visual limpo.

Deve priorizar:

- painel administrativo;
- usuarios familiares;
- permissoes;
- limites;
- relatorios;
- configuracoes.

## Padrao visual recomendado

- Fundo claro.
- Cards brancos.
- Bordas suaves.
- Tipografia forte e limpa.
- Acoes principais em destaque.
- Espacamento confortavel.
- Layout responsivo.
- Experiencia proxima de app financeiro moderno.

## Regra de produto

Se uma tela parecer site institucional, ela deve ser redesenhada.

Se uma tela exigir explicacao longa para uso diario, ela deve ser simplificada.
