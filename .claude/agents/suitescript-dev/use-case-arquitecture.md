# Arquitetura: UseCase Architecture — Netsuite

Use este recurso ao criar ou modificar scripts que seguem o padrão arquitetural **EntryPoint / UseCase / Model** da ProjectDome.

---

## Quando usar este padrão

Use sempre que o script envolver:
- Mais de uma operação de leitura/escrita em records
- Regras de negócio que precisam ser reutilizadas em outros scripts
- Lógica que justifique separação de responsabilidades

Scripts simples de uma única operação podem usar apenas o EntryPoint com o NetsuiteTools diretamente.

---

## Estrutura de pastas

```
<projeto>/
├── EntryPoints/
│   └── <Descricao>.<tipo>.js       ← apenas orquestração, sem regra de negócio
├── UseCases/
│   └── <NomeAção>.js               ← regras de negócio, exporta execute()
└── Models/
    └── <NomeRecord>.model.js       ← acesso a dados, TYPE, FIELDS, funções CRUD
```

---

## Responsabilidades de cada camada

### EntryPoint
- Ponto de entrada do SuiteScript (UE, MR, CS, SL)
- **Não contém regra de negócio**
- Apenas lê o contexto, extrai o que precisa e delega para UseCases
- Importa Models apenas para acessar `FIELDS` (ex: `getValue`)
- Nunca acessa records diretamente — isso é responsabilidade do Model

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

### UseCase
- Contém as regras de negócio
- Exporta sempre uma função `execute()` como ponto de entrada
- Pode importar múltiplos Models
- Nunca usa `record.load` / `record.create` diretamente — delega ao Model
- Pode chamar outros UseCases se necessário

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

### Model
- Responsável por **tudo** que toca o record: leitura, escrita, busca
- Declara `TYPE` e `FIELDS` como constantes exportadas
- Exporta funções CRUD semânticas (ex: `create`, `load`, `getByCaixaPai`)
- Nunca contém regra de negócio — apenas acesso a dados
- Usa sempre `record_util` e `search_util` da NetsuiteTools

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

    const SUBLIST_ID = 'sublistId'
    const SUBLIST_FIELDS = {
        nomeAtributo: { name: 'columnfieldid' }
    }

    function readData(rec) {
        return record_util
            .handler(rec)
            .data({ 
                fields: FIELDS,
                sublists: {
                    sublistName : {
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

---

## Regras da arquitetura

- **EntryPoint nunca acessa record diretamente** — sempre via UseCase ou Model
- **UseCase nunca usa `record.load` / `record.create`** — sempre via Model
- **Model nunca contém `if` de regra de negócio** — apenas operações de dados
- Funções do Model devem ter nomes semânticos que reflitam o domínio (`getByCaixaPai`, `markClosingStep1`)
- Cada UseCase deve ter uma única responsabilidade (ex: `UpdateCaixaBalance`, `ValidateCaixaStatus`)
- Logs de erro sempre no formato: `'NomeArquivo | nomeFuncao - descrição'`

---

## Padrão de log

```javascript
// Erro com detalhe
log.error({ title: 'NomeArquivo | nomeFuncao - descrição do erro', details: JSON.stringify(valor) });

// Sucesso em operação importante
log.audit({ title: 'NomeArquivo | nomeFuncao - success', details: JSON.stringify({ id, campo }) });
```