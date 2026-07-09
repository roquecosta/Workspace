---
name: project_gafisa_pya_steps_renumber
description: Gafisa Property Allocation (PYA) — remoção das etapas mandate-exchange/mandate-property e renumeração em cascata 14-19→12-17 (2026-07-08)
metadata:
  type: project
---

No projeto Gafisa `PropertyAllocation` (`Gafisa\src\FileCabinet\SuiteScripts\ProjectDome\PropertyAllocation\`), as etapas antigas 12 (`mandate-exchange`) e 13 (`mandate-property`) foram removidas do TECH-SPEC/MANIFEST e do código em 2026-07-08. Motivo de negócio: a parametrização de subsidiária no projeto já supre o que `mandate-exchange` fazia (a etapa `exchange-poc`, renumerada de 14→12, calcula direto do saldo contábil sem depender de um "mandato" separado); `mandate-property` era redundante com a etapa 7 (`rec-cost-soc-sale`). As etapas 14–19 foram renumeradas em cascata para 12–17 (só o número de exibição mudou; os stepId em string permanecem: `exchange-poc`, `brokerage-soc`, `brokerage-fisc`, `neutral-soc`, `neutral-tax-prop`, `neutral-tax-res`).

**Por que isso importa (achado durante a implementação):** o processo mantém DUAS numerações que precisam ficar sincronizadas manualmente:
1. `Constants/steps.constants.js` — objeto `STEPS[stepId].value`, usado como `stepValue` do Journal Entry (campo customlist `customlist_pd_pya_prop_aloc_steps`).
2. O array local `STEPS_ORDER` duplicado em **três** EntryPoints (`PYA_PropertyAllocationManager.RL.js`, `.MR.js`, `.Delete.MR.js`) — a posição no array (+1) é usada para `lastFinishedStep` e para buscar JEs por etapa.

Essas duas numerações coincidiam antes da remoção porque não havia "buracos" (steps sem JE, como `poc`/`sale`/`receipt`/`total-cost`/`brokerage-fisc`, ficam de fora do STEPS constant mas mantêm a posição correta no array). Ao remover/renumerar etapas, os TRÊS `STEPS_ORDER` e o `steps.constants.js` precisam ser editados juntos, senão o `stepValue` gravado no JE diverge da posição usada para reler/apagar.

**Pendência sinalizada ao usuário (não resolvida por mim):** qualquer `customrecord_pd_pya_property_allocation` já em andamento (com `custrecord_pd_pya_last_finished_step` apontando para uma etapa antiga ≥12) terá sua posição reinterpretada errado após o deploy desta mudança, pois a numeração por posição mudou. Verificar/finalizar alocações em andamento antes de deployar, ou escrever um fix de dados.

**Convenção pré-existente e não tocada:** os métodos `updateStepN/clearStepN` dentro de `Models/Exchanges.model.js`, `Brokerages.model.js`, `Neutralizations.model.js` usam um número de sufixo que é sempre `STEPS.value + 1` (ex.: `updateStep15` para `exchange-poc`, que hoje vale 12). Essa é uma inconsistência cosmética antiga, não criada por esta mudança — não renomeei esses métodos (só removi os de mandate-exchange/property) porque não foi pedido e o rename tocaria vários call sites sem ganho funcional. Ver [[user_profile]] para preferências gerais do usuário.

Ver também `Docs/prototipo/app.js` (mockup estático de UI) — tem um esquema de stepId totalmente diferente (`mandato-terreno`, `permuta-poc`, etc.) e não foi tocado por ser apenas protótipo de design, não código em produção.
