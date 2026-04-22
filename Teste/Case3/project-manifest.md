# LMX Integration

> **Integração NetSuite x WMS LMX Logistica** — Automatiza o fluxo de pedidos de venda entre o NetSuite e o WMS da LMX Logistica, cobrindo desde o envio do pedido para picking (separacao) ate o retorno de status via webhook e o envio do XML da nota fiscal.

---

## Metadados

| Campo          | Valor                              |
|----------------|------------------------------------|
| Cliente        | RGM                                |
| Prefixo        | lmx                                |
| Responsavel    | Rogerio Goncalves Rodrigues        |
| Criado em      | 2026-04-22                         |
| Ultima revisao | 2026-04-22                         |

---

## Scripts

> Convencao de status: `novo` = sera criado pelo pipeline | `existente` = ja esta no NetSuite, apenas referenciado

### customscript_pd_lmx_ntegration_ue

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | userevent                                                                                                         |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration.userevent.js                |
| recordType   | salesorder                                                                                                        |
| deploymentId | customdeploy_pd_lmx_ntegration_ue                                                                                 |
| beforeLoad   | beforeLoad                                                                                                        |
| description  | Injeta o client script lmx_order_payload.client.js e adiciona o botao "Iniciar Separacao com a LMX" na SO em modo VIEW. Nao executa em create/edit. |

> Nota: o XML do objeto aponta para o caminho legado `/SuiteScripts/project_dome/lmx_integration/lmx_integration_user_event/lmx-integration.userevent.js`. O arquivo real no repositorio esta em `entry_points/lmx_integration.userevent.js`.

---

### customscript_pd_lmx_integration_rt

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | suitelet                                                                                                          |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration.suitelet.js                 |
| deploymentId | customdeploy_pd_lmx_integration_rt                                                                                |
| function     | onRequest                                                                                                         |
| description  | Endpoint de autenticacao. Aceita GET, chama accessTokenData.getAccessToken() e retorna o Bearer Token da LMX em JSON. Utilizado pelos dois client scripts como primeiro passo de qualquer fluxo. |

---

### customscript_pd_lmx_integ_regis_order_st

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | suitelet                                                                                                          |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_register_order.suitelet.js  |
| deploymentId | customdeploy_pd_lmx_integ_regis_order_st                                                                          |
| function     | onRequest                                                                                                         |
| description  | Recebe via POST { salesOrderId, payload, accessToken } e envia o pedido de venda ao WMS da LMX via registerOrderLMX.send(). Retorna success, statusCode e body da resposta da LMX. |

---

### customscript_pd_lmx_integ_save_return_st

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | suitelet                                                                                                          |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_save_return.suitelet.js     |
| deploymentId | customdeploy_pd_lmx_integ_save_return_st                                                                          |
| function     | onRequest                                                                                                         |
| description  | Recebe via POST { salesOrderId, mensagem, pedidoCliente, dataEnvio } e cria um novo registro customrecord_pd_lmx_lauched_orders com os dados de retorno do WMS. |

---

### customscript_pd_lmx_integ_update_regi_st

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | suitelet                                                                                                          |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_update_register_order.suitelet.js |
| deploymentId | customdeploy_pd_lmx_integ_update_regi_st                                                                          |
| function     | onRequest                                                                                                         |
| description  | Recebe via POST { pedidoCliente, accessToken } e executa updateRegisterOrderLMX.execute() para consultar e atualizar o status do pedido no registro customizado. Permite acionar a consulta manualmente. |

---

### customscript_pd_lmx_intr_regt_invoice_st

| Campo        | Valor                                                                                                              |
|--------------|--------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                          |
| type         | suitelet                                                                                                           |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_register_invoice_xml.suitelet.js |
| deploymentId | customdeploy_pd_lmx_intr_regt_invoice_st                                                                           |
| function     | onRequest                                                                                                          |
| description  | Recebe via POST { invoiceId, accessToken }, monta o payload do XML da NF via invoiceXmlPayload.buildPayload() e envia ao WMS via registerInvoiceXmlLMX.sendInvoice(). |

