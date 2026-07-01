# AI-0: Contrato Operacional da IA

## 1. Matriz de Capacidades

| Domínio | Criar | Editar | Excluir | Ação Financeira | Consultar |
|---------|-------|--------|---------|-----------------|-----------|
| Gastos | ✅ | ✅ | ✅ c/ forte | ❌ | ✅ |
| Contas a Pagar | ✅ | ✅ | ✅ c/ forte | ✅ pagar | ✅ |
| Contas a Receber | ✅ | ✅ | ✅ c/ forte | ✅ receber | ✅ |
| Bancos | ✅ | ✅ | ✅ c/ forte | ✅ ajuste saldo | ✅ |
| Categorias | ✅ | ⏳ futuro | ✅ c/ forte | ❌ | ✅ |
| Origens de Recebimento | ✅ | ⏳ futuro | ✅ c/ forte | ❌ | ✅ |
| Membros | ⏳ futuro | ⏳ futuro | ❌ | ❌ | ✅ |
| Admin | ❌ | ❌ | ❌ | ❌ | ❌ |

Legenda: ✅ = implementado ou em implementação atual | ❌ = fora de escopo | ⏳ futuro = planejado próximo ciclo

## 2. Política de Confirmação

| Nível | Ações | Comportamento |
|-------|-------|---------------|
| **Confirmação simples** | Criar gasto/conta/recebimento/banco | IA mostra resumo → usuário confirma → executa |
| **Confirmação com preview** | Editar registro existente | IA mostra antes/depois → usuário confirma → executa |
| **Confirmação forte** | Excluir, pagar, receber, ajuste saldo | IA mostra detalhes → usuário confirma explicitamente ("confirmo") → executa |
| **Auto-aprovado** | Consultas read-only | Executa direto, sem confirmação |
| **Bloqueado** | Admin, permissões, alterar owner | Recusa explícita |

## 3. Arquitetura de Comando

```
Usuário → Intent Router → Entity Resolver → Data Collector → Confirmation → Tool Executor → Audit → Response
```

Cada etapa é responsabilidade de um módulo separado em `lib/ai/manager/`.

## 4. Response Contract

Toda resposta da IA segue este formato:

```typescript
type AiResponse = {
  content: string;           // Mensagem para o usuário
  type: "message" | "confirmation" | "error" | "action_result";
  action?: {
    type: string;            // "create_expense" | "pay_bill" | etc
    status: "pending" | "confirmed" | "executed" | "rejected";
    summary: string;         // Resumo do que será/foi feito
    before?: Record<string, unknown>;  // Para edições
    after?: Record<string, unknown>;   // Para edições
  };
};
```

## 5. Regras de Segurança

1. Toda ação de escrita passa por server action com validação RLS + organization_id
2. Toda ação destrutiva (excluir) exige `confirm_delete` no servidor
3. Nenhuma ação de escrita é executada sem auditoria
4. Rate limiting por usuário + organização
5. Confirmação expira após 5 minutos
