# Aceite e Roadmap - FamilyFinance

Este documento registra os criterios de aceite e o roadmap vivo do FamilyFinance conforme o estado atual do codigo.

## Estado atual

```txt
MVP Web/PWA: implementado e em consolidacao.
Admin familiar: implementado.
Permissoes por modulo/acao/escopo: implementadas.
Relatorios: implementados em versao inicial.
Mobile nativo: planejado.
SaaS publico: fora do escopo.
```

## Criterios de aceite do MVP Web/PWA

### Autenticacao

- [ ] Login funcionando.
- [ ] Cadastro funcionando apenas para e-mail autorizado pelo Admin.
- [ ] Confirmacao de e-mail/token funcionando.
- [ ] Recuperacao de senha funcionando.
- [ ] Atualizacao de senha funcionando.
- [ ] Usuario sem sessao redirecionado para `/auth/login`.
- [ ] Usuario com e-mail nao autorizado bloqueado.
- [ ] Usuario inativo bloqueado.

### Banco e ambiente

- [ ] `.env.local` configurado.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado.
- [ ] chave publica Supabase configurada.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada apenas no servidor.
- [ ] `ADMIN_EMAIL` configurado.
- [ ] Migration 001 executada.
- [ ] Migration 002 executada.
- [ ] Migration 003 executada.
- [ ] Migration 004 executada.
- [ ] Banco sem dados duplicados de seed.

### Modulos financeiros

- [ ] Dashboard abre sem erro.
- [ ] Dashboard respeita escopo de permissao.
- [ ] Pessoas podem ser criadas.
- [ ] Pessoas podem ser editadas.
- [ ] Pessoas podem ser ativadas/desativadas.
- [ ] Limites mensais podem ser alterados.
- [ ] Categorias podem ser criadas.
- [ ] Categorias podem ser excluidas.
- [ ] Gastos podem ser cadastrados.
- [ ] Gastos reduzem limite mensal.
- [ ] Gastos podem ser excluidos conforme permissao.
- [ ] Contas a pagar podem ser cadastradas.
- [ ] Contas a pagar podem mudar status.
- [ ] Contas vencidas aparecem como atrasadas.
- [ ] Contas a receber podem ser cadastradas.
- [ ] Contas a receber podem mudar status.
- [ ] Recebimentos vencidos aparecem como atrasados.
- [ ] Bancos podem ser cadastrados.
- [ ] Saldo bancario pode ser atualizado.
- [ ] Relatorios refletem dados reais.
- [ ] Configuracoes gerenciam limites e categorias.

## Criterios de aceite do Admin familiar

- [ ] Admin inicial criado pelo `ADMIN_EMAIL`.
- [ ] Admin acessa `/protected/admin`.
- [ ] Admin acessa `/protected/admin/usuarios`.
- [ ] Admin acessa `/protected/admin/permissoes`.
- [ ] Admin consegue criar usuario familiar.
- [ ] Admin consegue editar usuario familiar.
- [ ] Admin consegue excluir usuario familiar.
- [ ] Admin consegue ativar/desativar usuario familiar.
- [ ] Admin consegue vincular usuario a membro financeiro.
- [ ] Admin consegue sincronizar usuario com Supabase Auth pelo e-mail.
- [ ] Admin consegue liberar ou bloquear modulo.
- [ ] Admin consegue definir permissao de ver.
- [ ] Admin consegue definir permissao de criar.
- [ ] Admin consegue definir permissao de editar.
- [ ] Admin consegue definir permissao de excluir.
- [ ] Admin consegue definir escopo `own`.
- [ ] Admin consegue definir escopo `selected`.
- [ ] Admin consegue definir escopo `family`.
- [ ] Admin consegue escolher membros liberados para `selected`.
- [ ] Usuario familiar ve apenas modulos liberados.
- [ ] Usuario familiar nao consegue executar acao bloqueada.
- [ ] Admin ve dashboard consolidado.
- [ ] Usuario ve dashboard individual ou selecionado conforme permissao.

## Criterios de aceite de seguranca

- [ ] `SUPABASE_SERVICE_ROLE_KEY` nao aparece no client.
- [ ] `createAdminClient()` nao e importado em Client Components.
- [ ] Server Actions validam permissao antes de mutar dados.
- [ ] Queries financeiras usam escopo de membros acessiveis.
- [ ] Perfil inativo nao acessa dados.
- [ ] Usuario comum nao acessa Admin.
- [ ] URL direta de modulo bloqueado nao deve vazar dados.
- [ ] RLS permanece ativa nas tabelas principais.

