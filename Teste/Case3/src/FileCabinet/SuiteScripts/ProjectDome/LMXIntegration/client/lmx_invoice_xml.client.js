/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/url', 'N/https', 'N/log'], function (url, https, log) {
    'use strict';

    const SCRIPT_TOKEN           = 'customscript_pd_lmx_integration_rt';
    const DEPLOY_TOKEN           = 'customdeploy_pd_lmx_integration_rt';
    const SCRIPT_REGISTER_INV    = 'customscript_pd_lmx_intr_regt_invoice_st';
    const DEPLOY_REGISTER_INV    = 'customdeploy_pd_lmx_intr_regt_invoice_st';
    const SCRIPT_SAVE_INV_RETURN = 'customscript_pd_lmx_intr_status_invc_st';
    const DEPLOY_SAVE_INV_RETURN = 'customdeploy_pd_lmx_intr_status_invc_st';

    function pageInit(context) {
        // pageInit intencional vazio — inicializacao gerenciada pelo botao
    }

    function saveInvoiceReturn(invoiceId, successFlag, mensagem, erro, dataEnvio) {
        try {
            var saveReturnUrl = url.resolveScript({ scriptId: SCRIPT_SAVE_INV_RETURN, deploymentId: DEPLOY_SAVE_INV_RETURN, returnExternalUrl: false });
            https.post({
                url: saveReturnUrl,
                body: JSON.stringify({
                    invoiceId: invoiceId,
                    success:   successFlag,
                    mensagem:  mensagem  || '',
                    erro:      erro      || '',
                    dataEnvio: dataEnvio || ''
                }),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            log.error({ title: 'lmx_invoice_xml.client - saveInvoiceReturn', details: JSON.stringify(e.message) });
        }
    }

    function sendInvoiceXmlToLMX(invoiceId) {
        var accessToken = null;

        try {
            // 1. Obtencao do Bearer Token
            var tokenUrl = url.resolveScript({ scriptId: SCRIPT_TOKEN, deploymentId: DEPLOY_TOKEN, returnExternalUrl: false });
            var tokenResp = https.get({ url: tokenUrl });
            var tokenData = JSON.parse(tokenResp.body);
            accessToken = tokenData.token;

            if (!accessToken) {
                saveInvoiceReturn(invoiceId, false, null, 'Erro ao obter token de autenticacao.', null);
                alert('Erro ao obter token de autenticacao. Verifique as credenciais LMX.');
                return;
            }

            // 2. Envio do XML ao WMS via Suitelet register_invoice_xml
            var registerUrl = url.resolveScript({ scriptId: SCRIPT_REGISTER_INV, deploymentId: DEPLOY_REGISTER_INV, returnExternalUrl: false });
            var registerResp = https.post({
                url: registerUrl,
                body: JSON.stringify({ invoiceId: invoiceId, accessToken: accessToken }),
                headers: { 'Content-Type': 'application/json' }
            });
            var registerResult = JSON.parse(registerResp.body);

            // 3. Salvamento do retorno na Invoice
            var now = new Date();
            var pad = function (n) { return n < 10 ? '0' + n : String(n); };
            var dataEnvio = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() +
                ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

            saveInvoiceReturn(
                invoiceId,
                registerResult.success,
                registerResult.success ? (registerResult.body || 'Enviado com sucesso') : null,
                registerResult.success ? null : (registerResult.body || 'Erro no envio'),
                dataEnvio
            );

            if (registerResult.success) {
                alert('XML da NF enviado com sucesso para a LMX!');
            } else {
                alert('Falha ao enviar XML da NF: ' + (registerResult.body || 'Erro desconhecido'));
            }

        } catch (error) {
            log.error({ title: 'lmx_invoice_xml.client - sendInvoiceXmlToLMX - invoiceId: ' + invoiceId, details: JSON.stringify(error.message) });
            // Tenta salvar retorno de falha antes de encerrar
            saveInvoiceReturn(invoiceId, false, null, error.message, null);
            alert('Erro ao enviar XML da NF para a LMX: ' + error.message);
        }
    }

    return {
        pageInit: pageInit,
        sendInvoiceXmlToLMX: sendInvoiceXmlToLMX
    };
});
