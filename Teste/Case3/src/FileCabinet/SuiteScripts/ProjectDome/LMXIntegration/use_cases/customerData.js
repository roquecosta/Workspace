/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {
    'use strict';

    const FIELDS = {
        FED_TAX_REG:  'custentity_brl_entity_t_fed_tax_reg',
        COMPANY_NAME: 'companyname',
        EMAIL:        'email',
        PHONE:        'phone',
        STATE_TX_REG: 'custentity_brl_entity_t_state_tx_reg'
    };

    const ADDR_FIELDS = {
        COMPLEMENT: 'custrecord_brl_addrform_t_complement',
        ADDRESS1:   'addr1',
        ADDRESS2:   'addr2',
        CITY:       'city',
        STATE:      'state',
        ZIP:        'zip',
        COUNTRY:    'country'
    };

    function load(id) {
        return record.load({
            type: record.Type.CUSTOMER,
            id: id,
            isDynamic: false
        });
    }

    function readData(obj) {
        // Leitura do subrecord de endereco (primeiro endereco do addressbook)
        var addrData = {};
        try {
            var addrCount = obj.getLineCount({ sublistId: 'addressbook' });
            if (addrCount > 0) {
                var addrSubrecord = obj.getSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress',
                    line: 0
                });
                addrData = {
                    address1:   addrSubrecord.getValue({ fieldId: ADDR_FIELDS.ADDRESS1 }),
                    address2:   addrSubrecord.getValue({ fieldId: ADDR_FIELDS.ADDRESS2 }),
                    city:       addrSubrecord.getValue({ fieldId: ADDR_FIELDS.CITY }),
                    state:      addrSubrecord.getValue({ fieldId: ADDR_FIELDS.STATE }),
                    zip:        addrSubrecord.getValue({ fieldId: ADDR_FIELDS.ZIP }),
                    country:    addrSubrecord.getValue({ fieldId: ADDR_FIELDS.COUNTRY }),
                    complement: addrSubrecord.getValue({ fieldId: ADDR_FIELDS.COMPLEMENT })
                };
            }
        } catch (e) {
            log.error({ title: 'customerData.readData - subrecord endereco', details: JSON.stringify(e.message) });
        }

        return {
            fedTaxReg:   obj.getValue({ fieldId: FIELDS.FED_TAX_REG }),
            companyName: obj.getValue({ fieldId: FIELDS.COMPANY_NAME }),
            email:       obj.getValue({ fieldId: FIELDS.EMAIL }),
            phone:       obj.getValue({ fieldId: FIELDS.PHONE }),
            stateTxReg:  obj.getValue({ fieldId: FIELDS.STATE_TX_REG }),
            address:     addrData
        };
    }

    return {
        load: load,
        readData: readData
    };
});