---

### customscript_pd_lmx_intr_status_invc_st

| Campo        | Valor                                                                                                              |
|--------------|--------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                          |
| type         | suitelet                                                                                                           |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_save_invoice_xml_return.suitelet.js |
| deploymentId | customdeploy_pd_lmx_intr_status_invc_st                                                                            |
| function     | onRequest                                                                                                          |
| description  | Recebe via POST { invoiceId, success, mensagem, erro, dataEnvio } e persiste o resultado do envio da NF no campo custbody_pd_lmx_wms_invoice_return da Invoice. |

---

### customscript_pd_lmx_update_order_mr

| Campo        | Valor                                                                                                                    |
|--------------|--------------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                                |
| type         | mapreduce                                                                                                                |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_update_register_order.mapreduce.js |
| deploymentId | customdeploy_pd_lmx_update_order_mr                                                                                      |
| getInputData | getInputData                                                                                                             |
| map          | map                                                                                                                      |
| summarize    | summarize                                                                                                                |
| description  | Batch periodico que consulta todos os registros customrecord_pd_lmx_lauched_orders com status diferente de RETIRADO ou CANCELADO e executa updateRegisterOrderLMX.execute() para cada um. Gerencia renovacao do token e trata erros 401 separadamente. |

> Nota: o scriptId exato do Map/Reduce nao consta no XML do repositorio (apenas o UE foi exportado). O ID acima segue a convencao da ProjectDome e deve ser confirmado no NetSuite.

---

### customscript_pd_lmx_webhook_rt

| Campo        | Valor                                                                                                                          |
|--------------|--------------------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                                      |
| type         | restlet                                                                                                                        |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/entry_points/lmx_integration_update_register_order_webhook.restlet.js |
| deploymentId | customdeploy_pd_lmx_webhook_rt                                                                                                 |
| post         | post                                                                                                                           |
| description  | Endpoint POST que recebe webhooks da LMX. Valida presenca de idPedidoCliente e executa updateRegisterOrderLMXWebhook.execute() para atualizar o registro customizado. Nao requer access token — o WMS autentica a chamada diretamente. |

> Nota: o scriptId exato do Restlet nao consta no XML do repositorio. O ID acima segue a convencao e deve ser confirmado no NetSuite.

---

### customscript_pd_lmx_order_cs

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | clientscript                                                                                                      |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/client/lmx_order_payload.client.js                       |
| deploymentId | customdeploy_pd_lmx_order_cs                                                                                      |
| pageInit     | pageInit                                                                                                          |
| function     | sendOrderToLMX                                                                                                    |
| description  | Orquestrador do fluxo de envio de pedido ao WMS. Injetado pelo UE na SO. Ao clicar no botao, executa: (1) carrega dados da SO/cliente/itens, (2) monta payload, (3) obtem token, (4) registra pedido, (5) salva retorno, (6) atualiza status. |

> Nota: este script nao tem deploymentId proprio — e injetado dinamicamente pelo user event via form.clientScriptModulePath.

---

### customscript_pd_lmx_invoice_cs

| Campo        | Valor                                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------------------------|
| status       | existente                                                                                                         |
| type         | clientscript                                                                                                      |
| file         | src/FileCabinet/SuiteScripts/ProjectDome/LMXIntegration/client/lmx_invoice_xml.client.js                         |
| deploymentId | customdeploy_pd_lmx_invoice_cs                                                                                    |
| pageInit     | pageInit                                                                                                          |
| function     | sendInvoiceXmlToLMX                                                                                               |
| description  | Orquestrador do fluxo de envio do XML da NF ao WMS. Estrutura analoga ao client script da SO, mas para Invoice. Em caso de erro em qualquer etapa, tenta salvar retorno de falha antes de encerrar. |

> Nota: este script nao tem deploymentId proprio — e injetado dinamicamente pelo user event da Invoice.

---

### Scripts de desenvolvimento/debug (nao utilizados em producao)

