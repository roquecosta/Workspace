---
name: project-gafisa-purchase-contract-audit-remaining-balance
description: Nova regra na ferramenta de Auditoria de Saldo Remanescente do módulo pd_c_purchase_contract (Gafisa) — POST de correção passa a zerar custcol_pd_remaining_balance para contratos Aditados
metadata:
  type: project
---

Módulo `pd_c_purchase_contract` (Gafisa), ferramenta de auditoria (`CPC_ContractAudit.RL` →
`RunContractAudit`/`FixContractAuditQuantities`/`PurchaseContractAudit.model`) não tinha
nenhuma seção no `Docs/TECH-SPEC.md` até 2026-09-09 — só existia como comentário no próprio
código ("regra ainda não incorporada ao tech-spec"). Nesta data foi adicionada a **seção 2**
do TECH-SPEC, cobrindo só esta regra pontual (mesmo padrão de escopo mínimo de
[[feedback-legacy-module-minimal-tech-spec]] e [[project-gafisa-purchase-contract-budget]]).

**Mudança:** o POST de correção em lote (`FixContractAuditQuantities.execute` →
`PurchaseContractAuditModel.applyExpectedQuantities`) passa a zerar também
`custcol_pd_remaining_balance` (linha de item), além de corrigir `quantity` como já fazia.

**Escopo confirmado com o usuário:**
- Só para contratos com `transtatus` = Aditado (`'E'`). Anulado/Estornado (`'D'`) fica de
  fora — continua só corrigindo quantidade.
- Vale para **todas** as linhas que entram no lote de correção daquele contrato (todas as
  divergentes do reaudit, por quantidade OU por saldo) — não só as linhas com
  `remainingDivergent = true`. Zerar é seguro pois o esperado já é sempre 0.
- Campo `custcol_pd_remaining_balance` já existe e já é usado na leitura da auditoria —
  não é objeto novo, não precisou do `manifest-builder`. Módulo continua sem MANIFEST.md.

**Decisão que esta regra substitui:** revoga uma decisão anterior registrada só em comentário
de código (`FixContractAuditQuantities.js`), que dizia "saldo remanescente não é tocado aqui
(regra confirmada pelo usuário)". Ou seja, já houve uma reversão de decisão sobre este mesmo
campo — se aparecer de novo, checar o TECH-SPEC (fonte atual) em vez do comentário do código
(desatualizado após esta mudança).

**Como aplicar:** ao acionar `suitescript-dev` para implementar, tocar
`Models/PurchaseContractAudit.model.js#applyExpectedQuantities` (setar
`custcol_pd_remaining_balance = 0` por linha, condicionado ao status do contrato ser 'E') e
atualizar o comentário de cabeçalho de `UseCases/FixContractAuditQuantities.js` que hoje
afirma o contrário do que passou a ser verdade.
