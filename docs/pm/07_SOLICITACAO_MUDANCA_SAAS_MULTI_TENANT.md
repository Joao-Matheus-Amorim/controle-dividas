# Solicitacao de Mudanca - Evolucao SaaS Multi-tenant

> Status DocDoc: Historico/PM
> Uso seguro: registro formal da mudanca de escopo para SaaS multi-tenant.
> Observacao: nao e contrato tecnico atual da transicao; confirme estado em
> ADRs vigentes, `docs/VALIDACAO_TECNICA.md` e `docs/SAAS_GAP_REGISTER.md`.

## 1. Identificacao

**Projeto:** FamilyFinance  
**Documento:** Solicitacao formal de mudanca  
**Mudanca:** Evolucao de solucao familiar privada para SaaS multi-tenant  
**Classificacao:** Mudanca grande de escopo, arquitetura, seguranca e modelo de negocio  
**Solicitante:** Product Owner / Fundador  
**Status:** Proposta para nova fase  
**Data:** 2026-05-17

## 2. Resumo executivo

O FamilyFinance foi inicialmente planejado, documentado e implementado como uma solucao financeira familiar personalizada para uma unica familia. O sistema evoluiu para um MVP Web/PWA funcional, com autenticacao, painel administrativo, usuarios familiares, permissoes, modulos financeiros, dashboard, relatorios, configuracoes, migrations Supabase, testes automatizados e documentacao PMBOK.

A partir desta solicitacao, o projeto passa a avaliar oficialmente sua evolucao para um SaaS multi-tenant. A mudanca proposta transforma o FamilyFinance de um sistema familiar privado em uma plataforma capaz de atender varias familias, grupos ou organizacoes independentes, cada uma com dados isolados, membros proprios, permissoes proprias e possibilidade futura de planos comerciais.

Esta mudanca nao deve ser implementada como uma migration isolada. Ela altera a estrutura de dados, o modelo de permissao, o fluxo de autenticacao, as rotas, a estrategia mobile/PWA, o roadmap, a seguranca, a documentacao e os criterios de aceite.

## 3. Contexto atual

O projeto atual possui:

- Next.js App Router;
- React;
- TypeScript;
- Tailwind CSS;
- Supabase Auth;
- Supabase Database/PostgreSQL;
- Supabase SSR;
- Row Level Security;
- migrations versionadas;
- Dashboard financeiro;
- Pessoas/membros financeiros;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- Admin familiar;
- Usuarios familiares;
- Permissoes por modulo;
- Permissoes por acao;
- Escopos `own`, `selected`, `family`;
- Testes unitarios;
- Testes de integracao;
- Documentacao PMBOK;
- CI com lint, build e testes.

A arquitetura atual e coerente com uma familia unica. No entanto, o investimento realizado ja cria uma base promissora para um SaaS se a arquitetura for ajustada com seguranca.

## 4. Problema de negocio

Manter o FamilyFinance apenas como ferramenta privada limita o valor do produto.

O sistema ja possui varios recursos que poderiam atender outras familias ou grupos:

- controle financeiro por pessoa;
- categorias;
- contas fixas e avulsas;
- contas a receber;
- bancos;
- permissoes;
- dashboard;
- relatorios;
- administracao familiar.

Se o produto continuar restrito a uma unica familia, parte significativa do trabalho tecnico e de produto nao sera convertida em valor comercial. Transformar em SaaS permite:

- reutilizar a base existente para multiplos clientes;
- construir um produto vendavel;
- criar possibilidade futura de assinatura;
- aumentar valor de portfolio;
- amadurecer arquitetura;
- preparar app mobile com base mais robusta;
- criar isolamento real de dados;
- profissionalizar o projeto.

## 5. Problema tecnico

O modelo atual usa `owner_id` ligado diretamente a `auth.users(id)` como eixo de propriedade dos dados.

Esse modelo funciona para familia unica, mas limita SaaS porque:

- o dado pertence diretamente a um usuario, nao a uma organizacao;
- um usuario nao consegue participar naturalmente de varias organizacoes;
- permissoes ficam presas ao owner atual;
- RLS isola por usuario dono, nao por membership;
- `ADMIN_EMAIL` nao escala para multiplos clientes;
- billing futuro nao tem entidade de conta contratante;
- rotas atuais nao expressam contexto de organizacao;
- suporte a multiplas familias exigiria gambiarras se o modelo nao mudar.

## 6. Objetivo da mudanca

Evoluir o FamilyFinance para uma arquitetura SaaS multi-tenant em que cada organizacao representa uma familia, grupo financeiro, workspace ou conta contratante isolada.

A mudanca deve permitir:

- multiplas organizacoes no mesmo sistema;
- usuarios vinculados a uma ou mais organizacoes;
- dados financeiros isolados por organizacao;
- permissoes por organizacao;
- dashboard por organizacao;
- rotas futuras com `orgSlug`;
- possibilidade futura de billing;
- preservacao do MVP atual durante a transicao;
- implementacao incremental e validavel.

## 7. Declaracao da mudanca proposta

A proposta e alterar a direcao estrategica do projeto:

### Antes

