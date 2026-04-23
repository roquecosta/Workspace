/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/query', 'N/log'], function (https, query, log) {
    'use strict';

    function sendInvoice(payload, token) {
        try {
            if (!payload.conteudoXml) {
                log.error({ title: 'registerInvoiceXmlLMX.sendInvoice', details: 'Campo conteudoXml ausente no payload.' });
                return { success: false, statusCode: null, body: 'conteudoXml ausente' };
            }
            if (!payload.tipo) {
                log.error({ title: 'registerInvoiceXmlLMX.sendInvoice', details: 'Campo tipo ausente no payload.' });
                return { success: false, statusCode: null, body: 'tipo ausente' };
            }
            if (!payload.numeroNf) {
                log.error({ title: 'registerInvoiceXmlLMX.sendInvoice', details: 'Campo numeroNf ausente no payload.' });
                return { success: false, statusCode: null, body: 'numeroNf ausente' };
            }

            var sql = [
                'SELECT custrecord_pd_lmx_wms_intr_invoice_xml AS url',
                'FROM customrecord_pd_lmx_integrat_credentials',
                'WHERE isinactive = \'F\'',
                'FETCH FIRST 1 ROWS ONLY'
            ].join(' ');

            var result = query.runSuiteQL({ query: sql });
            var rows = result.asMappedResults();

            if (!rows || rows.length === 0) {
                log.error({ title: 'registerInvoiceXmlLMX.sendInvoice', details: 'URL de envio de NF nao encontrada.' });
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
            log.error({ title: 'registerInvoiceXmlLMX.sendInvoice - erro', details: JSON.stringify(error.message) });
            return { success: false, statusCode: null, body: error.message };
        }
    }

    return {
        sendInvoice: sendInvoice
    };
});
