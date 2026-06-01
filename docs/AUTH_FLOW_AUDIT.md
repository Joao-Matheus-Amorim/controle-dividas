# Auditoria do fluxo de autenticacao

> Status DocDoc: Parcialmente superado/historico
> Superado por: codigo atual, CI e `docs/VALIDACAO_TECNICA.md`.
> Uso atual: contexto da auditoria de auth de uma etapa anterior; nao usar como
> estado vivo isolado do fluxo de autenticacao.

## Objetivo

Esta auditoria valida o fluxo de autenticacao ja implementado no projeto vivo.

A regra desta etapa e:

```txt
Nao recriar autenticacao.
Auditar o que ja existe.
Validar o fluxo real.
Registrar lacunas pequenas.
Criar Issues separadas apenas para ajustes reais.
```

## Resumo executivo

O fluxo de autenticacao esta funcional e cobre o essencial para o MVP:

- login;
- cadastro;
- validacao de email autorizado pelo Admin familiar;
- confirmacao de email/token;
- vinculo entre `auth.users` e `profiles`;
- logout;
- recuperacao de senha;
- atualizacao de senha;
- protecao global de rotas privadas;
- redirecionamento de usuario sem sessao para `/auth/login`.

A autenticacao nao precisa ser reconstruida. Ela precisa apenas de auditoria de UX, pequenos ajustes de texto e possivelmente testes adicionais.

## Fluxo oficial de autenticacao

```txt
Admin cria um perfil familiar com email autorizado
  -> usuario acessa /auth/sign-up
  -> usuario informa email e senha
  -> sistema valida se o email existe em profiles
  -> Supabase cria/valida o usuario Auth
  -> usuario confirma o acesso
  -> /auth/confirm valida o token
  -> sistema vincula auth.users ao profile familiar
  -> usuario entra no app
  -> proxy protege rotas privadas
  -> app mostra apenas modulos e dados liberados
```

## Arquivos auditados

| Arquivo | Papel |
| --- | --- |
| `components/login-form.tsx` | Formulario de login |
| `components/sign-up-form.tsx` | Formulario de cadastro |
| `app/auth/sign-up/actions.ts` | Validacao server-side de email autorizado |
| `app/auth/confirm/route.ts` | Confirmacao de token e vinculo com profile familiar |
| `components/auth-button.tsx` | Exibicao de usuario logado/deslogado |
| `components/logout-button.tsx` | Logout e redirecionamento |
| `components/forgot-password-form.tsx` | Recuperacao de senha |
| `components/update-password-form.tsx` | Atualizacao de senha |
| `proxy.ts` | Entrada global da protecao de rotas |
| `lib/supabase/proxy.ts` | Validacao de sessao e redirecionamento |
| `lib/finance/profile-linking.ts` | Vinculo entre Auth user e profile familiar |
| `lib/finance/access-control.ts` | Base de permissoes apos login |

## Estado por area

### Login

Status: **implementado**.

O login usa Supabase Auth com `signInWithPassword`, possui estado de loading, captura erro e redireciona para `/protected` quando entra com sucesso.

Pontos positivos:

- formulario simples;
- email e senha obrigatorios;
- feedback de loading;
- mensagem de erro;
- link para recuperacao de senha;
- link para cadastro;
- visual coerente com o tema mobile-first.

Lacunas reais:

- avaliar se a mensagem tecnica do Supabase deve ser traduzida para linguagem mais simples;
- avaliar teste automatizado especifico para login.

### Cadastro

Status: **implementado**.

O cadastro valida primeiro se o email foi autorizado pelo Admin familiar. Apenas emails cadastrados em `profiles` podem criar acesso.

Pontos positivos:

- senha e repeticao de senha;
- bloqueio quando senhas nao conferem;
- validacao server-side de email autorizado;
- feedback quando email nao foi autorizado;
- feedback quando perfil esta inativo;
- feedback quando email ja possui acesso;
- redirecionamento para sucesso de cadastro;
- email redirect para `/auth/confirm?next=/protected`.

Lacunas reais:

- avaliar regra minima de senha;
- avaliar teste automatizado para email nao autorizado, perfil inativo e email ja vinculado.

### Confirmacao de email/token

Status: **implementado**.

