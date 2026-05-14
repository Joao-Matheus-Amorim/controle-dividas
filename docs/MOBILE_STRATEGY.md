# FamilyFinance - Estrategia Mobile

## Decisao principal

O FamilyFinance sera planejado como app nativo Android e iOS para uso diario da familia.

O painel web atual continuara existindo como backoffice administrativo e ambiente de configuracao.

## Arquitetura recomendada

- Mobile: React Native com Expo.
- Web Admin: Next.js.
- Backend: Supabase.
- Banco: PostgreSQL via Supabase.
- Auth: Supabase Auth.
- Build mobile: EAS Build.
- Futuro: Expo Notifications.

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

## Papel do painel web

O painel web deve priorizar:

- configuracoes administrativas;
- gestao de usuarios;
- permissoes;
- relatorios consolidados;
- ajustes de limites;
- gestao de categorias;
- suporte e manutencao.

## Estrutura futura recomendada

```txt
familyfinance/
  apps/
    web/
    mobile/
  packages/
    shared/
  supabase/
    migrations/
```

## Fases mobile

### Fase Mobile 1 - MVP

- Login.
- Dashboard familiar.
- Dashboard individual.
- Lancar gasto.
- Ver gastos.
- Ver contas a pagar.
- Ver contas a receber.
- Ver bancos.

### Fase Mobile 2 - Admin familiar

- Criar usuarios.
- Vincular usuarios a membros financeiros.
- Configurar permissoes.
- Controlar o que cada usuario pode ver, criar, editar e excluir.

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

Antes da implementacao mobile, o MVP web deve ser estabilizado e a documentacao aprovada. O app mobile deve nascer alinhado ao escopo personalizado da familia.