| Script                                    | Tipo        | Status | Observacao                                                                              |
|-------------------------------------------|-------------|--------|-----------------------------------------------------------------------------------------|
| `lmx-integration_userevent.js` (sem XML)  | userevent   | legado | Versao anterior/experimental. Apenas loga o payload, nao envia. Nao deployado em prod. |
| `lmx-integration-xml-invoice.userevent.js`| userevent   | legado | Em desenvolvimento. Apenas le e loga o XML da NF, nao realiza envio. Sem deploy ativo. |

---

## Records

> Registros customizados criados ou utilizados neste projeto.

### customrecord_pd_lmx_lauched_orders

| Campo           | Valor                                                                                      |
|-----------------|--------------------------------------------------------------------------------------------|
| status          | existente                                                                                  |
| label           | LMX Pedidos Lancados                                                                       |
| description     | Armazena os dados de retorno do WMS para cada pedido enviado. Um registro e criado no momento do envio (saveLMXOrderReturn) e atualizado a cada consulta de status (updateRegisterOrderLMX e updateRegisterOrderLMXWebhook). |

#### Campos

##### custrecord_pd_lmx_wms_intr_sales_order

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Sales Order                                     |
| type        | select                                          |
| source      | salesorder                                      |
| description | Referencia ao pedido de venda do NetSuite       |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_customer_requ

| Campo       | Valor                                                            |
|-------------|------------------------------------------------------------------|
| label       | Pedido Cliente (LMX)                                             |
| type        | text                                                             |
| description | ID do pedido no lado da LMX (ex: numero do pedido cliente). Usado como chave de busca em todas as consultas ao WMS. |
| isMandatory | false                                                            |

##### custrecord_pd_lmx_wms_intr_message

| Campo       | Valor                                                        |
|-------------|--------------------------------------------------------------|
| label       | Mensagem Retorno                                             |
| type        | textarea                                                     |
| description | Mensagem retornada pela LMX no momento do envio do pedido   |
| isMandatory | false                                                        |

##### custrecord_pd_lmx_wms_intr_shipping_date

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Data de Envio                                   |
| type        | datetime                                        |
| description | Data/hora em que o pedido foi enviado ao WMS. Parseada do formato DD-MM-YYYY HH:MM:SS. |
| isMandatory | false                                           |

##### custrecord_pd_lmx_wms_intr_status

| Campo       | Valor                                                                         |
|-------------|-------------------------------------------------------------------------------|
| label       | Status WMS                                                                    |
| type        | text                                                                          |
| description | Status atual do pedido na LMX. Valores conhecidos: RETIRADO, CANCELADO, e demais status do WMS. Usado como filtro no Map/Reduce. |
| isMandatory | false                                                                         |

##### custrecord_pd_lmx_wms_intr_lmx_id

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Codigo Pedido LMX (codped)                      |
| type        | text                                            |
| description | Codigo interno do pedido na LMX (campo codped da resposta da API) |
| isMandatory | false                                           |

##### custrecord_pd_lmx_wms_intr_recipient

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Destinatario                                    |
| type        | text                                            |
| description | Nome do destinatario retornado pela LMX         |
| isMandatory | false                                           |

##### custrecord_pd_lmx_wms_intr_carrier

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Transportadora                                  |
| type        | text                                            |
| description | Nome da transportadora retornada pela LMX. Campo opcional — so e gravado quando presente na resposta. |
| isMandatory | false                                           |

##### custrecord_pd_lmx_wms_intr_create_date

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Data de Criacao (LMX)                           |
| type        | datetime                                        |
| description | Data de criacao do pedido no WMS (campo criacao da resposta da API). Parseada via parseDate.parseDateLMX(). |
| isMandatory | false                                           |

##### custrecord_pd_lmx_wms_intr_historical

| Campo       | Valor                                                                          |
|-------------|--------------------------------------------------------------------------------|
| label       | Historico de Eventos                                                           |
| type        | textarea                                                                       |
| description | Historico de eventos do pedido no WMS. Cada linha no formato: "data / descricao / usuario". Ordenado cronologicamente. |
| isMandatory | false                                                                          |

