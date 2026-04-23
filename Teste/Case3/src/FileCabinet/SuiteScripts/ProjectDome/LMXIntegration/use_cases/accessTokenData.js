/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/query', 'N/log'], function (https, query, log) {
    'use strict';

    function getAccessToken() {
        try {
            var sql = [
                'SELECT',
                '  custrecord_pd_lmx_wms_intregrat_username AS username,',
                '  custrecord_pd_lmx_wms_intr_password      AS password,',
                '  custrecord_pd_lmx_wms_intr_client_id     AS client_id,',
                '  custrecord_pd_lmx_wms_intr_client_secret AS client_secret,',
                '  custrecord_pd_lmx_wms_intr_grant_type    AS grant_type,',
                '  custrecord_pd_lmx_wms_intr_scope         AS scope,',
                '  custrecord_pd_lmx_wms_intr_oauth_tkn_url AS oauth_url',
                'FROM customrecord_pd_lmx_integrat_credentials',
                'WHERE isinactive = \'F\'',
                'FETCH FIRST 1 ROWS ONLY'
            ].join(' ');

            var result = query.runSuiteQL({ query: sql });
            var rows = result.asMappedResults();

            if (!rows || rows.length === 0) {
                log.error({ title: 'accessTokenData.getAccessToken', details: 'Nenhuma credencial encontrada.' });
                return null;
            }

            var cred = rows[0];

            var body = [
                'grant_type='    + encodeURIComponent(cred.grant_type),
                'username='      + encodeURIComponent(cred.username),
                'password='      + encodeURIComponent(cred.password),
                'client_id='     + encodeURIComponent(cred.client_id),
                'client_secret=' + encodeURIComponent(cred.client_secret),
                'scope='         + encodeURIComponent(cred.scope || '')
            ].join('&');

            var response = https.post({
                url: cred.oauth_url,
                body: body,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            var parsed = JSON.parse(response.body);
            return parsed.access_token || null;

        } catch (error) {
            log.error({ title: 'accessTokenData.getAccessToken - erro', details: JSON.stringify(error.message) });
            return null;
        }
    }

    return {
        getAccessToken: getAccessToken
    };
});
