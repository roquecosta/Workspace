# Controle de Amostras

> Rastreamento de amostras enviadas a clientes, substituindo planilha Excel. Registra envios,
> vincula a pedidos de venda (quando existente), notifica responsável por email em mudança de status
> e envia lembretes diários de devolução ao cliente.

---

## Metadados

| Campo          | Valor                        |
|----------------|------------------------------|
| Cliente        | Teste                        |
| Prefixo        | tst                          |
| Responsável    | Roque Costa                  |
| Criado em      | 2026-04-20                   |
| Última revisão | 2026-04-24                   |

---

## Scripts

> Convenção de status: `novo` = será criado pelo pipeline | `existente` = já está no NetSuite, apenas referenciado

### [customscript_tst_amostra_ue]

| Campo        | Valor                                                                                                                             |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------|
| status       | novo                                                                                                                              |
| type         | userevent                                                                                                                         |
| file         | SuiteScripts/ProjectDome/ControleAmostras/EntryPoints/TST_AmostraStatus.UE.js                                                    |
| recordType   | customrecord_tst_amostra                                                                                                          |
| deploymentId | customdeploy_tst_amostra_ue                                                                                                       |
| afterSubmit  | afterSubmit                                                                                                                       |
| description  | Disparado após salvar uma amostra. Se o status mudou para "devolvida" ou "perdida", envia email ao representante do cliente (ignora silenciosamente se representante estiver vazio). Sempre recalcula e atualiza o campo custentity_tst_amostras_abertas no cliente. |

### [customscript_tst_relatorio_amostras_sc]

| Campo        | Valor                                                                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| status       | novo                                                                                                                                    |
| type         | scheduled                                                                                                                               |
| file         | SuiteScripts/ProjectDome/ControleAmostras/EntryPoints/TST_RelatorioAmostras.SS.js                                                       |
| deploymentId | customdeploy_tst_relatorio_amostras_sc                                                                                                  |
| function     | execute                                                                                                                                 |
| schedule     | Diariamente                                                                                                                             |
| description  | Busca todas as amostras com status "enviada" há mais de 30 dias, agrupa por cliente e envia email individualmente para o endereço de email de cada cliente (campo nativo `email` no customer) com a lista de amostras pendentes dele. |

---

## Records

> Registros customizados criados ou utilizados neste projeto.

### [customrecord_tst_amostra]

| Campo              | Valor                                                                              |
|--------------------|------------------------------------------------------------------------------------|
| status             | novo                                                                               |
| label              | Amostra                                                                            |
| description        | Registra cada amostra enviada a um cliente, com rastreamento de status e vínculo opcional ao pedido de venda |
| allowInlineEdit    | false                                                                              |
| isAvailableOffline | false                                                                              |

#### Campos

##### Name (built-in)

| Campo       | Valor                                     |
|-------------|-------------------------------------------|
| label       | Nome / Identificador                      |
| type        | text                                      |
| description | Identificador da amostra (ex: AMS-0001). Preenchimento manual pelo usuário. |
| isMandatory | true                                      |

##### [custrecord_tst_amostra_cliente]

| Campo       | Valor                                     |
|-------------|-------------------------------------------|
| label       | Cliente                                   |
| type        | select                                    |
| source      | customer                                  |
| description | Cliente que recebeu a amostra             |
| isMandatory | true                                      |

##### [custrecord_tst_amostra_item]

| Campo       | Valor                                     |
|-------------|-------------------------------------------|
| label       | Produto                                   |
| type        | select                                    |
| source      | item                                      |
| description | Item enviado como amostra                 |
| isMandatory | true                                      |

##### [custrecord_tst_amostra_quantidade]

| Campo        | Valor                                    |
|--------------|------------------------------------------|
| label        | Quantidade                               |
| type         | float                                    |
| description  | Quantidade enviada (aceita decimais)     |
| isMandatory  | true                                     |
| defaultValue |                                          |

##### [custrecord_tst_amostra_data_envio]

| Campo        | Valor                                          |
|--------------|------------------------------------------------|
| label        | Data de Envio                                  |
| type         | date                                           |
| description  | Data em que a amostra foi enviada ao cliente   |
| isMandatory  | true                                           |
| defaultValue |                                                |

##### [custrecord_tst_amostra_status]

| Campo        | Valor                                                  |
|--------------|--------------------------------------------------------|
| label        | Status                                                 |
| type         | select                                                 |
| source       | customlist_tst_amostra_status                          |
| description  | Status atual da amostra: enviada / devolvida / perdida |
| isMandatory  | true                                                   |
| defaultValue | enviada                                                |

##### [custrecord_tst_amostra_pedido]

| Campo       | Valor                                                                                                   |
|-------------|---------------------------------------------------------------------------------------------------------|
| label       | Pedido de Venda                                                                                         |
| type        | select                                                                                                  |
| source      | salesorder                                                                                              |
| description | Pedido de venda relacionado ao envio. Opcional — nem toda amostra está vinculada a um pedido (ex: prospecção) |
| isMandatory | false                                                                                                   |