##### custrecord_pd_lmx_wms_intr_latest_update

| Campo       | Valor                                                                          |
|-------------|--------------------------------------------------------------------------------|
| label       | Ultima Atualizacao                                                             |
| type        | text                                                                           |
| description | Registro de quando e por qual mecanismo o registro foi atualizado por ultimo. Formato: "FONTE - DD/MM/YYYY HH:MM:SS". Exemplos: "MAP_REDUCE - 22/04/2026 10:30:00", "WEBHOOK - 22/04/2026 11:00:00". |
| isMandatory | false                                                                          |

---

### customrecord_pd_lmx_integrat_credentials

| Campo       | Valor                                                                                      |
|-------------|--------------------------------------------------------------------------------------------|
| status      | existente                                                                                  |
| label       | LMX Credenciais de Integracao                                                              |
| description | Registro de configuracao central que armazena todas as credenciais OAuth e URLs da API da LMX. Consultado por SuiteQL em varios use cases. Espera-se exatamente 1 registro ativo. |

#### Campos

##### custrecord_pd_lmx_wms_intregrat_username

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Username OAuth                                  |
| type        | text                                            |
| description | Usuario para autenticacao OAuth na LMX          |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_password

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Password OAuth                                  |
| type        | text                                            |
| description | Senha para autenticacao OAuth na LMX            |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_client_id

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Client ID OAuth                                 |
| type        | text                                            |
| description | Client ID do aplicativo registrado na LMX       |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_client_secret

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Client Secret OAuth                             |
| type        | text                                            |
| description | Client Secret do aplicativo registrado na LMX   |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_grant_type

| Campo        | Valor                                           |
|--------------|-------------------------------------------------|
| label        | Grant Type OAuth                                |
| type         | text                                            |
| description  | Grant type OAuth (ex: password)                 |
| isMandatory  | true                                            |

##### custrecord_pd_lmx_wms_intr_scope

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | Scope OAuth                                     |
| type        | text                                            |
| description | Scope(s) OAuth requeridos pela LMX              |
| isMandatory | false                                           |

##### custrecord_pd_lmx_wms_intr_oauth_tkn_url

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | URL OAuth Token                                 |
| type        | url                                             |
| description | Endpoint da LMX para obtencao do Bearer Token   |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_launchord_url

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | URL Lancamento de Pedido                        |
| type        | url                                             |
| description | Endpoint da LMX para envio/registro do pedido de venda |
| isMandatory | true                                            |

##### custrecord_pd_lmx_wms_intr_searchord_url

| Campo       | Valor                                                              |
|-------------|--------------------------------------------------------------------|
| label       | URL Consulta de Pedido                                             |
| type        | url                                                                |
| description | URL base da LMX para consulta de status do pedido. O pedidoCliente e concatenado como sufixo: baseUrl + '/' + pedidoCliente. |
| isMandatory | true                                                               |

##### custrecord_pd_lmx_wms_intr_invoice_xml

| Campo       | Valor                                           |
|-------------|-------------------------------------------------|
| label       | URL Envio XML NF                                |
| type        | url                                             |
| description | Endpoint da LMX para envio do XML da Nota Fiscal |
| isMandatory | true                                            |

---

## External Fields

> Campos customizados em records nativos do NetSuite referenciados por este projeto.

### custbody_pd_lmx_wms_invoice_return

| Campo       | Valor                                                                                      |
|-------------|--------------------------------------------------------------------------------------------|
| status      | existente                                                                                  |
| label       | Retorno WMS (NF)                                                                           |
| type        | textarea                                                                                   |
| appliesTo   | invoice                                                                                    |
| description | Armazena o resultado do envio do XML da NF ao WMS. Sucesso: "dataEnvio - mensagem". Falha: "ERRO - descricao_do_erro". Gravado por saveInvoiceXmlReturn. |
| isMandatory | false                                                                                      |

### custbody_brl_tran_dc_cert_xml_file