```txt
FamilyFinance e uma solucao financeira familiar personalizada para uma unica familia.
```

### Depois

```txt
FamilyFinance sera evoluido para uma plataforma SaaS multi-tenant de gestao financeira familiar, onde cada organizacao representa uma familia, grupo ou conta contratante independente.
```

## 8. Escopo da mudanca

### Dentro do escopo desta mudanca

- Documentar a nova estrategia SaaS.
- Definir modelo multi-tenant alvo.
- Planejar migrations nao destrutivas.
- Introduzir entidade `organizations`.
- Introduzir memberships por organizacao.
- Adicionar `organization_id` nas tabelas financeiras.
- Adaptar helpers server-side.
- Adaptar queries e actions para organizacao ativa.
- Evoluir RLS para isolamento por organization membership.
- Planejar rotas com `[orgSlug]`.
- Atualizar documentacao PMBOK.
- Atualizar testes para isolamento multi-tenant.

### Fora do escopo imediato

- Stripe em producao.
- Assinatura paga.
- Landing page comercial completa.
- Area publica de marketing completa.
- App nativo React Native/Expo.
- Open Finance.
- Integracao bancaria automatica.
- IA financeira.
- Marketplace.
- Multi-empresa contabil.
- Produto financeiro regulado.
- Reescrita da stack.
- Redesign completo.

## 9. Premissas

- A stack atual sera preservada.
- Supabase continuara sendo backend principal.
- RLS continuara ativo.
- A seguranca nao dependera apenas do frontend.
- O MVP atual sera preservado sempre que possivel.
- Migrations devem ser incrementais e revisaveis.
- Billing so sera implementado depois do isolamento multi-tenant.
- Rotas com `orgSlug` so devem entrar depois do modelo de dados estar preparado.
- Documentacao deve acompanhar cada mudanca relevante.

## 10. Restricoes

- Nao aplicar SQL destrutivo sem plano de rollback.
- Nao remover `owner_id` antes da compatibilidade estar validada.
- Nao alterar RLS em massa sem testes de isolamento.
- Nao misturar billing com migration base.
- Nao misturar redesign com mudanca de tenant.
- Nao criar PRs gigantes envolvendo banco, UI, rotas e permissao ao mesmo tempo.
- Nao confiar em `orgSlug` do frontend sem validacao server-side.

## 11. Impacto tecnico

### Banco de dados

Impacto alto.

Sera necessario:

- criar `organizations`;
- criar `organization_memberships`;
- adicionar `organization_id` nas tabelas atuais;
- popular organizacao inicial;
- criar indices por `organization_id`;
- revisar constraints;
- revisar uniqueness;
- revisar foreign keys;
- revisar policies RLS.

### Backend/server-side

Impacto alto.

Sera necessario:

- resolver organizacao ativa;
- validar membership;
- validar perfil dentro da organizacao;
- adaptar helpers de permissao;
- adaptar queries financeiras;
- adaptar Server Actions;
- garantir que dados de outra organizacao nao sejam acessados.

### Frontend

Impacto medio/alto.

Sera necessario:

- preparar rotas futuras com organization slug;
- ajustar navegacao;
- adicionar contexto de organizacao;
- possivelmente criar organization switcher;
- preservar UX atual no periodo de transicao.

### Testes

Impacto alto.

Sera necessario testar:

- usuario acessando sua organizacao;
- usuario bloqueado fora da organizacao;
- admin de uma organizacao sem acesso a outra;
- queries filtradas por organization_id;
- actions impedindo mutacao fora da organizacao;
- RLS impedindo vazamento;
- fallback quando usuario nao possui organizacao.

### Documentacao

Impacto alto.

Sera necessario atualizar:

- README;
- escopo PMBOK;
- WBS/EAP;
- riscos;
- arquitetura;
- estrategia mobile;
- estrategia de testes;
- roadmap;
- validacao tecnica.

## 12. Impacto em seguranca

A seguranca passa a depender de tres camadas:

### 12.1 RLS

Responsavel por garantir que o usuario autenticado so veja registros de organizacoes das quais participa.

### 12.2 Server-side helpers

Responsaveis por aplicar regras de negocio e permissoes finas:

- pode ver modulo?
- pode criar?
- pode editar?
- pode excluir?
- pode acessar membro especifico?
- escopo e `own`, `selected` ou `family`?

### 12.3 Frontend

Responsavel apenas por experiencia:

- esconder menus;
- ocultar botoes;
- exibir mensagens;
- melhorar fluxo.

Frontend nao deve ser barreira de seguranca principal.

## 13. Modelo-alvo resumido

```txt
auth.users
  -> organization_memberships
    -> organizations
      -> profiles
      -> family_members
      -> expense_categories
      -> expenses
      -> payable_bills
      -> receivable_incomes
      -> banks
      -> user_module_permissions
      -> user_feature_permissions
```

## 14. Entidades novas propostas

### 14.1 organizations

Representa a conta SaaS/tenant.

Campos candidatos:

```txt
id
slug
name
owner_auth_user_id
plan
status
trial_ends_at
stripe_customer_id
created_at
updated_at
```

### 14.2 organization_memberships