## Criterios de aceite tecnico

- [ ] `npm run lint` aprovado.
- [ ] `npm run build` aprovado.
- [ ] `npm run test:run` aprovado.
- [ ] Teste manual por modulo realizado.
- [ ] Documentacao atualizada.
- [ ] Deploy manual feito apenas quando versao estiver estavel.

## Criterios de aceite do app nativo futuro

Ainda nao implementado.

Quando a fase mobile iniciar, os criterios serao:

- [ ] App Android gera build.
- [ ] App iOS gera build.
- [ ] Login mobile funciona.
- [ ] Sessao permanece ativa.
- [ ] Usuario consegue lancar gasto rapido.
- [ ] Usuario consegue consultar saldo.
- [ ] Usuario ve apenas menu liberado.
- [ ] Usuario executa apenas acoes permitidas.
- [ ] Admin ve atalho Admin.
- [ ] Atalho Admin abre painel web ou WebView segura.

## Roadmap

### Release 0.1 - Fundacao Web Financeira

Status: implementado.

Inclui:

- Next.js;
- TypeScript;
- Tailwind;
- Supabase;
- Auth base;
- Dashboard;
- Pessoas;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- Migrations iniciais.

### Release 0.2 - Estabilizacao Web/PWA

Status: implementado em grande parte / em consolidacao.

Inclui:

- correcao de seed duplicado;
- constraints de seed;
- UI mobile-first;
- PWA manifest;
- protecao contra scroll horizontal;
- deploy automatico desativado;
- documentacao atualizada;
- validacao tecnica.

Pendencias de consolidacao:

- rodar lint/build/test em ambiente local;
- separar mock de producao em calculos;
- melhorar feedbacks de erro;
- concluir edicoes completas.

### Release 0.3 - Admin Familiar e Permissoes

Status: implementado / em consolidacao.

Inclui:

- profiles;
- usuarios familiares;
- vinculo com membros financeiros;
- permissao por modulo;
- permissao por acao;
- escopo `own`, `selected`, `family`;
- `allowed_member_ids`;
- menu dinamico;
- Dashboard por permissao;
- Admin familiar.

Pendencias:

- UI completa para `user_feature_permissions`;
- aplicar `canUseFeature()` em mais pontos;
- testes adicionais de Server Actions.

### Release 0.4 - CRUD Completo e Periodos

Status: proxima fase recomendada.

Inclui:

- editar gasto completo;
- editar conta a pagar completa;
- editar conta a receber completa;
- editar banco completo;
- editar categoria;
- filtro por periodo;
- periodo dinamico no Dashboard;
- periodo dinamico em Relatorios;
- filtros por pessoa/categoria/status.

### Release 0.5 - Relatorios Avancados

Status: planejado.

Inclui:

- graficos;
- exportacao PDF/Excel;
- comparativo mensal;
- alertas simples;
- indicadores de saude financeira;
- projecoes.

### Release 0.6 - Modulos Financeiros Avancados

Status: planejado.

Inclui:

- contas fixas;
- dividas;
- metas;
- alertas;
- investimentos;
- acoes;
- cotacoes;
- historico de precos.

### Release 0.7 - App Mobile MVP

Status: futuro.

Inclui:

- React Native;
- Expo;
- Expo Router;
- Supabase JS;
- login;
- dashboard mobile;
- lancamento rapido de gastos;
- consulta de saldo;
- contas autorizadas;
- bancos autorizados;
- menu por permissao;
- atalho Admin para perfil Admin.

## Definition of Done

Uma entrega so sera considerada pronta quando:

- codigo implementado;
- dados persistidos corretamente;
- permissoes respeitadas quando aplicavel;
- usuario comum nao acessa dados indevidos;
- Admin acessa o que precisa;
- lint aprovado;
- build aprovado;
- testes aprovados;
- teste manual realizado;
- criterio de aceite validado;
- documentacao atualizada.

## Proxima entrega recomendada

A proxima entrega mais coerente e:

```txt
Release 0.4 - CRUD Completo e Periodos
```

Antes dela, executar validacao completa:

```bash
npm run lint
npm run build
npm run test:run
```

Depois priorizar:

1. separar mock de producao em `lib/finance/calculations.ts`;
2. concluir edicoes completas;
3. tornar periodo dinamico;
4. evoluir permissoes finas;
5. adicionar filtros e relatorios avancados.