| Campo       | Valor                                                                                      |
|-------------|--------------------------------------------------------------------------------------------|
| status      | existente                                                                                  |
| label       | XML NF-e (Arquivo)                                                                         |
| type        | select                                                                                     |
| source      | file                                                                                       |
| appliesTo   | invoice                                                                                    |
| description | Campo nativo do bundle BRL (localizacao brasileira). Armazena o ID do arquivo XML da NF-e certificada. Lido por invoiceXmlPayload e pelo userevent xml-invoice. |
| isMandatory | false                                                                                      |

### custbody_brl_tran_t_cust_fed_tx_reg

| Campo       | Valor                                                         |
|-------------|---------------------------------------------------------------|
| status      | existente                                                     |
| label       | CNPJ/CPF do Cliente (Transacao)                               |
| type        | text                                                          |
| appliesTo   | salesorder                                                    |
| description | Campo nativo do bundle BRL. CNPJ ou CPF do cliente na transacao. Lido por salesOrdeData. |
| isMandatory | false                                                         |

### custbody_brl_tran_t_carr_fed_tax_reg

| Campo       | Valor                                                         |
|-------------|---------------------------------------------------------------|
| status      | existente                                                     |
| label       | CNPJ da Transportadora (Transacao)                            |
| type        | text                                                          |
| appliesTo   | salesorder                                                    |
| description | Campo nativo do bundle BRL. CNPJ da transportadora selecionada no pedido. Lido por salesOrdeData e incluso no payload enviado a LMX. |
| isMandatory | false                                                         |

### custbody_brl_tran_l_shipping_vendor

| Campo       | Valor                                                         |
|-------------|---------------------------------------------------------------|
| status      | existente                                                     |
| label       | Transportadora (Vendor)                                       |
| type        | select                                                        |
| source      | vendor                                                        |
| appliesTo   | salesorder                                                    |
| description | Campo nativo do bundle BRL. Referencia ao registro de vendor da transportadora. O nome (dataCarrier.name) e incluido no payload da LMX como nomeTransportadora. |
| isMandatory | false                                                         |

### custentity_brl_entity_t_fed_tax_reg

| Campo       | Valor                                                         |
|-------------|---------------------------------------------------------------|
| status      | existente                                                     |
| label       | CNPJ/CPF (Entity)                                             |
| type        | text                                                          |
| appliesTo   | customer                                                      |
| description | Campo nativo do bundle BRL. CNPJ ou CPF do cliente. Lido por customerData e incluido no payload como cnpjCpf (somente numeros). |
| isMandatory | false                                                         |

### custentity_brl_entity_t_state_tx_reg

| Campo       | Valor                                                         |
|-------------|---------------------------------------------------------------|
| status      | existente                                                     |
| label       | Inscricao Estadual (Entity)                                   |
| type        | text                                                          |
| appliesTo   | customer                                                      |
| description | Campo nativo do bundle BRL. Inscricao estadual do cliente. Lido por customerData (presente no FIELDS mas nao incluso no payload da LMX na versao atual). |
| isMandatory | false                                                         |

### custrecord_brl_addrform_t_complement

| Campo       | Valor                                                         |
|-------------|---------------------------------------------------------------|
| status      | existente                                                     |
| label       | Complemento do Endereco                                       |
| type        | text                                                          |
| appliesTo   | address (subrecord de customer/addressbook)                   |
| description | Campo nativo do bundle BRL no subrecord de endereco. Complemento do endereco do cliente. Lido por customerData mas nao incluido no payload da LMX na versao atual. |
| isMandatory | false                                                         |

---

## Dependencias entre objetos

### Fluxo 1 — Envio de Pedido ao WMS (acionado pelo botao na SO)

