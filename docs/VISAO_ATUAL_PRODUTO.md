# Visao Atual do Produto - FamilyFinance / Controle de Dividas

> Status: visao de produto e decisao operacional atual.
>
> Objetivo: servir como norte pratico para fechar o projeto como produto usavel antes de expandir novas frentes tecnicas.
>
> Regra principal: a fundacao SaaS ja existe; agora a prioridade e transformar o sistema em uma experiencia que uma familia ou organizacao consiga usar todos os dias sem explicacao externa.

---

## 1. Decisao central

Se este projeto fosse meu, eu mudaria imediatamente o foco de:

```txt
Construir mais arquitetura para um SaaS robusto.
```

para:

```txt
Fazer uma familia usar o produto todos os dias para controlar dividas, gastos, recebimentos e bancos pelo celular sem precisar de explicacao.
```

A arquitetura atual ja esta muito acima de um CRUD simples. O projeto ja possui base SaaS, multi-tenant, autenticacao, organizacoes, memberships, permissoes, escopos, RLS, CI, deploy, testes, documentacao viva, auditoria parcial e billing parcialmente preparado.

O risco atual nao e falta de arquitetura. O risco atual e o projeto continuar expandindo em fundacao, contratos e planejamento antes de fechar uma experiencia real, simples e confiavel para usuario final.

A decisao pratica e:

```txt
Congelar expansoes grandes e fechar produto usavel.
```

Isso significa que, pelos proximos ciclos, todo trabalho deve responder a uma pergunta objetiva:

```txt
Isso ajuda o usuario final a usar melhor o sistema hoje?
```

Se a resposta for nao, a tarefa deve esperar.

---

## 2. Estado atual percebido

O projeto esta em fase de MVP Web/PWA funcional avancado, com base tecnica forte e ambicao clara de SaaS financeiro multi-tenant.

Ele ja nao deve ser tratado como um experimento simples de controle de dividas. Ele deve ser tratado como um produto em transicao para beta real.

### 2.1 O que ja esta forte

- Arquitetura SaaS-first.
- Separacao por organizacao.
- Memberships por organizacao.
- Rotas organization-aware em `/org/[orgSlug]`.
- Compatibilidade transicional com `/protected`.
- Autenticacao via Supabase.
- RLS organization-aware.
- Permissoes por modulo.
- Permissoes por acao.
- Escopos de acesso por membro: `own`, `selected`, `family`.
- Admin com controle de usuarios e permissoes.
- Migrations organizadas.
- CI com lint, typecheck, build e testes.
- Deploy automatizado Supabase + Vercel.
- Documentacao viva, ADRs, gap register e contratos.
- Billing parcialmente preparado.
- Auditoria e rate limit parcial para operacoes sensiveis.

### 2.2 O que ainda impede o produto de ficar redondo

- Alguns fluxos de CRUD ainda precisam ser confirmados como completos na UI.
- Periodo do dashboard e dos relatorios ainda precisa ser dinamico.
- Relatorios ainda precisam ficar mais uteis para decisao diaria.
- Billing ainda nao esta comercialmente pronto.
- Notificacoes ainda nao possuem runtime.
- Experiencia mobile precisa ser validada como fluxo real de uso diario.
- `/protected` ainda existe como compatibilidade, enquanto `/org/[orgSlug]` deve ser o modelo mental final.
- `owner_id` ainda existe como compatibilidade tecnica.
- Rate limit em memoria e aceitavel para MVP, mas nao para producao em escala.
- Documentacao extensa pode ficar defasada se o produto continuar evoluindo sem reconciliacao.

---

## 3. Norte de produto

O produto deve ser simples de entender:

```txt
Um espaco financeiro compartilhado para uma familia, casal, grupo ou pequena organizacao controlar gastos, dividas, recebimentos, bancos, limites e responsabilidades.
```

O usuario nao deve pensar em banco de dados, RLS, organizacao, membership ou permissao.

O usuario deve pensar:

- Quanto estou devendo?
- O que vence primeiro?
- Quem gastou mais?
- Quanto ainda posso gastar?
- Quanto vou receber?
- Quanto tenho em bancos?
- Quem pode ver ou mexer em cada coisa?
- Estou no controle ou estou no vermelho?

A visao de produto deve priorizar clareza, confianca e rotina.

---

