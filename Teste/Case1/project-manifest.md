# TRÊS M – Caixa Gerencial

> **Gestão de caixa gerencial e caixas por fazenda** — Controla entradas e saídas de recursos financeiros do ecossistema Três M, gerando dados de equilíbrio financeiro entre o quadro societário. Inclui caixas principais e secundários (por fazenda), lógica de fechamento e geração de registro de empate entre sócios.

---

## Metadados

| Campo          | Valor       |
|----------------|-------------|
| Cliente        | Três M      |
| Prefixo        | CG          |
| Responsável    | Roque Costa |
| Criado em      | 2025-12-24  |
| Última revisão | 2026-04-20  |

---

## Scripts

> Convenção de status: `novo` = será criado pelo pipeline | `existente` = já está no NetSuite, apenas referenciado

---

### Transformations (User Event / Map-Reduce)

---

### [customscript_pd_transformation_journal_entrada_caixa]

| Campo        | Valor                                                                                     |
|--------------|-------------------------------------------------------------------------------------------|
| status       | novo                                                                                      |
| type         | userevent                                                                                 |
| file         | src/scripts/TransformJournalToEntradaCaixa.US.js                                          |
| recordType   | journalentry                                                                              |
| deploymentId | customdeploy_pd_transformation_journal_entrada_caixa                                     |
| afterSubmit  | afterSubmit                                                                               |
| description  | Ao aprovar um Journal com flag `custbody_pd_aporte_caixa_gerencial = T`, cria um registro [2.0] ENTRADA DE CAIXA vinculado ao caixa gerencial com status "Aberto". |

---

### [customscript_pd_transformation_saida_transferencia_caixa]

| Campo        | Valor                                                                                     |
|--------------|-------------------------------------------------------------------------------------------|
| status       | novo                                                                                      |
| type         | userevent                                                                                 |
| file         | src/scripts/TransformSaidaToEntradaCaixa.US.js                                            |
| recordType   | customrecord_pd_controle_administrativo                                                   |
| deploymentId | customdeploy_pd_transformation_saida_transferencia                                        |
| afterSubmit  | afterSubmit                                                                               |
| description  | Quando `custrecord_pd_coadm_tipo_uso = "Transferência de fundos" (ID 4)`, cria um registro [2.0] ENTRADA DE CAIXA no caixa de destino conforme `custrecord_pd_coadm_destino`. |

---

### Scripts de Saldo (recalculo em tempo real)

> Um script por record type de caixa secundário, acionado via User Event afterSubmit nos registros filhos ([2.0] e [3.0]).

---

### [customscript_pd_recalculo_saldo_cx_1_1]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent                                                             |
| file         | src/scripts/RecalculoSaldoCaixa_1_1.US.js                            |
| recordType   | customrecord_pd_cx_gerencial_1_1                                      |
| deploymentId | customdeploy_pd_recalculo_saldo_cx_1_1                                |
| afterSubmit  | afterSubmit                                                           |
| description  | Recalcula Entradas, Saídas e Saldo Disponível do Caixa Fazenda Contenda sempre que um registro filho [2.0] ou [3.0] for criado/editado. |

---

### [customscript_pd_recalculo_saldo_cx_1_2]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent                                                             |
| file         | src/scripts/RecalculoSaldoCaixa_1_2.US.js                            |
| recordType   | customrecord_pd_cx_gerencial_1_2                                      |
| deploymentId | customdeploy_pd_recalculo_saldo_cx_1_2                                |
| afterSubmit  | afterSubmit                                                           |
| description  | Recalcula Entradas, Saídas e Saldo Disponível do Caixa Fazenda São Luiz. |

---

### [customscript_pd_recalculo_saldo_cx_1_3]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent                                                             |
| file         | src/scripts/RecalculoSaldoCaixa_1_3.US.js                            |
| recordType   | customrecord_pd_cx_gerencial_1_3                                      |
| deploymentId | customdeploy_pd_recalculo_saldo_cx_1_3                                |
| afterSubmit  | afterSubmit                                                           |
| description  | Recalcula Entradas, Saídas e Saldo Disponível do Caixa Fazenda Trapiche. |

---

