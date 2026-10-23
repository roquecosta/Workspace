---
name: project-aloia-irl-rma-inbound-shipment
description: Estado do projeto pd_irl_rma_inbound_shipment (cliente Aloia) — EP1 implementado, EP2/EP3 pendentes
metadata:
  type: project
---

Projeto `pd_irl_rma_inbound_shipment` (cliente Aloia). TECH-SPEC e MANIFEST em
`Aloia/src/FileCabinet/SuiteScripts/project_dome/pd_irl_rma_inbound_shipment/DOCS/`. Implementação
segue a skill `usecase-architecture` (EntryPoint/UseCase/Model/Constants).

**Prefixo do projeto assumido como `IRL`** (derivado do nome da pasta `pd_irl_...` e do padrão de
outros projetos Dome onde o código de 3 letras no meio do nome da pasta é o prefixo de script, ex:
`pd_pos_...` → `POS`, `pd_ccr_...` → `CCR`). Não está escrito explicitamente no MANIFEST/TECH-SPEC —
se o usuário indicar um prefixo oficial diferente, renomear o EntryPoint já criado
(`EntryPoints/IRL_RmaInboundShipments.UE.js`).

**EP1 implementado** (UserEvent beforeLoad em `returnauthorization`, subaba "Inbound Shipments
Vinculados"):
- `EntryPoints/IRL_RmaInboundShipments.UE.js`
- `UseCases/ListLinkedInboundShipments.js`
- `Models/ReturnAuthorization.model.js`, `Models/RmaLink.model.js`, `Models/TransactionChain.model.js`
- `Constants/rmaLinkSublist.constants.js`

Ver [[feedback_netsuite_tools_lib_path_convention]] para a decisão de caminho relativo da lib
compartilhada (`../../pd_c_netsuite_tools/...`, confirmado deployado na conta Aloia fora do git,
usuário optou por não copiar a lib para o repo).

**Pontos não cobertos pelo TECH-SPEC que exigiram decisão de implementação (sinalizar se usuário
quiser revisar):**
- A tabela de colunas da subaba (TECH-SPEC seção 5) não lista uma coluna com o número/link do
  próprio Inbound Shipment — só dados derivados do RMA + Vendor. Implementado literalmente como
  especificado (sem inventar coluna extra), mas é estranho para uma subaba cujo propósito é listar
  shipments vinculados.
- TECH-SPEC não diz o que fazer quando não há nenhum vínculo: implementei sempre criando a
  subaba/sublist vazia (not condicionado à existência de links), por padrão/consistência.
- Cadeia de joins Vendor (Invoice→SO→PO→Vendor) implementada em `TransactionChain.model.js` com
  fallback silencioso (retorna vazio) em caso de falha — é risco técnico explícito do TECH-SPEC
  (seção 3), ainda não validado contra conta real.

**Pendente:** EP2 (Suitelet de criação de Inbound Shipment vinculado a RMA) e EP3 (Client Script de
auto-preenchimento de Location), que são mais acoplados entre si — a implementar na sequência,
seguindo o mesmo padrão de prefixo/estrutura.
