/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/query', 'N/log'], function (https, query, log) {
    'use strict';

    function send(payload, token) {
        try {
            var sql = [
                'SELECT custrecord_pd_lmx_wms_intr_launchord_url AS url',
                'FROM customrecord_pd_lmx_integrat_credentials',
                'WHERE isinactive = \'F\'',
                'FETCH FIRST 1 ROWS ONLY'
            ].join(' ');

            var result = query.runSuiteQL({ query: sql });
            var rows = result.asMappedResults();

            if (!rows || rows.length === 0) {
                log.error({ title: 'registerOrderLMX.send', details: 'URL de lancamento de pedido nao encontrada.' });
                return { success: false, statusCode: null, body: 'URL nao configurada' };
            }

            var url = rows[0].url;

            var response = https.post({
                url: url,
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });

            return {
                success: response.code >= 200 && response.code < 300,
                statusCode: response.code,
                body: response.body
            };

        } catch (error) {
            log.error({ title: 'registerOrderLMX.send - erro', details: JSON.stringify(error.message) });
            return { success: false, statusCode: null, body: error.message };
        }
    }

    return {
        send: send
    };
});
