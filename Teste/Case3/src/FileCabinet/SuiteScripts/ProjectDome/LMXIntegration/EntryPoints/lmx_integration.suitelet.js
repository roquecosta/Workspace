/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log', '../use_cases/accessTokenData'], function (log, accessTokenData) {
    'use strict';

    function onRequest(context) {
        var response = context.response;
        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        try {
            var token = accessTokenData.getAccessToken();

            response.write(JSON.stringify({ token: token }));

        } catch (error) {
            log.error({ title: 'lmx_integration.suitelet - onRequest', details: JSON.stringify(error.message) });
            response.write(JSON.stringify({ token: null, error: error.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
