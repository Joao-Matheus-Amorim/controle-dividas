# Plano de Controle de Gaps e Dividas Tecnicas

> Status DocDoc: Atual
> Uso atual: plano PMBOK vivo para controlar gaps, dividas tecnicas,
> evidencias, criterios de aceite e sequenciamento de PRs.
> Fonte-base: `docs/audits/PROJECT_STATE_CROSS_AUDIT_2026-06-01.md`.

Atualizado em: 2026-06-01

## 1. Objetivo

Este documento transforma a auditoria cruzada do estado do projeto em controle
operacional no estilo PMBOK.

O objetivo e evitar:

- gaps sem dono;
- divida tecnica invisivel;
- PR amplo sem fronteira;
- evidencia declarada sem execucao real;
- documento antigo superando contrato atual;
- implementacao fora de sequencia.

## 2. Fontes de controle

A hierarquia de fontes para decisao e:

1. codigo, migrations e workflows versionados na `main`;
2. `docs/VALIDACAO_TECNICA.md`;
3. `docs/SAAS_GAP_REGISTER.md`;
4. `docs/audits/PROJECT_STATE_CROSS_AUDIT_2026-06-01.md`;
5. ADRs vigentes em `docs/adr/`;
6. contratos especificos em `docs/audits/`;
7. documentos PM historicos apenas como contexto.

Se houver conflito, o documento antigo deve ser atualizado, marcado como
superado ou referenciado explicitamente como historico.

## 3. Regra de governanca

Nenhum gap ou divida tecnica pode ser considerado fechado sem todos os itens:

- PR pequeno com escopo unico;
- criterio de aceite explicito;
- CI verde;
- teste, guard ou evidencia operacional proporcional ao risco;
- documentacao viva atualizada;
- rollback ou plano de reversao quando houver runtime, schema, RLS, billing ou deploy;
- registro do que ficou fora de escopo.

## 4. WBS operacional

| WBS | Pacote | Objetivo | Saida esperada |
| --- | --- | --- | --- |
| 1.0 | Evidencias live | provar que controles criticos funcionam fora da inspecao local | artefatos GitHub/Stripe anexaveis a docs |
| 1.1 | RLS Live Gate | executado em ambiente isolado | workflow verde `26913026310` + artifact `rls-live-gate-evidence-26913026310-5` |
| 1.2 | Visual snapshot gate | executar snapshot deterministico do dashboard summary | screenshot gated aprovado |
| 1.3 | Stripe checkout/portal evidence | provar checkout e portal reais em modo teste | evidencia antes de webhook |
| 1.4 | Post-deploy protected smoke | executar smoke manual contra URL real do deploy | workflow `.github/workflows/post-deploy-smoke.yml` verde + artifact Playwright |
| 2.0 | Billing | completar caminho de assinatura sem falso verde | webhook, sync e enforcement em PRs separados |
| 2.1 | Webhook runtime | validar assinatura, raw body, eventos pequenos e idempotencia | endpoint seguro e rollback documentado |
| 2.2 | Subscription sync | sincronizar plano/status com eventos confiaveis | estado de assinatura consistente |
| 2.3 | Commercial enforcement | aplicar limites comerciais so depois do sync | regras de acesso por plano |
| 3.0 | `owner_id` retirement | remover compatibilidade transicional sem quebrar seguranca | plano, preflight, PRs por dominio |
| 3.1 | Inventario | mapear todos os usos runtime/schema/test/docs | matriz de dependencias |
| 3.2 | Preflight | provar dados e constraints antes da troca | SQL/guards verdes |
| 3.3 | Execucao por dominio | migrar reads/writes um dominio por vez | reducao progressiva de `owner_id` |
| 4.0 | Visual migration | concluir Ink + Copper + Ivory sem regressao | zero tokens legados na Phase 5 |
| 4.1 | Auth/onboarding | migrar primeiras telas do usuario | forms publicos e onboarding com `--ff-*` |
| 4.2 | UI primitives | migrar primitives restantes | `sheet`, `select`, `alert`, `skeleton`, `separator` |
| 4.3 | Domains | migrar cada modulo protegido | Pessoas, Gastos, Payables, Receivables, Bancos, Relatorios, Configuracoes, Admin |
| 5.0 | Produto pendente | fechar funcionalidades conhecidas | edits, periodo dinamico, reports, settings |
| 6.0 | Documentacao | manter DocDoc e contratos vivos | docs atuais, historicos marcados |

## 5. Matriz de gaps e dividas