### [customscript_pd_recalculo_saldo_cx_1_4]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent                                                             |
| file         | src/scripts/RecalculoSaldoCaixa_1_4.US.js                            |
| recordType   | customrecord_pd_cx_gerencial_1_4                                      |
| deploymentId | customdeploy_pd_recalculo_saldo_cx_1_4                                |
| afterSubmit  | afterSubmit                                                           |
| description  | Recalcula Entradas, Saídas e Saldo Disponível do Caixa Fazenda Munin. |

---

### [customscript_pd_recalculo_saldo_cx_1_5]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent                                                             |
| file         | src/scripts/RecalculoSaldoCaixa_1_5.US.js                            |
| recordType   | customrecord_pd_cx_gerencial_1_5                                      |
| deploymentId | customdeploy_pd_recalculo_saldo_cx_1_5                                |
| afterSubmit  | afterSubmit                                                           |
| description  | Recalcula Entradas, Saídas e Saldo Disponível do Caixa Uso Dia a Dia. |

---

### [customscript_pd_recalculo_saldo_cx_1_6]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent                                                             |
| file         | src/scripts/RecalculoSaldoCaixa_1_6.US.js                            |
| recordType   | customrecord_pd_cx_gerencial_1_6                                      |
| deploymentId | customdeploy_pd_recalculo_saldo_cx_1_6                                |
| afterSubmit  | afterSubmit                                                           |
| description  | Recalcula Entradas, Saídas e Saldo Disponível do Caixa [1.6] reserva. |

---

### Scripts de Fechamento de Caixa

> Cada caixa tem seu próprio script de fechamento, acionado pelo botão "FECHAR CAIXA" gerado via SuiteScript.

---

### [customscript_pd_fechamento_cx_ger_1_0]

| Campo        | Valor                                                                                       |
|--------------|---------------------------------------------------------------------------------------------|
| status       | novo                                                                                        |
| type         | userevent (client action via botão)                                                         |
| file         | src/scripts/FechamentoCaixaGerencial_1_0.US.js                                              |
| recordType   | customrecord_pd_cx_gerencial_1_0                                                            |
| deploymentId | customdeploy_pd_fechamento_cx_ger_1_0                                                       |
| description  | Fecha o Caixa Gerencial [1.0]: preenche data de fechamento, altera status para "Fechado", bloqueia subregistros, cria novo caixa com saldo transferido, marca step_1 em [2.0] e [3.0] e aciona a criação do registro [4.0] GESTÃO DE EMPATE. |

---

### [customscript_pd_fechamento_cx_1_1]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent (client action via botão)                                   |
| file         | src/scripts/FechamentoCaixa_1_1.US.js                                 |
| recordType   | customrecord_pd_cx_gerencial_1_1                                      |
| deploymentId | customdeploy_pd_fechamento_cx_1_1                                     |
| description  | Fecha o Caixa Fazenda Contenda: mesma rotina de fechamento/abertura/transferência de saldo. |

---

### [customscript_pd_fechamento_cx_1_2]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent (client action via botão)                                   |
| file         | src/scripts/FechamentoCaixa_1_2.US.js                                 |
| recordType   | customrecord_pd_cx_gerencial_1_2                                      |
| deploymentId | customdeploy_pd_fechamento_cx_1_2                                     |
| description  | Fecha o Caixa Fazenda São Luiz.                                       |

---

### [customscript_pd_fechamento_cx_1_3]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent (client action via botão)                                   |
| file         | src/scripts/FechamentoCaixa_1_3.US.js                                 |
| recordType   | customrecord_pd_cx_gerencial_1_3                                      |
| deploymentId | customdeploy_pd_fechamento_cx_1_3                                     |
| description  | Fecha o Caixa Fazenda Trapiche.                                       |

---

### [customscript_pd_fechamento_cx_1_4]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent (client action via botão)                                   |
| file         | src/scripts/FechamentoCaixa_1_4.US.js                                 |
| recordType   | customrecord_pd_cx_gerencial_1_4                                      |
| deploymentId | customdeploy_pd_fechamento_cx_1_4                                     |
| description  | Fecha o Caixa Fazenda Munin.                                          |

---

### [customscript_pd_fechamento_cx_1_5]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent (client action via botão)                                   |
| file         | src/scripts/FechamentoCaixa_1_5.US.js                                 |
| recordType   | customrecord_pd_cx_gerencial_1_5                                      |
| deploymentId | customdeploy_pd_fechamento_cx_1_5                                     |
| description  | Fecha o Caixa Uso Dia a Dia.                                          |