---

## External Fields

> Campos customizados em records **nativos** do NetSuite que são criados ou referenciados por este projeto.

### [custentity_tst_amostras_abertas]

| Campo        | Valor                                                                                                                       |
|--------------|-----------------------------------------------------------------------------------------------------------------------------|
| status       | novo                                                                                                                        |
| label        | Amostras em Aberto                                                                                                          |
| type         | integer                                                                                                                     |
| appliesTo    | customer                                                                                                                    |
| description  | Contador de amostras com status "enviada" vinculadas a este cliente. Atualizado pelo customscript_tst_amostra_ue a cada criação ou alteração de amostra. |
| isMandatory  | false                                                                                                                       |
| defaultValue | 0                                                                                                                           |

### [custentity_ff_representante]

| Campo       | Valor                                                                                          |
|-------------|------------------------------------------------------------------------------------------------|
| status      | existente                                                                                      |
| internalId  | 1847                                                                                           |
| label       | Representante de Vendas                                                                        |
| appliesTo   | customer                                                                                       |
| description | Representante responsável pelo cliente. Destino do email de notificação quando status muda para "devolvida" ou "perdida". |

---

## Custom Lists

### [customlist_tst_amostra_status]

| Campo       | Valor                                          |
|-------------|------------------------------------------------|
| status      | novo                                           |
| label       | Status de Amostra                              |
| values      | enviada, devolvida, perdida                    |
| description | Lista de valores para o campo status da amostra |

---

## Dependências entre objetos

- `customscript_tst_amostra_ue` lê `custrecord_tst_amostra_status` para detectar transição para "devolvida" ou "perdida" (compara `context.oldRecord` vs `context.newRecord`)
- `customscript_tst_amostra_ue` lê `custrecord_tst_amostra_cliente` para localizar o cliente da amostra
- `customscript_tst_amostra_ue` lê `custentity_ff_representante` (internalId 1847) no `customer` para obter o destinatário do email de notificação
- `customscript_tst_amostra_ue` atualiza `custentity_tst_amostras_abertas` no `customer` após cada save
- `customscript_tst_relatorio_amostras_sc` lê `customrecord_tst_amostra` filtrando por status = "enviada" e `custrecord_tst_amostra_data_envio` <= hoje − 30 dias
- `customscript_tst_relatorio_amostras_sc` lê o campo nativo `email` do `customer` para enviar o relatório de pendências ao cliente externo
- `custrecord_tst_amostra_cliente` faz lookup em `customer`
- `custrecord_tst_amostra_item` faz lookup em `item`
- `custrecord_tst_amostra_pedido` faz lookup em `salesorder`
- `custrecord_tst_amostra_status` faz lookup em `customlist_tst_amostra_status`

---

## Notas de implementação

- **Status padrão:** toda amostra nova deve ter status inicial = "enviada". Garantir via `defaultValue` no campo.
- **Email de notificação (devolvida / perdida):** disparado no `afterSubmit` do UE quando o status muda de outro valor para "devolvida" **ou** "perdida". Comparar `context.oldRecord` vs `context.newRecord`. Se o cliente não tiver representante (`custentity_ff_representante` vazio), ignorar silenciosamente sem lançar erro.
- **Atualização do contador `custentity_tst_amostras_abertas`:** executar em todo `afterSubmit` do UE (create e edit) via `search`, contando amostras do cliente com status = "enviada". Sempre recalcular do zero — não incrementar/decrementar, para evitar inconsistências.
- **Relatório diário — destinatário:** o email vai para o endereço de email do **cliente externo** (campo nativo `email` do registro `customer`). Clientes sem email cadastrado são ignorados silenciosamente. O email lista todos os produtos/quantidades/datas de envio em aberto daquele cliente.
- **Pedido de venda opcional:** `custrecord_tst_amostra_pedido` não é obrigatório — cenário de prospecção sem pedido associado é válido.
- **Campo Name do custom record:** campo nativo do NetSuite; não é `custrecord_`. Preenchimento manual pelo usuário. Recomenda-se convenção como "AMS-{ano}-{sequencial}", sem automação nesta fase.
- **Ambiente:** deploy inicia em sandbox antes de produção.
- **Pasta dos arquivos:** `SuiteScripts/ProjectDome/ControleAmostras/`

---

## Changelog

| Data       | Autor            | Mudança                                                                                      |
|------------|------------------|----------------------------------------------------------------------------------------------|
| 2026-04-20 | Roque Costa      | Criação do manifest                                                                          |
| 2026-04-24 | manifest-builder | "perdida" também dispara email; relatório vai ao cliente externo; schedule atualizado para diário; campo Name adicionado ao custom record |
