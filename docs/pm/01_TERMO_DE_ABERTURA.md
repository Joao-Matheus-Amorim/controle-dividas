# Termo de Abertura - FamilyFinance

> Status DocDoc: Historico/PM
> Uso seguro: contexto de abertura, objetivos originais e linguagem de gestao.
> Observacao: nao e contrato tecnico atual; confirme estado vigente em
> `docs/VALIDACAO_TECNICA.md`, `docs/SAAS_GAP_REGISTER.md` e no codigo.

## Nome do projeto

FamilyFinance - Aplicativo financeiro familiar personalizado.

## Tipo de projeto

Projeto personalizado para uma unica familia, com Web/PWA funcional em validacao, painel web administrativo e app nativo Android/iOS planejado para fase futura.

O projeto nao e tratado como SaaS, multi-tenant comercial, produto publico ou sistema por assinatura nesta fase.

## Justificativa

A familia precisa centralizar o controle financeiro em uma solucao simples e segura, capaz de organizar:

- membros financeiros;
- limites mensais por pessoa;
- gastos;
- categorias;
- contas a pagar;
- contas a receber;
- bancos;
- relatorios;
- usuarios familiares;
- permissoes por modulo, acao e escopo.

A solucao tambem precisa separar corretamente:

```txt
Usuario do sistema  -> profile/auth
Membro financeiro   -> family_member
Admin familiar      -> responsavel que controla acessos
```

## Objetivo geral

Construir uma solucao financeira familiar sob medida, com backend Supabase, Web/PWA mobile-first, painel Admin familiar e base preparada para evoluir futuramente para app nativo Android/iOS.

## Objetivos especificos

### Ja implementados no MVP Web/PWA

- Controlar membros financeiros da familia.
- Definir limites mensais por pessoa.
- Registrar gastos por pessoa e categoria.
- Controlar contas a pagar.
- Controlar contas a receber.
- Gerenciar bancos por pessoa.
- Gerar relatorios financeiros consolidados.
- Criar Admin familiar.
- Criar usuarios familiares.
- Vincular usuarios a membros financeiros.
- Configurar permissoes por modulo.
- Configurar permissoes por acao: ver, criar, editar e excluir.
- Configurar escopo de dados: proprio, selecionados ou familia.
- Criar menu dinamico por permissao.
- Proteger rotas por sessao.
- Validar e-mail familiar autorizado antes do cadastro.
- Vincular `auth.users` aos `profiles` familiares.
- Criar migrations Supabase.
- Criar testes unitarios e de integracao.

### Parcialmente implementados

- Permissoes por funcionalidade especifica: tabela, tipos e testes existem, mas a UI completa ainda deve evoluir.
- Edicao completa de gastos, contas, bancos e categorias.
- Relatorios: tela e agregacoes existem, mas filtros, graficos e exportacao ainda precisam evoluir.
- Dashboard: ja respeita permissoes, mas o periodo financeiro ainda deve virar dinamico.

### Planejados para fases futuras

- Contas fixas.
- Dividas.
- Metas.
- Alertas.
- Investimentos.
- Acoes/cotacoes.
- Graficos avancados.
- Exportacoes.
- Convites por e-mail.
- App nativo React Native/Expo.

## Patrocinador

Responsavel financeiro da familia.

## Gerente do projeto

Joao Matheus.

## Premissas

- O app sera personalizado para uma familia especifica.
- O projeto nao sera vendido como SaaS nesta fase.
- O backend sera Supabase.
- A web atual funcionara como PWA de validacao e painel Admin.
- O produto final desejado sera mobile-first.
- O Admin familiar tera controle total de permissoes.
- Usuarios familiares acessarao apenas o que for liberado.
- A camada server-side deve validar permissoes, nao apenas a interface.

## Restricoes

- Evitar expansao para multiplas familias nesta fase.
- Evitar escopo comercial ou assinatura.
- Priorizar simplicidade de uso familiar.
- Validar Web/PWA antes de implementar app mobile completo.
- Nao expor `SUPABASE_SERVICE_ROLE_KEY` no browser.
- Manter deploy automatico da Vercel desativado durante desenvolvimento intenso.

## Riscos iniciais e atuais

- Escopo crescer para produto comercial antes da validacao familiar.
- Permissoes ficarem complexas demais para uso familiar.
- Diferenca entre usuario do sistema e membro financeiro gerar confusao.
- App mobile ser iniciado antes da consolidacao do Web/PWA.
- Custos externos de publicacao e build serem esquecidos.
- RLS ficar menos granular que a permissao fina da aplicacao.
- Codigo legado/mockado se misturar com producao.
- Documentacao ficar desatualizada em relacao ao codigo.

## Criterios de sucesso atualizados

- Web/PWA roda localmente.
- `npm run lint` aprovado.
- `npm run build` aprovado.
- `npm run test:run` aprovado.
- Migrations executadas sem erro.
- Banco sem dados duplicados de seed.
- Login e confirmacao Supabase funcionando.
- Admin criado pelo `ADMIN_EMAIL`.
- Admin consegue criar usuarios familiares.
- Admin consegue configurar permissoes.
- Usuario familiar ve apenas menus e dados liberados.
- Dashboard reflete dados reais e escopo de permissao.
- Relatorios refletem dados reais.
- Mutacoes financeiras validam permissao no servidor.
- Documentacao acompanha o estado real do codigo.

## Status atual

```txt
Release atual: MVP Web/PWA funcional em consolidacao.
Admin familiar: implementado.
Permissoes por modulo/acao/escopo: implementadas.
Relatorios: implementados em nivel inicial.
Mobile nativo: planejado.
SaaS publico: fora do escopo.
```