---

### [customscript_pd_fechamento_cx_1_6]

| Campo        | Valor                                                                 |
|--------------|-----------------------------------------------------------------------|
| status       | novo                                                                  |
| type         | userevent (client action via botão)                                   |
| file         | src/scripts/FechamentoCaixa_1_6.US.js                                 |
| recordType   | customrecord_pd_cx_gerencial_1_6                                      |
| deploymentId | customdeploy_pd_fechamento_cx_1_6                                     |
| description  | Fecha o Caixa [1.6] reserva.                                          |

---

### Workflows (sem script — apenas referenciados)

---

### [customworkflow_pd_wf_entradas_caixa]

| Campo        | Valor                                                                                     |
|--------------|-------------------------------------------------------------------------------------------|
| status       | existente                                                                                 |
| label        | PD \| WF \| [2.0] ENTRADA CAIXAS                                                          |
| recordType   | journalentry                                                                              |
| description  | Garante obrigatoriedade dos campos `custbody_pd_aporte_caixa_gerencial` e `custbody_pd_aporte_caixa_quadro` no Journal antes de acionar a transformation. |

---

### [customworkflow_pd_wf_controle_administrativo]

| Campo        | Valor                                                                                     |
|--------------|-------------------------------------------------------------------------------------------|
| status       | existente                                                                                 |
| label        | PD \| WF \| [3.0] CONTROLE ADMINISTRATIVO                                                 |
| recordType   | customrecord_pd_controle_administrativo                                                   |
| description  | Torna `custrecord_pd_coadm_destino` obrigatório quando tipo_uso = "Transferência de fundos". Torna `custrecord_pd_coadm_socio_solicitante` obrigatório quando `custrecord_pd_coadm_empate = T`. |

---

## Records

---

### [customrecord_pd_cx_gerencial_1_0]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.0] Caixa Gerencial                                              |
| description     | Registro principal de gestão financeira. Consolida saldo inicial, entradas gerenciais, saldo utilizado e saldo disponível. Gera o registro de Gestão de Empate no fechamento. |

---

### [customrecord_pd_cx_gerencial_1_1]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.1] Caixa Fazenda Contenda                                       |
| description     | Caixa secundário da Fazenda Contenda. Controla entradas e saídas independentes com fechamento próprio. |

---

### [customrecord_pd_cx_gerencial_1_2]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.2] Caixa Fazenda São Luiz                                       |
| description     | Caixa secundário da Fazenda São Luiz.                              |

---

### [customrecord_pd_cx_gerencial_1_3]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.3] Caixa Fazenda Trapiche                                       |
| description     | Caixa secundário da Fazenda Trapiche.                              |

---

### [customrecord_pd_cx_gerencial_1_4]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.4] Caixa Fazenda Munin                                          |
| description     | Caixa secundário da Fazenda Munin.                                 |

---

### [customrecord_pd_cx_gerencial_1_5]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.5] Caixa Uso Dia a Dia                                          |
| description     | Caixa rotativo, geralmente em posse do motorista.                  |

---

### [customrecord_pd_cx_gerencial_1_6]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [1.6] Caixa Reserva                                                |
| description     | Caixa reserva para expansão futura.                                |

---

### [customrecord_pd_entradas_caixa_gerencial]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [2.0] Entrada de Caixa                                             |
| description     | Registra aportes financeiros nos caixas. Pode ser criado manualmente ou via transformation de Journal. |

---

### [customrecord_pd_controle_administrativo]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [3.0] Controle Administrativo                                      |
| description     | Registra saídas financeiras dos caixas. Quando tipo_uso = "Transferência de fundos", gera uma entrada no caixa destino. Suporta marcação de empate por sócio. |

---

### [customrecord_pd_gestao_empate]

| Campo           | Valor                                                              |
|-----------------|--------------------------------------------------------------------|
| status          | existente                                                          |
| label           | [4.0] Gestão de Empate                                             |
| description     | Criado automaticamente no fechamento do [1.0]. Compara entradas e saídas por sócio para equalização financeira do quadro societário. |

---

## Custom Fields

> Organizado por record type para facilitar consulta.

---

