# [NOME DO PROJETO]

> **Descrição curta do projeto** — O que este projeto faz e qual problema resolve.

---

## Metadados

| Campo          | Valor                        |
|----------------|------------------------------|
| Cliente        | [Nome do cliente]            |
| Prefixo        | [Prefixo do projeto]         |
| Responsável    | [Nome do desenvolvedor]      |
| Criado em      | [YYYY-MM-DD]                 |
| Última revisão | [YYYY-MM-DD]                 |

---

## Scripts

> Convenção de status: `novo` = será criado pelo pipeline | `existente` = já está no NetSuite, apenas referenciado

### [customscript_nome_do_script]

| Campo          | Valor                                  |
|----------------|----------------------------------------|
| status         | novo                                   |
| type           | userevent                              |
| file           | src/scripts/nome_do_script.js          |
| recordType     | salesorder                             |
| deploymentId   | customdeploy_nome_do_script            |
| beforeSubmit   | beforeSubmitFunction                   |
| afterSubmit    | afterSubmitFunction                    |
| description    | O que este script faz                  |

### [customscript_outro_script]

| Campo          | Valor                                  |
|----------------|----------------------------------------|
| status         | novo                                   |
| type           | scheduled                              |
| file           | src/scripts/outro_script.js            |
| deploymentId   | customdeploy_outro_script              |
| function       | executeFunction                        |
| description    | O que este script faz                  |

### [customscript_ja_existente]

| Campo          | Valor                                  |
|----------------|----------------------------------------|
| status         | existente                              |
| type           | userevent                              |
| internalId     | 123                                    |
| description    | Script já no NetSuite, apenas referenciado neste projeto |

---

## Records

> Registros customizados criados ou utilizados neste projeto.
> Os campos de cada registro `novo` são listados como subtópicos dentro do próprio registro.

### [customrecord_nome_do_registro]

| Campo              | Valor                        |
|--------------------|------------------------------|
| status             | novo                         |
| label              | Nome Legível do Registro     |
| description        | Para que serve este registro |
| allowInlineEdit    | true                         |
| isAvailableOffline | false                        |

#### Campos

##### [custrecord_prefixo_nome_do_campo]

| Campo        | Valor                             |
|--------------|-----------------------------------|
| label        | Nome Legível do Campo             |
| type         | text                              |
| description  | Para que serve este campo         |
| isMandatory  | false                             |
| defaultValue |                                   |

##### [custrecord_prefixo_campo_lookup]

| Campo        | Valor                             |
|--------------|-----------------------------------|
| label        | Campo de Lookup                   |
| type         | select                            |
| source       | customrecord_outro_registro       |
| description  | Campo de lookup para o registro X |
| isMandatory  | true                              |

### [customrecord_registro_existente]

| Campo       | Valor                                        |
|-------------|----------------------------------------------|
| status      | existente                                    |
| internalId  | 456                                          |
| label       | Registro Já Existente                        |
| description | Utilizado por este projeto para armazenar X  |

---

## External Fields

> Campos customizados em records **nativos** do NetSuite (não pertencentes a este projeto)
> que são criados ou referenciados por este projeto.

### [custbody_nome_do_campo]

| Campo        | Valor                        |
|--------------|------------------------------|
| status       | novo                         |
| label        | Nome Legível do Campo        |
| type         | text                         |
| appliesTo    | salesorder                   |
| description  | Para que serve este campo    |
| isMandatory  | false                        |
| defaultValue |                              |

### [custbody_campo_existente]

| Campo       | Valor                                              |
|-------------|----------------------------------------------------|
| status      | existente                                          |
| internalId  | 789                                                |
| label       | Campo Já Existente                                 |
| appliesTo   | salesorder                                         |
| description | Campo já presente no ambiente, utilizado para X    |

---

## Dependências entre objetos

> Descreva aqui como os objetos se relacionam. Útil para o agent de código e para o parser XML.

- `customscript_nome_do_script` lê o campo `custbody_nome_do_campo` no `salesorder`
- `customscript_outro_script` cria registros em `customrecord_nome_do_registro`
- `custrecord_campo_no_registro` faz lookup em `customrecord_outro_registro`

---

## Notas de implementação

> Informações importantes que não cabem nas tabelas: regras de negócio, edge cases, decisões de arquitetura.

- [Nota relevante sobre o projeto]
- [Outra nota]

---

## Changelog

| Data       | Autor      | Mudança                        |
|------------|------------|--------------------------------|
| YYYY-MM-DD | [Nome]     | Criação do README              |