1. `customscript_pd_lmx_ntegration_ue` (beforeLoad / VIEW na SO) injeta `lmx_order_payload.client.js` e cria o botao "Iniciar Separacao com a LMX"
2. `customscript_pd_lmx_order_cs` (sendOrderToLMX) le dados da `salesorder` via `salesOrdeData` — campos: `tranid`, `custbody_brl_tran_t_cust_fed_tx_reg`, `entity`, `custbody_brl_tran_t_carr_fed_tax_reg`, `custbody_brl_tran_l_shipping_vendor`
3. `customscript_pd_lmx_order_cs` le dados do `customer` via `customerData` — campos: `custentity_brl_entity_t_fed_tax_reg`, `companyname`, `email`, `phone` e subrecord `addressbookaddress`
4. `customscript_pd_lmx_order_cs` consulta itens da SO via `itemsData` (SuiteQL em `transaction`/`transactionline`/`item` — retorna `upccode` e `quantity`)
5. `customscript_pd_lmx_order_cs` monta payload via `orderPayload.buildPayload()` — normaliza CNPJ/CPF, CEP, telefone e CNPJ da transportadora (remove nao-numericos)
6. `customscript_pd_lmx_order_cs` chama `customscript_pd_lmx_integration_rt` (GET) para obter Bearer Token — que consulta `customrecord_pd_lmx_integrat_credentials` via SuiteQL
7. `customscript_pd_lmx_order_cs` chama `customscript_pd_lmx_integ_regis_order_st` (POST) — que usa `registerOrderLMX`, que le `custrecord_pd_lmx_wms_intr_launchord_url` das credenciais
8. `customscript_pd_lmx_order_cs` chama `customscript_pd_lmx_integ_save_return_st` (POST) — que cria registro em `customrecord_pd_lmx_lauched_orders` com os campos: `custrecord_pd_lmx_wms_intr_sales_order`, `custrecord_pd_lmx_wms_intr_message`, `custrecord_pd_lmx_wms_intr_customer_requ`, `custrecord_pd_lmx_wms_intr_shipping_date`
9. `customscript_pd_lmx_order_cs` chama `customscript_pd_lmx_integ_update_regi_st` (POST) — que consulta status na LMX usando `custrecord_pd_lmx_wms_intr_searchord_url` e atualiza os campos do registro criado no passo 8

### Fluxo 2 — Atualizacao Batch de Status (Map/Reduce)

1. `customscript_pd_lmx_update_order_mr` (getInputData) consulta via SuiteQL todos os `customrecord_pd_lmx_lauched_orders` cujo `custrecord_pd_lmx_wms_intr_status` nao e RETIRADO nem CANCELADO
2. Para cada registro, chama `accessTokenData.getAccessToken()` se ainda nao tiver token (reutiliza entre iteracoes)
3. Chama `updateRegisterOrderLMX.execute()` que busca status na LMX via GET e atualiza: `custrecord_pd_lmx_wms_intr_lmx_id`, `custrecord_pd_lmx_wms_intr_status`, `custrecord_pd_lmx_wms_intr_recipient`, `custrecord_pd_lmx_wms_intr_create_date`, `custrecord_pd_lmx_wms_intr_historical`, `custrecord_pd_lmx_wms_intr_latest_update`, `custrecord_pd_lmx_wms_intr_carrier`

### Fluxo 3 — Webhook do WMS

1. `customscript_pd_lmx_webhook_rt` (POST) recebe notificacao da LMX com `idPedidoCliente`
2. Localiza o registro em `customrecord_pd_lmx_lauched_orders` por `custrecord_pd_lmx_wms_intr_customer_requ`
3. Atualiza: `custrecord_pd_lmx_wms_intr_status`, `custrecord_pd_lmx_wms_intr_latest_update` (prefixo "WEBHOOK"), `custrecord_pd_lmx_wms_intr_historical`, `custrecord_pd_lmx_wms_intr_recipient`, `custrecord_pd_lmx_wms_intr_carrier`

### Fluxo 4 — Envio do XML da NF ao WMS (acionado manualmente na Invoice)