### Campos do [1.0] Caixa Gerencial (`customrecord_pd_cx_gerencial_1_0`)

| Field ID                                  | Label                  | Type     | Description                                                  |
|-------------------------------------------|------------------------|----------|--------------------------------------------------------------|
| custrecord_pd_saldo_inicial_cx_ger_1_0    | Saldo de Abertura      | currency | Valor inicial do caixa. Manual no Golive, depois via script de fechamento. |
| custrecord_pd_entradas_cx_ger_1_0         | Entradas Gerenciais    | currency | Soma dos registros [2.0] relacionados a este caixa.          |
| custrecord_pd_saidas_cx_ger_1_0           | Saldo Utilizado        | currency | Soma dos registros [3.0] relacionados a este caixa.          |
| custrecord_pd_disponivel_cx_ger_1_0       | Saldo Disponível       | currency | Saldo Inicial + Entradas – Saídas. Atualizado automaticamente. |
| custrecord_pd_status_cx_ger_1_0           | Status Caixa           | select   | "Aberto" ou "Fechado". Controlado pelo script de fechamento. |
| custrecord_pd_data_closure_cx_ger_1_0     | Data do Fechamento     | date     | Preenchida no momento da execução do fechamento.             |
| custrecord_pd_ultimo_closure_cx_ger_1_0   | Data Último Fechamento | date     | Referência histórica do fechamento anterior.                 |

---

### Campos do [1.1] Caixa Fazenda Contenda (`customrecord_pd_cx_gerencial_1_1`)

| Field ID                                    | Label                  | Type     | Description                                           |
|---------------------------------------------|------------------------|----------|-------------------------------------------------------|
| custrecord_pd_data_atual_cx_1_1             | Data                   | date     | Exibe sempre a data atual.                            |
| custrecord_pd_saldo_inicial_cx_1_1          | Saldo Inicial          | currency | Preenchido pelo script de fechamento.                 |
| custrecord_pd_entradas_cx_1_1               | Entradas               | currency | Soma de [2.0] filtrado por `custrecord_pd_entradas_cx_gerencial_1_1`. |
| custrecord_pd_saidas_cx_1_1                 | Saídas                 | currency | Soma de [3.0] filtrado por `custrecord_pd_saidas_cx_gerencial_1_1`. |
| custrecord_pd_disponivel_cx_1_1             | Saldo Disponível       | currency | Saldo Inicial + Entradas – Saídas.                    |
| custrecord_pd_ultimo_closure_cx_1_1         | Último Fechamento      | date     | Preenchido pelo script de fechamento.                 |
| custrecord_pd_data_closure_cx_1_1           | Data do Fechamento     | date     | Preenchida na execução do fechamento.                 |
| custrecord_pd_status_cx_ger_1_1             | Status                 | select   | "Aberto" / "Fechado".                                 |

> **Nota:** Os caixas [1.2] a [1.6] seguem a mesma estrutura de campos, substituindo o sufixo `_1_1` pelos respectivos `_1_2`, `_1_3`, `_1_4`, `_1_5`, `_1_6`.

---

### Campos do [2.0] Entrada de Caixa (`customrecord_pd_entradas_caixa_gerencial`)

| Field ID                                  | Label                  | Type     | Description                                                       |
|-------------------------------------------|------------------------|----------|-------------------------------------------------------------------|
| custrecord_pd_caixa                       | Caixa (pai [1.0])      | select   | Relacionamento com o [1.0] Caixa Gerencial.                       |
| custrecord_pd_entradas_cx_gerencial_1_1   | Caixa [1.1]            | select   | Relacionamento com o Caixa Fazenda Contenda.                      |
| custrecord_pd_entradas_cx_gerencial_1_2   | Caixa [1.2]            | select   | Relacionamento com o Caixa Fazenda São Luiz.                      |
| custrecord_pd_entradas_cx_gerencial_1_3   | Caixa [1.3]            | select   | Relacionamento com o Caixa Fazenda Trapiche.                      |
| custrecord_pd_entradas_cx_gerencial_1_4   | Caixa [1.4]            | select   | Relacionamento com o Caixa Fazenda Munin.                         |
| custrecord_pd_entradas_cx_gerencial_1_5   | Caixa [1.5]            | select   | Relacionamento com o Caixa Uso Dia a Dia.                         |
| custrecord_pd_entradas_cx_gerencial_1_6   | Caixa [1.6]            | select   | Relacionamento com o Caixa Reserva.                               |
| custrecord_pd_data_criacao_aporte         | Data da Transação      | date     | Preenchida com `trandate` do Journal de origem.                   |
| custrecord_pd_valor_aporte                | Valor do Aporte        | currency | Valor da linha de crédito do Journal (`totalamount`).             |
| custrecord_pd_detalhes                    | Detalhamento           | text     | Texto descritivo. Ex.: "Entrada de fundos via Journal".           |
| custrecord_pd_quadro_socios               | Quadro Societário      | select   | ID do sócio. Fonte: `customlist_pd_quadro_societario`.            |
| custrecord_pd_transacao_de_origem         | Transação de Origem    | select   | Link para o Journal de origem.                                    |
| custrecord_pd_entrada_step_1              | Fechamento Etapa 1     | checkbox | Marcado pelo script de fechamento do caixa.                       |
| custrecord_pd_entrada_step_2              | Fechamento Etapa 2     | checkbox | Marcado após captura dos dados no [4.0] Gestão de Empate.         |

