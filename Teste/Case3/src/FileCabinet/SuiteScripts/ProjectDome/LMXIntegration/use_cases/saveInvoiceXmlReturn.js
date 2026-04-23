/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {
    'use strict';

    function saveReturn(data) {
        try {
            var invoiceId = data.invoiceId;
            var success   = data.success;
            var mensagem  = data.mensagem;
            var erro      = data.erro;
            var dataEnvio = data.dataEnvio;

            var valor;
            if (success) {
                valor = dataEnvio + ' - ' + mensagem;
            } else {
                valor = 'ERRO - ' + (erro || mensagem || 'erro desconhecido');
            }

            var rec = record.load({
                type: 'invoice',
                id: invoiceId
            });

            rec.setValue({ fieldId: 'custbody_pd_lmx_wms_invoice_return', value: valor });
            rec.save({ ignoreMandatoryFields: true });

            return { success: true };

        } catch (error) {
            log.error({ title: 'saveInvoiceXmlReturn.saveReturn - erro - invoiceId: ' + data.invoiceId, details: JSON.stringify(error.message) });
            return { success: false };
        }
    }

    return {
        saveReturn: saveReturn
    };
});
