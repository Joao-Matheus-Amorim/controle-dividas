# FamilyFinance - Canais de Acesso

## Decisao oficial

O FamilyFinance tera dois canais principais:

1. Painel Web Admin
2. App Mobile Familiar

O painel web sera usado pelo Admin familiar, inicialmente Danyel.

O app mobile sera usado pelos demais membros da familia para operacoes do dia a dia.

## Decisao sobre Admin no app

A opcao escolhida e a Opcao B.

O app mobile podera exibir um atalho Admin apenas para Danyel.

Ao clicar nesse atalho, o app abrira o painel web Admin em uma WebView ou no navegador externo autenticado.

A administracao nao sera reconstruida dentro do app mobile. O app apenas direciona Danyel para o painel web Admin.

## Painel Web Admin

O painel web nao sera a interface principal da familia.

Ele sera um ambiente administrativo privado para o Danyel configurar e acompanhar a familia.

### Responsabilidades do painel web

- Criar e gerenciar membros financeiros.
- Criar e gerenciar usuarios familiares.
- Vincular usuarios a membros financeiros.
- Configurar permissoes por modulo.
- Configurar permissoes por acao: ver, criar, editar e excluir.
- Ajustar limites mensais.
- Gerenciar categorias.
- Gerenciar bancos.
- Ver dashboard consolidado.
- Ver relatorios familiares.
- Manter dados e regras da familia.

## App Mobile Familiar

O app mobile sera a interface principal para a rotina da familia.

### Responsabilidades do app mobile

- Login do usuario familiar.
- Dashboard individual.
- Lancamento rapido de gastos.
- Consulta de saldo.
- Consulta de contas autorizadas.
- Consulta de bancos autorizados.
- Acoes permitidas conforme permissao configurada pelo Danyel.

## Atalho Admin no app mobile

O atalho Admin sera condicionado ao usuario autenticado.

### Regra de exibicao

- Se o usuario logado for Danyel/Admin, o app exibe o atalho Admin.
- Se o usuario logado for familiar comum, o app nao exibe o atalho Admin.

### Comportamento ao clicar

O app deve abrir:

```txt
https://controle-dividas-seven.vercel.app/protected/admin
```

A abertura pode ser feita de duas formas:

1. Navegador externo.
2. WebView interna do app.

A recomendacao inicial e usar navegador externo, por ser mais simples, seguro e facil de manter.

### Regra de seguranca

Mesmo que um usuario comum descubra a URL do painel Admin, as regras de autenticacao e permissao devem impedir acesso indevido.

O atalho no app e apenas conveniencia visual. A seguranca real deve estar no backend e nas regras do painel web.

## Regras de autenticacao

- Danyel autentica no painel web Admin.
- Familiares autenticam no app mobile.
- O mesmo backend Supabase gerencia autenticacao e dados.
- As permissoes configuradas no painel web controlam o app.

## Regra de produto

Toda configuracao administrativa deve nascer primeiro no painel web.

O app mobile deve permanecer simples, voltado para uso diario, sem excesso de configuracoes.

## Conclusao

O FamilyFinance nao tera dois sistemas concorrentes. A divisao sera clara:

- Web Admin: configuracao e controle pelo Danyel.
- App Mobile: uso diario pela familia.
- Atalho Admin no app: visivel apenas para Danyel e direcionando para o painel web.
