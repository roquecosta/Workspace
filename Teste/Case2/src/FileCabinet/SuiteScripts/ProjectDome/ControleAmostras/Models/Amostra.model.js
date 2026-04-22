/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 * @description Model do record customrecord_tst_amostra
 */
define([
    'N/log',
    'N/record',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
], function (log, record, record_util, search_util) {

    const TYPE = 'customrecord_tst_amostra';

    const STATUS = {
        ENVIADA:   'enviada',
        DEVOLVIDA: 'devolvida',
        PERDIDA:   'perdida',
    };

    const FIELDS = {
        internalId: { name: 'internalid' },
        cliente:    { name: 'custrecord_tst_amostra_cliente', type: 'select' },
        item:       { name: 'custrecord_tst_amostra_item',    type: 'select' },
        quantidade: { name: 'custrecord_tst_amostra_quantidade', type: 'float' },
        dataEnvio:  { name: 'custrecord_tst_amostra_data_envio', type: 'date' },
        status:     { name: 'custrecord_tst_amostra_status',  type: 'select' },
        pedido:     { name: 'custrecord_tst_amostra_pedido',  type: 'select' },
    };

    // Filtro de fórmula para comparar o texto do status (evita dependência do internalId da lista)
    const FILTER_STATUS = { name: 'formulatext', formula: '{custrecord_tst_amostra_status}' };

    function load(id) {
        return record.load({ type: TYPE, id });
    }

    function readData(rec) {
        return record_util.handler(rec).data({ fields: FIELDS });
    }

    function countEnviadasByCliente(clienteId) {
        if (isNullOrEmpty(clienteId)) return 0;
        const results = search_util.all({
            type: TYPE,
            columns: {
                internalId: FIELDS.internalId,
            },
            query: search_util
                .where(search_util.query(FIELDS.cliente, 'anyof', [clienteId]))
                .and(search_util.query(FILTER_STATUS, 'is', STATUS.ENVIADA)),
        }) || [];
        return results.length;
    }

    function getEnviadasHaMais30Dias() {
        const dataLimite = new Date().add('day', -30);
        return search_util.all({
            type: TYPE,
            columns: {
                internalId:  { name: 'internalid' },
                clienteId:   FIELDS.cliente,
                clienteNome: { name: 'companyname', join: 'custrecord_tst_amostra_cliente' },
                itemNome:    { name: 'itemid',      join: 'custrecord_tst_amostra_item' },
                quantidade:  FIELDS.quantidade,
                dataEnvio:   FIELDS.dataEnvio,
            },
            query: search_util
                .where(search_util.query(FILTER_STATUS, 'is', STATUS.ENVIADA))
                .and(search_util.query(FIELDS.dataEnvio, 'onorbefore', dataLimite)),
        }) || [];
    }

    return {
        TYPE,
        STATUS,
        FIELDS,
        load,
        readData,
        countEnviadasByCliente,
        getEnviadasHaMais30Dias,
    };
});
