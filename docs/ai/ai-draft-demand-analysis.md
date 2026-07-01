# Análise de Demanda por Categoria — Draft & Fallback para CRUD via IA

## Premissa

O usuário descreve em linguagem natural uma operação financeira. A IA precisa
entregar **certeza onde pode, dúvida explícita onde não pode** — sem silêncio,
sem ação parcial despercebida.

---

## 1. Mapa de Confiança por Entidade e Campo

Legenda: `H` = alta (parse confiável), `M` = média (parse possível com falsos ±),
`B` = baixa (parse raro), `—` = não aplicável.

### `gasto` (Expense)

| Campo | Conf. | Fonte de parse | Falha típica | Fallback |
|-------|-------|----------------|-------------|----------|
| amount | **H** | último número no texto | "comprei 2 paes 5 reais" → não diferencia qtd x preço | highlight p/ confirmação |
| description | **H** | texto limpo após extrair números/datas | "cinema" → perfeito; "foi no cinema com a familia" → longo | truncar p/ 60 chars + tooltip full |
| date | **M** | "ontem/hoje/amanhã" ou dd/mm | "semana passada" não parseia; "dia 15" sem mês → mês corrente | fallback = hoje + ícone "?" |
| categoryId | **B** | keyword → categoria | "mercado" → Alimentação funciona; "ifood" → depende da taxonomia | selector com pré-seleção por palavra-chave |
| memberId | **M** | nome do membro no texto | só funciona se o nome está literal | fallback = dono do pedido + "?" |
| bankId | **M** | nome do banco no texto | "crédito" detecta payment method, não banco | select bancos do membro |
| paymentMethod | **M** | "pix/cartão/dinheiro" | "crédito/débito" → mapeia cartão | fallback = vazio |
| purchaseLocation | **M** | texto após "no/na/em" | "no posto" → "posto" correto; "em casa" → "casa" (genérico) | suggest se parseou, vazio se não |

### `conta_a_pagar` (Payable Bill)

| Campo | Conf. | Fonte de parse | Falha típica | Fallback |
|-------|-------|----------------|-------------|----------|
| name | **H** | primeiras palavras após verbo | "criar conta de luz 120" → "conta de luz" | fallback = "Conta" + sequencial |
| amount | **H** | último número | confiável | highlight |
| dueDate | **M** | "vence/Vencimento dd/mm" | "dia 15 todo mês" → não parseia recorrência | fallback = 30d de hoje + "?" |
| categoryId | **B** | keyword → categoria | "luz" → Utilities; "agua" → funciona só com termo exato | selector com pré-seleção por domínio |
| memberId | **B** | nome do membro | raro em contas (quase nunca citam) | fallback = dono |
| billType | **H** | "fixa/mensal" → fixa; senão avulsa | default avulsa é seguro | fallback = "avulsa" |
| status | **H** | "paga/paguei" → pago; senão pendente | default pendente é seguro | fallback = "pendente" |
| bankId | **M** | nome do banco | raro | select opcional |

### `conta_a_receber` (Receivable Income)

| Campo | Conf. | Fonte de parse | Falha típica | Fallback |
|-------|-------|----------------|-------------|----------|
| amount | **H** | último número | confiável | highlight |
| expectedDate | **M** | "amanhã/dia dd" ou data literal | "recebo dia 5" sem mês → mês corrente | fallback = 7d de hoje + "?" |
| sourceId | **B** | nome da fonte + aliases | "freela" → funciona com alias; "projeto X" → não | selector com pré-seleção + "Outro" |
| incomeType | **H** | "salário/mensal" → fixa; senão variável | default "variável" é seguro | fallback = "variavel" |
| memberId | **B** | nome do membro | raro | fallback = dono |
| status | **H** | "recebi/recebido/caiu" → recebido; senão previsto | default "previsto" é seguro | fallback = "previsto" |
| bankId | **M** | nome do banco | raro | select opcional |

### `banco` (Bank Account)

| Campo | Conf. | Fonte de parse | Falha típica | Fallback |
|-------|-------|----------------|-------------|----------|
| bankName | **H** | fuzzy match com 73 bancos | "Itaú" → funciona; "C6" → depende do alias | selector com autocomplete |
| currentBalance | **M** | "saldo de X" ou último número | "20 euros" → 20 correto; "saldo inicial 0" → 0 correto | highlight + permitir vazio |
| accountType | **B** | "corrente/poupança/digital" | "corrente" funciona; "conta" → ambíguo | fallback = "corrente" + "?" |
| currency | **M** | "EUR/BRL/$/euros/reais" | "euros" → EUR correto; sem menção → default EUR | fallback = "EUR" + "?" |
| memberId | **B** | nome do membro | raro | fallback = dono |

---

## 2. Estratégia de Fallback por Operação CRUD

### CREATE — Rascunho com Preview Editável

```
Fluxo atual:
  Texto → Classificador → Draft builder → missingFields[] → Form sheet

Fluxo ideal:
  Texto → Classificador → Draft builder →
    Preview card com:
      ├─ Campos H: exibidos como "conferido" (ícone ✓, cor neutra)
      ├─ Campos M: exibidos com "?",
      │            tooltip "A IA inferiu este valor. Verifique."
      │            + clique p/ editar inline
      ├─ Campos B/vazios: exibidos como "Pendente"
      │            com valor sugerido + botão "Aceitar sugestão"
      └─ Ações: [Recusar] [Editar no formulário] [Confirmar]
```

