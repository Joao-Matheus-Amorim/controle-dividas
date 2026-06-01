# Design - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo dos contratos e direcoes de design.
> Atualizado em: 2026-06-01.

## Como usar

Use este diretorio para orientar tokens, componentes e direcao visual. Estes
documentos nao substituem:

1. `app/globals.css`, que guarda os tokens efetivamente versionados;
2. componentes reais em `components/ui`, `components/app` e `components/dashboard`;
3. ADRs vigentes, especialmente `docs/adr/0003-design-system-and-shadcn-adoption.md`;
4. evidencia de CI, screenshots gated ou validacao visual atual.

## Documentos de design

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `redesign-2026-ink-copper-ivory.md` | Atual como direcao visual em andamento | Fonte da direcao Ink + Copper + Ivory e dos tokens `--ff-*`; a migration plan interna e historica e deve ser conferida contra o codigo atual antes de abrir PR. |
| `VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md` | Parcialmente superado/historico | Baseline anterior ao redesign 2026; ainda e util para limites shadcn/ADR, mas nao para cores, superficies ou estado visual atual. |

## Regra operacional

Design docs orientam o visual, mas nao sao evidencia de implementacao. Antes de
alterar um componente, confirme o estado atual no codigo. Nao remigrar um
componente ja convertido para tokens `--ff-*` apenas porque uma fase antiga do
redesign citou o diretorio inteiro.
