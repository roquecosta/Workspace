/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/log'], function (log) {
    'use strict';

    function onlyNumbers(str) {
        if (!str) return '';
        return String(str).replace(/\D/g, '');
    }

    function buildPayload(so, cust, items) {
        try {
            var cnpjCpf           = onlyNumbers(cust.fedTaxReg);
            var cep               = onlyNumbers(cust.address ? cust.address.zip : '');
            var telefone          = onlyNumbers(cust.phone);
            var cnpjTransportadora = onlyNumbers(so.carrFedTaxReg);

            var produtos = (items || []).map(function (item) {
                return {
                    ean:        item.upccode || '',
                    quantidade: item.quantity || 0
                };
            });

            // dataSeparacao hard-coded — pendencia documentada no manifest (bloqueio em aberto)
            var payload = {
                pedidoCliente:      so.tranid,
                cnpjCpf:            cnpjCpf,
                nomeDestinatario:   cust.companyName || '',
                email:              cust.email || '',
                telefone:           telefone,
                cep:                cep,
                endereco:           cust.address ? (cust.address.address1 || '') : '',
                bairro:             cust.address ? (cust.address.address2 || '') : '',
                cidade:             cust.address ? (cust.address.city || '') : '',
                estado:             cust.address ? (cust.address.state || '') : '',
                cnpjTransportadora: cnpjTransportadora,
                nomeTransportadora: so.shippingVendorName || '',
                dataSeparacao:      '2026-12-09',
                produtos:           produtos
            };

            return payload;

        } catch (error) {
            log.error({ title: 'orderPayload.buildPayload - erro', details: JSON.stringify(error.message) });
            return null;
        }
    }

    return {
        buildPayload: buildPayload
    };
});
