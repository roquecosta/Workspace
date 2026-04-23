/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([
    'N/query',
    'N/log',
    '../use_cases/accessTokenData',
    '../use_cases/updateRegisterOrderLMX'
], function (query, log, accessTokenData, updateRegisterOrderLMX) {
    'use strict';

    // Token reutilizado entre iteracoes da fase map para evitar multiplas chamadas OAuth
    let accessToken = null;

    function getInputData() {
        try {
            var sql = [
                'SELECT',
                '  id,',
                '  custrecord_pd_lmx_wms_intr_customer_requ AS pedidocliente',
                'FROM customrecord_pd_lmx_lauched_orders',
                'WHERE custrecord_pd_lmx_wms_intr_status <> \'RETIRADO\'',
                '  AND custrecord_pd_lmx_wms_intr_status <> \'CANCELADO\'',
                '  AND isinactive = \'F\''
            ].join(' ');

            var result = query.runSuiteQL({ query: sql });
            return result.asMappedResults();

        } catch (error) {
            log.error({ title: 'lmx_update_order.mapreduce - getInputData', details: JSON.stringify(error.message) });
            return [];
        }
    }

    function map(context) {
        try {
            var row = JSON.parse(context.value);
            var pedidoCliente = row.pedidocliente;

            if (!pedidoCliente) {
                log.error({ title: 'lmx_update_order.mapreduce - map', details: 'pedidoCliente vazio para registro: ' + row.id });
                return;
            }

            // Obtém token apenas uma vez e reutiliza entre iteracoes
            if (!accessToken) {
                accessToken = accessTokenData.getAccessToken();
                if (!accessToken) {
                    log.error({ title: 'lmx_update_order.mapreduce - map', details: 'Nao foi possivel obter access token.' });
                    return;
                }
            }

            var result = updateRegisterOrderLMX.execute({
                pedidoCliente: pedidoCliente,
                accessToken:   accessToken
            });

            context.write({ key: row.id, value: JSON.stringify(result) });

        } catch (error) {
            var msg = error.message || '';
            // Erros 401 (token invalido) sao logados e nao retentados
            if (msg.indexOf('401') !== -1 || msg.toLowerCase().indexOf('token') !== -1) {
                log.error({ title: 'lmx_update_order.mapreduce - map - erro 401/token', details: JSON.stringify(msg) });
                return;
            }
            log.error({ title: 'lmx_update_order.mapreduce - map - erro', details: JSON.stringify(msg) });
        }
    }

    function summarize(context) {
        context.mapSummary.errors.iterator().each(function (key, error) {
            log.error({ title: 'lmx_update_order.mapreduce - summarize - map error key: ' + key, details: error });
            return true;
        });

        var successCount = 0;
        var failCount    = 0;

        context.output.iterator().each(function (key, value) {
            var result = JSON.parse(value);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
            return true;
        });

        log.audit({
            title: 'lmx_update_order.mapreduce - summarize',
            details: 'Sucesso: ' + successCount + ' | Falha: ' + failCount
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
