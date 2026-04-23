/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {
    'use strict';

    const FIELDS = {
        TRAN_ID:           'tranid',
        CUST_FED_TX_REG:   'custbody_brl_tran_t_cust_fed_tx_reg',
        ENTITY:            'entity',
        CARR_FED_TAX_REG:  'custbody_brl_tran_t_carr_fed_tax_reg',
        SHIPPING_VENDOR:   'custbody_brl_tran_l_shipping_vendor'
    };

    function salesOrderObj(id) {
        return record.load({
            type: record.Type.SALES_ORDER,
            id: id,
            isDynamic: false
        });
    }

    function readData(obj) {
        return {
            tranid:          obj.getValue({ fieldId: FIELDS.TRAN_ID }),
            cnpjCpf:         obj.getValue({ fieldId: FIELDS.CUST_FED_TX_REG }),
            entity:          obj.getValue({ fieldId: FIELDS.ENTITY }),
            carrFedTaxReg:   obj.getValue({ fieldId: FIELDS.CARR_FED_TAX_REG }),
            shippingVendor:  obj.getValue({ fieldId: FIELDS.SHIPPING_VENDOR })
        };
    }

    return {
        salesOrderObj: salesOrderObj,
        readData: readData
    };
});