---

### Campos do [3.0] Controle Administrativo (`customrecord_pd_controle_administrativo`)

| Field ID                                  | Label                       | Type     | Description                                                         |
|-------------------------------------------|-----------------------------|----------|---------------------------------------------------------------------|
| custrecord_pd_coadm_tipo_uso              | Tipo de Uso                 | select   | Define a natureza da saída. ID=4 = "Transferência de fundos".       |
| custrecord_pd_coadm_destino               | Destino da Transferência    | select   | Obrigatório quando tipo_uso = "Transferência de fundos". Fonte: `customlist_pd_cx_gerencial_tranf`. |
| custrecord_pd_coadm_requisitante          | Requisitante                | select   | Preenchido automaticamente (WF) com o usuário criador do registro.  |
| custrecord_pd_coadm_trandate              | Data da Transação           | date     | Preenchida automaticamente (WF) com a data atual.                   |
| custrecord_pd_coadm_empate                | Incluir no Empate           | checkbox | Quando marcado, torna `custrecord_pd_coadm_socio_solicitante` obrigatório. |
| custrecord_pd_coadm_socio_solicitante     | Sócio Solicitante           | select   | Obrigatório quando `empate = T`. Fonte: `customlist_pd_quadro_societario`. |
| custrecord_pd_valor_coadm_servico         | Valor                       | currency | Valor da saída, usado na composição do empate.                      |
| custrecord_pd_coadm_closure_step_1        | Fechamento Etapa 1          | checkbox | Marcado pelo script de fechamento do caixa.                         |
| custrecord_pd_coadm_closure_step_2        | Fechamento Etapa 2          | checkbox | Marcado após captura dos dados no [4.0] Gestão de Empate.           |
| custrecord_pd_saidas_cx_gerencial_1_1     | Caixa [1.1]                 | select   | Relacionamento com o Caixa Fazenda Contenda.                        |
| custrecord_pd_saidas_cx_gerencial_1_2     | Caixa [1.2]                 | select   | Relacionamento com o Caixa Fazenda São Luiz.                        |
| custrecord_pd_saidas_cx_gerencial_1_3     | Caixa [1.3]                 | select   | Relacionamento com o Caixa Fazenda Trapiche.                        |
| custrecord_pd_saidas_cx_gerencial_1_4     | Caixa [1.4]                 | select   | Relacionamento com o Caixa Fazenda Munin.                           |
| custrecord_pd_saidas_cx_gerencial_1_5     | Caixa [1.5]                 | select   | Relacionamento com o Caixa Uso Dia a Dia.                           |
| custrecord_pd_saidas_cx_gerencial_1_6     | Caixa [1.6]                 | select   | Relacionamento com o Caixa Reserva.                                 |

---

### Campos do [4.0] Gestão de Empate (`customrecord_pd_gestao_empate`)

