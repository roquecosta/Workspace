---
name: project-gafisa-pya-last-step-focus-fix
description: Gafisa PYA — fix de modo livre para o Suitelet abrir na última etapa (não na primeira) quando todas as etapas estão concluídas.
metadata:
  type: project
---

Bug corrigido (2026-07-21, modo livre, sem alterar TECH-SPEC/MANIFEST): em
`Gafisa/src/FileCabinet/SuiteScripts/ProjectDome/PropertyAllocation/Screens/PYA_PropertyAllocation.ui.js`,
quando todas as 18 etapas estão `'done'` (apropriação aguardando confirmação de finalização — Etapa 18),
nenhuma etapa tem status `'active'`. O Suitelet caía no fallback `STEPS[0]`, abrindo a Etapa 1.

**Correção aplicada:**
- `activeStep()`: fallback trocado de `STEPS[0]` para `STEPS[STEPS.length - 1]`.
- `buildSidebarSections(steps, currentStepId)`: ganhou um segundo parâmetro `currentStepId`. O item do
  sidebar destacado (`active:`) agora é `step.id === currentStepId` quando esse argumento é passado, em
  vez de depender só de `step.status === 'active'` — senão o sidebar ficava sem nenhum item destacado
  no mesmo cenário (todas as etapas 'done').
- `initDashboard()` passa `currentStep.id` (já resolvido por `activeStep()`) para `buildSidebarSections`.

**Why:** o status `'done'`/`'active'`/`'pending'` de cada etapa (usado para ícones e regras de
toolbar) é uma coisa; "qual etapa está em foco na tela" é outra. Antes do fix os dois estavam
acoplados via `status === 'active'`, o que quebra no caso de todas as etapas concluídas (não há
"active" nesse estado). O fix separa os dois conceitos sem alterar o significado de status.

**How to apply:** se no futuro surgir mais um lugar que decide "qual etapa mostrar"/"qual etapa
destacar" a partir de `step.status === 'active'`, prefira usar o resultado de `activeStep()` (ou o
`currentStepId` propagado a partir dele) em vez de checar `status` diretamente — `status` não cobre o
estado "tudo concluído".

Avisado ao usuário: essa mudança altera comportamento observável do Suitelet (tela de foco quando tudo
concluído) — vale considerar documentar essa regra no TECH-SPEC se fizer sentido para o projeto.
