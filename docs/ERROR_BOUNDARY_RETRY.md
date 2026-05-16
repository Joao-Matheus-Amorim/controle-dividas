# Error boundary retry em rotas protegidas

## Contexto

O Copilot/Codex apontou no PR #18 que `app/protected/error.tsx` usava `reset` no botao `Tentar novamente`.

No Next.js 16.2, o error boundary pode receber `unstable_retry` para tentar novamente erros de carregamento server-side em vez de apenas resetar o estado do boundary.

## Decisao

Usar `unstable_retry` em `app/protected/error.tsx`.

## Motivo

As rotas protegidas dependem de dados server-side do Supabase. Em falhas transientes de rede, permissao, cookies ou fetch server-side, `unstable_retry` representa melhor a intencao do botao `Tentar novamente`.

## Arquivo alterado

```txt
app/protected/error.tsx
```

## Comportamento esperado

- Tela de erro continua amigavel.
- Botao `Tentar novamente` chama `unstable_retry`.
- A UI continua mostrando a mensagem do erro de forma discreta.

## Observacao

A API ainda carrega o prefixo `unstable_`, entao deve ser revisitada se o Next.js estabilizar ou alterar esse contrato futuramente.