A rota `/auth/confirm` valida `token_hash` e `type`, chama `verifyOtp`, busca claims e tenta vincular o Auth user ao profile familiar.

Pontos positivos:

- usa token hash;
- aceita `next` com fallback para `/protected`;
- vincula Auth user ao profile familiar quando possivel;
- redireciona para erro quando token/type faltam ou falham.

Lacunas reais:

- avaliar mensagem amigavel na tela de erro;
- avaliar teste automatizado do fluxo de confirmacao com mock.

### Logout

Status: **implementado**.

O logout chama `supabase.auth.signOut()` e redireciona para `/auth/login`.

Pontos positivos:

- simples;
- integrado no layout protegido;
- mostra email do usuario logado quando existe claims.

Lacunas reais:

- avaliar feedback quando signOut falhar;
- avaliar se o botao deve dizer `Sair` em vez de `Logout` para padronizar idioma.

### Recuperacao de senha

Status: **implementado, mas com UX a revisar**.

A tela usa `resetPasswordForEmail` e redireciona para `/auth/update-password`.

Pontos positivos:

- fluxo tecnico existe;
- possui loading;
- possui sucesso;
- possui erro.

Lacunas reais:

- textos ainda estao em ingles em partes da interface;
- visual parece mais proximo do template base do que do visual customizado do login/cadastro;
- mensagens de erro podem ser simplificadas para usuario leigo.

### Atualizacao de senha

Status: **implementado, mas com UX a revisar**.

A tela usa `supabase.auth.updateUser({ password })` e redireciona para `/protected`.

Pontos positivos:

- fluxo tecnico existe;
- possui loading;
- possui erro;
- redireciona apos sucesso.

Lacunas reais:

- textos ainda estao em ingles em partes da interface;
- visual parece mais proximo do template base do que do visual customizado do login/cadastro;
- poderia confirmar senha novamente;
- poderia ter regra minima de senha mais clara.

### Protecao global de rotas

Status: **implementado**.

O projeto usa `proxy.ts` chamando `updateSession` em `lib/supabase/proxy.ts`.

Pontos positivos:

- ignora assets publicos;
- ignora rotas de auth;
- cria Supabase server client por request;
- sincroniza cookies;
- usa `supabase.auth.getClaims()`;
- redireciona usuario sem sessao para `/auth/login`.

Lacunas reais:

- avaliar teste automatizado da regra de redirecionamento;
- validar no navegador se todas as rotas privadas exigem sessao.

## Checklist manual recomendado

Antes de fechar completamente esta etapa, validar no navegador:

- [ ] Usuario sem sessao acessando `/protected` vai para `/auth/login`
- [ ] Login valido entra em `/protected`
- [ ] Login invalido mostra erro
- [ ] Cadastro com email nao autorizado mostra erro
- [ ] Cadastro com senhas diferentes mostra erro
- [ ] Cadastro com email autorizado segue para sucesso
- [ ] Confirmacao redireciona para `/protected`
- [ ] Logout envia para `/auth/login`
- [ ] Recuperacao de senha dispara email
- [ ] Atualizacao de senha redireciona para `/protected`

## Lacunas reais identificadas

1. Padronizar idioma e visual das telas de recuperacao e atualizacao de senha.
2. Avaliar mensagens amigaveis para erros de Supabase Auth.
3. Avaliar confirmacao de senha na tela de atualizacao de senha.
4. Criar testes automatizados para pontos criticos de auth quando viavel.

## Recomendacao

A autenticacao deve ser considerada **funcional para o MVP**, com ajustes pequenos de UX/testes em Issues separadas.

Nao ha motivo para reconstruir o fluxo de auth.

## Proximas acoes recomendadas

- Criar uma Issue especifica para padronizar UX das telas de recuperacao/atualizacao de senha.
- Levar testes de auth para a Issue #11, pois ela ja trata expansao de testes criticos.
- Atualizar o README quando os ajustes de UX forem implementados, nao apenas por auditoria.

## Criterio para fechar a Issue #6

A Issue #6 pode ser fechada quando:

- esta auditoria estiver mergeada na `main`;
- a lacuna de UX de senha estiver registrada em Issue propria;
- os testes de auth estiverem encaminhados para #11;
- o time aceitar que auth esta funcional e nao deve ser reconstruido.
