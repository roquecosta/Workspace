---
name: project_gafisa_pya_neutral_tax_prop_etapa16
description: Gafisa PYA Etapa 16 (neutral-tax-prop) — remoção do sub-cálculo de Neutralização de Custo Imobiliário Fiscal e mudança do JE para partida dobrada (2026-07-15)
metadata:
  type: project
---

No projeto Gafisa `PropertyAllocation`, a Etapa 16 (`neutral-tax-prop`, "Neutralização Fiscal") teve
duas mudanças de comportamento aplicadas em 2026-07-15, refletidas no código a partir de TECH-SPEC/MANIFEST
já atualizados:

1. **Sub-cálculo "Neutralização Custo Imobiliário Fiscal" removido por completo** (coletava saldo da conta
   2812040100 e usava a conta 2812050100 na contabilização). A etapa ficou só com 3 sub-cálculos:
   Neutralização Receita Fiscal, Gastos Incorporação, Corretagem. Campos removidos do
   `customrecord_pd_pya_neutralizations` / `Models/Neutralizations.model.js`: os 6 `neut19Cost*`
   (prev/cur/var normal + bal). A conta 2812050100 (internal ID 3061) continua existindo no MANIFEST e em
   `accounts.constants.js` porque é usada por outro agrupamento (`NEUT_SOC_REF_ACCOUNTS`, Etapa 18
   `neutral-soc`) — não removi essa constante, só o uso específico da Etapa 16.

2. **Contabilização da Etapa 16 mudou de lançamento de uma perna só (DR se var>0 / CR se var<0 na MESMA
   conta) para partida dobrada completa** (2 linhas por sub-cálculo, contas trocam de lado conforme o
   sinal): ver `UseCases/ProcessStep/ProcessNeutralTaxProp.js`, função `addDoubleEntryLines(varAmount,
   creditAccount, debitAccount, jobId, lines)` — variação positiva credita `creditAccount`/debita
   `debitAccount`; negativa inverte. `MAX_PROJECTS_PER_ENTRY` mudou de `floor(MAX_LINES/4)` para
   `floor(MAX_LINES/6)` (3 sub-cálculos × 2 linhas em vez de 4 sub-cálculos × 1 linha).

**Contas reaproveitadas entre Etapa 16 e Etapa 17 (confirmado explicitamente pelo usuário como intencional):**
3111190100 (634), 4111310100 (3511) e 4221400200 (631) agora aparecem tanto em
`NEUTRAL_TAX_PROP_ACCOUNTS` (Etapa 16, JE em partida dobrada) quanto em `NEUTRAL_TAX_RES_ACCOUNTS`
(Etapa 17, JE de perna única — `ProcessNeutralTaxRes.js`, **não tocado** nesta mudança). São objetos de
constantes separados por convenção do projeto (um por etapa), mesmo reusando os mesmos internal IDs —
não consolidar em uma constante compartilhada sem que o usuário peça.

Ver também [[project_gafisa_pya_steps_renumber]] para a convenção de numeração de etapas (`updateStepN`/
`clearStepN` no Model usa sufixo 19 para `neutral-tax-prop`, herdado de numeração antiga congelada).
