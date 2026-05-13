# Validação Técnica — FamilyFinance

Este documento registra a revisão técnica inicial após a transformação do starter em sistema financeiro familiar.

## Pontos revisados

- Rotas protegidas dependem de sessão/cookies do Supabase e foram marcadas como dinâmicas no layout de `/protected`.
- Variantes do componente `Badge` foram tipadas em telas com status dinâmico.
- CRUDs principais foram organizados por módulo:
  - Pessoas
  - Gastos
  - Contas a Pagar
  - Contas a Receber
  - Bancos
  - Relatórios
  - Configurações
- Dados reais do dashboard agora vêm dos helpers de servidor conectados ao Supabase.

## Comandos para validar localmente

Execute na raiz do projeto:

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Banco de dados

Antes de testar as telas protegidas, execute no Supabase SQL Editor:

```txt
supabase/migrations/001_family_finance_schema.sql
```

## Variáveis de ambiente necessárias

Crie ou atualize `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=URL_DO_SEU_PROJETO
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICAVEL_DO_SUPABASE
```

## Fluxo de teste manual recomendado

1. Criar conta ou fazer login.
2. Acessar `/protected/pessoas` e confirmar se os membros iniciais foram criados.
3. Alterar um limite mensal em `/protected/configuracoes`.
4. Lançar um gasto em `/protected/gastos`.
5. Confirmar se o dashboard recalcula o saldo da pessoa.
6. Criar uma conta a pagar vencida e confirmar se aparece como atrasada.
7. Criar uma conta a receber e marcar como recebida.
8. Cadastrar banco e atualizar saldo.
9. Conferir `/protected/relatorios`.

## Observação

A revisão foi feita por inspeção estática do código e correções preventivas. O build local precisa ser executado no ambiente do projeto, pois o ambiente usado nesta revisão não conseguiu clonar o repositório por indisponibilidade de resolução DNS para `github.com`.
