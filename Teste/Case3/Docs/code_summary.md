# Integração NetSuite × LMX WMS — Documentação dos Entrypoints

> **Status atual:** Desenvolvimento pausado aguardando resolução do chamado Oracle `6893292`
> (erro de FCI requerido indevidamente, impedindo geração dos XMLs das NFs das SOs SO14, SO15 e SO16).

---

## Visão Geral

Esta integração automatiza o fluxo de pedidos de venda entre o **NetSuite** e o **WMS da LMX Logística**, cobrindo desde o envio do pedido para picking até o retorno das quantidades atendidas e a emissão de nota fiscal.

---

## Entrypoints

### Suitelets

#### `lmx_integration.suitelet.js`
Utilitário de autenticação. Ponto de entrada simples para obtenção do access token da LMX. Chama `accessTokenData.getAccessToken()` e retorna o token em JSON. Serve como base para os demais scripts que precisam se autenticar na API do WMS.

---

#### `lmx_integration_register_order.suitelet.js`
**Criação/registro do pedido no WMS.**
Recebe via `POST` um `salesOrderId`, `payload` e `accessToken`, e dispara o envio do pedido de venda ao WMS da LMX através de `registerOrderLMX.send()`.

---

#### `lmx_integration_update_register_order.suitelet.js`
**Atualização manual de status de pedido.**
Recebe `pedidoCliente` e `accessToken` via `POST` e executa `updateRegisterOrderLMX.execute()`. Permite acionar manualmente a consulta e atualização de status de um pedido já registrado no WMS.

---

#### `lmx_integration_save_return.suitelet.js`
**Persistência do retorno do pedido.**
Recebe dados de retorno do WMS (`salesOrderId`, `mensagem`, `pedidoCliente`, `dataEnvio`) e grava no NetSuite via `saveLMXOrderReturn.save()`.

---

#### `lmx_integration_register_invoice_xml_suitelet.js`
**Envio da NF ao WMS.**
Recebe `invoiceId` e `accessToken`, monta o payload da nota fiscal via `invoiceXmlPayload.buildPayload()` e envia o XML ao WMS via `registerInvoiceXmlLMX.sendInvoice()`.

---

#### `lmx_integration_save_invoice_xml_return_suitelet.js`
**Gravação do retorno da NF.**
Recebe a resposta do WMS após o envio da NF (`invoiceId`, `success`, `mensagem`, `erro`, `dataEnvio`) e persiste essa informação no NetSuite via `saveInvoiceXmlReturn.saveReturn()`.

---

### Map/Reduce

#### `lmx_integration_update_register_order_mapreduce.js`
**Atualização periódica (batch) de status dos pedidos ativos.**
Consulta via SuiteQL todos os registros customizados `customrecord_pd_lmx_lauched_orders` cujo status não seja `RETIRADO` ou `CANCELADO`, e para cada um executa `updateRegisterOrderLMX.execute()`. Gerencia renovação do access token quando necessário e trata erros de autenticação (401) separadamente dos demais.

---

### Restlet

#### `lmx_integration_update_register_order_webhook_restlet.js`
**Recepção assíncrona de eventos do WMS.**
Expõe um endpoint `POST` para receber webhooks da LMX. Valida a presença de `idPedidoCliente` e executa `updateRegisterOrderLMXWebhook.execute()`. É o canal pelo qual o WMS notifica o NetSuite sobre mudanças de status (ex: pedido retirado, cancelado).

---

### User Events

#### `lmx_integration.userevent.js`
**Interface manual na Sales Order.**
No `beforeLoad` de visualização de uma SO, injeta o client script `lmx_order_payload.client.js` e adiciona o botão **"Iniciar Separação com a LMX"** no formulário, permitindo que o usuário dispare manualmente o envio ao WMS.

---

#### `lmx-integration_userevent.js`
**Script de desenvolvimento/debug — não utilizado em produção.**
No `beforeLoad`, carrega dados da SO, do cliente e dos itens, e monta o payload via services (`salesorder_service`, `customer_service`, `item_service`, `payload_service`). Apenas loga o payload gerado, sem enviar nada. Versão anterior/experimental do fluxo.

---

#### `lmx-integration-xml-invoice_userevent.js`
**Ponto inicial do fluxo de envio de NF — em desenvolvimento.**
No `beforeLoad` de uma Invoice, lê o campo `custbody_brl_tran_dc_cert_xml_file` para obter o ID do arquivo XML da NF gerada e carrega seu conteúdo via `file.load()`. Apenas loga o XML — ainda não realiza o envio ao WMS.

---

### Client Scripts

#### `lmx_order_payload.client.js`
**Orquestrador do fluxo de envio de pedido ao WMS — acionado pelo botão na SO.**
É o script injetado pelo user event na Sales Order. Ao clicar em "Iniciar Separação com a LMX", a função `sendOrderToLMX` executa a seguinte sequência:

