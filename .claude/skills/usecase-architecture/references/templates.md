# Templates de código — NetSuite UseCase Architecture

## Template: EntryPoint (UserEventScript)

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author <Nome> - ProjectDome
 */
define([
    'N/log',
    '../Models/NomeRecord.model',
    '../UseCases/NomeAcao',
], function (log, NomeRecordModel, NomeAcao) {

    function afterSubmit(context) {
        const newRecord = context.newRecord;

        const fieldValue = newRecord.getValue({
            fieldId: NomeRecordModel.FIELDS.campoRelevante.name
        });

        if (isNullOrEmpty(fieldValue)) {
            log.error({ title: 'NomeScript | afterSubmit - campo não encontrado', details: fieldValue });
            return;
        }

        NomeAcao.execute(fieldValue);
    }

    return { afterSubmit };
});
```

---

## Template: UseCase

```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Use case: <descrição do que faz>
 */
define([
    'N/log',
    '../Models/NomeRecord.model',
    '../Models/OutroRecord.model',
], function (log, NomeRecordModel, OutroRecordModel) {

    function execute(param) {
        if (isNullOrEmpty(param)) {
            log.error({ title: 'NomeUseCase | execute - param inválido', details: param });
            return;
        }

        const records = NomeRecordModel.getByRelatedId(param);
        const total = NomeRecordModel.sumValues(records);

        const rec = OutroRecordModel.load(param);
        OutroRecordModel.updateBalances(rec, { total });

        log.audit({
            title: 'NomeUseCase | execute - success',
            details: JSON.stringify({ param, total })
        });
    }

    return { execute };
});
```

---

## Template: Model

```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author <Nome> - ProjectDome
 * @description Model for <NomeRecord> record
 */
define([
    'N/log',
    'N/record',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
], function (log, record, record_util, search_util) {

    const TYPE = 'customrecord_nome_interno';

    const FIELDS = {
        internalId:   { name: 'internalid' },
        campoTexto:   { name: 'custrecord_campo_texto' },
        campoSelect:  { name: 'custrecord_campo_select' },
        campoValor:   { name: 'custrecord_campo_valor' },
    };

    const SUBLIST_ID = 'sublistId';
    const SUBLIST_FIELDS = {
        nomeAtributo: { name: 'columnfieldid' }
    };

    function readData(rec) {
        return record_util
            .handler(rec)
            .data({
                fields: FIELDS,
                sublists: {
                    sublistName: {
                        id: SUBLIST_ID,
                        fields: SUBLIST_FIELDS
                    }
                }
            });
    }

    function load(id) {
        return record.load({ type: TYPE, id });
    }

    function getByRelatedId(relatedId) {
        if (isNullOrEmpty(relatedId)) return [];
        return search_util.all({
            type: TYPE,
            columns: FIELDS,
            query: search_util.where(
                search_util.query(FIELDS.campoSelect, 'anyof', relatedId)
            ),
        }) || [];
    }

    function sumValues(records) {
        return (records || []).reduce((acc, r) => {
            return acc + (parseFloat(r.campoValor) || 0);
        }, 0);
    }

    function create(data) {
        const rec = record.create({ type: TYPE });
        const newId = record_util
            .handler(rec)
            .set({
                [FIELDS.campoTexto.name]:  data.campoTexto,
                [FIELDS.campoValor.name]:  data.campoValor,
            })
            .save();

        log.audit({ title: 'NomeRecord.model | create - success', details: newId });
        return newId;
    }

    function updateBalances(rec, data) {
        return record_util
            .handler(rec)
            .set({
                [FIELDS.campoValor.name]: data.total,
            })
            .save({ ignoreMandatoryFields: true });
    }

    return {
        TYPE,
        FIELDS,
        readData,
        load,
        getByRelatedId,
        sumValues,
        create,
        updateBalances,
    };
});
```