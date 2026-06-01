# Codebase Scan Gap Checklist

Data: 2026-06-01

## Objetivo

Este documento consolida a varredura tecnica, operacional e organizacional do projeto para orientar os proximos PRs sem depender de uma nova varredura completa a cada frente.

Uso esperado:

- validar um item por vez;
- manter PRs pequenos e com escopo unico;
- marcar itens quando houver evidencia real;
- evitar misturar front, schema, RLS, billing, CI e produto no mesmo PR.

## Estado de Partida

- App em Next.js App Router com React 19 e Supabase SSR.
- Multi-tenant em transicao com `organizations`, `organization_memberships`, `organization_id` e `owner_id`.
- Rotas protegidas em `/protected` e rotas organization-aware em `/org/[orgSlug]`.
- Deploy automatizado via GitHub Actions: migrations Supabase antes do deploy Vercel.
- Migrations versionadas ate `043_restore_finance_relationships_and_rls_cleanup.sql`.
- RLS e guards bem documentados, mas parte da evidencia live ainda depende de gates manuais.
- Front em evolucao paralela; evitar tocar em arquivos visuais enquanto houver trabalho ativo no dashboard.

## Regras de Execucao

- [ ] Atualizar `main` antes de qualquer nova branch.
- [ ] Criar uma branch por frente.
- [ ] Fazer PR pequeno, com escopo unico.
- [ ] Nao remover `owner_id` sem plano proprio.
- [ ] Nao implementar webhook Stripe antes de evidencia real de checkout e portal.
- [ ] Nao declarar gap fechado sem CI verde, deploy/migration aplicado e doc alinhada.
- [ ] Nao rodar RLS live gate contra producao real.
- [ ] Nao criar E2E data-changing sem cleanup.

## P0 - Bugs e Riscos Imediatos

### P0.1 - Preservar redirects no Dashboard

Status: aberto

Problema:

`features/protected-pages/dashboard-page.tsx` usa `Promise.allSettled` e converte falhas em fallback vazio. Isso pode engolir erros de controle de fluxo do Next, como `redirect()` e `notFound()`, renderizando dashboard limitado quando deveria redirecionar para login, onboarding ou erro de autorizacao.

Arquivos provaveis:

- `features/protected-pages/dashboard-page.tsx`
- testes guard relacionados ao dashboard/auth redirects

Acao recomendada:

- [ ] Identificar helper oficial para detectar redirect/not-found do Next.
- [ ] Rethrow de redirect/not-found antes de aplicar fallback.
- [ ] Manter fallback apenas para falha de dados nao-control-flow.
- [ ] Criar/atualizar guard unitario.

Criterio de fechamento:

- [ ] Redirect de auth/onboarding nao e engolido por `Promise.allSettled`.
- [ ] Dashboard ainda degrada com fallback apenas para falha de dados permitida.

Estimativa: 0,5 dia.

### P0.2 - Validar efeito da migration 043 em producao

Status: aberto

Problema:

O banco remoto tinha tabelas/colunas e migrations registradas, mas nao tinha foreign keys usadas pelos embedded selects do PostgREST. A migration `043` restaura FKs como `NOT VALID` e remove policies antigas `*_own`, mas ainda falta confirmar aplicacao real no ambiente.

Arquivos:

- `supabase/migrations/043_restore_finance_relationships_and_rls_cleanup.sql`

Acao recomendada:

- [ ] Confirmar que o deploy de `main` aplicou a migration `043`.
- [ ] Rodar query de FKs e confirmar `convalidated = false`.
- [ ] Abrir rotas em producao: `/protected/gastos`, `/protected/contas-a-pagar`, `/protected/contas-a-receber`, `/protected/bancos`.
- [ ] Conferir Runtime Logs da Vercel se qualquer rota ainda quebrar.

Criterio de fechamento:

- [ ] FKs existem no banco.
- [ ] Rotas financeiras renderizam sem Server Components digest.

Estimativa: 0,5 dia.

### P0.3 - Preflight de orfaos antes de validar FKs

Status: em andamento

Problema:

As FKs restauradas em `043` foram criadas como `NOT VALID` para nao abortar migration em bancos com dados historicos orfaos. Falta preflight formal para contar e classificar esses orfaos antes de validar constraints.

Acao recomendada:

- [x] Criar SQL read-only para contar orfaos em `docs/sql/finance-relationships-orphan-preflight.sql`:
  - `expenses.family_member_id`
  - `expenses.category_id`
  - `payable_bills.responsible_member_id`
  - `receivable_incomes.receiver_member_id`
  - `banks.family_member_id`
