/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log', '../use_cases/updateRegisterOrderLMX'], function (log, updateRegisterOrderLMX) {
    'use strict';

    function onRequest(context) {
        var response = context.response;
        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        try {
            var body = JSON.parse(context.request.body);
            var pedidoCliente = body.pedidoCliente;
            var accessToken   = body.accessToken;

            var result = updateRegisterOrderLMX.execute({
                pedidoCliente: pedidoCliente,
                accessToken:   accessToken
            });

            response.write(JSON.stringify(result));

        } catch (error) {
            log.error({ title: 'lmx_integration_update_register_order.suitelet - onRequest', details: JSON.stringify(error.message) });
            response.write(JSON.stringify({ success: false, error: error.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
