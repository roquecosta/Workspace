/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define([
    'N/url',
    'N/https',
    'N/log',
    '../use_cases/salesOrdeData',
    '../use_cases/customerData',
    '../use_cases/itemsData',
    '../use_cases/orderPayload'
], function (url, https, log, salesOrdeData, customerData, itemsData, orderPayload) {
    'use strict';

    const SCRIPT_TOKEN          = 'customscript_pd_lmx_integration_rt';
    const DEPLOY_TOKEN          = 'customdeploy_pd_lmx_integration_rt';
    const SCRIPT_REGISTER_ORDER = 'customscript_pd_lmx_integ_regis_order_st';
    const DEPLOY_REGISTER_ORDER = 'customdeploy_pd_lmx_integ_regis_order_st';
    const SCRIPT_SAVE_RETURN    = 'customscript_pd_lmx_integ_save_return_st';
    const DEPLOY_SAVE_RETURN    = 'customdeploy_pd_lmx_integ_save_return_st';
    const SCRIPT_UPDATE_ORDER   = 'customscript_pd_lmx_integ_update_regi_st';
    const DEPLOY_UPDATE_ORDER   = 'customdeploy_pd_lmx_integ_update_regi_st';

    function pageInit(context) {
        // pageInit intencional vazio — inicializacao gerenciada pelo botao
    }

    function sendOrderToLMX(salesOrderId) {
        try {
            // 1. Leitura da Sales Order
            var soObj  = salesOrdeData.salesOrderObj(salesOrderId);
            var soData = salesOrdeData.readData(soObj);

            // 2. Leitura do Customer
            var custObj  = customerData.load(soData.entity);
            var custData = customerData.readData(custObj);

            // 3. Leitura dos itens da SO
            var items = itemsData.itemList(salesOrderId);

            // 4. Montagem do payload
            // Injeta nome da transportadora (campo texto da SO) no objeto soData para o payload
            soData.shippingVendorName = soObj.getText({ fieldId: 'custbody_brl_tran_l_shipping_vendor' });
            var payload = orderPayload.buildPayload(soData, custData, items);

            if (!payload) {
                alert('Erro ao montar payload do pedido. Verifique os logs.');
                return;
            }

            // 5. Obtencao do Bearer Token via Suitelet de autenticacao
            var tokenUrl = url.resolveScript({ scriptId: SCRIPT_TOKEN, deploymentId: DEPLOY_TOKEN, returnExternalUrl: false });
            var tokenResp = https.get({ url: tokenUrl });
            var tokenData = JSON.parse(tokenResp.body);
            var accessToken = tokenData.token;

            if (!accessToken) {
                alert('Erro ao obter token de autenticacao. Verifique as credenciais LMX.');
                return;
            }

            // 6. Registro do pedido na LMX
            var registerUrl = url.resolveScript({ scriptId: SCRIPT_REGISTER_ORDER, deploymentId: DEPLOY_REGISTER_ORDER, returnExternalUrl: false });
            var registerResp = https.post({
                url: registerUrl,
                body: JSON.stringify({ salesOrderId: salesOrderId, payload: payload, accessToken: accessToken }),
                headers: { 'Content-Type': 'application/json' }
            });
            var registerResult = JSON.parse(registerResp.body);

            // 7. Salvamento do retorno no registro customizado
            var saveReturnUrl = url.resolveScript({ scriptId: SCRIPT_SAVE_RETURN, deploymentId: DEPLOY_SAVE_RETURN, returnExternalUrl: false });
            var lmxBody = {};
            try { lmxBody = JSON.parse(registerResult.body); } catch (e) { lmxBody = {}; }

            https.post({
                url: saveReturnUrl,
                body: JSON.stringify({
                    salesOrderId:  salesOrderId,
                    mensagem:      registerResult.body || '',
                    pedidoCliente: lmxBody.pedidoCliente || payload.pedidoCliente || '',
                    dataEnvio:     lmxBody.dataEnvio || ''
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            // 8. Atualizacao do status do pedido na LMX
            var updateUrl = url.resolveScript({ scriptId: SCRIPT_UPDATE_ORDER, deploymentId: DEPLOY_UPDATE_ORDER, returnExternalUrl: false });
            https.post({
                url: updateUrl,
                body: JSON.stringify({
                    pedidoCliente: lmxBody.pedidoCliente || payload.pedidoCliente || '',
                    accessToken:   accessToken
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            alert('Pedido enviado com sucesso para a LMX!');

        } catch (error) {
            log.error({ title: 'lmx_order_payload.client - sendOrderToLMX - salesOrderId: ' + salesOrderId, details: JSON.stringify(error.message) });
            alert('Erro ao enviar pedido para a LMX: ' + error.message);
        }
    }

    return {
        pageInit: pageInit,
        sendOrderToLMX: sendOrderToLMX
    };
});
