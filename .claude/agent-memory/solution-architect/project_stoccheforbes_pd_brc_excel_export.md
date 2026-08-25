---
name: project-stoccheforbes-pd-brc-excel-export
description: pd_brc_billing_rate_card_report (StoccheForbes) ganhou novo título e botão de exportação Excel; TECH-SPEC e MANIFEST atualizados em 2026-08-25
metadata:
  type: project
---

O relatório `pd_brc_billing_rate_card_report` (cliente StoccheForbes) teve duas mudanças de design
confirmadas pelo usuário em 2026-08-25:

1. Título da tela renomeado de "SF - Relatório de Cartões de Taxa de Cobrança" para
   "SF - Tabela de Faturamento por Data de Criação" (mantém o prefixo `"SF - "`, padrão de todos os
   relatórios do cliente). Aplicado em 3 lugares no código: `title` do `suitelet_util.build()`, `<h5>`
   do topo da tela, `card-header` da seção de resultados.
2. Adicionado botão "Download Excel" na tela, revertendo a decisão anterior registrada no TECH-SPEC
   ("sem exportação Excel/CSV, confirmado com o usuário"). A exportação usa client-side, sem round-trip
   ao RESTlet — exporta as linhas já carregadas/filtradas na tabela.

**Why:** o cliente StoccheForbes tem um padrão de exportação Excel consolidado e reaproveitado por
múltiplos relatórios (não é decisão isolada de um projeto): lib compartilhada
`pd-cntst-export.util.js` em `pd_c_netsuite_tools/pd_cnt_static/pd_cntst_js/`, expõe
`generateExcelDownload({ fileName, columns, rows })` (gera `.xls` SpreadsheetML via `<a download>`).
O precedente mais claro do padrão é `pd_aging_report` (`pd_ar_suitelet/pd-ar-aging-report.suitelet.js`
+ `pd_ar_static/pd_ar_static_js/pd-ar-report-aging.js`, função `downloadExcel()`): botão no
`card-header` (`float-right`, ícone `fa-file-excel`, texto "Download Excel"), nome do arquivo
`"<Título do relatório>.xls"`, colunas/linhas derivadas da própria definição de colunas da tabela e das
linhas atualmente carregadas via `$('#tabela').lines()`. Outros relatórios do cliente que também
referenciam essa lib: `pd_ar_accounts_receivable`, `pd_receivement_report`, `pd_c_customer_expense_report`.

**How to apply:** ao desenhar/exportar Excel em qualquer novo relatório StoccheForbes, procurar
primeiro esse padrão (`pd-cntst-export.util.js` + `downloadExcel()` no JS da tela + botão no
card-header) em vez de propor mecanismo novo. Ao referenciar essa lib num MANIFEST de projeto, seguir
o mesmo formato usado para `pd-cnts-suitelet.util.js` (seção "Bibliotecas Compartilhadas — Referência
Externa"), já que é lib compartilhada entre múltiplos projetos, sem MANIFEST próprio no workspace.

Arquivos editados nesta sessão (via Edit pontual, após confirmação do usuário):
- `StoccheForbes/src/FileCabinet/SuiteScripts/project_dome/pd_brc_billing_rate_card_report/Docs/TECH-SPEC.md`
- `StoccheForbes/src/FileCabinet/SuiteScripts/project_dome/pd_brc_billing_rate_card_report/Docs/MANIFEST.md`
  (via subagente manifest-builder — adicionou `pd-cntst-export.util.js` como lib de referência)

Pendente: refletir as duas mudanças no código real (`pd-brc-billing-rate-card-report.suitelet.js`,
`pd-brc-report.html`, `pd-brc-report.js`) — trabalho do `suitescript-dev` na etapa de Implementação,
ainda não executado nesta sessão.
