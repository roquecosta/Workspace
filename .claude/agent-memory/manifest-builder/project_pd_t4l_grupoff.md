---
name: project-pd-t4l-grupoff
description: Projeto pd_t4l (Tech4Log/TMS) da GrupoFF — convenções de scriptid, customlists inline, prefixos de campo por record
metadata:
  type: project
---

MANIFEST em `GrupoFF/src/FileCabinet/SuiteScripts/ProjectDome/pd_t4l/Docs/MANIFEST.md`, SPEC.md na mesma pasta (v2.6 em 20/08/2026).

**Convenção real de scriptid para MapReduce difere do texto do MANIFEST:** a tabela de Scripts do MANIFEST lista IDs sem sufixo (ex.: `customscript_pd_t4l_clear_logs`), mas o XML real em `GrupoFF/src/Objects/pd_t4l/Scripts/customscript_pd_t4l_clear_logs_mr.xml` tem `scriptid="customscript_pd_t4l_clear_logs_mr"` (com sufixo `_mr`). Todos os demais MRs do projeto (`create_rev_inst_mr`, `create_nfse_nd_mr`, `create_debit_note_mr`, `log_entry_mr` etc.) também terminam em `_mr` no XML real.
**Why:** o MANIFEST aparentemente foi escrito sem o sufixo por simplificação/erro histórico; ao cunhar um scriptid novo para um MR deste projeto, o XML (fonte real) é o critério, não o texto atual do MANIFEST.
**How to apply:** ao adicionar novo script MapReduce a este projeto, sempre confirmar o padrão real no XML em `src/Objects/pd_t4l/Scripts/`, não apenas no MANIFEST.md. Ex.: para o log de saída (v2.6), usei `customscript_pd_t4l_clear_logs_saida_mr` (com `_mr`) em vez do `customscript_pd_t4l_clear_logs_saida` que havia sido sugerido sem confirmar o XML. Vale a pena sinalizar essa divergência ao coordenador quando notada, mas não corrigir a linha antiga sem pedido explícito.

**Customlists não têm seção própria neste MANIFEST — valores documentados inline.** O projeto tem pelo menos duas customlists reais (`customlist_pd_t4l_type_entry`, usada no campo `custrecord_pd_type_entry`; e `customlist_pd_t4l_type_saida`, criada na v2.6 para `custrecord_pd_t4l_saida_operation`), mas nenhuma aparece numa seção "## Listas Customizadas" — os valores são descritos apenas no parágrafo intro do record (padrão "Status: Valor(1), Valor(2)...") e no campo "(1–N)" da tabela, igual ao já usado para status de CIOT/Parcela.
**Why:** convenção já estabelecida desde a v1.0 deste manifest específico (confirmado também no `references/example_manifest.md` da skill manifest-standards, que reflete este mesmo projeto).
**How to apply:** ao cadastrar um campo List/Record apoiado em customlist neste projeto, não criar seção "Listas Customizadas" — documentar os valores no texto do record e do campo, como já é feito.

**Prefixo de campo por record:** cada custom record do projeto usa um prefixo específico nos internal IDs dos seus campos, exceto `customrecord_pd_t4l_log_entry` (usa `custrecord_pd_` genérico, sem `t4l`, provavelmente herdado de um padrão anterior). Records mais recentes seguem `custrecord_pd_t4l_<abrev_record>_<campo>` (ex.: `_ciot_`, `_inst_`, `_veh_`, `_nc_`, `_nd_`). Para o novo `customrecord_pd_t4l_log_saida` (v2.6) usei o prefixo `custrecord_pd_t4l_saida_`, seguindo o padrão mais recente (não o genérico do log_entry).
**How to apply:** ao adicionar campos a records novos deste projeto, seguir o prefixo `custrecord_pd_t4l_<abrev>_`, não replicar o padrão genérico legado do log_entry.
