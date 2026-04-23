/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {
    'use strict';

    // Parseia data no formato DD-MM-YYYY HH:MM:SS retornado pelo WMS
    function parseShippingDate(str) {
        if (!str) return null;
        try {
            // Formato esperado: "DD-MM-YYYY HH:MM:SS"
            var parts = str.split(' ');
            var dateParts = parts[0].split('-');
            var timeParts = parts[1] ? parts[1].split(':') : ['0', '0', '0'];

            var day   = parseInt(dateParts[0], 10);
            var month = parseInt(dateParts[1], 10) - 1;
            var year  = parseInt(dateParts[2], 10);
            var hours = parseInt(timeParts[0], 10);
            var mins  = parseInt(timeParts[1], 10);
            var secs  = parseInt(timeParts[2], 10);

            return new Date(year, month, day, hours, mins, secs);
        } catch (e) {
            log.error({ title: 'saveLMXOrderReturn.parseShippingDate', details: 'Falha ao parsear data: ' + str });
            return null;
        }
    }

    function save(data) {
        try {
            var salesOrderId  = data.salesOrderId;
            var mensagem      = data.mensagem;
            var pedidoCliente = data.pedidoCliente;
            var dataEnvio     = data.dataEnvio;

            var rec = record.create({ type: 'customrecord_pd_lmx_lauched_orders' });

            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_sales_order',    value: salesOrderId });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_message',        value: mensagem      || '' });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_customer_requ',  value: pedidoCliente || '' });

            var parsedDate = parseShippingDate(dataEnvio);
            if (parsedDate) {
                rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_shipping_date', value: parsedDate });
            }

            var newId = rec.save({ ignoreMandatoryFields: true });
            return { success: true, id: newId };

        } catch (error) {
            log.error({ title: 'saveLMXOrderReturn.save - erro - salesOrderId: ' + data.salesOrderId, details: JSON.stringify(error.message) });
            return { success: false };
        }
    }

    return {
        save: save
    };
});