## 4. Persona principal da fase atual

A persona principal nao deve ser ainda uma empresa grande.

A persona principal deve ser:

```txt
Uma familia, casal, responsavel financeiro ou pequeno grupo que precisa organizar contas, gastos, dividas, recebimentos e saldos em um unico lugar.
```

Essa persona quer cadastrar gastos rapido, ver contas atrasadas, saber o que vence hoje ou esta semana, dividir responsabilidades, controlar limite de cada pessoa, evitar esquecimento, acompanhar entradas previstas, entender se o mes esta saudavel e usar pelo celular.

Essa persona nao quer configurar demais, aprender termos tecnicos, preencher formularios longos sem necessidade, ler documentacao para conseguir usar ou depender do desenvolvedor explicando o fluxo.

---

## 5. Principio de decisao para os proximos ciclos

A partir desta visao, qualquer tarefa deve cair em uma destas categorias:

1. Fecha fluxo essencial de usuario.
2. Corrige bug que impede uso real.
3. Aumenta confianca nos dados financeiros.
4. Melhora clareza e usabilidade mobile.
5. Prepara cobranca somente depois que o produto estiver usavel.
6. Reduz risco de seguranca sem abrir escopo grande.

Se uma tarefa nao se encaixar nisso, ela deve ser adiada.

---

## 6. Regra operacional dos proximos 30 dias

Durante os proximos 30 dias de trabalho, evitar:

- redesign amplo;
- nova biblioteca visual grande;
- grafico complexo antes de filtros e periodo dinamico;
- billing completo antes de beta usavel;
- IA;
- refactor arquitetural amplo;
- mudanca de stack;
- nova camada de estado global sem necessidade comprovada;
- novos contratos documentais sem implementacao associada;
- grandes PRs misturando feature, schema, UI e docs.

Durante os proximos 30 dias, priorizar:

- fechar CRUDs;
- testar fluxos reais;
- melhorar dashboard;
- tornar periodo dinamico;
- melhorar relatorios;
- validar mobile;
- preparar notificacoes internas;
- reduzir ambiguidade de rotas;
- atualizar documentacao viva conforme implementacao real.

---

## 7. Caminho principal de produto

O caminho mental final do produto deve ser baseado em organizacao:

```txt
/org/[orgSlug]
/org/[orgSlug]/gastos
/org/[orgSlug]/contas-a-pagar
/org/[orgSlug]/contas-a-receber
/org/[orgSlug]/bancos
/org/[orgSlug]/relatorios
/org/[orgSlug]/configuracoes
/org/[orgSlug]/admin
```

`/protected` deve continuar existindo apenas como compatibilidade transicional para auth, bookmarks, onboarding e rotas antigas.

A direcao desejada e:

1. Usuario loga.
2. Sistema identifica organizacoes acessiveis.
3. Se nao houver organizacao, vai para onboarding.
4. Se houver organizacao ativa, vai para `/org/[orgSlug]`.
5. O menu sempre trabalha dentro da organizacao ativa.
6. A troca de organizacao deve ser explicita e segura.

O usuario deve perceber que esta dentro de um "espaco financeiro".

---

## 8. Dashboard ideal da fase MVP

O dashboard deve ser a tela de decisao do usuario.

Ele nao deve ser apenas bonito. Ele deve responder rapidamente:

```txt
Meu mes esta saudavel?
Quanto ja gastei?
Quanto ainda posso gastar?
Quanto tenho de divida em aberto?
O que esta atrasado?
O que vence primeiro?
Quanto vou receber?
Quanto tenho em bancos?
Quem esta gastando mais?
Qual categoria esta pesando?
```

### 8.1 Prioridades do dashboard

1. Clareza acima de densidade.
2. Numeros confiaveis acima de efeito visual.
3. Estado do mes acima de historico complexo.
4. Alertas importantes acima de cards decorativos.
5. Mobile-first.

### 8.2 Blocos recomendados

#### Bloco 1 - Saude do mes

Mostrar limite total do mes, total gasto, limite restante, percentual usado e estado: saudavel, atencao ou estourado.

#### Bloco 2 - Dividas e contas

Mostrar total em aberto, total atrasado, proximo vencimento, quantidade de contas pendentes e acao rapida para registrar nova conta.

#### Bloco 3 - Recebimentos

