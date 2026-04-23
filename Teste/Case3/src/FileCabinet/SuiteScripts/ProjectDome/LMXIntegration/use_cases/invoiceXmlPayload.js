/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/file', 'N/log'], function (query, file, log) {
    'use strict';

    function buildPayload(invoiceId) {
        try {
            var sql = [
                'SELECT',
                '  custbody_brl_tran_dc_cert_xml_file AS fileId,',
                '  tranid                              AS tranid',
                'FROM transaction',
                'WHERE id = ' + invoiceId
            ].join(' ');

            var result = query.runSuiteQL({ query: sql });
            var rows = result.asMappedResults();

            if (!rows || rows.length === 0) {
                log.error({ title: 'invoiceXmlPayload.buildPayload', details: 'Invoice nao encontrada: ' + invoiceId });
                return null;
            }

            var row = rows[0];
            var fileId = row.fileid;
            var tranid = row.tranid;

            if (!fileId) {
                log.error({ title: 'invoiceXmlPayload.buildPayload', details: 'Campo custbody_brl_tran_dc_cert_xml_file vazio na invoice: ' + invoiceId });
                return null;
            }

            var xmlFile = file.load({ id: fileId });
            var fileContent = xmlFile.getContents();

            return {
                conteudoXml: fileContent,
                tipo: 'ATACADO',
                numeroNf: String(tranid)
            };

        } catch (error) {
            log.error({ title: 'invoiceXmlPayload.buildPayload - erro', details: JSON.stringify(error.message) });
            return null;
        }
    }

    return {
        buildPayload: buildPayload
    };
});
