---
name: project_gafisa_pya_cfc_client_advance_pending_accounts
description: RESOLVIDO — Gafisa PYA Etapa 15 (cfc-client-advance) já tem os internal IDs reais das 2 contas antes-pendentes (1211018888=1063, 1139998888=247).
metadata:
  type: project
---

Atualização (2026-07-14): ao trabalhar na Etapa 16 da mesma pasta, verifiquei
`Constants/accounts.constants.js` e `Docs/MANIFEST.md` — a pendência descrita anteriormente aqui
(contas placeholder `'0'`/`'0'` para Ajuste VP Car LP e Ajuste VP Car CP na Etapa 15,
`cfc-client-advance`) **já foi resolvida** em algum momento fora desta sessão. Os internal IDs reais
estão confirmados e sincronizados nos dois lugares:
- `Constants/accounts.constants.js` → `CFC_CLIENT_ADVANCE_ACCOUNTS = ['3062', '1105', '1104', '1063', '247']`
- `UseCases/StepData/GetCfcClientAdvanceData.js` → `AVP_LP_ACCOUNTS = ['1063']`, `AVP_CP_ACCOUNTS = ['247']`
- `Docs/MANIFEST.md` (tabela de contas) → `1211018888 → 1063`, `1139998888 → 247`

Não há mais colisão de saldo entre `avpLpBal`/`avpCpBal`. Nenhuma ação pendente neste ponto — mantendo
o registro só para histórico, caso surja dúvida sobre por que uma versão antiga do código usava `'0'`.
