---
name: ns-router-deep-linking
description: ns-router.js (Framework) e integração de deep-linking via URL no Painel ProjectPriceComposition (Drivetech)
metadata:
  type: project
---

Criado `Framework/ui/components/ns-router.js` (classe global `NsRouter`, mesmo
estilo de `NsHttp`/`NsModal` — sem dependência de build, carregado via
`<script>`): `push(state)`/`replace(state)` fazem MERGE com a querystring atual
(preservam `script`/`deploy`/`compid` automaticamente — nunca os removem);
`getState()` lê `location.search` como objeto plano; `onPopState(cb)` expõe
reação a voltar/avançar (retorna unsubscribe), mas **não é usado** no Painel
(só restauração no boot, não em tempo real — decisão da integração, não do
componente). Registrado em `Framework/ui/NsSuitelet.js`
(`COMPONENT_FILE_MAP['router'] = 'ns-router.js'`), componente opcional (não
está em `CORE_COMPONENTS`).

Integrado em `Drivetech/.../ProjectPriceComposition/Screens/Painel/` —
`PPC_Painel.ST.js` (`components: [..., 'router']`) e `PPC_Painel.js`:
- `openPanel`/`handleClickNew`/`handleClickView`/`showLanding` fazem
  `_router.push(...)` (nova entrada no histórico — transições de tela).
- `navigateToLayer` faz `_router.replace({ layer })` (troca de aba, sem
  poluir o histórico) — só mescla a chave `layer`, confiando que
  `view`/`proposalId` já foram escritos por `openPanel` antes.
- `initPanel()` lê `_router.getState()` ANTES de decidir a tela: se
  `view==='panel'` + `proposalId` + `layer` válido (ver
  `isValidLayerKey`/`getValidLayerKeys`, derivado de `LAYER_NAV_SECTIONS` do
  config), chama `restoreProposalFromDeepLink` — senão cai no landing puro
  (`showLanding(false)`, replaceState pra não empilhar histórico espúrio no
  boot). Prioridade: `cadastroProjeto` (atalho Oportunidade) > deep-link da
  URL > landing.
- `restoreProposalFromDeepLink(proposalId, layerKey)` resolve
  `_proposal.projectId` SEM Restlet/UseCase novo: reaproveita o GET
  `layer:'CCPV'` já existente (`UseCases/GetLayerData.js::resolveHeader` →
  `Models/Proposta.model.js::load`), que já devolve `cadastroProjeto`/`status`
  junto com o header. Em caso de erro (proposalId inválido/excluído), cai em
  `showLanding(false)`.

**Why:** decisão já fechada no TECH-SPEC do projeto (seção "Decisões de
Arquitetura" — "Navegação com deep-linking via URL"), pra sobreviver a F5
dentro do painel sem perder a Proposta/camada aberta.

**How to apply:** qualquer outra tela com navegação em abas (ex.:
ProjectIncomeStatement/Screens/Dashboard) pode reusar `ns-router.js` do
mesmo jeito — é genérico, sem acoplamento ao domínio do CPV. Ver também
[[project_proposta_first_save_wiring]] (contexto de como `_proposal.id` é
resolvido em outros fluxos do mesmo Painel).

Nota de infra: `Drivetech/` é um repositório git PRÓPRIO, aninhado dentro do
workspace `ProjectDome` (tem `.git` próprio) — `git status`/`diff` desse
projeto precisam rodar com cwd dentro de `Drivetech/`, não no root do
workspace (o `.gitignore` do root ignora tudo exceto `.claude/`, então
mudanças em `Framework/` e `Drivetech/` só aparecem no `git status` do
repositório correto).
