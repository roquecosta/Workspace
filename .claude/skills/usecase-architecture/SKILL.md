---
name: usecase-architecture
description: >
  Architectural reference for creating new NetSuite scripts following the EntryPoint / UseCase / Model pattern used at ProjectDome.
  Use this skill ALWAYS when creating, scaffolding, or modifying NetSuite scripts, including UserEvent (UE), MapReduce (MR),
  Client Script (CS), or Suitelet (SL) types. Also trigger when the user mentions terms like "new script", "new NetSuite project",
  "SuiteScript", "EntryPoint", "UseCase", "Model", "custom record", "pd_c_netsuite_tools", "record_util", "search_util",
  or any business logic creation in NetSuite.
  Also trigger when the user mentions "utils", "utilities", "helper", "constants", "constantes", "funções utilitárias",
  or asks where to place shared/reusable logic that doesn't belong to a specific layer.
  This skill defines the mandatory folder structure, the responsibilities of each layer, and the code templates to follow.
---

# Arquitetura UseCase — NetSuite (ProjectDome)

## Quando aplicar este padrão

Use sempre que o script envolver:
- Mais de uma operação de leitura/escrita em records
- Regras de negócio reutilizáveis entre scripts
- Lógica que justifique separação de responsabilidades

> Scripts simples de operação única podem usar apenas o EntryPoint com NetsuiteTools diretamente.

---

## Estrutura de pastas obrigatória

```
<projeto>/
├── EntryPoints/
│   └── <Descricao>.<tipo>.js       ← apenas orquestração, sem regra de negócio
├── UseCases/
│   └── <NomeAção>.js               ← regras de negócio, exporta execute()
├── Models/
│   └── <NomeRecord>.model.js       ← acesso a dados, TYPE, FIELDS, funções CRUD
├── Utils/
│   └── <dominio>.util.js           ← funções puras e reutilizáveis (ex: math.util.js)
└── Constants/
    └── <dominio>.constants.js      ← valores fixos compartilhados entre camadas
```

---

## Responsabilidades de cada camada

### EntryPoint
- Ponto de entrada do SuiteScript (UE, MR, CS, SL)
- **Não contém regra de negócio**
- Lê o contexto, extrai o necessário e delega para UseCases
- Importa Models apenas para acessar `FIELDS` (ex: `getValue`)
- **Nunca acessa records diretamente** — isso é responsabilidade do Model

### UseCase
- Contém as regras de negócio
- Exporta sempre uma função `execute()` como ponto de entrada
- Pode importar múltiplos Models
- **Nunca usa `record.load` / `record.create` diretamente** — delega ao Model
- Pode chamar outros UseCases se necessário

### Model
- Responsável por **tudo** que toca o record: leitura, escrita, busca
- Declara `TYPE` e `FIELDS` como constantes exportadas
- Exporta funções CRUD semânticas (ex: `create`, `load`, `getByCaixaPai`)
- **Nunca contém regra de negócio** — apenas acesso a dados
- Usa sempre `record_util` e `search_util` da NetsuiteTools

### Utils
- Contém **funções puras e reutilizáveis** que não pertencem a nenhuma camada específica
- Pode ser importado por qualquer camada (EntryPoint, UseCase, Model)
- **Nunca acessa records, não usa módulos N/ com efeitos colaterais**
- Exemplos de uso: arredondamento, formatação de valores, manipulação de strings/datas
- Organize por domínio funcional: `math.util.js`, `date.util.js`, `string.util.js`
- Cada função deve ser **pura**: mesmo input → mesmo output, sem efeitos colaterais

### Constants
- Centraliza **valores fixos** compartilhados entre camadas
- Pode ser importado por qualquer camada (EntryPoint, UseCase, Model)
- **Nunca contém lógica** — apenas declarações de valores
- Organize por domínio de negócio: `accounts.constants.js`, `status.constants.js`
- Use `Object.freeze()` para garantir imutabilidade em runtime
- Exemplos: IDs de contas específicas, tipos de registro fixos, códigos de status

---

## Regras da arquitetura

- EntryPoint nunca acessa record diretamente — sempre via UseCase ou Model
- UseCase nunca usa `record.load` / `record.create` — sempre via Model
- Model nunca contém `if` de regra de negócio — apenas operações de dados
- Funções do Model devem ter nomes semânticos que reflitam o domínio (`getByCaixaPai`, `markClosingStep1`)
- Cada UseCase deve ter uma única responsabilidade (ex: `UpdateCaixaBalance`, `ValidateCaixaStatus`)
- **Utils nunca importam Models ou UseCases** — a dependência é sempre de cima para baixo
- **Constants nunca importam nada** — são declarações puras sem dependências
- Logs de erro sempre no formato: `'NomeArquivo | nomeFuncao - descrição'`

---

## Padrão de log

```javascript
// Erro com detalhe
log.error({ title: 'NomeArquivo | nomeFuncao - descrição do erro', details: valor });

// Sucesso em operação importante
log.audit({ title: 'NomeArquivo | nomeFuncao - success', details: JSON.stringify({ id, campo }) });
```

---

## Templates de código

Os templates completos de EntryPoint, UseCase e Model estão em `references/templates.md`. Leia esse arquivo ao gerar código para qualquer uma dessas camadas.

### Template: Utils

```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Utility functions for <domínio> (ex: math, date, string)
 */
define([], function () {

    /**
     * Arredonda um valor para N casas decimais de forma específica.
     * @param {number} value
     * @param {number} decimals
     * @returns {number}
     */
    function roundValue(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    return { roundValue };
});
```

### Template: Constants

```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Constants for <domínio> (ex: accounts, status, record types)
 */
define([], function () {

    const ACCOUNT_IDS = Object.freeze({
        CONTA_ESPECIFICA: 42,
        OUTRA_CONTA:      99,
    });

    const STATUS = Object.freeze({
        ATIVO:    'ATIVO',
        INATIVO:  'INATIVO',
        PENDENTE: 'PENDENTE',
    });

    return { ACCOUNT_IDS, STATUS };
});
```

### Exemplo de uso em UseCase

```javascript
define([
    'N/log',
    '../Models/CaixaRecord.model',
    '../Utils/math.util',
    '../Constants/accounts.constants',
], function (log, CaixaModel, mathUtil, accountsConstants) {

    function execute(param) {
        const records = CaixaModel.getByAccountId(accountsConstants.ACCOUNT_IDS.CONTA_ESPECIFICA);

        const total = records.reduce((acc, r) => {
            return acc + mathUtil.roundValue(parseFloat(r.valor) || 0, 2);
        }, 0);

        log.audit({ title: 'NomeUseCase | execute - success', details: JSON.stringify({ total }) });
    }

    return { execute };
});
```