- [ ] Documentar resultado por ambiente.
- [ ] Criar plano de cleanup se houver orfaos.
- [ ] Criar migration posterior para `VALIDATE CONSTRAINT` somente depois do cleanup.

Criterio de fechamento:

- [ ] Preflight mostra zero orfaos ou cleanup aprovado.
- [ ] FKs podem ser validadas sem rollback.

Estimativa: 0,5 a 1 dia para preflight; 0,5 a 1 dia para cleanup se necessario.

## P1 - Operacao e Deploy

### P1.1 - Health check pos-deploy

Status: aberto

Problema:

Deploy verde hoje prova build/migration/deploy, mas nao prova que rotas protegidas renderizam no runtime real.

Acao recomendada:

- [ ] Criar gate manual ou pos-deploy para smoke de rotas criticas.
- [ ] Validar pelo menos:
  - `/protected`
  - `/protected/gastos`
  - `/protected/contas-a-pagar`
  - `/protected/contas-a-receber`
  - `/protected/bancos`
  - `/protected/configuracoes`
- [ ] Capturar erro de Runtime Logs quando falhar.

Criterio de fechamento:

- [ ] Existe evidencia de smoke pos-deploy para o deploy atual.
- [ ] Falha de Server Components render vira alerta acionavel.

Estimativa: 1 dia.

### P1.2 - RLS Live Gate com evidencia real

Status: aberto

Problema:

O workflow existe, mas a evidencia live depende de execucao manual com ambiente dedicado.

Arquivos:

- `.github/workflows/rls-live-gate.yml`
- `docs/rls/RLS_LIVE_GATE.md`

Acao recomendada:

- [ ] Configurar `RLS_TEST_SUPABASE_URL`.
- [ ] Configurar secrets `RLS_TEST_SUPABASE_*`.
- [ ] Rodar workflow manual.
- [ ] Salvar artifact/summary como evidencia.
- [ ] Atualizar docs somente apos execucao verde.

Criterio de fechamento:

- [ ] RLS Live Gate executado com sucesso em ambiente dedicado.
- [ ] Evidencia registrada.

Estimativa: 0,5 a 1 dia depois das credenciais prontas.

### P1.3 - Padronizar observabilidade de erros server-side

Status: aberto

Problema:

Muitos loaders usam `throw new Error(error.message)`. Em producao isso vira digest opaco no browser, dificultando diagnostico.

Acao recomendada:

- [ ] Criar padrao de erro operacional com `surface`, `table`, `operation`, `safeMessage`.
- [ ] Logar detalhes no servidor sem expor segredo ao client.
- [ ] Aplicar primeiro em helpers de `lib/organizations/*`.

Criterio de fechamento:

- [ ] Runtime Logs mostram erro acionavel por superficie.
- [ ] Browser continua exibindo mensagem segura.

Estimativa: 1 a 2 dias.

## P1 - Billing e Receita

### P1.4 - Evidencia real de Stripe checkout e portal

Status: aberto

Problema:

Checkout e portal existem, mas ainda falta evidencia real com conta Stripe de teste. Webhook e subscription sync devem continuar bloqueados ate essa evidencia existir.

Arquivos:

- `lib/billing/stripe-checkout.ts`
- `lib/billing/stripe-portal.ts`
- `app/protected/configuracoes/billing-actions.ts`
- `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md`

Acao recomendada:

- [ ] Configurar conta Stripe de teste.
- [ ] Configurar env vars Stripe em Vercel.
- [ ] Rodar fluxo real de checkout em teste.
- [ ] Rodar fluxo real de portal em teste.
- [ ] Registrar evidencia no runbook/docs.

Criterio de fechamento:

- [ ] Checkout cria sessao real.
- [ ] Portal abre para organizacao com `stripe_customer_id`.
- [ ] Nenhum webhook foi implementado antes da evidencia.

Estimativa: 1 a 2 dias.

### P1.5 - Webhook e subscription sync

Status: bloqueado por P1.4

Problema:

Nao ha webhook, idempotencia de evento Stripe, subscription sync nem enforcement comercial.

Acao recomendada:

- [ ] Implementar webhook em PR proprio.
- [ ] Validar assinatura com `STRIPE_WEBHOOK_SECRET`.
- [ ] Registrar eventos processados para idempotencia.
- [ ] Sincronizar status de assinatura na organizacao.
- [ ] Manter enforcement comercial em PR posterior.

Criterio de fechamento:

- [ ] Webhook processa eventos de teste de forma idempotente.
- [ ] Subscription status refletido no banco.

Estimativa: 2 a 4 dias depois da evidencia Stripe.

## P1 - Seguranca e Controles

### P1.6 - Rate limit duravel/cache-backed

Status: aberto

