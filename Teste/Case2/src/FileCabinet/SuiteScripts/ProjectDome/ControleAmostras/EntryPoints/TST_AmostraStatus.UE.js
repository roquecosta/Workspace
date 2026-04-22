/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Project Dome - Roque Costa
 */
define([
    'N/log',
    '../Models/Amostra.model',
    '../UseCases/NotificarDevolucao',
    '../UseCases/AtualizarContadorAmostras',
    '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util',
], function (log, AmostraModel, NotificarDevolucao, AtualizarContadorAmostras) {

    function afterSubmit(context) {
        try {
            const newRecord = context.newRecord;
            const oldRecord = context.oldRecord;

            const clienteId = newRecord.getValue({ fieldId: AmostraModel.FIELDS.cliente.name });

            if (isNullOrEmpty(clienteId)) {
                log.error({
                    title: 'TST_AmostraStatus.UE | afterSubmit - clienteId não encontrado',
                    details: JSON.stringify(newRecord.id),
                });
                return;
            }

            const newStatus = (newRecord.getText({ fieldId: AmostraModel.FIELDS.status.name }) || '').toLowerCase();
            const oldStatus = ((oldRecord && oldRecord.getText({ fieldId: AmostraModel.FIELDS.status.name })) || '').toLowerCase();

            const statusMudouParaDevolvida =
                newStatus === AmostraModel.STATUS.DEVOLVIDA &&
                oldStatus !== AmostraModel.STATUS.DEVOLVIDA;

            if (statusMudouParaDevolvida) {
                NotificarDevolucao.execute({ amostraId: newRecord.id, clienteId });
            }

            AtualizarContadorAmostras.execute(clienteId);
        } catch (error) {
            log.error({
                title: 'TST_AmostraStatus.UE | afterSubmit - erro',
                details: JSON.stringify(error.message),
            });
        }
    }

    return { afterSubmit };
});