1. `customscript_pd_lmx_invoice_cs` (sendInvoiceXmlToLMX) le `invoiceId` do registro atual
2. Chama `invoiceXmlPayload.buildPayload(invoiceId)` — que consulta `transaction` via SuiteQL para obter `custbody_brl_tran_dc_cert_xml_file` (fileId) e `tranid` (numeroNf), carrega o arquivo XML via `file.load()`
3. Chama `customscript_pd_lmx_integration_rt` (GET) para obter Bearer Token
4. Chama `customscript_pd_lmx_intr_regt_invoice_st` (POST) com `{ invoiceId, accessToken }` — que usa `registerInvoiceXmlLMX`, que le `custrecord_pd_lmx_wms_intr_invoice_xml` das credenciais
5. Chama `customscript_pd_lmx_intr_status_invc_st` (POST) — que grava em `custbody_pd_lmx_wms_invoice_return` na Invoice. Sucesso: "dataEnvio - mensagem". Falha: "ERRO - descricao_do_erro".

### Dependencias da lib NetsuiteTools

- `salesOrdeData.js` importa `pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util` e `pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js`
- `customerData.js` importa os mesmos modulos da NetsuiteTools
- `orderPayload.js` importa os mesmos modulos da NetsuiteTools

---

## Notas de implementacao

### Bloqueio atual (em aberto em 22/04/2026)

O chamado Oracle **n. 6893292** (aberto em 17/04/2026) impede a geracao dos XMLs das NF-e das transacoes SO14, SO15 e SO16 por erro de FCI sendo exigido indevidamente. Nenhum avanco nos testes do Fluxo 4 e possivel ate a resolucao.

### Arquitetura geral

- A integracao segue o padrao **Client Script como orquestrador + Suitelets como camada de servico**. O client script nunca chama a API da LMX diretamente — todas as chamadas HTTP externas passam por Suitelets intermediarios. Isso contorna a limitacao do contexto de client script para chamadas externas complexas.
- O registro `customrecord_pd_lmx_integrat_credentials` e a fonte unica de verdade para todas as URLs e credenciais. Qualquer mudanca de ambiente (sandbox -> producao) deve ser feita apenas neste registro.

### Convencao do campo custrecord_pd_lmx_wms_intr_customer_requ

- Este campo e a **chave primaria funcional** de `customrecord_pd_lmx_lauched_orders`. E usado como parametro de busca por todos os use cases que precisam localizar um registro: `updateRegisterOrderLMX.findRecord()` e `updateRegisterOrderLMXWebhook.findRecord()`. Deve ser unico por pedido.

### Renovacao do token no Map/Reduce

- O token e obtido uma unica vez na fase `map` e reutilizado entre as iteracoes via variavel de modulo (`let accessToken = null`). Erros com mensagem contendo "401" ou "token" sao tratados separadamente (log de erro mas sem retentar) para evitar loops de falha de autenticacao.

### Normalizacao do payload de pedido

- `orderPayload.buildPayload()` remove todos os caracteres nao-numericos dos campos `cnpjCpf`, `cep`, `telefone` e `cnpjTransportadora` antes de enviar a LMX.
- O campo `dataSeparacao` esta hard-coded como `"2026-12-09"` na versao atual — isso e um pendencia de desenvolvimento.

### Diferenca no formato do historico entre Polling e Webhook

- `updateRegisterOrderLMX.buildHistoricalText()` usa as chaves `dataHistorico`, `descSituacao`, `nomeUsuario` (camelCase) na resposta da API de consulta.
- `updateRegisterOrderLMXWebhook.buildHistoricalText()` usa as chaves `data_historico`, `desc_situacao`, `nome_usuario` (snake_case) no payload do webhook.
- Os dois formatos sao diferentes pois vem de endpoints distintos da LMX.

### Parseamento de datas

- `saveLMXOrderReturn` usa `parseShippingDate()` propria para o formato `DD-MM-YYYY HH:MM:SS` (retorno do WMS apos envio do pedido).
- `updateRegisterOrderLMX` usa `parseDate.parseDateLMX()` para o campo `criacao` da consulta de status (formato ISO, `new Date(dateString)`).
- Sao dois parsers distintos para dois formatos distintos.

### Scripts legados nao deployados

