/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Use case: recalcula e atualiza custentity_tst_amostras_abertas no cliente
 */
define([
    'N/log',
    '../Models/Amostra.model',
    '../Models/Customer.model',
], function (log, AmostraModel, CustomerModel) {

    function execute(clienteId) {
        if (isNullOrEmpty(clienteId)) {
            log.error({
                title: 'AtualizarContadorAmostras | execute - clienteId inválido',
                details: clienteId,
            });
            return;
        }

        const quantidade = AmostraModel.countEnviadasByCliente(clienteId);
        CustomerModel.updateAmostrasAbertas(clienteId, quantidade);

        log.audit({
            title: 'AtualizarContadorAmostras | execute - success',
            details: JSON.stringify({ clienteId, quantidade }),
        });
    }

    return { execute };
});
