# FamilyFinance - Canais de Acesso

## Decisao oficial

O FamilyFinance tera dois canais principais:

1. Painel Web Admin
2. App Mobile Familiar

O painel web sera usado pelo Admin familiar, inicialmente Danyel.

O app mobile sera usado pelos demais membros da familia para operacoes do dia a dia.

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

## Admin no app mobile

O app mobile nao deve conter uma area Admin completa.

Existem duas possibilidades futuras:

### Opcao A - Sem aba Admin no app

O app familiar nao exibe Admin. O Danyel acessa o painel web diretamente pelo navegador.

### Opcao B - Atalho Admin no app

O app pode exibir um botao ou item discreto chamado Admin apenas para o Danyel.

Ao clicar, o app abre o painel web Admin em uma WebView ou no navegador externo.

Esse atalho nao implementa a administracao dentro do app. Ele apenas redireciona para o painel web.

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
