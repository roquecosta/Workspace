/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log', '../use_cases/saveLMXOrderReturn'], function (log, saveLMXOrderReturn) {
    'use strict';

    function onRequest(context) {
        var response = context.response;
        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        try {
            var body = JSON.parse(context.request.body);
            var salesOrderId  = body.salesOrderId;
            var mensagem      = body.mensagem;
            var pedidoCliente = body.pedidoCliente;
            var dataEnvio     = body.dataEnvio;

            var result = saveLMXOrderReturn.save({
                salesOrderId:  salesOrderId,
                mensagem:      mensagem,
                pedidoCliente: pedidoCliente,
                dataEnvio:     dataEnvio
            });

            response.write(JSON.stringify(result));

        } catch (error) {
            log.error({ title: 'lmx_integration_save_return.suitelet - onRequest', details: JSON.stringify(error.message) });
            response.write(JSON.stringify({ success: false, error: error.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
