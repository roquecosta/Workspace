/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @author Project Dome - Roque Costa
 */
define([
    'N/log',
    '../UseCases/GerarRelatorioAmostras',
    '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util',
], function (log, GerarRelatorioAmostras) {

    function execute(context) {
        try {
            GerarRelatorioAmostras.execute();
        } catch (error) {
            log.error({
                title: 'TST_RelatorioAmostras.SS | execute - erro',
                details: JSON.stringify(error.message),
            });
        }
    }

    return { execute };
});
