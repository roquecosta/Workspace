---
name: netsuite-tools-lib-path-convention
description: Como resolver o caminho relativo de import de pd_c_netsuite_tools quando a lib não está fisicamente no checkout git do cliente
metadata:
  type: feedback
---

Quando `pd_c_netsuite_tools` (record_util/search_util/common.util) não existe fisicamente no
checkout git do projeto do cliente (comum — às vezes a lib já está deployada direto na conta
NetSuite, fora do controle de versão deste repo específico), **não pare para copiar/versionar a
lib**. Calcule o caminho relativo assumindo que ela é **filha do namespace do projeto**
(`project_dome/pd_c_netsuite_tools/` ou `projectdome/pd_c_netsuite_tools/`, dependendo de qual
namespace o projeto usa), nunca irmã de `SuiteScripts/` nem acima dele.

**Why:** confirmado por evidência de profundidade de caminho em dois lugares independentes:
(1) ~32 scripts legados em `Aloia/.../projectdome/<projeto>/<subpasta>/arquivo.js` que importam
`../../pd_c_netsuite_tools/...` — a aritmética de `../../` a partir de um arquivo 2 níveis abaixo de
`projectdome/` aterrissa exatamente em `projectdome/pd_c_netsuite_tools/`, não acima de
`SuiteScripts/`; (2) `StoccheForbes/.../project_dome/pd_c_netsuite_tools/` existe fisicamente como
filha do namespace `project_dome`, confirmando o mesmo padrão onde a lib realmente está presente no
repo. Ou seja, a convenção do workspace é: a lib sempre vive dentro do namespace
(`project_dome/` ou `projectdome/`), nunca num nível acima compartilhado entre namespaces.

**How to apply:** ao criar Models seguindo a skill `usecase-architecture` num projeto estruturado
como `<namespace>/<nome_projeto>/<Camada>/arquivo.js` (EntryPoints/UseCases/Models/Constants todos
um nível abaixo da pasta do projeto, que por sua vez é um nível abaixo do namespace), o caminho
relativo até a lib é `../../pd_c_netsuite_tools/pd_cnt_standard/...` — exatamente o caminho já usado
no template da skill. Não é necessário confirmar a existência física da pasta no git para usar esse
caminho; ela pode estar deployada direto na conta. Se o usuário confirmar que a lib está deployada
fora do git (não precisa copiar), siga com esse caminho relativo sem hesitar.

Ver também [[project_aloia_irl_rma_inbound_shipment]] (caso onde isso foi aplicado pela primeira
vez, cliente Aloia).
