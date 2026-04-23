/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log', '../use_cases/saveInvoiceXmlReturn'], function (log, saveInvoiceXmlReturn) {
    'use strict';

    function onRequest(context) {
        var response = context.response;
        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        try {
            var body = JSON.parse(context.request.body);
            var invoiceId = body.invoiceId;
            var success   = body.success;
            var mensagem  = body.mensagem;
            var erro      = body.erro;
            var dataEnvio = body.dataEnvio;

            var result = saveInvoiceXmlReturn.saveReturn({
                invoiceId: invoiceId,
                success:   success,
                mensagem:  mensagem,
                erro:      erro,
                dataEnvio: dataEnvio
            });

            response.write(JSON.stringify(result));

        } catch (error) {
            log.error({ title: 'lmx_integration_save_invoice_xml_return.suitelet - onRequest', details: JSON.stringify(error.message) });
            response.write(JSON.stringify({ success: false, error: error.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
