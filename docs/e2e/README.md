# E2E - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo dos contratos e roadmaps de Playwright E2E.
> Atualizado em: 2026-06-01.

## Como usar

Use estes documentos para entender cobertura planejada, contratos de fixture,
gates manuais e regras de limpeza. Eles nao substituem:

1. specs reais em `tests/e2e`;
2. workflows e comandos versionados;
3. resultados de CI ou execucoes gated;
4. `docs/VALIDACAO_TECNICA.md`;
5. `docs/SAAS_GAP_REGISTER.md`.

## Documentos E2E

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `PLAYWRIGHT_COVERAGE_ROADMAP.md` | Atual como mapa de cobertura | Mostra a matriz E2E coberta/gated e a proxima sequencia segura. |
| `PLAYWRIGHT_ONBOARDING_TESTS.md` | Atual como contrato gated | Define fixtures e flags para onboarding, active organization, shell e multi-org switch. |
| `DATA_CHANGING_CLEANUP_STRATEGY.md` | Atual como contrato de cleanup | Define regras obrigatorias para qualquer E2E que muda dados. |

## Regra operacional

Documentos E2E podem orientar novos testes, mas nao devem ser usados para:

- afirmar que um gate rodou em ambiente atual;
- provar estado de CI;
- usar usuario ou dado de producao;
- criar teste data-changing sem cleanup e flag explicita;
- misturar E2E com runtime, schema, RLS, billing ou UI em PR amplo.

Quando houver conflito entre roadmap E2E e specs atuais, trate os specs e CI
como fonte de verdade e abra um PR DocDoc pequeno para reconciliar o texto.
