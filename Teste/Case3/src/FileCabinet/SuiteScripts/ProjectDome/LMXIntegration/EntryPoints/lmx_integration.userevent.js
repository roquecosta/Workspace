/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/ui/serverWidget'], function (log, serverWidget) {
    'use strict';

    function beforeLoad(context) {
        try {
            // Executa apenas em modo VIEW
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            var form = context.form;

            // Injeta o client script orquestrador do fluxo de envio de pedido
            form.clientScriptModulePath = '../client/lmx_order_payload.client.js';

            // Adiciona botao que aciona sendOrderToLMX no client script
            form.addButton({
                id: 'custpage_btn_iniciar_separacao',
                label: 'Iniciar Separacao com a LMX',
                functionName: 'sendOrderToLMX(' + context.newRecord.id + ')'
            });

        } catch (error) {
            log.error({
                title: 'lmx_integration.userevent - beforeLoad - id: ' + context.newRecord.id,
                details: JSON.stringify(error.message)
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
