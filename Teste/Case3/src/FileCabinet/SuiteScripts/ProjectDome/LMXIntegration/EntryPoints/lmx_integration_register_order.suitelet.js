/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log', '../use_cases/registerOrderLMX'], function (log, registerOrderLMX) {
    'use strict';

    function onRequest(context) {
        var response = context.response;
        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        try {
            var body = JSON.parse(context.request.body);
            var salesOrderId = body.salesOrderId;
            var payload      = body.payload;
            var accessToken  = body.accessToken;

            var result = registerOrderLMX.send(payload, accessToken);

            response.write(JSON.stringify({
                success:    result.success,
                statusCode: result.statusCode,
                body:       result.body
            }));

        } catch (error) {
            log.error({ title: 'lmx_integration_register_order.suitelet - onRequest', details: JSON.stringify(error.message) });
            response.write(JSON.stringify({ success: false, statusCode: null, body: error.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