Problema:

Rate limit sensivel usa memoria de processo. Isso e reversivel e simples, mas nao e controle forte em ambiente serverless/multi-instancia.

Acao recomendada:

- [ ] Escolher storage: tabela Postgres, Upstash/Redis, Vercel KV/Runtime Cache ou outro.
- [ ] Definir custo e rollback.
- [ ] Migrar uma fronteira critica primeiro.
- [ ] Depois expandir para public auth e operacoes sensiveis.

Criterio de fechamento:

- [ ] Uma fronteira critica usa storage compartilhado.
- [ ] O comportamento entre instancias e consistente.

Estimativa: 1 a 3 dias para primeira fronteira.

### P1.7 - Falhas de audit logging nao podem ser totalmente silenciosas

Status: aberto

Problema:

`recordAuditEvent` retorna `false` silenciosamente em falhas. Isso preserva UX, mas reduz rastreabilidade de operacoes sensiveis.

Arquivo:

- `lib/audit/events.ts`

Acao recomendada:

- [ ] Logar falha com contexto seguro.
- [ ] Definir quais acoes devem bloquear em caso de falha de auditoria.
- [ ] Manter metadados redigidos.

Criterio de fechamento:

- [ ] Falhas de auditoria aparecem em Runtime Logs com contexto seguro.
- [ ] Politica de bloquear vs nao bloquear esta documentada.

Estimativa: 0,5 a 1 dia.

## P2 - Produto e Modelo SaaS

### P2.1 - Substituir `ADMIN_EMAIL` por modelo final de convite/owner

Status: aberto

Problema:

`ADMIN_EMAIL` ainda e bootstrap global. Serve para transicao, mas nao escala como modelo SaaS final.

Acao recomendada:

- [ ] Definir modelo de convite/admin inicial.
- [ ] Definir recuperacao de ownership.
- [ ] Definir papel de `ADMIN_EMAIL` como dev-only/emergencia.
- [ ] Criar ADR ou atualizar ADR existente.

Criterio de fechamento:

- [ ] Novo owner/admin nao depende de secret global.
- [ ] Transicao tem rollback.

Estimativa: 3 a 5 dias.

### P2.2 - Plano de aposentadoria de `owner_id`

Status: aberto

Problema:

`owner_id` segue como compatibilidade/write ownership. Remover agora e prematuro, mas precisa de plano proprio.

Acao recomendada:

- [ ] Inventariar todos os usos de `owner_id`.
- [ ] Classificar: auth ownership, tenant scope, compatibilidade, seed/test.
- [ ] Criar plano de migracao por tabela.
- [ ] Separar runtime, schema e cleanup em PRs diferentes.

Criterio de fechamento:

- [ ] Existe ADR/plano aprovado.
- [ ] Nenhuma remocao ocorre sem preflight e rollback.

Estimativa: 3 a 8 dias em fases.

### P2.3 - Membership lifecycle final

Status: aberto

Problema:

O limite de uma membership ativa foi removido, mas o comportamento final de convite, troca de org, admin e status de membros ainda precisa de decisao de produto.

Acao recomendada:

- [ ] Definir ciclo de vida: convidado, ativo, suspenso, removido.
- [ ] Definir quem pode alterar cada estado.
- [ ] Definir impacto em billing/permissoes.

Criterio de fechamento:

- [ ] ADR aceito.
- [ ] Fluxos admin ficam alinhados.

Estimativa: 2 a 4 dias.

## P2 - Front, UX e Qualidade Visual

### P2.4 - Validar redesign do dashboard com snapshot seletivo

Status: em andamento externo

Problema:

O front esta sendo atualizado em paralelo. Sem gate visual, pode haver regressao de layout/texto/estado.

Acao recomendada:

- [ ] Evitar mexer nos arquivos de front enquanto a frente visual estiver ativa.
- [ ] Validar textos sem mojibake.
- [ ] Rodar screenshot gated do dashboard summary quando a frente estabilizar.
- [ ] Atualizar docs de visual tokens se o baseline mudar.

Criterio de fechamento:

- [ ] Dashboard renderiza em mobile e desktop.
- [ ] Sem texto corrompido.
- [ ] Snapshot seletivo ou evidencia visual anexada.

Estimativa: 0,5 a 1 dia depois do front estar pronto.

### P2.5 - Estrategia de estado client-side

Status: aberto

Problema:

Filtros, paginacao, optimistic updates e estado local ainda nao tem estrategia formal.

Acao recomendada:

- [ ] Documentar quando usar URL state.
- [ ] Documentar quando usar server actions.
- [ ] Documentar quando usar estado local.
- [ ] Evitar store global antes de necessidade real.

