# Memory Index

- [Gafisa PYA — remoção/renumeração de etapas](project_gafisa_pya_steps_renumber.md) — remoção de mandate-exchange/mandate-property e renumeração 14-19→12-17; duas numerações (steps.constants.js + STEPS_ORDER duplicado em 3 EntryPoints) precisam ficar sincronizadas.
- [Gafisa PYA — contas pendentes cfc-client-advance](project_gafisa_pya_cfc_client_advance_pending_accounts.md) — avpLpBal/avpCpBal (Etapa 15) usam placeholder '0' colidido; ao confirmar IDs reais, editar accounts.constants.js + GetCfcClientAdvanceData.js.