| Field ID                               | Label                        | Type     | Description                                                            |
|----------------------------------------|------------------------------|----------|------------------------------------------------------------------------|
| custrecord_pd_cx_relacionamento        | Caixa Gerencial              | select   | Relacionamento com o [1.0] Caixa Gerencial de origem.                  |
| custrecord_pd_ge_socio_1               | Sócio 1                      | select   | ORIGENES MONTE NETO — ID 1 da lista `customlist_pd_quadro_societario`. |
| custrecord_pd_ge_socio_2               | Sócio 2                      | select   | PAULO SERGIO MORAIS — ID 2.                                            |
| custrecord_pd_ge_socio_3               | Sócio 3                      | select   | HELDER LIRA MEDEIROS — ID 3.                                           |
| custrecord_pd_ge_entradas_socio_1      | Entradas Sócio 1             | currency | Soma de [2.0] onde `custrecord_pd_quadro_socios = ID 1` e step_2 = F. |
| custrecord_pd_ge_entradas_socio_2      | Entradas Sócio 2             | currency | Soma de [2.0] onde `custrecord_pd_quadro_socios = ID 2` e step_2 = F. |
| custrecord_pd_ge_entradas_socio_3      | Entradas Sócio 3             | currency | Soma de [2.0] onde `custrecord_pd_quadro_socios = ID 3` e step_2 = F. |
| custrecord_pd_ge_consumo_socio_1       | Consumo Sócio 1              | currency | Soma de [3.0] onde `socio_solicitante = ID 1`, empate = T e step_2 = F.|
| custrecord_pd_ge_consumo_socio_2       | Consumo Sócio 2              | currency | Soma de [3.0] onde `socio_solicitante = ID 2`, empate = T e step_2 = F.|
| custrecord_pd_ge_consumo_socio_3       | Consumo Sócio 3              | currency | Soma de [3.0] onde `socio_solicitante = ID 3`, empate = T e step_2 = F.|
| custrecord_pd_ge_saldo_socio_1         | Saldo Sócio 1                | currency | Entradas Sócio 1 – Consumo Sócio 1.                                    |
| custrecord_pd_ge_saldo_socio_2         | Saldo Sócio 2                | currency | Entradas Sócio 2 – Consumo Sócio 2.                                    |
| custrecord_pd_ge_saldo_socio_3         | Saldo Sócio 3                | currency | Entradas Sócio 3 – Consumo Sócio 3.                                    |
| custrecord_pd_ge_base_geral_empate     | Base Geral do Empate         | currency | Preenchido manualmente. Valor base de referência para equalização.     |
| custrecord_pd_ge_base_socio_1          | Base Sócio 1                 | currency | Replicado de `custrecord_pd_ge_base_geral_empate` via script.          |
| custrecord_pd_ge_base_socio_2          | Base Sócio 2                 | currency | Replicado de `custrecord_pd_ge_base_geral_empate` via script.          |
| custrecord_pd_ge_base_socio_3          | Base Sócio 3                 | currency | Replicado de `custrecord_pd_ge_base_geral_empate` via script.          |
| custrecord_pd_ge_valor_final_socio_1   | Valor Final Sócio 1          | currency | Saldo Sócio 1 – Base Sócio 1. Resultado para equalização.              |
| custrecord_pd_ge_valor_final_socio_2   | Valor Final Sócio 2          | currency | Saldo Sócio 2 – Base Sócio 2.                                          |
| custrecord_pd_ge_valor_final_socio_3   | Valor Final Sócio 3          | currency | Saldo Sócio 3 – Base Sócio 3.                                          |

---

### Campos no Journal Entry (campos custom da transação standard)

| Field ID                              | Label                        | Type     | Description                                                              |
|---------------------------------------|------------------------------|----------|--------------------------------------------------------------------------|
| custbody_pd_aporte_caixa_gerencial    | Caixa Gerencial (flag)       | checkbox | Gatilho para a transformation. Quando = T em Journal aprovado, cria [2.0]. |
| custbody_pd_aporte_caixa_quadro       | Quadro Societário            | select   | Sócio vinculado ao aporte. Replicado para `custrecord_pd_quadro_socios` no [2.0]. |

---

### Custom Lists

| List ID                              | Label                        | Description                                                                    |
|--------------------------------------|------------------------------|--------------------------------------------------------------------------------|
| customlist_pd_quadro_societario      | Quadro Societário            | IDs 1, 2, 3 = Origenes Monte Neto, Paulo Sergio Morais, Helder Lira Medeiros. |
| customlist_pd_cx_gerencial_tranf     | Destinos de Transferência    | IDs 1–6 mapeados para os respectivos record types de caixa [1.1] a [1.6].     |