Mostrar valores previstos, valores recebidos, valores atrasados e proximas entradas.

#### Bloco 4 - Bancos

Mostrar saldo total, quantidade de contas, principais contas e ultima atualizacao de saldo, quando existir.

#### Bloco 5 - Pessoas e categorias

Mostrar quem gastou mais, quem ainda tem limite, categoria com maior gasto e top 3 categorias.

---

## 9. CRUDs que precisam estar impecaveis

Antes de billing, graficos ou redesign, os fluxos basicos precisam estar fechados.

### 9.1 Pessoas

Fluxo esperado:

- criar pessoa;
- editar nome;
- editar papel/role financeiro;
- editar limite mensal;
- ativar/desativar;
- vincular usuario quando aplicavel;
- refletir limite no dashboard e relatorios.

Criterio de pronto:

```txt
Um admin consegue cadastrar e manter as pessoas do espaco financeiro sem mexer direto no banco e sem precisar de ajuda externa.
```

### 9.2 Gastos

Fluxo esperado:

- criar gasto;
- editar gasto;
- excluir gasto;
- selecionar pessoa;
- selecionar categoria;
- informar data;
- informar descricao;
- informar valor;
- opcionalmente informar local, metodo de pagamento, banco/cartao e observacoes;
- filtrar por periodo;
- filtrar por pessoa;
- filtrar por categoria.

Criterio de pronto:

```txt
Um usuario autorizado consegue registrar e corrigir os gastos do mes pelo celular em poucos segundos.
```

### 9.3 Contas a pagar

Fluxo esperado:

- criar conta/divida;
- editar conta;
- excluir conta;
- marcar como paga;
- marcar/identificar atrasada;
- diferenciar fixa e avulsa;
- filtrar por status;
- filtrar por vencimento;
- filtrar por responsavel;
- aparecer no dashboard e relatorios.

Criterio de pronto:

```txt
O usuario consegue abrir o app e saber exatamente o que precisa pagar, quando e por quem.
```

### 9.4 Contas a receber

Fluxo esperado:

- criar recebimento;
- editar recebimento;
- excluir recebimento;
- marcar como recebido;
- identificar atrasado;
- diferenciar fixo e variavel;
- filtrar por status;
- filtrar por periodo;
- aparecer no dashboard e relatorios.

Criterio de pronto:

```txt
O usuario consegue ver o dinheiro previsto e o dinheiro ja recebido sem confusao.
```

### 9.5 Bancos

Fluxo esperado:

- criar conta bancaria/carteira;
- editar conta;
- atualizar saldo;
- excluir conta;
- vincular a pessoa, quando aplicavel;
- mostrar saldo total;
- mostrar saldos por conta;
- aparecer no dashboard e relatorios.

Criterio de pronto:

```txt
O usuario consegue saber quanto tem disponivel sem misturar saldo com gastos ou dividas.
```

### 9.6 Configuracoes

Fluxo esperado:

- criar categoria;
- editar categoria;
- excluir categoria quando seguro;
- configurar moeda no futuro;
- configurar periodo padrao no futuro;
- configurar preferencias do espaco financeiro no futuro.

Criterio de pronto:

```txt
O admin consegue ajustar a base do sistema sem depender de alteracao tecnica.
```

---

## 10. Periodo dinamico

Periodo dinamico deve vir antes de graficos.

Um sistema financeiro sem controle claro de periodo perde confianca.

A primeira versao deve permitir:

- mes atual;
- mes passado;
- proximos 30 dias para contas/recebimentos;
- ultimos 3 meses;
- intervalo personalizado em etapa posterior.

Regras:

- Dashboard deve deixar claro qual periodo esta sendo exibido.
- Relatorios devem usar o mesmo conceito de periodo.
- Filtros devem persistir de forma previsivel, preferencialmente via URL state quando fizer sentido.
- O usuario nunca deve olhar um numero sem saber o periodo daquele numero.

---

## 11. Relatorios MVP

Relatorios devem ser simples e uteis antes de serem bonitos.

### 11.1 Relatorios essenciais

1. Gastos por pessoa.
2. Gastos por categoria.
3. Contas pagas, pendentes e atrasadas.
4. Recebimentos previstos, recebidos e atrasados.
5. Saldos por banco/carteira.
6. Comparativo simples entre periodos.

