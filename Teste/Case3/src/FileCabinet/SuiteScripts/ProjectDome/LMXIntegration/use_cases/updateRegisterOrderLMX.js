/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define([
    'N/https',
    'N/query',
    'N/record',
    'N/log',
    './parseDate'
], function (https, query, record, log, parseDate) {
    'use strict';

    function getSearchUrl() {
        var sql = [
            'SELECT custrecord_pd_lmx_wms_intr_searchord_url AS url',
            'FROM customrecord_pd_lmx_integrat_credentials',
            'WHERE isinactive = \'F\'',
            'FETCH FIRST 1 ROWS ONLY'
        ].join(' ');

        var result = query.runSuiteQL({ query: sql });
        var rows = result.asMappedResults();

        if (!rows || rows.length === 0) {
            return null;
        }
        return rows[0].url;
    }

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

    function buildHistoricalText(historico) {
        if (!historico || !Array.isArray(historico)) {
            return '';
        }
        return historico.map(function (item) {
            return (item.dataHistorico || '') + ' / ' + (item.descSituacao || '') + ' / ' + (item.nomeUsuario || '');
        }).join('\n');
    }

    function formatLatestUpdate(source) {
        var now = new Date();
        var pad = function (n) { return n < 10 ? '0' + n : String(n); };
        var formatted = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() +
            ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        return source + ' - ' + formatted;
    }

    function execute(params) {
        var pedidoCliente = params.pedidoCliente;
        var accessToken = params.accessToken;

        try {
            var baseUrl = getSearchUrl();
            if (!baseUrl) {
                log.error({ title: 'updateRegisterOrderLMX.execute', details: 'URL de consulta nao configurada.' });
                return { success: false };
            }

            var response = https.get({
                url: baseUrl + '/' + pedidoCliente,
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });

            if (response.code < 200 || response.code >= 300) {
                log.error({
                    title: 'updateRegisterOrderLMX.execute - resposta LMX',
                    details: 'statusCode: ' + response.code + ' | body: ' + response.body
                });
                return { success: false, statusCode: response.code };
            }

            var data = JSON.parse(response.body);

            var recordId = findRecord(pedidoCliente);
            if (!recordId) {
                log.error({ title: 'updateRegisterOrderLMX.execute', details: 'Registro nao encontrado para pedidoCliente: ' + pedidoCliente });
                return { success: false };
            }

            var rec = record.load({
                type: 'customrecord_pd_lmx_lauched_orders',
                id: recordId
            });

            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_lmx_id',      value: data.codped     || '' });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_status',       value: data.situacao   || '' });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_recipient',    value: data.destinatario || '' });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_historical',   value: buildHistoricalText(data.historico) });
            rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_latest_update', value: formatLatestUpdate('MAP_REDUCE') });

            if (data.criacao) {
                rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_create_date', value: parseDate.parseDateLMX(data.criacao) });
            }

            if (data.transportadora) {
                rec.setValue({ fieldId: 'custrecord_pd_lmx_wms_intr_carrier', value: data.transportadora });
            }

            rec.save({ ignoreMandatoryFields: true });

            return { success: true };

        } catch (error) {
            log.error({ title: 'updateRegisterOrderLMX.execute - erro - pedidoCliente: ' + pedidoCliente, details: JSON.stringify(error.message) });
            return { success: false };
        }
    }

    return {
        execute: execute,
        findRecord: findRecord
    };
});
