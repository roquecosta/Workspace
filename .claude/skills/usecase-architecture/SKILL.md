---
name: netsuite-usecase-architecture
description: >
  Architectural reference for creating new NetSuite scripts following the EntryPoint / UseCase / Model pattern used at ProjectDome.
  Use this skill ALWAYS when creating, scaffolding, or modifying NetSuite scripts, including UserEvent (UE), MapReduce (MR),
  Client Script (CS), or Suitelet (SL) types. Also trigger when the user mentions terms like "new script", "new NetSuite project",
  "SuiteScript", "EntryPoint", "UseCase", "Model", "custom record", "pd_c_netsuite_tools", "record_util", "search_util",
  or any business logic creation in NetSuite.
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
└── Models/
    └── <NomeRecord>.model.js       ← acesso a dados, TYPE, FIELDS, funções CRUD
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

---

## Regras da arquitetura

- EntryPoint nunca acessa record diretamente — sempre via UseCase ou Model
- UseCase nunca usa `record.load` / `record.create` — sempre via Model
- Model nunca contém `if` de regra de negócio — apenas operações de dados
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

---

## Templates de código

Os templates completos estão em `references/templates.md`. Leia esse arquivo ao gerar código para qualquer uma das camadas.

---