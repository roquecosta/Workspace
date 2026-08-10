---
name: project-pipefy-accountclassvalidation-no-shared-lib
description: Pipefy é cliente novo sem pd-c-netsuite-tools ainda instanciado — implementações usam N/record, N/search, N/currentRecord nativos, não record_util/search_util
metadata:
  type: project
---

O cliente **Pipefy** (`Pipefy/src/FileCabinet/SuiteScripts/ProjectDome/`) tem `.gitmodules`
declarando o submódulo `pd-c-netsuite-tools` (biblioteca compartilhada ProjectDome — record_util,
search_util etc.), mas o submódulo **nunca foi de fato adicionado** ao repositório (sem gitlink na
tree do git, `git submodule update --init` não traz nada). Ou seja: hoje não existe
`pd_cnt_standard/pd-cnts-record.util.js` nem `pd-cnts-search.util.js` disponível no projeto Pipefy,
diferente de Gafisa/GrupoFF/StoccheForbes/etc., que têm cópia própria do submódulo.

**Como isso mudou a implementação:** na feature `AccountClassValidation` (primeira feature do
cliente), os Models (`Account.model.js`, `JournalEntry.model.js`, `VendorBill.model.js`) foram
escritos com **N/search e N/record/N/currentRecord nativos** (getSublistValue/getLineCount,
search.create), em vez de `record_util.handler(...)` / `search_util.all(...)` como nos outros
clientes. Também não há acesso às funções globais do `pd_cnt_common` (isNullOrEmpty,
arrayToDict etc.) — checagens de vazio foram escritas em JS puro (`=== null || === undefined || === ''`).

**Por quê:** adicionar o submódulo exigiria clonar de
`https://github.com/Project-Dome/pd-c-netsuite-tools` e rodar `git submodule add`, o que grava
seção nova em `.git/config` — tratado como fora do escopo de "implementar uma feature" e por
cautela com a regra de não tocar config de git sem pedido explícito. Não tentei o clone; segui
direto com módulos nativos do SuiteScript.

**Como aplicar:** antes de implementar qualquer novo script SuiteScript no cliente Pipefy, verificar
se o submódulo já foi inicializado (`ls .../ProjectDome/pd-c-netsuite-tools` ou
`git submodule status` na raiz do repo Pipefy). Se ainda ausente, seguir o mesmo padrão nativo
(sem record_util/search_util) para manter consistência entre os scripts do cliente — ou perguntar
ao usuário se ele quer inicializar o submódulo antes de continuar (decisão de infraestrutura, não
de feature).