### READ (Query) — Resposta com Sugestão de Ação

```
Exemplo:
  User: "mostra contas de luz"
  IA: lista as contas pendentes
      + "Quer pagar alguma?" [Pagar]
      + "Quer editar?" [Editar]
```

Quando o router retorna `query` mas os termos mencionam entidades específicas,
sugerir a ação seguinte é mais útil que só listar.

### UPDATE — Preview de Alterações com Diff

```
Fluxo:
  "editar conta de luz para 130" →
    1. Busca "conta de luz" pendente
    2. Gera diff: amount 120 → 130
    3. Preview card modo "diff":
       ├─ Campos antigos: riscados
       ├─ Campos novos: destacados em verde
       └─ [Recusar] [Ajustar] [Confirmar alteração]
```

### DELETE — Confirmação Forte com Detalhes da Entidade

```
Fluxo:
  "excluir conta de luz" →
    1. Busca entidade
    2. Preview card vermelho com:
       ├─ Nome, Valor, Vencimento
       ├─ "Essa ação não pode ser desfeita"
       ├─ checkbox "Entendi, quero excluir"
       └─ [Cancelar] [Sim, excluir]
```

Já existe parcialmente — falta o card ser o mesmo componente em vez de dialogs
manteridos separadamente por ação.

### MARK AS PAID/RECEIVED — Confirmação + Sugestão de Banco

```
Fluxo atual:
  Preview com:
    ├─ Dados da conta
    ├─ Select banco (obrigatório p/ pagamento)
    └─ [Confirmar]

Sugestão:
  Mesmo preview card com:
    ├─ Dados da entidade
    ├─ Select banco (obrigatório p/ pagamento, opcional p/ recebimento)
    ├─ "Registrar movimentação no extrato?"
    └─ [Confirmar com movimentação] [Só marcar status]
```

---

## 3. Tratamento de Confiança por Campo

Cada campo do draft precisa ser enriquecido com metadado de confiança:

```typescript
type AiFieldConfidence = "alta" | "media" | "baixa";

type AiDraftField<T> = {
  value: T | null;
  confidence: AiFieldConfidence;
  reason: string;            // Por que esse valor?
  accepted?: boolean;        // Usuário já aceitou/confirmou?
  defaultValue?: T;          // Sugestão de fallback
};
```

Isso permite que o Preview Card saiba:
- **alta**: exibir normal, sem destaque
- **media**: exibir com indicador "?", hover explica o raciocínio
- **baixa/explicitMissing**: exibir campo vazio com fallback em destaque +
  foco automático se for obrigatório

### Regras de Fallback por Categoria de Confiança

| Confiança | UX | Ação do sistema |
|-----------|-----|-----------------|
| Alta | Mostrar valor sem destaque | Pode auto-salvar se todos H |
| Média | Mostrar com indicador "?" | Não auto-salva; requer revisão |
| Baixa (parse falhou) | Mostrar fallback em itálico | Destacar campo; foco se obrigatório |
| Baixa (sem fallback) | Campo vazio com placeholder | Foco automático |

---

## 4. Sugestão da Próxima Ação

Após cada CRUD, o sistema deve sugerir o próximo passo natural:

| Ação executada | Sugestão seguinte |
|---------------|-------------------|
| Criou gasto | "Vincular a um banco?" / "Criar outro similar?" |
| Criou conta | "Quer pagar agora?" |
| Pagou conta | "Registrar no extrato do banco?" |
| Recebeu valor | "Alocar em qual banco?" |
| Editou entidade | "Mais alguma alteração?" |
| Excluiu entidade | "Recriar com dados diferentes?" |

---

## 5. Architecture

```
chat/route.ts
     │
     ▼
buildAiFinanceUniversalDraft (já existe)
     │
     ▼
AiFinanceUniversalDraftBoundary (já existe, sem field confidence)
     │
     ▼
AiDraftPreviewCard (NOVO)
     ├─ renderiza campos por confiança
     ├─ permite edição inline
     ├─ ação única "Confirmar" (chama /api/ai/actions)
     └─ fallback "Editar no formulário" (abre form sheet)
```

### O que precisa mudar no draft existente

1. `AiFinanceIntakeDraft` → cada campo vira `AiDraftField<T>` com metadado
2. `buildAiFinanceUniversalDraft` → retorna field confidence junto
3. `AiFinanceUniversalDraftBoundary` → ganha `fieldConfidence` opcional
4. `AiDraftPreviewCard` → novo componente substitui os 3 dialogs separados
5. `ai-command-bar` → usa o card no lugar dos dialogs inline
6. `chat/route.ts` → retorna field confidence na resposta

---

## 6. Risco & Trade-off

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Field confidence imprecisa confunde mais que ajuda | Média | Alto | Testar com golden prompts; se dúvida, rebaixar p/ "media" |
| Dois sistemas de confirmação (card IA + form sheet) se contradizem | Alta | Médio | Card substitui o primeiro passo; form sheet vira refinamento |
| Usuário ignora indicadores e confirma cego | Alta | Médio | Modal de confirmação final sempre presente ("Confirma os dados acima?") |
| Mais código cliente = mais latência no chat | Baixa | Baixo | Card é estático (sem estado de servidor) |
