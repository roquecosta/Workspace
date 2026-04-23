/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/log'], function (query, log) {
    'use strict';

    function itemList(salesOrderId) {
        try {
            var sql = [
                'SELECT',
                '  i.upccode   AS upccode,',
                '  tl.quantity AS quantity',
                'FROM transaction t',
                'JOIN transactionline tl ON tl.transaction = t.id',
                'JOIN item i ON i.id = tl.item',
                'WHERE t.id = ' + salesOrderId,
                '  AND tl.mainline = \'F\'',
                '  AND tl.taxline  = \'F\'',
                '  AND tl.isclosed = \'F\''
            ].join(' ');

            var result = query.runSuiteQL({ query: sql });
            var rows = result.asMappedResults();

            return (rows || []).map(function (row) {
                return {
                    upccode:  row.upccode,
                    quantity: row.quantity
                };
            });

        } catch (error) {
            log.error({ title: 'itemsData.itemList - erro - salesOrderId: ' + salesOrderId, details: JSON.stringify(error.message) });
            return [];
        }
    }

    return {
        itemList: itemList
    };
});
