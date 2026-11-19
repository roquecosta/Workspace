---
name: project-grupoff-pd-t4l-estorno-race
description: GrupoFF pd_t4l — race condition entre Log de Estorno (tipo 4) e Log de Pagamento (tipo 3); reverseInstallment nunca foi implementado no UE apesar de descrito no SPEC.md
metadata:
  type: project
---

No projeto GrupoFF `pd_t4l` (Integração Tech4Log), o `Docs/SPEC.md` (v2.3, papel de
TECH-SPEC, gerado por engenharia reversa) descreve nas regras RN05/RN06 do
`pd-t4l-log-entry-handler.ue.js` que o `afterSubmit` processaria **imediatamente**
tipo 2 (`cancelCiot`) e tipo 4 (`reverseInstallment`), desde a v1.1 (08/05/2026).

**Confirmado pelo usuário (Roque) em 2026-08-17: isso nunca foi implementado.** Não é
regressão de código — é funcionalidade descrita no spec e nunca codificada. O código
real do UE só processa imediatamente (síncrono, no `afterSubmit`/CREATE) os tipos 1, 3,
8, 9, 10, 11. O tipo 4 (estorno) depende inteiramente do Orquestrador assíncrono
(`pd-t4l-log-entry.mr.js`, agendado) + `pd-t4l-log-entry-reversed.mr.js`.

**Why:** essa divergência é a causa raiz do bug relatado — pagamento roda síncrono na
hora que o log chega; estorno fica esperando o próximo ciclo do Orquestrador agendado.
Se um novo pagamento chegar nessa janela, ele processa antes do estorno (ordem não
garantida entre MRs de tipos diferentes), e a parcela já está "Pago" → bloqueio
indevido ou (pela regra RN12 de idempotência do `payCiot`) sucesso silencioso sem
atualizar os novos valores do pagamento.

**Achado adicional:** mesmo quando o estorno roda (via `pd-t4l-log-entry-reversed.mr.js`),
ele **nunca** reseta `custrecord_pd_t4l_inst_status` de volta para Em Aberto(1) — só
limpa NC/ND/Invoice/VendorBill (tipo REDE) e seta `custrecord_pd_t4l_inst_reversed = true`.
Não existe, em nenhum lugar do projeto, código que devolva a parcela para Pendente após
estorno. Isso significa que resolver só o timing não bastaria — o reset de status
também precisa ser adicionado.

**How to apply:** ao desenhar a correção (tornar estorno síncrono no `afterSubmit`,
espelhando o padrão de `payCiot`), incluir também o reset de status como parte
explícita da regra de negócio no TECH-SPEC — não assumir que já existe. Ver também
[[feedback-legacy-module-minimal-tech-spec]] — este projeto tem um `SPEC.md` robusto
(não `TECH-SPEC.md`); **resolvido em 2026-11-12 (EC-601, v3.8): o arquivo foi renomeado para
`Docs/TECH-SPEC.md` (pedido do usuário, padrão Dome) e é o TECH-SPEC canônico do pd_t4l** —
novas mudanças entram como nova versão no changelog dele. MANIFEST alinhado com GrupoFF_Prod
(prod = referência final de IDs, por decisão do usuário).
(DEV-858 = só a soma em centavos do payload pd_inp, já em prod/PR #5.) EC-601 consolida
(design; código ainda não implementado em 2026-11-12, card aguardando aprovação do cliente) a NFS-e em 1 linha (só a NFS-e — o que vai para a TS/PlugNotas) e
corrigiu o estorno para não sinalizar cancelamento de NFS-e quando a VendorBill bloqueia.
Pendência separada conhecida: IDs de campos NC/ND no MANIFEST divergem do XML real.