- `lmx-integration_userevent.js` e uma versao experimental anterior que apenas logava o payload sem enviar. Nao esta deployado e pode ser removido com seguranca.
- `lmx-integration-xml-invoice.userevent.js` e uma prova de conceito para leitura do XML via beforeLoad da Invoice. Sem deploy ativo — o fluxo real de envio usa o client script `lmx_invoice_xml.client.js`.

### Campos do payload de NF

- O campo `tipo` do payload da NF e sempre `"ATACADO"` (hard-coded em `invoiceXmlPayload.buildPayload()`).
- O campo `numeroNf` e o `tranid` da Invoice no NetSuite, convertido para string.

### Dependencia do bundle BRL (localizacao brasileira)

- Os campos `custbody_brl_tran_dc_cert_xml_file`, `custbody_brl_tran_t_cust_fed_tx_reg`, `custbody_brl_tran_t_carr_fed_tax_reg`, `custbody_brl_tran_l_shipping_vendor`, `custentity_brl_entity_t_fed_tax_reg`, `custentity_brl_entity_t_state_tx_reg` e `custrecord_brl_addrform_t_complement` sao do bundle de localizacao brasileira da Oracle/NetSuite. A integracao depende que este bundle esteja instalado e ativo no ambiente.

---

## Use Cases (modulos internos)

| Arquivo                          | Funcao principal          | Descricao                                                                                          |
|----------------------------------|---------------------------|----------------------------------------------------------------------------------------------------|
| `accessTokenData.js`             | `getAccessToken()`        | Consulta credenciais em `customrecord_pd_lmx_integrat_credentials` e realiza POST OAuth na LMX    |
| `registerOrderLMX.js`            | `send(payload, token)`    | POST do pedido ao WMS usando URL de `custrecord_pd_lmx_wms_intr_launchord_url`                    |
| `registerInvoiceXmlLMX.js`       | `sendInvoice(payload, token)` | POST do XML da NF ao WMS usando URL de `custrecord_pd_lmx_wms_intr_invoice_xml`. Valida presence de `conteudoXml`, `tipo` e `numeroNf`. |
| `invoiceXmlPayload.js`           | `buildPayload(invoiceId)` | Consulta Invoice por SuiteQL, carrega XML via `file.load()` e monta payload `{conteudoXml, tipo, numeroNf}` |
| `updateRegisterOrderLMX.js`      | `execute({pedidoCliente, accessToken})` | GET na LMX, localiza registro por `pedidoCliente`, atualiza campos de status/historico |
| `updateRegisterOrderLMXWebhook.js`| `execute(payload)`       | Mesmo que acima, mas sem token — recebe payload direto do webhook                                 |
| `saveLMXOrderReturn.js`          | `save(data)`              | Cria registro em `customrecord_pd_lmx_lauched_orders` com dados do retorno do WMS                 |
| `saveInvoiceXmlReturn.js`        | `saveReturn(data)`        | Atualiza `custbody_pd_lmx_wms_invoice_return` na Invoice com resultado do envio                   |
| `orderPayload.js`                | `buildPayload(so, cust, items)` | Monta o JSON do pedido para a LMX com normalizacao de CNPJ/CEP/telefone                     |
| `salesOrdeData.js`               | `salesOrderObj()`, `readData()` | Carrega SO via `record.load` usando NetsuiteTools                                           |
| `customerData.js`                | `load()`, `readData()`    | Carrega Customer com subrecord de endereco via NetsuiteTools                                       |
| `itemsData.js`                   | `itemList(salesOrderId)`  | SuiteQL em `transaction`/`transactionline`/`item` retornando `upccode` e `quantity`               |
| `parseDate.js`                   | `parseDateLMX(str)`       | Converte string ISO para objeto Date via `new Date()`                                              |

---

## Changelog

| Data       | Autor                       | Mudanca                        |
|------------|-----------------------------|--------------------------------|
| 2026-04-22 | Spec Builder (ProjectDome)  | Geracao do manifest a partir do codigo existente |
