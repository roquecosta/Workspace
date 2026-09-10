---
name: project-pd-fcf-fill-cnab-fields
description: Projeto pd_fcf_fill_cnab_fields (GrupoFF) — MANIFEST criado do zero a partir do SPEC.md (engenharia reversa); achado importante de que pd-t4l-cnab.js† (planejado no pd_t4l) nunca foi implementado e a feature real nasceu aqui
metadata:
  type: project
---

Projeto **pd_fcf_fill_cnab_fields — Preenchimento Automático de Campos CNAB nas Parcelas**, cliente
**GrupoFF**. MANIFEST criado em modo "derivado de SPEC.md" (SPEC gerado por engenharia reversa do
código, v1.0, 2026-09-10) em
`GrupoFF/src/FileCabinet/SuiteScripts/ProjectDome/pd_fcf_fill_cnab_fields/Docs/MANIFEST.md`. 2 scripts
(UserEvent), 1 custom record referenciado (não criado por este projeto, `customrecord_brl_vendor_payment_prefer`,
3 campos), sem seção de custom records novos, 1 seção "Campos Customizados em Records Nativos" com
4 subseções (`customer`, `vendor`, `invoice`, e duas de "Colunas de Linha (installment)" para
`invoice`/`vendorbill`). Sem `custscript_`/`custsecret_` — seções omitidas.

## Achado importante: `pd-t4l-cnab.js`† do pd_t4l nunca foi implementado — a feature real nasceu neste projeto

Ao conferir `pd_t4l/Docs/MANIFEST.md`, encontrei que os campos `custbody_brl_tran_l_banking_info` e
`custbody_brl_tran_l_payment_method` já estavam catalogados lá (seção "Campos Customizados de
Transação"), atribuídos ao módulo `pd-t4l-cnab.js`† — que segundo `[[project_pd_t4l_grupoff]]`
(marcador `†` = "objeto real, nome definido no SPEC, ainda não implementado") nunca chegou a ser
escrito. Este novo projeto `pd_fcf_fill_cnab_fields` implementa exatamente essa mesma
responsabilidade (preenchimento CNAB da parcela), mas como projeto próprio, com nomes de arquivo
diferentes (`pd-fcf-*` em vez de `pd-t4l-cnab`). Isto é análogo ao achado já registrado em
`[[project_pd_mvd_mirror_vendor]]` (mesma dinâmica: feature planejada/†-marcada num projeto acabou
implementada de fato em outro projeto com nome diferente).

**Divergências adicionais encontradas e sinalizadas no corpo do MANIFEST (não corrigidas em
`pd_t4l`, fora do escopo desta tarefa):**
1. `pd_t4l/Docs/MANIFEST.md` atribui o mesmo Internal ID `custentity_pd_mtodo_de_pagamento` tanto a
   "Informações Bancárias da Subsidiária (CNAB)" quanto a "Método de Pagamento (CNAB)" — erro de
   cópia. O código real (`UseCases/FillCnabFields.js` deste projeto) confirma que "Informações
   Bancárias" é na verdade `custentity_pd_informaes_ban_da_subsidi`, um campo distinto.
2. `pd_t4l/Docs/MANIFEST.md` lista `custbody_brl_tran_l_banking_info` também para `vendorbill`, mas
   o código deste projeto só aplica esse campo em Invoice — Vendor Bill usa
   `custrecord_brl_inst_l_subs_bank_info` (custom record por linha) para o mesmo propósito.
3. `custrecord_brl_inst_l_cent_clear_house` (câmara centralizadora, por linha, Vendor Bill) foi
   encontrado em código (`applyCnabToInstallments`) mas a RN12 do SPEC.md deste projeto não o
   menciona entre os "campos exclusivos de Vendor Bill por linha" — marcado com `⚠` no MANIFEST e
   recomendada atualização da RN12.

**Why:** manifest-builder segue "IDs reais têm prioridade" e "não omitir" — ao ler o código-fonte
para confirmar campos citados no SPEC, descobri objetos reais (ou erros) não capturados pelo texto
do SPEC/de outro manifest. Reportar é obrigatório; corrigir os outros artefatos não é (fora de
escopo sem pedido explícito).

**How to apply:** se o usuário pedir para atualizar `pd_t4l/Docs/MANIFEST.md` ou revisitar este
projeto, mencionar as 3 divergências acima antes de prosseguir.

## Convenções aplicadas (reaproveitadas de outros projetos)

- `*` para os 2 Script IDs inferidos por convenção de nome de arquivo (nenhum XML/SDF existe ainda
  para este projeto — `GrupoFF/src/Objects/pd_fcf*` não existe).
- `**` (símbolo novo, não reaproveitado) para "Record Alvo inferido/não confirmado" do segundo
  script (`pd-fcf-payer-identifier.us.js`) — o próprio SPEC lista isso como Dúvida em Aberto (item 2:
  tipo de record e deployments não identificáveis só pelo código). Distinto de `*` (Script ID
  inferido) porque são fatos ortogonais: aqui o arquivo existe e é real, só o record alvo/deployment
  é que não está confirmado.
- Deployments reais (`customdeploy_pd_fcf_fill_vb_cnab_fie_us`, `customdeploy_pd_fcf_fill_inv_cnab_fie_us`)
  citados no SPEC — como o script tem 2 deployments com Record Alvo diferente, usei "Invoice
  (`invoice`), Vendor Bill (`vendorbill`)" na célula Record Alvo da tabela principal (mesmo padrão de
  `pd_piv_pdf_invoice_vendorbill/DOCS/MANIFEST.md` linha 18, script com 2 records-alvo numa célula
  só) e acrescentei uma mini-tabela "Deployments" logo abaixo da tabela de Scripts para não perder a
  informação real de deployment→record — não é literal do template da skill, mas segue o precedente
  de subtabelas extras já usado em `[[project_pd_t4l_grupoff]]` ("Funções Expostas").
- `UseCases/FillCnabFields.js` (módulo auxiliar, usado por só 1 script) **não** virou seção "Módulos
  Internos Compartilhados" — apliquei a regra já registrada em `[[project_pd_t4l_grupoff]]`: só
  promover módulo interno a seção própria quando usado por múltiplos scripts.
- `customrecord_brl_vendor_payment_prefer` já tinha subseção em
  `pd_piv_pdf_invoice_vendorbill/DOCS/MANIFEST.md` com outro conjunto de campos (bancários,
  `custrecord_brl_venpaytpref_*`). Segui o mesmo padrão dessa referência cruzada: nova subseção
  neste MANIFEST, só com os campos que este projeto usa (`custrecord_pd_*`, identificação fiscal),
  com nota explícita de que é o mesmo registro documentado alhures com campos diferentes — nunca
  omiti o registro nem tentei "linkar" sem listar campos (esse não é o padrão do workspace).
- `custbody_pd_t4l_nature` (campo do `pd_t4l`) listado na subseção `invoice` deste MANIFEST com nota
  "não redefinido aqui, pertence ao pd_t4l" — a own SPEC deste projeto já pede explicitamente
  "referenciar, não redefinir". Diferente do padrão observado em `pd_piv` (que redefine campos
  cross-project em Records Nativos sem nota de proveniência) — aqui usei nota porque o próprio SPEC
  chamou atenção para a distinção, deixando mais rastreável para o leitor.
