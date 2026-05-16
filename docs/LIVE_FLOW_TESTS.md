# Testes de fluxos criticos vivos

## Objetivo

Registrar a cobertura adicionada para os fluxos criticos do MVP vivo.

A regra desta etapa e expandir testes onde existem lacunas reais, sem tratar o projeto como se nao tivesse testes.

## Testes ja existentes no projeto

O projeto ja possui cobertura para:

- calculos financeiros;
- formatacao de moeda;
- limite restante;
- percentual usado;
- permissoes/RBAC;
- escopos `own`, `selected` e `family`;
- admin bypass;
- perfil inativo;
- permissoes por funcionalidade;
- queries de dashboard com MSW;
- falha controlada de query.

## Cobertura adicionada nesta etapa

Arquivo:

```txt
__tests__/unit/payable-bill-actions.test.ts
```

Fluxos cobertos:

- bloqueia criacao de conta sem responsavel;
- bloqueia criacao de conta com valor invalido;
- cria conta avulsa com `bill_type = 'avulsa'`;
- garante que conta avulsa nao grava recorrencia;
- cria conta fixa com `bill_type = 'fixa'`;
- garante recorrencia `mensal` por padrao em conta fixa;
- retorna erro quando o usuario nao tem permissao para criar conta para o membro escolhido.

## Lacunas futuras

Ainda podem evoluir em Issues futuras:

- teste de UI do formulario de conta fixa/avulsa;
- teste de filtros de listagem por query params;
- teste de error boundary/loading visual;
- teste de auth com email autorizado e nao autorizado;
- teste de update/delete com feedback visual.

## Comando

```bash
npm run test
```

## Regra de ouro

```txt
Cada regra critica nova deve ganhar pelo menos um teste unitario ou de integracao quando for viavel.
```
