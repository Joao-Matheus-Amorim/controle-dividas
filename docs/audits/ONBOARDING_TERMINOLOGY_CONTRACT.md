# Onboarding Terminology Contract

> Status DocDoc: Atual
> Uso atual: contrato vigente do GAP-016 para copy e UX do onboarding antes de
> qualquer mudanca de UI/runtime.

Atualizado em: 2026-06-08

## Objetivo

Definir a linguagem de produto para o primeiro onboarding financeiro sem mudar
runtime, rota, schema, RLS, billing, permissoes ou dependencias.

Este contrato existe porque o fluxo atual expoe termos tecnicos como
`organizacao`, `owner` e `slug` para usuarios pessoais/familiares. Esses termos
continuam validos como modelo tecnico multi-tenant, mas nao devem ser a primeira
camada de linguagem de produto quando o usuario esta criando o primeiro espaco.

## Escopo deste PR

- Documenta o GAP-016.
- Define o mapa de termos para futuras mudancas de copy.
- Inventaria a copy atual do onboarding.
- Mantem `/onboarding/organizacao` como rota vigente.

Este PR nao altera runtime.
Este PR nao altera UI.
Este PR nao altera rota.
Este PR nao altera schema.
Este PR nao altera RLS.
Este PR nao altera billing.
Este PR nao adiciona dependencia.
Este PR nao muda /onboarding/organizacao.

## Superficie atual inventariada

Arquivos de runtime que continuam inalterados neste contrato:

- `app/onboarding/organizacao/page.tsx`
- `app/onboarding/organizacao/actions.ts`
- `components/onboarding/organization-onboarding-form.tsx`

Termos atuais que explicam o gap:

- `Crie sua organizacao financeira`
- `sua organizacao financeira inicial`
- `owner`
- `nome da organizacao`
- `slug`
- `familia-amorim`

## Linguagem de produto

Use `espaco financeiro` como termo primario para o usuario final no primeiro
onboarding.

Use `organizacao` apenas quando o contexto for tecnico, administrativo, legal,
fiscal, billing, tenant boundary, auditoria, suporte ou documentacao interna.

Use `responsavel principal` para representar o papel que hoje aparece como
`owner` em copy de usuario final. O papel tecnico `owner` continua existindo no
modelo de permissoes.

Use `identificador do link` para explicar `slug` quando esse campo precisar
continuar exposto. Se a UI puder gerar o identificador automaticamente, a copy
deve priorizar o nome do espaco e tornar o identificador secundario.

## Mapa de termos

| Termo atual | Termo recomendado para usuario final | Observacao |
| --- | --- | --- |
| organizacao financeira | espaco financeiro | Usar no titulo e no texto do primeiro onboarding. |
| organizacao | espaco financeiro | Manter `organizacao` em codigo, rota, banco e docs tecnicas. |
| owner | responsavel principal | Nao muda role, membership ou permissao. |
| slug | identificador do link | Explicar apenas quando o campo estiver visivel. |
| Nome da organizacao | Nome do espaco financeiro | Label de formulario futura. |

## Regras de adocao futura

1. Fazer a primeira troca de copy em PR pequeno e dedicado.
2. Nao misturar copy com route rename, billing, RLS, schema ou permissao.
3. Manter `/onboarding/organizacao` ate existir ADR ou decisao de rota.
4. Atualizar este contrato no mesmo PR que mudar a copy.
5. Preservar mensagens de erro objetivas, curtas e sem jargao tecnico isolado.
6. Garantir leitura mobile-first: labels curtos, helper text direto e sem blocos
   longos dentro do formulario.

## Bloqueios explicitos

- Nao renomear tabela, coluna, enum, role ou helper tecnico por causa deste
  contrato.
- Nao substituir `organization` no codigo sem decisao arquitetural separada.
- Nao remover `owner` do modelo de permissao neste bloco.
- Nao renomear `/onboarding/organizacao` neste bloco.
- Nao declarar GAP-016 runtime como implementado ate existir PR de copy.

## Criterios de aceite para runtime futuro

- O primeiro titulo deve falar em `espaco financeiro`, nao em `organizacao`.
- O texto deve explicar que o espaco agrupa pessoas, contas, gastos, bancos,
  permissoes e relatorios.
- A indicacao de papel deve falar em `responsavel principal`.
- Se `slug` continuar visivel, a UI deve explicar como `identificador do link`.
- O PR deve atualizar `docs/SAAS_GAP_REGISTER.md`,
  `docs/SAAS_OPERATIONAL_ROADMAP.md`, este contrato e o guard relacionado.
