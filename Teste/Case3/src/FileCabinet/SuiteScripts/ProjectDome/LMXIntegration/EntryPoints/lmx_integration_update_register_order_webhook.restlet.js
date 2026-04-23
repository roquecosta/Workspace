/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/log', '../use_cases/updateRegisterOrderLMXWebhook'], function (log, updateRegisterOrderLMXWebhook) {
    'use strict';

    function post(body) {
        try {
            if (!body || !body.idPedidoCliente) {
                log.error({
                    title: 'lmx_webhook.restlet - post',
                    details: 'Campo idPedidoCliente ausente no payload do webhook.'
                });
                return { success: false, error: 'idPedidoCliente ausente' };
            }

            var result = updateRegisterOrderLMXWebhook.execute(body);
            return result;

        } catch (error) {
            log.error({ title: 'lmx_webhook.restlet - post - erro', details: JSON.stringify(error.message) });
            return { success: false, error: error.message };
        }
    }

    return {
        post: post
    };
});
