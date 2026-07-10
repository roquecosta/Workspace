---
name: project_gafisa_pya_cfc_client_advance_pending_accounts
description: Gafisa PYA — Etapa 15 (cfc-client-advance) tem 2 de 5 contas com internal ID placeholder '0', pendentes de confirmação no cliente; ao resolver, precisa editar 2 lugares.
metadata:
  type: project
---

No projeto Gafisa `PropertyAllocation` (`Gafisa\src\FileCabinet\SuiteScripts\ProjectDome\PropertyAllocation\`), a Etapa 15 (`cfc-client-advance`, "CFC Adiantamento de Clientes") soma 5 saldos de conta contábil individuais: 2811040100 (3062), 2811050100 (1105), 2811020100 (1104), 1211018888 (**placeholder `'0'`**) e 1139998888 (**placeholder `'0'`**).

**Por que isso importa:** como as duas contas pendentes (Ajuste VP Car LP e Ajuste VP Car CP) usam o mesmo internal ID placeholder `'0'`, as consultas de saldo individuais (`avpLpBal`/`avpCpBal`) retornam hoje o mesmo valor (tipicamente 0, já que não há lançamentos no internal id 0) — uma colisão conhecida e documentada, não um bug. Isso foi implementado em 2026-07-10 em `UseCases/StepData/GetCfcClientAdvanceData.js` (consts locais `AVP_LP_ACCOUNTS`/`AVP_CP_ACCOUNTS`, seguindo o mesmo padrão de contas locais por UseCase já usado em `GetBrokerageSocData.js`).

**Quando o cliente confirmar os internal IDs reais**, será preciso atualizar os DOIS lugares em paralelo (mesmo tipo de sincronização manual documentada em [[project_gafisa_pya_steps_renumber]] para outra pendência do projeto):
1. `Constants/accounts.constants.js` — array `CFC_CLIENT_ADVANCE_ACCOUNTS` (hoje `['3062', '1105', '1104', '0', '0']`).
2. `UseCases/StepData/GetCfcClientAdvanceData.js` — consts locais `AVP_LP_ACCOUNTS` e `AVP_CP_ACCOUNTS`.

O campo agregado (`cfcClientAdvCur`) já soma os 5 saldos individuais corretamente e não precisa de ajuste quando os IDs forem confirmados — só as duas constantes acima.