Criterio de fechamento:

- [ ] Documento curto de estrategia aceito.
- [ ] Uma superficie piloto aplicada.

Estimativa: 1 a 2 dias.

### P2.6 - Dashboard visualization

Status: aberto

Problema:

Graficos/time-series ainda nao estao definidos como capacidade de produto.

Acao recomendada:

- [ ] Definir quais insights importam.
- [ ] Definir periodo e granularidade.
- [ ] Escolher biblioteca apenas depois do contrato.

Criterio de fechamento:

- [ ] Contrato de produto para dashboard insights.
- [ ] Sem dependencia grafica antes do escopo.

Estimativa: 1 a 2 dias para contrato; 2 a 4 dias para implementacao inicial.

## P3 - Documentacao e Governanca

### P3.1 - Reduzir duplicacao documental

Status: aberto

Problema:

Ha muita documentacao viva repetindo os mesmos estados: gap register, roadmap, live status, ADRs, audits e docs PM. Isso ajuda governanca, mas aumenta risco de stale docs.

Acao recomendada:

- [ ] Definir fonte primaria por area:
  - gaps: `docs/SAAS_GAP_REGISTER.md`
  - arquitetura: ADRs
  - execucao operacional: este checklist ou roadmap
  - validacao: `docs/VALIDACAO_TECNICA.md`
- [ ] Reduzir repeticao textual nas proximas alteracoes.
- [ ] Atualizar docs historicas apenas quando necessario.

Criterio de fechamento:

- [ ] Cada area tem uma fonte primaria clara.
- [ ] PRs novos nao precisam editar 5 docs para uma frase equivalente.

Estimativa: 1 a 2 dias.

### P3.2 - Atualizar `VALIDACAO_TECNICA.md`

Status: aberto

Problema:

O documento ainda fala de migrations ate `039`; o estado real ja chega a `043` e deploy automatizado.

Acao recomendada:

- [ ] Atualizar lista de migrations obrigatorias ate `043`.
- [ ] Incluir `SUPABASE_DB_URL` como secret de deploy, nao env runtime do app.
- [ ] Incluir validacao de FKs restauradas.
- [ ] Incluir pos-deploy smoke.

Criterio de fechamento:

- [ ] Documento reflete fluxo atual de deploy e banco.

Estimativa: 0,5 dia.

## Sequencia Recomendada de PRs

1. Preservar redirects no dashboard.
2. Preflight de orfaos das FKs restauradas.
3. Cleanup/validacao das FKs, se o preflight permitir.
4. Health check pos-deploy.
5. Atualizacao de `VALIDACAO_TECNICA.md`.
6. Evidencia real Stripe checkout/portal.
7. Webhook Stripe e subscription sync.
8. Rate limit duravel.
9. Modelo final de convite/admin bootstrap.
10. Plano de aposentadoria de `owner_id`.

## Checklist de Validacao Recorrente

- [ ] `main` local atualizado.
- [ ] Branch criada a partir de `main`.
- [ ] PR com escopo unico.
- [ ] CI verde.
- [ ] Deploy executado.
- [ ] Runtime Logs sem erro novo.
- [ ] Migrations aplicadas.
- [ ] Rotas criticas abertas em producao.
- [ ] Docs atualizadas na fonte primaria.
- [ ] Evidencia registrada quando o item exige ambiente real.

## Custos e Riscos

Infra:

- Vercel e Supabase podem operar em baixo custo no inicio, mas producao real tende a exigir planos pagos conforme uso, limites e suporte operacional.
- Stripe adiciona custo transacional apenas quando houver cobranca real.
- GitHub Actions pode consumir minutos conforme frequencia de CI, E2E e gates.

Tempo humano:

- O maior custo atual e coordenacao: schema, RLS, billing, front e docs estao todos interligados.
- PRs pequenos reduzem risco de regressao e custo de review.

Riscos principais:

- Banco real divergir do historico de migrations.
- Gates importantes existirem mas nao serem executados.
- Docs repetidas ficarem divergentes.
- Mudanca visual ampla entrar sem evidencia mobile.
- Billing avancar para webhook sem evidencia Stripe real.

## Nao Fechar Como Resolvido Sem Evidencia

- [ ] RLS final sem RLS Live Gate verde.
- [ ] Billing sem checkout/portal real em Stripe teste.
- [ ] FKs restauradas sem preflight/cleanup/validacao posterior.
- [ ] Front visual sem validacao mobile.
- [ ] Deploy sem smoke runtime.
- [ ] Admin SaaS final enquanto depender de `ADMIN_EMAIL`.
- [ ] Modelo organization-only enquanto `owner_id` ainda for necessario.
