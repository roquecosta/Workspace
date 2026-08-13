---
name: project-pd-inp-plugnotas
description: Projeto pd_inp (GrupoFF) — Integração NetSuite/PlugNotas NFS-e; caminho do MANIFEST, prefixo, e convenções específicas observadas (scripts de manutenção sem lastro no TECH-SPEC, Record Alvo em MapReduce, campos nativos de addon de terceiro)
metadata:
  type: project
---

Projeto **pd_inp** — Integração NetSuite — PlugNotas (NFS-e), cliente **GrupoFF**.

MANIFEST em:
`C:\Users\Roque\Documents\ProjectDome\GrupoFF\src\FileCabinet\SuiteScripts\ProjectDome\pd_inp_integration_netsuite_plugnotas\Docs\MANIFEST.md`

Prefixo de projeto: `pd_inp`. Pasta de MapReduce: `pd_inp_mapreduce`. Pasta de Client Scripts: `pd_inp_client`.

## Scripts de manutenção sem lastro no TECH-SPEC

Em 2026-08-13, o usuário pediu para cadastrar `customscript_pd_inp_clear_taxregime_mr` (MapReduce de
limpeza pontual do campo `custentity_fte_entity_l_taxregime` em Customer) — um script hospedado na
mesma pasta do projeto por conveniência, mas que **não faz parte do fluxo de NFS-e** e não tem
respaldo em nenhuma versão do TECH-SPEC.

**Why:** nem todo script na pasta do projeto nasce de uma regra do TECH-SPEC; scripts de manutenção
pontual (limpeza de dados, one-off) também podem ser cadastrados no MANIFEST a pedido direto do
usuário, mesmo sem entrada correspondente no TECH-SPEC.

**How to apply:** ao cadastrar esse tipo de script, atualizar apenas o campo `Gerado em` do cabeçalho
(data da edição), e **não** bumpar `Versão do Spec` — esse campo deve continuar refletindo a versão
real do TECH-SPEC, que não mudou. Deixar claro no resumo ao usuário que o script foi cadastrado sem
vínculo com o TECH-SPEC.

## Record Alvo em MapReduce (desvio da convenção padrão)

A skill `manifest-standards` diz que a coluna "Record Alvo" da tabela de Scripts só se aplica a
UserEvent e ClientScript (`—` para os demais tipos, incluindo MapReduce). Os MapReduce pré-existentes
neste manifest (`customscript_pd_inp_create_nfse_mr`, `_cancel_nfse_mr`, `_update_nfse_mr`) seguem essa
regra e usam `—`.

Para `customscript_pd_inp_clear_taxregime_mr`, o usuário pediu explicitamente `Record Alvo: customer`
(informação útil porque o script não segue o fluxo usual do projeto). Atendi ao pedido explícito e
preenchi `customer`, deixando uma nota transparente ao usuário sobre a inconsistência com as demais
linhas de MapReduce da mesma tabela.

**Why:** instrução explícita do usuário sobre um objeto específico tem prioridade sobre a convenção
geral da skill, mas a divergência de formato deve ser sinalizada, não silenciada.

**How to apply:** se novos MapReduce forem cadastrados neste projeto sem instrução explícita em
contrário, usar `—` (convenção padrão da skill) para manter consistência com as linhas antigas.

## Campos nativos de addons de terceiro (FTE, BRL)

Este manifest já documentava campos nativos de terceiros na seção "Campos Customizados em Records
Nativos" com a nota "Campo do módulo BRL" (ex.: `custbody_brl_tran_l_def_edoc_category`,
`custentity_brl_entity_t_municip_tx_reg`). Segui o mesmo padrão para o campo `custentity_fte_entity_l_taxregime`
(módulo FTE, não BRL) em `customer`, adicionando a frase "não gerenciado via SDF" — que ainda não
aparecia nas entradas BRL anteriores, mas é relevante aqui porque o script deste projeto efetivamente
grava (limpa) o campo, não apenas o lê.

**Why:** distinguir claramente que o objeto é de terceiro (não gerenciado via SDF por este projeto),
mesmo quando um script do projeto o manipula.

**How to apply:** ao documentar campos nativos/bundled de terceiro que um script do projeto
manipula (não apenas lê), preferir incluir a nota "não gerenciado via SDF" para deixar explícito que
não deve ser materializado pelo `sdf-generator`.
