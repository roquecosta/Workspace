---
name: project-gafisa-purchase-contract-budget
description: Mudança de regra na trava orçamentária (budget control) do módulo pd_c_purchase_contract (Gafisa) — subsidiária passou a compor o critério de orçamento
metadata:
  type: project
---

Módulo `pd_c_purchase_contract` (Gafisa) é legado: não tinha `Docs/TECH-SPEC.md` nem
`MANIFEST.md` até 2026-07-31. Nesta data foi criado o primeiro `TECH-SPEC.md` do módulo,
em `Gafisa\src\FileCabinet\SuiteScripts\ProjectDome\pd_c_purchase_contract\Docs\TECH-SPEC.md`,
cobrindo **só** a regra de Trava Orçamentária (Budget Control) — não documenta o módulo
inteiro retroativamente.

**Mudança:** a trava orçamentária (User Event `beforeSubmit` →
`pd_cpc_service/pd-cpc-purchase-contract.service.js#budgetControl`) passou a considerar
Subsidiária como parte do critério de casamento do orçamento (antes era só
Departamento+Etapa ou Projeto+Etapa). Critério novo: Subsidiária+Departamento+Etapa ou
Subsidiária+Projeto+Etapa, com igualdade exata de subsidiária (sem herança matriz/filial).

**Causa raiz confirmada lendo o código:** `getBySubsidiaryId()` (orçamento disponível) já
filtrava por subsidiária na query, mas `getProcessingList()` (consumido por outros
contratos) não tinha filtro de subsidiária nenhum — somava consumo de todas as
subsidiárias que caíssem no mesmo depto/etapa ou projeto/etapa, inflando o valor
consumido e causando bloqueio indevido.

**Por quê:** [[feedback-legacy-module-minimal-tech-spec]] documenta a decisão de escopo
mínimo tomada aqui, que deve se repetir em módulos legados similares.

**Como aplicar:** ao continuar este trabalho (ex.: acionar `suitescript-dev` para
implementar), a implementação toca `getBySubsidiaryId`, `getProcessingList`,
`mapSublistByLineAndTransctionId` e `checkBudgetByList`, todos em
`pd_cpc_service/pd-cpc-purchase-contract.service.js` e
`pd_cpc_service/pd-cpc-custom-budget.service.js`. Nenhum objeto novo no MANIFEST —
subsidiária é campo nativo do NetSuite, já presente nos dois lados. Escopo é só
validações novas a partir do deploy; contratos já aprovados não são reprocessados.