---

## Dependências entre objetos

- `customscript_pd_transformation_journal_entrada_caixa` lê `custbody_pd_aporte_caixa_gerencial` e `custbody_pd_aporte_caixa_quadro` no `journalentry` e cria registros em `customrecord_pd_entradas_caixa_gerencial`
- `customscript_pd_transformation_saida_transferencia_caixa` lê `custrecord_pd_coadm_tipo_uso` e `custrecord_pd_coadm_destino` no `customrecord_pd_controle_administrativo` e cria registros em `customrecord_pd_entradas_caixa_gerencial` no caixa destino
- Scripts de recalculo de saldo (`_cx_1_1` a `_cx_1_6`) somam registros de `customrecord_pd_entradas_caixa_gerencial` e `customrecord_pd_controle_administrativo` usando campos de relacionamento específicos por caixa
- Scripts de fechamento (`_fechamento_cx_1_0` a `_cx_1_6`) fecham o caixa atual, criam novo registro, transferem saldo e marcam `custrecord_pd_coadm_closure_step_1` e `custrecord_pd_entrada_step_1`
- `customscript_pd_fechamento_cx_ger_1_0` adicionalmente cria o registro `customrecord_pd_gestao_empate` via `custrecord_pd_cx_relacionamento`
- `customrecord_pd_gestao_empate` filtra `customrecord_pd_entradas_caixa_gerencial` por `custrecord_pd_quadro_socios` onde `custrecord_pd_entrada_step_2 = F`
- `customrecord_pd_gestao_empate` filtra `customrecord_pd_controle_administrativo` por `custrecord_pd_coadm_socio_solicitante` onde `custrecord_pd_coadm_empate = T` e `custrecord_pd_coadm_closure_step_2 = F`
- `customworkflow_pd_wf_entradas_caixa` valida campos obrigatórios no `journalentry` antes da transformation
- `customworkflow_pd_wf_controle_administrativo` valida campos obrigatórios no `customrecord_pd_controle_administrativo`

---

## Notas de implementação

- **Saldo Inicial no Golive**: O campo `custrecord_pd_saldo_inicial_cx_ger_1_0` deve ser preenchido manualmente na primeira abertura. Após isso, o script de fechamento assume.
- **Botão "FECHAR CAIXA"**: Deve ser renderizado via SuiteScript (Client Script ou Suitelet injetado via User Event `beforeLoad`), visível apenas quando `status = "Aberto"`.
- **Bloqueio de subregistros após fechamento**: O script de fechamento deve impedir criação de novos [2.0] e [3.0] vinculados ao ID do caixa fechado — implementar via User Event `beforeSubmit` nos records filhos verificando o status do pai.
- **Replicação da Base do Empate**: Quando o usuário preencher `custrecord_pd_ge_base_geral_empate`, os campos `base_socio_1/2/3` devem ser atualizados automaticamente — implementar via User Event `afterSubmit` ou formula no próprio record.
- **step_2 como antiduplicidade**: Os campos `custrecord_pd_entrada_step_2` e `custrecord_pd_coadm_closure_step_2` são a única barreira contra contabilização dupla no empate. O script de criação do [4.0] deve marcar esses campos logo após a soma.
- **Transferência de fundos**: A saída em [3.0] e a entrada no caixa destino em [2.0] devem ser criadas atomicamente. Considerar rollback em caso de erro na criação da entrada.
- **Caixas [1.1] a [1.6]**: A especificação prevê fechamento independente por caixa — o fechamento do [1.0] NÃO aciona automaticamente o fechamento dos caixas secundários.
- **IDs da lista `customlist_pd_cx_gerencial_tranf`**: Os IDs 1 a 6 devem estar mapeados na ordem exata dos registros [1.1] a [1.6] para que a transformation de transferência funcione corretamente.
- **Padrão de nomenclatura de arquivos**: EntryPoints seguem `NomeAção.US.js`; Services seguem `nome_record.service.js` conforme padrão `netsuite_tools`.

---

## Changelog

| Data       | Autor      | Mudança                                            |
|------------|------------|----------------------------------------------------|
| 2025-12-24 | —          | Criação da especificação funcional original        |
| 2026-04-20 | —          | Geração do manifest a partir da especificação      |