### 11.2 Exportacao

Exportacao deve ser simples no inicio:

- CSV primeiro;
- PDF depois.

CSV resolve muita coisa para usuario real e e mais simples de validar.

### 11.3 Graficos

Graficos devem vir depois dos dados e filtros.

Ordem recomendada:

1. tabela/resumo confiavel;
2. filtros bons;
3. CSV;
4. grafico pequeno e explicativo;
5. visual mais refinado.

---

## 12. Notificacoes como feature de valor

Controle de dividas sem aviso perde valor.

Notificacao deve ser tratada como uma das features mais importantes depois do MVP funcional.

### 12.1 Primeira fase - notificacao in-app

Implementar primeiro dentro do app:

- conta vence hoje;
- conta vence em 3 dias;
- conta atrasada;
- recebimento atrasado;
- limite atingiu 80%;
- limite estourado;
- saldo muito baixo, se configurado futuramente.

### 12.2 Segunda fase - preferencias

Permitir configurar:

- quais alertas ativar;
- antecedencia de vencimento;
- quem recebe alerta;
- se alertas aparecem apenas para admin ou para responsavel.

### 12.3 Terceira fase - canais externos

Depois do in-app funcionar:

- email;
- push/PWA;
- WhatsApp somente depois, com custo e provider definidos.

### 12.4 Regra de seguranca

Notificacao deve respeitar:

- organizacao ativa;
- membership;
- permissao;
- escopo por membro;
- deduplicacao;
- logs/auditoria quando for sensivel.

---

## 13. Billing e monetizacao

Billing nao deve ser prioridade antes de o produto estar usavel.

A ordem correta e:

1. Produto funcional.
2. Beta com familias/usuarios reais.
3. Ajustes baseados em uso real.
4. Stripe checkout/portal com evidencia real.
5. Webhook.
6. Subscription sync.
7. Enforcement por plano.
8. Comercializacao.

### 13.1 O que billing precisa ter para ser considerado pronto

- Conta Stripe de teste configurada.
- Checkout testado ponta a ponta.
- Portal testado ponta a ponta.
- Webhook validando assinatura Stripe.
- Eventos idempotentes.
- Organizacao atualizada conforme subscription.
- Plano refletido no app.
- Cancelamento tratado.
- Falha de pagamento tratada.
- Trial tratado, se existir.
- Feature gating por plano.
- Runbook de rollback.

### 13.2 Planos possiveis no futuro

Nao implementar agora, mas pensar em algo simples:

#### Free / Familiar basico

- uma organizacao;
- limite de pessoas;
- limite de registros mensais ou historico reduzido;
- notificacoes basicas in-app.

#### Pro

- mais pessoas;
- mais historico;
- relatorios avancados;
- exportacao;
- notificacoes por email;
- multiplas organizacoes.

#### Premium / Organizacao

- permissoes avancadas;
- auditoria visivel;
- multiplos admins;
- suporte prioritario;
- integracoes futuras.

A monetizacao deve nascer depois de o valor estar claro.

---

## 14. UX e visual

Nao fazer redesign grande agora.

A prioridade visual deve ser refinamento, nao reinvencao.

### 14.1 Melhorias visuais permitidas agora

- spacing consistente;
- cards mais claros;
- estados vazios melhores;
- mensagens de erro melhores;
- botoes mais evidentes;
- formularios mais rapidos;
- mobile bottom nav refinado;
- hierarquia melhor no dashboard;
- feedback de loading/salvando;
- confirmacao clara para exclusoes.

### 14.2 O que evitar agora

- trocar design system inteiro;
- adicionar biblioteca visual pesada;
- refazer todos os componentes;
- redesign amplo sem teste funcional;
- animacoes antes de usabilidade;
- graficos decorativos sem decisao de produto.

### 14.3 Direcao visual desejada

O produto deve parecer confiavel, simples, financeiro, leve, mobile-first, organizado, seguro, sem cara de planilha crua e sem exagero visual.

---

## 15. Mobile-first real

O usuario provavelmente vai registrar gasto pelo celular.

Portanto, a experiencia mobile nao pode ser apenas responsiva. Ela precisa ser pensada como principal.

### 15.1 Fluxos mobile prioritarios

- registrar gasto;
- marcar conta como paga;
- consultar vencimentos;
- consultar limite restante;
- consultar saldo;
- alternar organizacao;
- receber alerta.

