# Riscos, Qualidade e Mudancas - FamilyFinance

## Riscos principais

| ID | Risco | Probabilidade | Impacto | Resposta |
|---|---|---:|---:|---|
| R-001 | O projeto crescer para produto comercial antes da validacao familiar | Media | Alto | Manter escopo personalizado aprovado |
| R-002 | Duplicacao de dados iniciais | Media | Alto | Usar constraints, upsert e migration de limpeza |
| R-003 | Confusao entre usuario do app e membro financeiro | Alta | Alto | Separar profiles de family_members |
| R-004 | Permissoes aplicadas apenas na tela e nao no backend | Media | Alto | Validar regras tambem no banco/API |
| R-005 | Iniciar app mobile antes do escopo estar validado | Media | Alto | Aprovar documentacao antes da implementacao |
| R-006 | Custo de app nativo ser subestimado | Media | Alto | Trabalhar por fases e com aceite |
| R-007 | Interface ficar complexa para uso familiar | Media | Medio | Priorizar mobile-first e simplicidade |
| R-008 | Build quebrar apos mudancas de Next/Supabase | Media | Alto | Rodar lint e build por release |

## Problemas ja identificados

| ID | Problema | Status | Acao |
|---|---|---|---|
| I-001 | Seed duplicou membros financeiros | Corrigido | Migration 002 e upsert |
| I-002 | Lint varria pasta .next | Corrigido | Ignorar build output no ESLint |
| I-003 | cacheComponents conflitou com rotas autenticadas | Corrigido | Removido do next.config |
| I-004 | Supabase inferiu relacionamentos como array | Corrigido | Normalizacao dos relacionamentos |

## Plano de qualidade

A qualidade sera validada por:

- lint sem erros;
- build sem erros;
- teste manual por modulo;
- validacao de dados no Supabase;
- revisao de permissoes;
- aceite do Admin familiar;
- documentacao atualizada.

## Checklist de qualidade por release

- [ ] npm run lint aprovado.
- [ ] npm run build aprovado.
- [ ] Migrations executadas sem erro.
- [ ] Nao ha duplicacao de membros padrao.
- [ ] Dashboard reflete dados reais.
- [ ] Gastos reduzem saldo mensal.
- [ ] Contas vencidas aparecem como atrasadas.
- [ ] Recebimentos vencidos aparecem como atrasados.
- [ ] Relatorios batem com os modulos.
- [ ] Permissoes, quando implementadas, sao respeitadas.

## Controle de mudancas

Mudancas relevantes devem registrar:

- titulo;
- solicitante;
- motivo;
- impacto tecnico;
- impacto em prazo;
- impacto em custo;
- impacto em mobile;
- decisao aprovada ou rejeitada.

## Regra de mudanca

Qualquer item que mova o projeto para SaaS, multiplas familias, assinatura ou venda publica deve ser tratado como nova fase e novo escopo.
