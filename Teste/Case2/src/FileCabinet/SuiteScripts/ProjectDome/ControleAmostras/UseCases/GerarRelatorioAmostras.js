/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Use case: busca amostras enviadas há mais de 30 dias, agrupa por representante e envia CSV por email
 */
define([
    'N/log',
    'N/email',
    'N/file',
    'N/runtime',
    '../Models/Amostra.model',
    '../Models/Customer.model',
], function (log, email, file, runtime, AmostraModel, CustomerModel) {

    function execute() {
        const amostras = AmostraModel.getEnviadasHaMais30Dias();

        if (isNullOrEmpty(amostras)) {
            log.audit({ title: 'GerarRelatorioAmostras | execute - nenhuma amostra pendente', details: '' });
            return;
        }

        const clienteIds = [...new Set(amostras.map(function (a) { return a.clienteId.id; }))];
        const representanteMap = CustomerModel.getRepresentantesByClienteIds(clienteIds);

        // Agrupa amostras por representante; clientes sem representante são ignorados no envio
        const porRepresentante = {};
        amostras.forEach(function (amostra) {
            const clienteId      = amostra.clienteId.id;
            const representanteId = representanteMap[clienteId];
            if (isNullOrEmpty(representanteId)) return;

            if (!porRepresentante[representanteId]) {
                porRepresentante[representanteId] = [];
            }
            porRepresentante[representanteId].push(amostra);
        });

        const authorId = runtime.getCurrentUser().id;
        const hoje     = new Date().format({ type: 'pt-br' });

        Object.keys(porRepresentante).forEach(function (representanteId) {
            const linhas    = porRepresentante[representanteId];
            const csvContent = _buildCsv(linhas);

            const csvFile = file.create({
                name:     'amostras_pendentes_rep' + representanteId + '_' + hoje + '.csv',
                fileType: file.Type.CSV,
                contents: csvContent,
            });

            email.send({
                author:      authorId,
                recipients:  [parseInt(representanteId)],
                subject:     'Relatório Mensal — Amostras Pendentes (' + hoje + ')',
                body: [
                    'Olá,',
                    '',
                    'Segue em anexo o relatório de amostras enviadas há mais de 30 dias e ainda não devolvidas.',
                    '',
                    'Atenciosamente,',
                    'ProjectDome',
                ].join('\n'),
                attachments: [csvFile],
            });

            log.audit({
                title: 'GerarRelatorioAmostras | execute - email enviado',
                details: JSON.stringify({ representanteId, quantidadeAmostras: linhas.length }),
            });
        });
    }

    function _buildCsv(amostras) {
        const linhas = ['Cliente;Item;Quantidade;Data de Envio'];
        amostras.forEach(function (a) {
            const clienteNome = ifNullOrEmpty(a.clienteNome, '');
            const itemNome    = ifNullOrEmpty(a.itemNome, '');
            const quantidade  = ifNullOrEmpty(a.quantidade, 0);
            const dataEnvio   = isNullOrEmpty(a.dataEnvio) ? '' : a.dataEnvio.format({ type: 'pt-br' });
            linhas.push([clienteNome, itemNome, quantidade, dataEnvio].join(';'));
        });
        return linhas.join('\r\n');
    }

    return { execute };
});
