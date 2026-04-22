/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 * @description Model do record customer — campos customizados do projeto ControleAmostras
 */
define([
    'N/log',
    'N/record',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
], function (log, record, record_util, search_util) {

    const TYPE = 'customer';

    const FIELDS = {
        internalId:      { name: 'internalid' },
        companyName:     { name: 'companyname' },
        representante:   { name: 'custentity_ff_representante', type: 'select' }, // internalId do campo: 1847
        amostrasAbertas: { name: 'custentity_tst_amostras_abertas', type: 'integer' },
    };

    function load(id) {
        return record.load({ type: TYPE, id });
    }

    function readData(rec) {
        return record_util.handler(rec).data({ fields: FIELDS });
    }

    function updateAmostrasAbertas(clienteId, quantidade) {
        const rec = load(clienteId);
        record_util.handler(rec).set({
            [FIELDS.amostrasAbertas.name]: quantidade,
        }).save({ ignoreMandatoryFields: true });

        log.audit({
            title: 'Customer.model | updateAmostrasAbertas - success',
            details: JSON.stringify({ clienteId, quantidade }),
        });
    }

    function getRepresentantesByClienteIds(clienteIds) {
        if (isNullOrEmpty(clienteIds)) return {};
        const results = search_util.all({
            type: TYPE,
            columns: {
                internalId:    FIELDS.internalId,
                representante: FIELDS.representante,
            },
            query: search_util.where(
                search_util.query(FIELDS.internalId, 'anyof', clienteIds)
            ),
        }) || [];

        return results.reduce(function (acc, r) {
            acc[r.id] = isNullOrEmpty(r.representante) ? null : r.representante.id;
            return acc;
        }, {});
    }

    return {
        TYPE,
        FIELDS,
        load,
        readData,
        updateAmostrasAbertas,
        getRepresentantesByClienteIds,
    };
});
