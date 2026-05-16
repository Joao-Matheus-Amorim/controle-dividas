# Protecao da branch main

Este documento define as regras recomendadas para manter a branch `main` estavel.

## Configuracao recomendada no GitHub

Caminho:

```txt
Repository Settings -> Rules -> Rulesets -> New ruleset -> New branch ruleset
```

Ou, em alguns repositorios:

```txt
Repository Settings -> Branches -> Add branch protection rule
```

## Regra para aplicar

Branch alvo:

```txt
main
```

Ative as opcoes:

- Require a pull request before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Do not allow bypassing the above settings, se quiser uma regra mais rigida

## Status check obrigatorio

Use o check do workflow atual:

```txt
Quality Gate
```

Esse job executa instalacao, audit de vulnerabilidades criticas, lint, build e testes.

## Regra operacional

- Nunca fazer push direto na `main`.
- Toda mudanca deve entrar por Pull Request.
- Pull Request so deve ser mergeado com CI verde.
- Mudancas grandes devem ser quebradas em PRs menores.
- Secrets e credenciais nunca devem ser commitados.

## Quando o CI falhar

1. Abra o log do GitHub Actions.
2. Identifique a etapa que falhou.
3. Corrija na mesma branch do Pull Request.
4. Faca novo push.
5. Aguarde o CI ficar verde.
