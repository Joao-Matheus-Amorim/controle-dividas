# Refinamento do Dashboard — contas e dividas

## Decisao

O Dashboard deve refletir a decisao do MVP: **Contas a pagar** tambem representa **Dividas**.

A tela inicial nao deve tratar isso como um modulo novo separado. Ela deve reaproveitar os dados de `payable_bills` e apresentar uma leitura mais clara para o usuario.

## O que o Dashboard passa a comunicar

- Contas e dividas em aberto;
- contas pendentes;
- contas atrasadas;
- contas avulsas;
- contas fixas;
- proximos vencimentos;
- tipo da conta/divida nos proximos vencimentos.

## Regras preservadas

- O Dashboard continua respeitando permissoes por modulo.
- O Dashboard continua respeitando escopo de dados por membro.
- Contas pagas nao entram em proximos vencimentos.
- Contas vencidas nao pagas continuam aparecendo como atrasadas.
- A decisao de fixa/avulsa vem de `payable_bills.bill_type`.

## Fora do escopo desta etapa

- Criar modulo separado de Dividas;
- criar graficos avancados;
- implementar periodo dinamico;
- criar recorrencia personalizada;
- alterar regras de permissao.

Esses pontos podem evoluir nas proximas Issues.

## Arquivo principal

```txt
app/protected/page.tsx
```

## Relação com outras Issues

- #7 criou a base de conta fixa e avulsa.
- #8 refinou a listagem, filtros e status.
- #9 refina o Dashboard para refletir essa decisao.
