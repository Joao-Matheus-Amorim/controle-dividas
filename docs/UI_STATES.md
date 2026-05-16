# Padrao de estados de UI

## Objetivo

Este documento define o padrao minimo para estados de loading, vazio, erro e sucesso no FamilyFinance.

A regra desta etapa e reaproveitar o que ja existe, sem criar um sistema novo do zero.

## Componentes existentes reaproveitados

| Componente | Uso |
| --- | --- |
| `components/app/app-skeleton.tsx` | Loading/skeleton de paginas e secoes |
| `components/app/app-empty-state.tsx` | Estado vazio reutilizavel |
| `components/ui/button.tsx` | Acoes de retry, criar e salvar |
| Mensagens dos formularios | Erro e sucesso em actions com `useActionState` |

## Loading

Rotas protegidas devem usar loading visual consistente para evitar tela branca enquanto dados server-side carregam.

Padrao aplicado:

```txt
app/protected/loading.tsx
```

Esse arquivo usa:

```txt
AppPageSkeleton
```

## Erro

Rotas protegidas devem ter uma tela de erro amigavel para falhas inesperadas.

Padrao aplicado:

```txt
app/protected/error.tsx
```

A tela deve:

- explicar que houve erro ao carregar;
- oferecer botao de tentar novamente;
- mostrar a mensagem tecnica de forma discreta;
- manter visual coerente com o app.

## Estado vazio

Estados vazios devem explicar o que esta faltando e, quando possivel, apontar a proxima acao.

Exemplos:

- nenhuma conta ou divida cadastrada;
- nenhum resultado para filtros selecionados;
- nenhuma renda cadastrada;
- nenhum banco cadastrado;
- nenhum gasto cadastrado;
- nenhuma categoria exibivel.

## Erro/sucesso em formulario

Formularios com Server Actions devem retornar mensagens simples:

```ts
{ error: "Mensagem para usuario leigo." }
{ success: "Acao concluida com sucesso." }
```

Mensagens tecnicas devem ser evitadas quando o usuario nao consegue agir sobre elas.

## Actions silenciosas

Algumas actions ainda retornam silenciosamente em casos de erro, principalmente alteracao de status e exclusao.

Isso nao sera refeito nesta etapa para evitar alterar regra de negocio sem necessidade.

Lacuna registrada para evolucao futura:

- padronizar feedback em actions de update/delete;
- confirmar exclusoes destrutivas;
- exibir erro quando uma action falhar por permissao ou banco.

## Regra de ouro

```txt
Usuario nunca deve ficar sem saber se o app esta carregando, vazio, com erro ou se a acao deu certo.
```

## Fora do escopo desta etapa

- Toast global;
- sistema novo de notificacoes;
- refatoracao completa de todas as actions;
- redesign de todas as telas financeiras;
- alteracao de regras de permissao.
