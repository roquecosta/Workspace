/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define([], function () {
    'use strict';

    function parseDateLMX(str) {
        return new Date(str);
    }

    return {
        parseDateLMX: parseDateLMX
    };
});
