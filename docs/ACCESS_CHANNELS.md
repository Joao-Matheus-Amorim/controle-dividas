# FamilyFinance - Canais de Acesso

> Status DocDoc: Parcialmente superado/estrategia
> Superado por: `docs/adr/0009-mobile-channel-boundary.md` e
> `docs/MOBILE_STRATEGY.md`.
> Uso atual: contexto de canais mobile/web/admin; nao usar como evidencia de
> app nativo implementado.

## Decisao oficial

O FamilyFinance tera dois canais principais:

1. App Mobile Familiar
2. Painel Web Admin

O app mobile sera usado por todos os membros que tiverem login, incluindo Danyel.

O painel web Admin sera usado para configuracao e gerenciamento, acessado pelo Danyel quando precisar administrar.

## Danyel no sistema

Danyel tem dois papeis ao mesmo tempo:

1. Membro financeiro da familia.
2. Admin familiar.

Como membro financeiro, Danyel usa o app nativo normalmente para:

- ver seu saldo;
- lancar seus gastos;
- acompanhar suas contas;
- consultar bancos autorizados;
- participar dos relatorios da familia.

Como Admin familiar, Danyel ve no app um atalho Admin.

Ao clicar nesse atalho, o app abre o painel web de gerenciamento.

## Familiares no sistema

Pai, Mae, Gabryel e demais usuarios familiares usam apenas o app nativo.

Eles nao acessam a area Admin, exceto se o Danyel futuramente conceder papel de Admin a outro usuario.

## Decisao sobre Admin no app

A opcao escolhida e a Opcao B.

O app mobile exibira um atalho Admin apenas para usuarios com perfil Admin.

Na pratica inicial, esse usuario sera Danyel.

A administracao nao sera reconstruida dentro do app mobile. O app apenas direciona o Admin para o painel web.

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
- Exibir atalho Admin apenas para perfil Admin.

## Atalho Admin no app mobile

O atalho Admin sera condicionado ao perfil do usuario autenticado.

### Regra de exibicao

- Se o usuario logado tiver `profile.role = admin`, o app exibe o atalho Admin.
- Se o usuario logado tiver `profile.role = user`, o app nao exibe o atalho Admin.

Nao deve ser usado o nome da pessoa para decidir se mostra Admin. A regra deve ser baseada no perfil e permissao.

### Comportamento ao clicar

O app deve abrir:

```txt
<NEXT_PUBLIC_APP_URL>/protected/admin
```

A abertura pode ser feita de duas formas:

1. Navegador externo.
2. WebView interna do app.

A recomendacao inicial e usar navegador externo, por ser mais simples, seguro e facil de manter.

### Regra de seguranca

Mesmo que um usuario comum descubra a URL do painel Admin, as regras de autenticacao e permissao devem impedir acesso indevido.

O atalho no app e apenas conveniencia visual. A seguranca real deve estar no backend, nas rotas protegidas e nas regras do painel web.

## Regras de autenticacao

- Danyel autentica no app como membro financeiro e tambem pode autenticar no painel web Admin.
- Familiares autenticam no app mobile.
- O mesmo backend Supabase gerencia autenticacao e dados.
- As permissoes configuradas no painel web controlam o app.

## Regra de produto

Toda configuracao administrativa deve nascer primeiro no painel web.

O app mobile deve permanecer simples, voltado para uso diario, sem excesso de configuracoes.

## Conclusao

O FamilyFinance nao tera dois sistemas concorrentes. A divisao sera clara:

- App Mobile: uso diario por Danyel e familiares.
- Web Admin: configuracao e controle pelo Danyel.
- Atalho Admin no app: visivel apenas para perfil Admin e direcionando para o painel web.