1. Carrega dados da SO, do cliente e dos itens usando os use cases `salesOrdeData`, `customerData` e `itemsData`
2. Monta o payload via `orderPayload.buildPayload()`
3. Chama o suitelet de token (`customscript_pd_lmx_integration_rt`) via `GET` para obter o access token
4. Chama o suitelet de registro do pedido (`customscript_pd_lmx_integ_regis_order_st`) via `POST` com o payload e o token
5. Chama o suitelet de save return (`customscript_pd_lmx_integ_save_return_st`) para persistir o retorno no registro customizado
6. Chama o suitelet de update register order (`customscript_pd_lmx_integ_update_regi_st`) para buscar o status atualizado do pedido na LMX logo após o envio

---

#### `lmx_invoice_xml.client.js`
**Orquestrador do fluxo de envio do XML da NF ao WMS — acionado manualmente na Invoice.**
Estrutura análoga ao client script da SO, mas para o contexto de Invoice. A função `sendInvoiceXmlToLMX` executa:

1. Obtém o `invoiceId` do registro atual
2. Monta o payload do XML via `invoiceXmlPayload.buildPayload(invoiceId)`
3. Chama o suitelet de token (`customscript_pd_lmx_integration_rt`) para obter o access token
4. Chama o suitelet de registro do XML (`customscript_pd_lmx_intr_regt_invoice_st`) com o payload e o token
5. Chama o suitelet de save return da invoice (`customscript_pd_lmx_intr_status_invc_st`) para persistir o resultado

Em caso de erro em qualquer etapa, tenta salvar o retorno de falha na Invoice antes de encerrar.

---

## Use Cases — Análise por módulo

### `accessTokenData.js`
Busca as credenciais OAuth no registro customizado `customrecord_pd_lmx_integrat_credentials` via SuiteQL e realiza um `POST` para a URL OAuth com `username`, `password`, `client_id`, `client_secret`, `grant_type` e `scope` no formato `application/x-www-form-urlencoded`. Retorna o token parsed do body da resposta.

---

### `registerOrderLMX.js`
Busca a URL de lançamento de pedidos em `customrecord_pd_lmx_integrat_credentials`, faz um `POST` com o payload e o Bearer token, e retorna `success: true` apenas quando o status code é `200`.

---

### `registerInvoiceXmlLMX.js`
Valida o payload (exige `conteudoXml`, `tipo` e `numeroNf`), busca a URL de envio do XML no registro de credenciais, faz o `POST` com Bearer token e retorna `success: true` somente para status `200`.

---

### `invoiceXmlPayload.js`
Consulta o `invoiceId` na tabela `transaction` para obter o `fileId` (`custbody_brl_tran_dc_cert_xml_file`) e o `numeroNf` (`tranid`). Carrega o arquivo XML via `file.load()`, monta o payload com `conteudoXml`, `tipo: 'ATACADO'` e `numeroNf`.

---

### `updateRegisterOrderLMX.js`
Consulta o status do pedido na LMX via `GET /{pedidoCliente}`, atualiza o registro `customrecord_pd_lmx_lauched_orders` no NetSuite com status, destinatário, data de criação, histórico e última atualização. Utiliza `parseDate.js` para converter a data de criação retornada pela LMX.

---

### `updateRegisterOrderLMXWebhook.js`
Recebe o payload do webhook da LMX, localiza o registro pelo `idPedidoCliente` e atualiza status, histórico, destinatário e transportador no `customrecord_pd_lmx_lauched_orders`. Não depende de access token — o próprio WMS chama o Restlet.

---

### `saveLMXOrderReturn.js`
Cria um novo registro `customrecord_pd_lmx_lauched_orders` com os dados de retorno do WMS (sales order, mensagem, pedido cliente e data de envio). Possui parser próprio de data (`parseShippingDate`) para o formato `DD-MM-YYYY HH:MM:SS`.

---

### `saveInvoiceXmlReturn.js`
Atualiza o campo `custbody_pd_lmx_wms_invoice_return` na Invoice com o resultado do envio: em caso de sucesso, grava `dataEnvio + ' - ' + mensagem`; em caso de erro, grava `'ERRO - ' + erro`.

---

### `orderPayload.js`
Monta o payload de pedido para a LMX a partir dos dados da SO, do cliente e dos itens. Normaliza CNPJ/CPF, CEP, telefone e CNPJ da transportadora removendo caracteres não numéricos.

---

### `salesOrdeData.js`
Carrega a Sales Order via `record.load` e extrai os campos necessários incluindo a sublist de itens e o campo de transportadora (`custbody_brl_tran_l_shipping_vendor`).

---

### `customerData.js`
Carrega o registro de cliente e extrai campos de endereço (via subrecord `addressbookaddress`), CNPJ, email, telefone e razão social.

---

### `itemsData.js`
Consulta via SuiteQL os itens da SO pelo `salesOrderId`, retornando `upccode` (código de barras) e quantidade absoluta de cada linha não-principal (`mainline = 'F'`).

---

### `parseDate.js`
Utilitário simples que converte uma string de data para objeto `Date` via `new Date(dateString)`.

---

*Autor: Project Dome — Rogério Gonçalves Rodrigues*