Representa os usuarios autenticados associados a uma organizacao.

Campos candidatos:

```txt
id
organization_id
auth_user_id
role
is_active
created_at
updated_at
```

## 15. Estrategia de migracao

### Fase 1 - Documentacao e aceite da mudanca

- Criar documentos de estrategia.
- Aprovar mudanca de escopo.
- Registrar riscos.
- Definir nomenclatura final.

### Fase 2 - Migration base

- Criar `organizations`.
- Criar `organization_memberships`.
- Criar indices.
- Nao alterar dados financeiros ainda.

### Fase 3 - Compatibilidade com dados atuais

- Criar organizacao inicial.
- Criar membership admin para usuario atual.
- Adicionar `organization_id` nullable nas tabelas.
- Popular `organization_id` para dados existentes.
- Manter `owner_id` temporariamente.

### Fase 4 - Adaptacao server-side

- Criar helpers de organizacao ativa.
- Adaptar perfil atual.
- Adaptar permissoes.
- Adaptar queries.
- Adaptar actions.

### Fase 5 - RLS multi-tenant

- Criar policies por membership.
- Testar isolamento.
- Comparar com policies antigas.
- Remover dependencia de `owner_id` quando seguro.

### Fase 6 - Rotas e UX SaaS

- Introduzir `[orgSlug]`.
- Redirecionar `/protected` para organizacao ativa.
- Ajustar navegacao.
- Validar PWA/mobile.

### Fase 7 - Billing e crescimento

- Preparar planos.
- Integrar Stripe.
- Criar limites por plano.
- Criar area de billing.

## 16. Riscos da mudanca

| ID | Risco | Probabilidade | Impacto | Resposta |
|---|---|---:|---:|---|
| SM-001 | Vazamento de dados entre organizacoes | Media | Critico | RLS por membership, testes e revisao manual |
| SM-002 | Migration quebrar dados existentes | Media | Alto | Migration incremental e rollback |
| SM-003 | Confusao entre `owner_id` e `organization_id` | Alta | Alto | Padronizar nomenclatura e transicao documentada |
| SM-004 | Billing ser implementado antes da seguranca | Media | Alto | Bloquear billing ate tenant estar validado |
| SM-005 | Rotas com slug entrarem antes da camada server | Media | Alto | Banco e helpers antes das rotas |
| SM-006 | PRs grandes demais | Alta | Medio | Quebrar em PRs pequenas |
| SM-007 | Permissoes ficarem inconsistentes por organizacao | Media | Alto | Testes de permissao por organization |
| SM-008 | Documentacao ficar desatualizada | Alta | Medio | Atualizar docs por fase |
| SM-009 | Usuario sem organizacao ativa ficar sem fluxo | Media | Medio | Criar onboarding/fallback |
| SM-010 | Slug duplicado ou invalido | Baixa | Medio | Unique index e validacao |

## 17. Criterios de aceite da mudanca

A fase SaaS base sera aceita quando:

- estrategia SaaS estiver documentada;
- solicitacao de mudanca estiver registrada;
- `organizations` existir;
- `organization_memberships` existir;
- dados antigos estiverem associados a uma organizacao inicial;
- tabelas financeiras tiverem `organization_id` preenchido;
- helpers server-side resolverem organizacao ativa;
- queries filtrarem por organizacao;
- actions validarem organization e permissao;
- RLS impedir acesso entre organizacoes;
- testes validarem isolamento minimo;
- CI estiver verde;
- documentacao PMBOK estiver atualizada.

## 18. Definition of Done da fase SaaS base

- Codigo implementado.
- Migrations revisadas.
- RLS revisado.
- Testes automatizados aprovados.
- Teste manual realizado.
- Documentacao atualizada.
- PRs pequenas e rastreaveis.
- Nenhum segredo exposto.
- Nenhum acesso cross-tenant permitido.
- Aceite registrado.

## 19. Decisao recomendada

A recomendacao e aprovar a mudanca para SaaS multi-tenant, mas implementar por fases.

Nao se recomenda aplicar imediatamente um SQL completo que altere todo o schema de uma vez.

A ordem recomendada e:

```txt
1. documentacao
2. plano SQL detalhado
3. organizations
4. memberships
5. organization_id nullable
6. backfill dos dados atuais
7. helpers server-side
8. queries/actions por organization
9. RLS multi-tenant
10. rotas por orgSlug
11. PWA/shortcuts
12. billing
```

## 20. Registro de decisao

Esta solicitacao altera a orientacao estrategica do projeto.

O FamilyFinance deixa de ser tratado apenas como uma solucao privada e passa a ser planejado como SaaS multi-tenant, desde que a transicao seja feita com seguranca, documentacao, testes e aceite por fase.

## 21. Proximos passos

1. Revisar `docs/SAAS_MULTI_TENANT_STRATEGY.md`.
2. Aprovar nomenclatura `organizations`.
3. Criar plano SQL detalhado.
4. Definir migration preparatoria.
5. Criar issue/PR para `organizations` e `organization_memberships`.
6. Definir testes minimos de isolamento.
7. Atualizar roadmap e EAP apos aprovacao.
