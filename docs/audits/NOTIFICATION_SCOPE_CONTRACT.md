# Notification Scope Contract

> Status DocDoc: Atual
> Uso atual: contrato vigente do GAP-017 para definir alertas, canais e
> opt-in antes de implementar notificacoes.
> Atualizado em: 2026-06-08.

## Objetivo

Este contrato reduz o GAP-017 sem implementar runtime novo.

Ele define quais notificacoes podem existir primeiro, quais canais sao
permitidos, qual modelo de consentimento deve ser respeitado e quais bloqueios
impedem envio automatico antes de existir aceite de produto, schema e rollback.

Este documento nao adiciona dependencia.
Este documento nao altera UI.
Este documento nao cria cron.
Este documento nao envia email.
Este documento nao envia push.
Este documento nao cria tabela.
Este documento nao altera RLS.
Este documento nao declara GAP-017 runtime como implementado.

## Estado atual

O produto atual possui dados suficientes para calcular alertas futuros:

- contas a pagar com vencimento e status;
- contas a receber com vencimento e status;
- organizacao ativa e membership;
- permissoes por modulo;
- rate limit e audit runtime para varias acoes sensiveis.

O projeto ainda nao possui canal de notificacao versionado.

Nao ha fila, job, cron, provider de email, push provider, web push, template de
mensagem ou preferencias persistidas de notificacao.

## Principios de produto

Notificacao deve reduzir risco financeiro real, nao criar ruido.

Toda notificacao futura precisa ter:

- evento financeiro claro;
- janela de antecedencia;
- destinatario elegivel;
- regra de permissao;
- canal escolhido;
- opt-in ou configuracao explicita;
- estado de desativacao;
- rate limit ou deduplicacao;
- auditabilidade minima;
- rollback operacional.

## Alertas permitidos primeiro

### 1. Vencimento de conta a pagar

Pergunta: "Quais contas precisam de acao antes de vencer?"

Dados minimos:

- conta a pagar;
- data de vencimento;
- status atual;
- organizacao ativa;
- membro responsavel ou visibilidade permitida.

Regras:

- nao notificar contas pagas;
- respeitar permissao de contas a pagar;
- nao vazar dados de outra organizacao;
- permitir desativar o alerta.

### 2. Conta a pagar atrasada

Pergunta: "O que ja esta em atraso e precisa de atencao?"

Dados minimos:

- conta a pagar;
- dias em atraso;
- valor;
- status atual.

Regras:

- nao repetir alerta indefinidamente sem deduplicacao;
- diferenciar vencimento futuro de atraso real;
- manter texto objetivo e sem julgamento.

### 3. Vencimento de conta a receber

Pergunta: "Quais recebimentos esperados precisam de acompanhamento?"

Dados minimos:

- conta a receber;
- data prevista;
- status atual;
- pagador ou membro relacionado quando permitido.

Regras:

- nao notificar contas recebidas;
- respeitar permissao de contas a receber;
- nao misturar alerta de recebimento com cobranca automatica.

## Canais permitidos por fase

### Fase 1: in-app

Canal recomendado para primeira implementacao.

Pode aparecer como:

- banner discreto;
- badge em modulo;
- bloco no dashboard;
- lista de proximos alertas.

Regras:

- sem provider externo;
- sem envio fora do app;
- fonte de dados server-side;
- opt-in pode iniciar como preferencia local da organizacao quando houver
  schema proprio.

### Fase 2: email

Bloqueado ate existir decisao de provider, templates, unsubscribe e limites.

Antes de email, o PR deve definir:

- provider;
- dominio/remetente;
- template;
- unsubscribe;
- deduplicacao;
- rate limit;
- politica de falha;
- rollback.

### Fase 3: push

Bloqueado ate existir decisao de canal mobile/PWA, permissao do dispositivo e
revogacao de consentimento.

Push nao deve ser o primeiro canal.

## Opt-in e preferencias

Notificacoes financeiras devem ser configuraveis.

Antes de persistir preferencias, o PR deve definir:

- escopo da preferencia: usuario, membership ou organizacao;
- quem pode habilitar/desabilitar;
- valor default;
- granularidade por tipo de alerta;
- retencao de historico;
- rollback de schema;
- relacao com permissoes existentes.

Default seguro:

- nenhum envio externo sem opt-in explicito;
- in-app pode ser exibido como insight passivo se respeitar permissoes;
- email/push sempre exigem consentimento configurado.

## Regras tecnicas

- Calculo de alertas deve ser server-side ou helper puro testavel.
- Tenant scope deve usar organizacao ativa e membership.
- Client Components podem renderizar alertas, mas nao decidem permissao.
- Notificacao nao pode bypassar RLS, access-control ou helpers financeiros.
- Jobs ou crons devem ter idempotencia e deduplicacao antes de envio externo.
- Qualquer provider externo exige boundary de configuracao e rollback.
- Conteudo enviado fora do app deve evitar dados sensiveis quando nao houver
  canal autenticado.

## Fora de escopo

Este contrato nao:

- implementa notificacoes;
- cria UI;
- cria cron, fila, worker ou scheduler;
- adiciona provider de email ou push;
- adiciona dependencia;
- cria schema de preferencias;
- cria tabela de eventos de notificacao;
- altera RLS, billing, permissoes ou deploy;
- altera dashboard, contas a pagar ou contas a receber;
- declara GAP-017 runtime como implementado.

## Proxima expansao segura

1. Escolher apenas um alerta inicial.
2. Implementar helper server-side ou pure helper para o dataset.
3. Exibir primeiro como in-app sem provider externo.
4. Definir schema de preferencias em PR dedicado se o alerta for configuravel.
5. So depois avaliar email, com provider, unsubscribe, rate limit e rollback.

## Acceptance

Um PR futuro que implementa notificacao deve:

- citar este contrato;
- declarar alerta, canal e opt-in;
- preservar tenant scope e permissoes server-side;
- manter `/protected` e `/org/[orgSlug]`;
- nao adicionar provider externo sem boundary propria;
- nao enviar dado financeiro fora do app sem consentimento;
- atualizar `docs/SAAS_GAP_REGISTER.md` quando houver runtime real.
