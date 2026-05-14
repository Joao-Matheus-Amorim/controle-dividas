# FamilyFinance - Estrategia Mobile

## Decisao principal

O FamilyFinance sera planejado como app nativo Android e iOS para uso diario da familia.

O painel web atual continuara existindo, mas seu papel sera especifico: sera o painel Admin privado utilizado pelo Danyel.

## Divisao oficial de canais

### Web Admin

A web sera usada apenas pelo Admin familiar, inicialmente Danyel.

Papel da web:

- backoffice administrativo;
- configuracao da familia;
- gestao de usuarios familiares;
- gestao de permissoes;
- ajuste de limites;
- categorias;
- bancos;
- relatorios consolidados;
- suporte e manutencao.

A web nao sera a interface principal dos demais membros da familia.

### App nativo

O app Android/iOS sera a interface principal da familia.

Papel do app:

- uso diario por Pai, Mae, Gabryel e demais usuarios familiares;
- lancamento rapido de gastos;
- consulta de saldo individual;
- visualizacao de contas autorizadas;
- recebimentos autorizados;
- bancos autorizados;
- notificacoes futuras;
- experiencia simples e mobile-first.

## Arquitetura recomendada

- Mobile: React Native com Expo.
- Web Admin: Next.js.
- Backend: Supabase.
- Banco: PostgreSQL via Supabase.
- Auth: Supabase Auth.
- Build mobile: EAS Build.
- Futuro: Expo Notifications.

## Principio de acesso

- Danyel acessa a web como Admin familiar.
- Familiares acessam o app nativo.
- Permissoes configuradas na web controlam o que aparece e o que pode ser feito no app.
- A web pode continuar com acesso total do Admin.
- O app deve esconder ou bloquear funcoes sem permissao.

## Por que React Native + Expo

A stack atual ja usa React, TypeScript e Supabase. React Native com Expo reduz retrabalho, permite compartilhar conceitos, tipos e regras de negocio, e entrega Android e iOS com uma base de codigo.

## Papel do app mobile

O app mobile deve priorizar:

- login persistente;
- lancamento rapido de gastos;
- consulta de saldo individual;
- dashboard simples;
- notificacoes de vencimento;
- telas adaptadas ao toque;
- operacao em poucos passos;
- permissoes aplicadas por usuario.

## Estrutura futura recomendada

```txt
familyfinance/
  apps/
    web-admin/
    mobile/
  packages/
    shared/
  supabase/
    migrations/
```

## Fases mobile

### Fase Mobile 1 - MVP do app familiar

- Login.
- Dashboard individual.
- Lancar gasto.
- Ver gastos autorizados.
- Ver contas a pagar autorizadas.
- Ver contas a receber autorizadas.
- Ver bancos autorizados.

### Fase Mobile 2 - Permissoes aplicadas no app

- Menu dinamico por permissao.
- Bloqueio de criar, editar e excluir por usuario.
- Dashboard individual por membro financeiro.
- Regras de acesso respeitadas no app e no backend.

### Fase Mobile 3 - Experiencia avancada

- Notificacoes.
- Dividas.
- Metas.
- Investimentos simples.
- Exportacoes.

## Fora do escopo mobile inicial

- SaaS publico.
- Multiplas familias.
- Assinatura.
- Integracao bancaria automatica.
- Open Finance.
- IA financeira.
- Publicidade.
- Area comercial.

## Decisao

Antes da implementacao mobile, a web deve ser consolidada como Admin privado do Danyel. O app mobile deve nascer como interface da familia, consumindo as permissoes definidas pelo Admin web.
