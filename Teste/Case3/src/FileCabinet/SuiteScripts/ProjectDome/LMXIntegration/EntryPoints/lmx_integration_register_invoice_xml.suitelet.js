/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([
    'N/log',
    '../use_cases/invoiceXmlPayload',
    '../use_cases/registerInvoiceXmlLMX'
], function (log, invoiceXmlPayload, registerInvoiceXmlLMX) {
    'use strict';

    function onRequest(context) {
        var response = context.response;
        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        try {
            var body = JSON.parse(context.request.body);
            var invoiceId   = body.invoiceId;
            var accessToken = body.accessToken;

            var payload = invoiceXmlPayload.buildPayload(invoiceId);
            if (!payload) {
                response.write(JSON.stringify({ success: false, body: 'Falha ao montar payload do XML da NF.' }));
                return;
            }

            var result = registerInvoiceXmlLMX.sendInvoice(payload, accessToken);

            response.write(JSON.stringify({
                success:    result.success,
                statusCode: result.statusCode,
                body:       result.body
            }));

        } catch (error) {
            log.error({ title: 'lmx_integration_register_invoice_xml.suitelet - onRequest', details: JSON.stringify(error.message) });
            response.write(JSON.stringify({ success: false, statusCode: null, body: error.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
