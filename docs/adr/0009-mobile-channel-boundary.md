# ADR 0009 - mobile channel boundary

## Status

Aceito

## Data

2026-06-01

## Contexto

O projeto ja possui uma web Next.js funcional com rotas protegidas, admin
familiar, permissoes, dashboard, modulos financeiros e deploy em producao.

Tambem existem documentos de produto que apontam para uma experiencia
mobile-first e para um app nativo futuro:

- `docs/MOBILE_STRATEGY.md`;
- `docs/MOBILE_FIRST_UX.md`;
- `docs/ACCESS_CHANNELS.md`.

Sem uma ADR, agentes podem interpretar esses documentos de duas formas
incompativeis:

- tratar a web atual como a experiencia final de todos os usuarios;
- tratar a existencia dos documentos mobile como evidencia de que o app nativo
  Android/iOS ja existe.

A decisao precisa separar canal atual, canal futuro e responsabilidade de cada
superficie.

## Decisao

A web Next.js atual permanece como canal operacional e painel admin/web.

O app nativo Android/iOS e um canal futuro para uso familiar diario, mas ainda
nao e evidencia de implementacao atual.

Enquanto o app nativo nao existir, a web precisa continuar funcionando bem em
mobile/PWA e nao pode depender de uma implementacao mobile inexistente para
fluxos essenciais.

Quando o app nativo for iniciado, ele deve consumir o mesmo backend Supabase,
respeitar as permissoes server-side existentes e tratar o painel web como
superficie administrativa, nao como modulo duplicado dentro do app.

## Alternativas consideradas

### Web como unica experiencia definitiva

Nao escolhida. A web atual resolve administracao, validacao do MVP e operacao
producao, mas a estrategia de produto continua mobile-first para uso diario.

### App nativo imediato antes de estabilizar web/admin

Nao escolhida. Criar o app antes de consolidar web, permissoes, Supabase,
billing, CI e documentacao aumentaria custo e duplicaria superficie instavel.

### Recriar admin completo dentro do app

Nao escolhida. O app pode ter atalho admin para perfis autorizados, mas a
administracao completa continua no painel web ate haver decisao nova.

## Consequencias

### Positivas

- Evita confundir estrategia mobile com evidencia de app implementado.
- Mantem a web atual como superficie produtiva e validavel.
- Permite projetar UX mobile-first sem abandonar o painel admin.
- Reduz risco de duplicar admin, permissoes e fluxos sensiveis no app nativo.

### Negativas / trade-offs

- O app nativo continua fora do escopo imediato.
- A web precisa manter experiencia mobile/PWA suficiente ate o app existir.
- Futuro mobile exigira decisao propria de arquitetura de repositorio,
  compartilhamento de tipos e build/distribuicao.

### Riscos a monitorar

- Documentos antigos podem voltar a falar de app nativo como se ele ja existisse.
- Mudancas visuais na web podem virar landing page ou SaaS marketing em vez de
  ferramenta operacional.
- Um futuro app pode tentar replicar permissoes client-side sem reaproveitar
  controles server-side.

## Impacto em seguranca e dados

Sem mudanca funcional imediata em seguranca/dados. Esta ADR e documental.

Para implementacao mobile futura:

- RLS continua sendo fronteira obrigatoria no Supabase;
- permissoes continuam resolvidas no backend, nao apenas no menu do app;
- dados financeiros continuam organization-scoped;
- fluxos admin sensiveis nao devem ser duplicados no app sem contrato proprio;
- auditoria, rate limit e retention devem seguir os contratos de GAP-015.

## Relacao com PMBOK

- `docs/pm/04_REQUISITOS.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/06_ACEITE_ROADMAP.md`

## Relacao com docs vivos

- `docs/MOBILE_STRATEGY.md`
- `docs/MOBILE_FIRST_UX.md`
- `docs/ACCESS_CHANNELS.md`
- `docs/DOCUMENTATION_STATUS.md`
- `docs/VALIDACAO_TECNICA.md`

## Relacao com issues/PRs

- PR: documentacao DocDoc de canais mobile/web/admin.

## Criterios de revisao futura

Revisar esta ADR antes de:

- criar app nativo Android/iOS;
- mover o projeto para monorepo `apps/web-admin` e `apps/mobile`;
- introduzir Expo/EAS ou outra stack mobile;
- duplicar qualquer fluxo admin dentro do app;
- mudar a web de painel operacional para outro papel de produto.
