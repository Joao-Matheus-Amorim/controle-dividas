# Guia de contribuição

Este projeto deve ser mantido com fluxo profissional: `main` estável, alterações em branches separadas, Pull Request obrigatório e CI verde antes do merge.

## Fluxo padrão

1. Atualize a branch principal:

```bash
git checkout main
git pull origin main
```

2. Crie uma branch para a tarefa:

```bash
git checkout -b feature/nome-da-feature
```

3. Faça alterações pequenas e focadas.

4. Rode as verificações locais antes do push:

```bash
npm ci
npm audit --audit-level=critical
npm run lint
npm run build
npm run test
```

5. Faça commit com mensagem clara:

```bash
git add .
git commit -m "Add debt summary card"
```

6. Envie a branch:

```bash
git push origin feature/nome-da-feature
```

7. Abra um Pull Request para `main`.

8. Só faça merge quando o CI estiver verde.

## Padrão de branches

Use nomes curtos, em inglês e com prefixo de intenção:

| Tipo | Quando usar | Exemplo |
| --- | --- | --- |
| `feature/` | Nova funcionalidade | `feature/debt-dashboard` |
| `fix/` | Correção de bug | `fix/login-validation` |
| `chore/` | Configuração, CI, manutenção | `chore/project-governance` |
| `refactor/` | Refatoração sem mudar comportamento | `refactor/supabase-client` |
| `docs/` | Documentação | `docs/setup-guide` |
| `test/` | Testes | `test/debt-form` |

## Padrão de commits

Use mensagens diretas, preferencialmente em inglês, começando com verbo:

- `Add ...`
- `Fix ...`
- `Update ...`
- `Remove ...`
- `Refactor ...`
- `Document ...`
- `Test ...`

Exemplos bons:

```txt
Add CI quality gate workflow
Fix Supabase environment validation
Update debt dashboard layout
Refactor authentication provider
Document project setup
```

Evite mensagens genéricas:

```txt
alterações
ajustes
update
coisas
```

## Regras de qualidade

Antes de pedir revisão, confirme:

- O código não expõe secrets, tokens, senhas ou chaves privadas.
- O build passa localmente.
- O lint passa localmente.
- Os testes passam localmente.
- O Pull Request explica o que mudou e como testar.
- O CI do GitHub Actions está verde.

## Variáveis e secrets

- Informações sensíveis devem ficar em **GitHub Actions Secrets**.
- Configurações não sensíveis devem ficar em **GitHub Actions Variables**.
- Nunca commitar `.env`, senha, token ou chave privada.
- Variáveis públicas de frontend, como `NEXT_PUBLIC_*`, podem ir para o bundle do navegador; não coloque segredos nelas.

## Regra da branch `main`

A branch `main` deve representar uma versão estável do projeto. Alterações devem entrar por Pull Request depois de passarem pelo CI.
