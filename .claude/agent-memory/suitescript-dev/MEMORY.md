# Memory Index

- [Gafisa PYA — remoção/renumeração de etapas](project_gafisa_pya_steps_renumber.md) — remoção de mandate-exchange/mandate-property e renumeração 14-19→12-17; 4 lugares com numeração manual (steps.constants.js, 3x STEPS_ORDER, STEP_HELP) precisam ficar sincronizados.
- [Gafisa PYA — contas cfc-client-advance](project_gafisa_pya_cfc_client_advance_pending_accounts.md) — RESOLVIDO: avpLpBal/avpCpBal (Etapa 15) já têm internal IDs reais (1063/247), não mais placeholder '0'.
- [Gafisa PYA — Etapa 16 neutral-tax-prop](project_gafisa_pya_neutral_tax_prop_etapa16.md) — sub-cálculo de custo removido, JE agora em partida dobrada; contas 634/3511/631 reusadas com a Etapa 17 (intencional).
- [Gafisa PYA — fix foco última etapa](project_gafisa_pya_last_step_focus_fix.md) — activeStep() e buildSidebarSections() não dependem mais só de status 'active'; cobre caso "todas as etapas done".
- [Pipefy — sem lib compartilhada](project_pipefy_accountclassvalidation_no_shared_lib.md) — pd-c-netsuite-tools declarado no .gitmodules mas nunca instanciado; scripts usam N/record, N/search, N/currentRecord nativos, sem record_util/search_util.