### 15.2 Criterios mobile

- botoes grandes o suficiente;
- formularios curtos;
- campos importantes primeiro;
- bottom nav clara;
- nenhuma tela com overflow horizontal;
- feedback apos salvar;
- estados vazios explicativos;
- filtros simples.

---

## 16. Seguranca e confianca

Seguranca continua importante, mas sem paralisar produto.

### 16.1 Manter como regra obrigatoria

Toda mutacao deve:

1. resolver usuario autenticado;
2. resolver organizacao ativa;
3. validar membership;
4. validar perfil ativo;
5. validar permissao;
6. validar entidade pertence a organizacao;
7. mutar com filtro por `organization_id`;
8. auditar quando sensivel;
9. aplicar rate limit quando sensivel;
10. revalidar rotas corretas.

### 16.2 O que melhorar depois

- rate limit persistente;
- auditoria consultavel pelo admin;
- politicas de retencao mais amplas;
- alertas de acoes sensiveis;
- logs operacionais de producao;
- monitoramento de erros.

---

## 17. Documentacao

A documentacao esta forte, mas deve ser controlada.

### 17.1 Documentos principais para trabalho diario

Usar como fontes principais:

1. `README.md`
2. `docs/VALIDACAO_TECNICA.md`
3. `docs/SAAS_GAP_REGISTER.md`
4. Este documento: `docs/VISAO_ATUAL_PRODUTO.md`

### 17.2 Regra

Nao criar documentacao nova se a tarefa puder ser resolvida atualizando um documento vivo existente.

### 17.3 Evitar

- docs duplicadas;
- plano antigo contradizendo estado atual;
- contrato sem implementacao planejada;
- atualizar docs sem fechar fluxo real.

---

## 18. Ordem recomendada de execucao

### 18.1 Semana 1 - Fechamento funcional

Objetivo:

```txt
Garantir que todos os modulos principais funcionam como CRUD real.
```

Tarefas:

- revisar Pessoas;
- revisar Gastos;
- revisar Contas a pagar;
- revisar Contas a receber;
- revisar Bancos;
- revisar Configuracoes;
- corrigir edicoes pendentes;
- corrigir exclusoes inseguras ou confusas;
- revisar permissoes por perfil;
- testar admin e usuario comum.

Entregavel:

```txt
Uma organizacao consegue operar o mes atual inteiro sem mexer no banco.
```

### 18.2 Semana 2 - Periodo, dashboard e relatorios

Objetivo:

```txt
Fazer os numeros responderem perguntas reais.
```

Tarefas:

- periodo dinamico no dashboard;
- periodo dinamico em relatorios;
- filtros basicos;
- resumos por pessoa;
- resumos por categoria;
- contas por status;
- recebimentos por status;
- saldos por banco;
- exportacao CSV inicial, se couber.

Entregavel:

```txt
Usuario entende o mes financeiro em poucos minutos.
```

### 18.3 Semana 3 - Alertas internos

Objetivo:

```txt
Evitar que o usuario esqueca contas e limites.
```

Tarefas:

- definir schema minimo de notificacoes ou abordagem inicial;
- criar alertas in-app;
- alertas de vencimento;
- alertas de atraso;
- alertas de limite;
- deduplicacao simples;
- respeitar permissao e organizacao.

Entregavel:

```txt
Dashboard e/ou area de notificacoes mostra o que exige atencao hoje.
```

### 18.4 Semana 4 - Beta real controlado

Objetivo:

```txt
Validar uso real no celular.
```

Tarefas:

- deploy atualizado;
- smoke pos-deploy;
- criar organizacoes reais de teste;
- simular familia real;
- registrar dados reais ou semi-reais;
- anotar bugs;
- corrigir UX;
- atualizar docs vivas.

Entregavel:

```txt
Uma familia consegue usar o app por uma semana sem ajuda do desenvolvedor.
```

---

## 19. Definition of Ready para novas tarefas

Antes de iniciar uma tarefa, ela deve ter:

- objetivo claro;
- usuario beneficiado;
- rota/tela afetada;
- dados afetados;
- permissao envolvida;
- criterio de pronto;
- fora de escopo;
- risco de seguranca, se houver;
- necessidade ou nao de migration;
- necessidade ou nao de teste.

