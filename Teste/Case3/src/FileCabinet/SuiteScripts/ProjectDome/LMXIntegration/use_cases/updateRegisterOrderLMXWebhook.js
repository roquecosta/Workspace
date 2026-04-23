/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/record', 'N/log'], function (query, record, log) {
    'use strict';

    function findRecord(pedidoCliente) {
        var sql = [
            'SELECT id',
            'FROM customrecord_pd_lmx_lauched_orders',
            'WHERE custrecord_pd_lmx_wms_intr_customer_requ = \'' + pedidoCliente + '\'',
            'FETCH FIRST 1 ROWS ONLY'
        ].join(' ');

        var result = query.runSuiteQL({ query: sql });
        var rows = result.asMappedResults();

        if (!rows || rows.length === 0) {
            return null;
        }
        return rows[0].id;
    }

    // Webhook usa chaves snake_case (data_historico, desc_situacao, nome_usuario)
    function buildHistoricalText(historico) {
        if (!historico || !Array.isArray(historico)) {
            return '';
        }
        return historico.map(function (item) {
            return (item.data_historico || '') + ' / ' + (item.desc_situacao || '') + ' / ' + (item.nome_usuario || '');
        }).join('\n');
    }

    function formatLatestUpdate() {
        var now = new Date();
        var pad = function (n) { return n < 10 ? '0' + n : String(n); };
        var formatted = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() +
            ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        return 'WEBHOOK - ' + formatted;
    }

    function execute(payload) {
        var pedidoCliente = payload.idPedidoCliente;

        try {
            var recordId = findRecord(pedidoCliente);
            if (!recordId) {
                log.error({ title: 'updateRegisterOrderLMXWebhook.execute', details: 'Registro nao encontrado para pedidoCliente: ' + pedidoCliente });
                return { success: false };
            }

            var rec = record.load({
                type: 'customrecord_pd_lmx_lauched_orders',
                id: recordId
            });

            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_status',        value: payload.situacao      || '' });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_recipient',     value: payload.destinatario  || '' });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_historical',    value: buildHistoricalText(payload.historico) });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_latest_update', value: formatLatestUpdate() });

            if (payload.transportadora) {
                rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_carrier', value: payload.transportadora });
            }

            rec.save({ ignoreMandatoryFields: true });

            return { success: true };

        } catch (error) {
            log.error({ title: 'updateRegisterOrderLMXWebhook.execute - erro - pedidoCliente: ' + pedidoCliente, details: JSON.stringify(error.message) });
            return { success: false };
        }
    }

    return {
        execute: execute,
        findRecord: findRecord
    };
});
