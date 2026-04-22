/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Use case: envia email ao representante quando amostra é marcada como devolvida
 */
define([
    'N/log',
    'N/email',
    'N/runtime',
    '../Models/Customer.model',
], function (log, email, runtime, CustomerModel) {

    function execute(params) {
        const { amostraId, clienteId } = params;

        const customerRec  = CustomerModel.load(clienteId);
        const customerData = CustomerModel.readData(customerRec);

        if (isNullOrEmpty(customerData.representante)) {
            // Sem representante — ignorar silenciosamente conforme regra de negócio
            log.debug({
                title: 'NotificarDevolucao | execute - cliente sem representante, email ignorado',
                details: JSON.stringify({ amostraId, clienteId }),
            });
            return;
        }

        const representanteId = customerData.representante.id;
        const authorId        = runtime.getCurrentUser().id;

        email.send({
            author:     authorId,
            recipients: [representanteId],
            subject:    'Devolução de Amostra — ' + customerData.companyName,
            body: [
                'Olá,',
                '',
                'A amostra #' + amostraId + ' vinculada ao cliente ' + customerData.companyName + ' foi registrada como devolvida.',
                '',
                'Por favor, verifique no NetSuite para confirmar o recebimento.',
                '',
                'Atenciosamente,',
                'ProjectDome',
            ].join('\n'),
        });

        log.audit({
            title: 'NotificarDevolucao | execute - email enviado',
            details: JSON.stringify({ amostraId, clienteId, representanteId }),
        });
    }

    return { execute };
});