Se nao for possivel responder isso, a tarefa esta grande demais ou mal definida.

---

## 20. Definition of Done de produto

Uma entrega so esta pronta quando:

- funciona no fluxo real;
- funciona no mobile;
- respeita permissao;
- respeita organizacao;
- tem estado vazio;
- tem estado de erro;
- tem loading/pending quando necessario;
- revalida dados apos mutacao;
- nao quebra CI;
- documentacao viva e atualizada quando necessario;
- o usuario consegue entender sem explicacao externa.

---

## 21. Decisoes que eu nao tomaria agora

Eu nao faria agora:

- aplicativo nativo separado;
- IA financeira;
- importacao bancaria/open finance;
- integracao WhatsApp;
- redesign total;
- dashboard cheio de graficos;
- marketplace;
- multi-idioma;
- contabilidade avancada;
- gestao empresarial completa;
- split de pagamentos;
- conciliacao bancaria;
- app offline complexo.

Essas ideias podem ser boas no futuro, mas agora desviam o foco.

---

## 22. Decisoes que eu tomaria agora

Eu faria agora:

- fechar uso diario;
- priorizar celular;
- tornar numeros confiaveis;
- transformar dashboard em decisao;
- terminar edicoes completas;
- criar filtros basicos;
- preparar alertas in-app;
- reduzir ambiguidade entre `/protected` e `/org/[orgSlug]`;
- manter PR pequeno;
- manter documentacao viva enxuta;
- validar com usuario real.

---

## 23. Produto minimo que eu consideraria pronto para beta

Eu so chamaria de beta quando este checklist estivesse verdadeiro:

- [ ] Usuario cria organizacao pelo onboarding.
- [ ] Admin cria pessoas.
- [ ] Admin cria usuario/permissao.
- [ ] Usuario comum entra e ve apenas o permitido.
- [ ] Usuario registra gasto.
- [ ] Usuario edita gasto.
- [ ] Usuario exclui gasto quando permitido.
- [ ] Admin cria conta a pagar.
- [ ] Usuario marca conta como paga quando permitido.
- [ ] Usuario ve atrasadas.
- [ ] Usuario cria recebimento.
- [ ] Usuario marca recebimento como recebido.
- [ ] Usuario cria banco/carteira.
- [ ] Usuario atualiza saldo.
- [ ] Dashboard mostra numeros do periodo correto.
- [ ] Relatorios mostram filtros basicos.
- [ ] App funciona bem no celular.
- [ ] Rotas por orgSlug funcionam como caminho principal.
- [ ] Smoke pos-deploy foi executado.
- [ ] CI esta verde.
- [ ] Nenhuma acao sensivel ignora organizacao/permissao.

---

## 24. Produto minimo que eu consideraria pronto para cobrar

Eu so cobraria quando, alem do beta, existisse:

- [ ] Checkout Stripe testado.
- [ ] Portal Stripe testado.
- [ ] Webhook Stripe implementado.
- [ ] Webhook com assinatura validada.
- [ ] Subscription sync persistindo plano/status.
- [ ] Enforcement por plano.
- [ ] Cancelamento tratado.
- [ ] Falha de pagamento tratada.
- [ ] Tela de billing clara.
- [ ] Politica minima de suporte/contato.
- [ ] Backup/rollback operacional entendido.
- [ ] Logs de erro minimamente monitorados.

---

## 25. Frase de comando

A frase de comando desta fase e:

```txt
Fechar o app para uso real antes de ampliar arquitetura.
```

A meta pratica e:

```txt
Em 30 dias, uma familia consegue controlar dividas, gastos, bancos e recebimentos pelo celular sem ajuda do desenvolvedor.
```

Essa e a visao atual recomendada.

---

## 26. Resumo executivo

O projeto tem fundacao tecnica forte.

Agora ele precisa de foco de produto.

A prioridade nao e parecer um SaaS grande. A prioridade e ser usado de verdade.

O proximo marco nao deve ser “mais uma camada arquitetural”.

O proximo marco deve ser:

```txt
Uma organizacao real usando o sistema por uma semana, no celular, com dados reais, sem precisar de suporte para entender o fluxo.
```

Quando isso acontecer, billing, notificacoes externas, graficos e polimento visual terao uma base muito mais segura para crescer.