| ID | Tipo | Status | Evidencia para fechar | Proximo PR seguro |
| --- | --- | --- | --- | --- |
| G-001 | Evidencia | Fechado | RLS Live Gate verde com artifact `rls-live-gate-evidence-26913026310-5` | manter evidencia viva quando fixtures RLS mudarem |
| G-002 | Evidencia | Aberto | Stripe checkout e portal reais em modo teste | executar runbook Stripe |
| G-003 | Billing | Bloqueado por G-002 | webhook com assinatura, raw body e idempotencia | webhook runtime somente depois da evidencia |
| G-004 | Billing | Bloqueado por G-003 | subscription sync validado | sync em PR proprio |
| G-005 | Compatibilidade | Aberto controlado | inventario e plano de remocao de `owner_id` | PR de inventario apenas |
| G-006 | Visual | Aberto controlado | grep zero para tokens legados na Phase 5 | auth/onboarding ou primitive group |
| G-007 | Produto | Aberto | edit flows e settings testados | escolher um fluxo por PR |
| G-008 | Documentacao | Continuo | DocDoc headers coerentes | atualizar docs afetados em cada PR |
| G-009 | GAP-015 | Parcial | storage/retention final definidos | ampliar controles em PR dedicado |
| G-010 | Admin lifecycle | Contrato pre-runtime criado | `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md`; runtime de convite/admin ainda pendente | schema/preflight ou runtime de convite em PR dedicado |

## 6. Criterios de aceite por tipo de entrega

### Documentacao

- Status DocDoc correto.
- Fonte viva referenciada.
- Nao contradiz `VALIDACAO_TECNICA.md` ou `SAAS_GAP_REGISTER.md`.
- CI verde.

### Runtime app

- Permissao validada server-side.
- Organizacao ativa resolvida no servidor.
- Sem confiar em `organization_id` do cliente.
- Teste/guard focado.
- Documento vivo atualizado.

### Schema/RLS

- Migration idempotente quando possivel.
- Preflight quando houver risco de dado historico.
- Rollback ou estrategia de recuperacao.
- RLS gated quando aplicavel.
- Documentacao e inventario atualizados.

### Billing

- Evidencia Stripe real antes de webhook.
- Secrets fora do client.
- Rollback por flag ou revert.
- Sem commercial enforcement antes de subscription sync.
- Logs sem payload bruto, token ou segredo.

### UI/design

- Sem alterar regra de negocio.
- Sem misturar com schema, RLS ou billing.
- Respeitar `--ff-*` e documentos de design atuais.
- Guard/snapshot focado quando a superficie for critica.

## 7. Controle de mudanca

Toda nova mudanca deve registrar no PR:

```txt
Contexto:
O que muda:
Validacao:
Risco:
Rollback:
Fora de escopo:
Docs atualizados:
```

Mudancas que exigem PR separado:

- schema;
- RLS;
- billing;
- deploy;
- auth/session;
- permissao;
- visual migration ampla;
- remocao de compatibilidade;
- `owner_id` retirement.

## 8. Registro de riscos

| Risco | Probabilidade | Impacto | Mitigacao |
| --- | --- | --- | --- |
| Webhook antes de evidencia Stripe | Media | Alto | bloquear por contrato e runbook |
| Remocao prematura de `owner_id` | Media | Alto | inventario + preflight + PR por dominio |
| Docs historicos usados como atuais | Alta | Medio | DocDoc status + fonte viva |
| Visual migration ampla demais | Media | Medio | PR por superficie |
| CI com secrets ausentes | Baixa/media | Medio | validação fail-fast e placeholders Dependabot |
| Rate limit process-local tratado como definitivo | Media | Medio | documentar como controle inicial, planejar storage duravel |

## 9. Cadencia recomendada

Para cada ciclo semanal:

1. escolher um item da matriz;
2. confirmar se `origin/main` esta verde;
3. criar branch limpa;
4. fazer PR pequeno;
5. deixar CI validar;
6. atualizar documento vivo;
7. marcar evidencia ou status no registro.

## 10. Proxima decisao

A proxima frente deve ser escolhida por objetivo:

- confianca operacional: G-001 RLS Live Gate fechado no run `26913026310`;
- receita/billing: G-002 Stripe evidence;
- qualidade visual: G-006 auth/onboarding visual migration;
- arquitetura: G-005 `owner_id` retirement inventory e G-010 convite/admin
  pre-runtime criado.

Recomendacao PMBOK: apos G-001 fechado, priorizar G-002 Stripe evidence ou o
proximo gate dedicado de rotas/E2E. Se a frente escolhida for arquitetura,
seguir G-010 com schema/preflight ou runtime de convite/admin em PR dedicado,
sem misturar produto, UI, billing ou retirada de `owner_id`.
