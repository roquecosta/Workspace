# [NOME DO PROJETO] — Project Manifest

> Referência dos objetos NetSuite deste projeto. Gerado e mantido automaticamente pelo pipeline.

---

## Metadados

| Campo          | Valor                   |
|----------------|-------------------------|
| Cliente        | [Nome do cliente]       |
| Prefixo        | [Prefixo do projeto]    |
| Última revisão | [YYYY-MM-DD]            |

---

## Scripts

> `novo` = será criado pelo pipeline | `existente` = já está no NetSuite

### [customscript_pd_{prefixo}_{nome}]

| Campo        | Valor                                        |
|--------------|----------------------------------------------|
| status       | novo                                         |
| type         | userevent                                    |
| file         | src/scripts/{nome}.js                        |
| deploymentId | customdeploy_pd_{prefixo}_{nome}             |
| triggers     | beforeSubmit, afterSubmit                    |
| recordType   | salesorder                                   |
| description  | O que este script faz                        |

### [customscript_pd_{prefixo}_{outro}]

| Campo        | Valor                                        |
|--------------|----------------------------------------------|
| status       | novo                                         |
| type         | scheduled                                    |
| file         | src/scripts/{outro}.js                       |
| deploymentId | customdeploy_pd_{prefixo}_{outro}            |
| triggers     | execute                                      |
| description  | O que este script faz                        |

### [customscript_existente]

| Campo        | Valor                                        |
|--------------|----------------------------------------------|
| status       | existente                                    |
| internalId   | [ID interno no NetSuite]                     |
| type         | userevent                                    |
| description  | Script já no NetSuite, referenciado aqui     |