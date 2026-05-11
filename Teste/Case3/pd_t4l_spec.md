# Spec: pd_t4l — Integração NetSuite × Tech4Log (CIOT)

**Cliente:** GrupoFF
**Data:** 2026-05-07
**Versão:** 1.2

> ⚠️ Este documento foi gerado a partir da leitura do código-fonte existente.
> Representa o comportamento **atual** do sistema, não necessariamente o comportamento **desejado**.
> Divergências estão documentadas na seção 13.

---

## Changelog

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.2 | 2026-05-08 | spec-editor | Remoção dos fluxos LogSaída (ex-6.9 e ex-6.10): envio de crédito e reversão de crédito ao Tech4Log — substituídos pelo fluxo de settlement (seção 6.9) |
| 1.1 | 2026-05-07 | spec-editor | Adição do fluxo de notificação de pagamento ao Tech4Log (settlement) via UserEvent em Customer Payment |
| 1.0 | 2026-05-07 | spec-reverse-builder | Versão inicial gerada por engenharia reversa |

---

## 1. Contexto

O GrupoFF opera transportadoras que emitem CIOTs (Certificado Internacional de Operações de Transporte) — documento obrigatório no transporte rodoviário de cargas. A plataforma Tech4Log é o TMS (Transportation Management System) responsável pela emissão e gestão desses CIOTs. O NetSuite é o ERP financeiro do grupo.

Este projeto implementa a integração bidirecional entre os dois sistemas: o Tech4Log notifica o NetSuite sobre eventos do ciclo de vida do CIOT (emissão, pagamento, cancelamento, etc.) via webhooks, e o NetSuite processa esses eventos para gerar os registros financeiros correspondentes — notas de crédito, notas de débito, faturas, boletos e confirmações de pagamento — enviando retornos de status ao Tech4Log ao final de cada fluxo.

---

## 2. Objetivo

Receber eventos do ciclo de vida de CIOTs via API REST (Tech4Log → NetSuite), processar as regras financeiras de cada evento, gerar os documentos contábeis correspondentes no NetSuite e confirmar o resultado de volta à Tech4Log.

---

## 3. Atores

| Ator | Papel no processo |
|------|-------------------|
| Tech4Log (TMS) | Sistema externo que emite CIOTs e envia webhooks ao NetSuite |
| Transportadora (Customer NetSuite) | Contratante do CIOT; gera receita para o grupo |
| Posto de Combustível (Vendor NetSuite) | Recebedor do pagamento CIOT; gera despesa para o grupo |
| Analista Financeiro GrupoFF | Aciona manualmente a geração de NCs/NDs via Suitelet quando necessário |
| Securitizadora | Terceiro que assume obrigações de pagamento de Vendor Bills específicas |
| NetSuite (ERP) | Processa eventos, gera documentos financeiros e retorna confirmações |

---

## 4. Gatilho

O sistema possui múltiplos gatilhos, um para cada fase do processo:

| Gatilho | Tipo | Evento |
|---------|------|--------|
| Webhook Tech4Log | RESTlet POST | Tech4Log envia JSON com evento do CIOT |
| Criação de Log Entry | UserEvent afterSubmit | Processamento síncrono imediato (tipos 1 e 3) |
| Orquestrador assíncrono | MapReduce agendado | Processa logs não processados periodicamente |
| MRs de faturamento | MapReduce agendados | Geram documentos fiscais em janelas diárias |

| Suitelet manual | URL acessada pelo usuário | Geração manual de lotes de NC/ND |
| Criação de Customer Payment | UserEvent afterSubmit *(atualizado na v1.1)* | Pagamento aplicado a Invoice da integração t4l dispara notificação ao Tech4Log |

---

## 5. Fluxo Principal

### 5.1 Fluxo de Emissão de CIOT (Tipo 1)

1. Tech4Log envia POST ao RESTlet `pd_t4l_log_entrada_rl` com payload JSON descrevendo o CIOT emitido.
2. O RESTlet cria um registro `customrecord_pd_t4l_log_entry` com o JSON bruto no campo `descricao`.
3. O UserEvent `beforeSubmit` do log entry identifica o tipo do evento pelo campo `descricao` e preenche `custrecord_pd_type_entry` com o valor `1` (Emissão CIOT).
4. O UserEvent `afterSubmit` detecta tipo=1 em operação CREATE e chama `createCiot(rec)` sincronamente:
   - Faz parse do JSON (com pipeline de sanitização: remoção de BOM → normalização de aspas → unescape HTML → extração do bloco JSON).
   - Valida o `cnpjCliente` buscando o Customer correspondente no NetSuite.
   - Cria o registro `customrecord_pd_t4l_ciot` mapeando os campos do JSON (protocolo, CNPJ, valor frete, IRRF, INSS, SEST/SENAT, datas de viagem, RNTRC, etc.).
   - Cria os registros de parcelas (`customrecord_pd_t4l_installment_ciot`) com categoria mapeada: Adiantamento=1, Saldo=2, Complementar=3.
   - Cria os registros de veículos (`customrecord_pd_t4l_vehicles`) vinculados ao CIOT.
   - Marca o log entry como processado e vincula o ID do CIOT criado.
5. Após criação bem-sucedida, chama `tech4LogApi.sendEmissionReturn()` enviando o status de retorno ao Tech4Log via POST em `/api/webhooks/oracle/ciots/integration-status`.
6. O MR Orquestrador também tentará processar este log entry assincronamente (dupla cobertura intencional), mas o campo `processado=T` evitará reprocessamento.

### 5.2 Fluxo de Pagamento de CIOT (Tipo 3)

1. Tech4Log envia POST com payload indicando pagamento de parcela (campo `idParcela`, `tipoPagamento`, `valor`).
2. RESTlet cria log entry; UserEvent identifica tipo=3.
3. UserEvent `afterSubmit` chama `payCiot(rec)` sincronamente:
   - Localiza a parcela pelo campo `name=idParcela` (fallback: por número da parcela).
   - Bloqueia processamento se parcela já estiver Pago(2) ou Cancelado(3).
   - Atualiza parcela: `amount_paid`, `status=Pago(2)`, `payment_date`, `payment_type` (REDE=1, SCD=2, PIX=3, TRC=4).
   - Vincula Posto (Vendor) e Transportadora (Customer) pela busca por CNPJ.
   - Executa `calculateDiscountAndRevenue()` para calcular desconto e receita líquida da parcela.
   - Se tipo de pagamento = REDE: cria Nota de Crédito (NC) e Nota de Débito (ND) sincronamente.
4. Chama `tech4LogApi.sendPaymentReturn()` enviando retorno ao Tech4Log via POST em `/api/webhooks/oracle/ciot-parcels/integration-status`.

---

## 6. Fluxos Alternativos

### 6.1 Cancelamento de CIOT (Tipo 2)

1. Tech4Log envia evento de cancelamento com protocolo e nome do CIOT.
2. MR `pd-t4l-log-entry-cancel-ciot.mr.js` localiza o CIOT pelo protocolo+nome (com fallbacks).
3. Atualiza status do CIOT para Cancelado(3) e registra data de cancelamento.
4. Cancela todas as parcelas em status "Em Aberto" (status 1→3), zerando `amount_paid`.
5. Parcelas já pagas ou liquidadas não são afetadas.

### 6.2 Estorno de Parcela (Tipo 4)

1. Tech4Log envia evento de estorno de parcela (idParcela).
2. MR `pd-t4l-log-entry-reversed.mr.js` localiza a parcela.
3. Se pagamento for do tipo REDE:
   - Exclui NCs vinculadas. Se a NC tiver Invoice gerada:
     - Se o Invoice tiver outras parcelas ainda não faturadas: remove apenas a linha da NC.
     - Se for linha única: exclui o Invoice inteiro.
   - Exclui NDs vinculadas com lógica análoga para Vendor Bills.
   - Limpa o vínculo de NFSe na parcela.
4. Marca a parcela como `custrecord_pd_t4l_inst_reversed=true` apenas em caso de sucesso completo.
5. Bloqueadores: Invoice já pago ou Invoice com parcelas de outros processos ainda pendentes.

### 6.3 Adiantamento de Crédito (Tipo 5)

1. Tech4Log envia evento de antecipação de crédito com CNPJ e valor.
2. MR `pd-t4l-log-entry-deposity.mr.js` localiza o Customer pelo CNPJ.
3. Cria um `customerdeposit` usando formulário customizado 67.
4. Conta bancária preferencial: 534 (se compatível com a subsidiária do cliente).
5. Vincula o ID do depósito no campo `custrecord_pd_linked_transaction` do log entry.

### 6.4 Liquidação de Parcela (Tipo 7)

1. Tech4Log envia evento com array `pagamentos[]` contendo múltiplas parcelas.
2. MR `pd-t4l-log-entry-sold-out.mr.js` processa cada item do array.
3. Para cada parcela: bloqueia se Pago(2) ou Cancelado(3); caso contrário, define status=Liquidado(4), `amount_paid` e `payment_type`.

### 6.5 Parcela Complementar (Tipo 8)

> ⚠️ **Este fluxo não está funcional.** O MR `pd-t4l-log-entry-additional-inst.mr.js` possui variáveis indefinidas (`CONFIG`, `record`, `ciotId`) e não está em produção.

### 6.6 Tipo 6 — Cancelamento de Antecipação

> ⚠️ **Este tipo foi descartado.** O log entry pode receber type=6, mas não existe MR ou processamento correspondente.

### 6.7 Geração de NC/ND por REDE (Fluxo Assíncrono de Recuperação)

1. MR `pd-t4l-create-rt-nd-nc.mr.js` roda periodicamente.
2. Localiza todas as parcelas REDE com status Pago que ainda não possuem NC ou ND vinculadas.
3. Para cada uma: cria NC e ND de forma idempotente (com retry de até 4 tentativas para lidar com conflitos RCRD_HAS_BEEN_CHANGED).

### 6.8 Pagamento via Securitizadora

1. Usuário acessa Vendor Bill e clica no botão "Pagamento por Securitizadora" (injetado via Client Script pelo UE `pd-t4l-vendorbill-handler.us.js`).
2. O botão aciona o RESTlet `pd-t4l-securitization-payment.rl.js` via POST.
3. O RESTlet copia o Vendor Bill original para o vendor da securitizadora (parâmetro `custscript_pd_t4l_securitization_vendor`), preservando a transação de origem (`transactionOrigin`).
4. O Vendor Bill original é transformado em Credit Memo.

### 6.9 Notificação de Pagamento ao Tech4Log (Settlement) *(atualizado na v1.1)*

1. Um Customer Payment é criado no NetSuite.
2. O UserEvent `afterSubmit` do pagamento é acionado.
3. O script percorre todas as linhas de aplicação do pagamento (Invoices quitados total ou parcialmente).
4. Para cada Invoice aplicado, verifica se o campo `custbody_pd_t4l_nature = 3` (Nota de Crédito) — critério que identifica Invoices originados da integração t4l.
5. Para cada Invoice elegível, envia ao Tech4Log o payload:
   ```json
   {
     "cpf_cnpj": "<CPF/CNPJ do cliente do Invoice>",
     "value": <valor aplicado neste Invoice pelo pagamento>,
     "type": "settlement",
     "invoice": "<número do Invoice (tranid)>",
     "external_id": "<ID interno do pagamento no NetSuite>"
   }
   ```
6. O envio usa o mesmo endpoint e autenticação já existentes (`/api/webhooks/statement/oracle`).
7. Se o pagamento quitar múltiplos Invoices elegíveis, um envio independente é realizado para cada um.

---

## 7. Regras de Negócio

- **RN01:** Um log entry só é processado pelo MR Orquestrador se `processado ≠ T` (ou vazio) e foi criado após 31/01/2026.
- **RN02:** Se um log entry acumular mais de 4 tentativas de processamento (campo de contador), é marcado como processado para evitar loop infinito.
- **RN03:** Parcelas com status Pago(2) ou Cancelado(3) são imunes a novos pagamentos (tipos 3 e 7 bloqueados).
- **RN04:** Apenas parcelas em status "Em Aberto"(1) são canceladas no fluxo de cancelamento de CIOT (tipo 2).
- **RN05:** Apenas pagamentos do tipo REDE(1) geram Nota de Crédito e Nota de Débito.
- **RN06:** NCs são emitidas com base em dia da semana configurado na própria NC — o campo de dia de faturamento é definido por um processo externo (não identificado no código).
- **RN07:** NDs são emitidas com a mesma lógica de dia da semana da NC correspondente; a taxa da ND = `amtRefund - amtIncome`.
- **RN08:** NFSes (para postos) são geradas para parcelas REDE/Pagas que possuam ND vinculada mas ainda sem NFSe.
- **RN09:** A entidade de uma NFSe de posto é `custrecord_pd_t4l_inst_gas_station` (Customer representando o posto).
- **RN10:** NCs e NDs só são geradas para pagamentos com `payment_date <= ontem`.
- **RN11:** O token de autenticação da API Tech4Log é cacheado por 3.300 segundos (~55 min) em cache de aplicação (N/cache, scope APPLICATION), evitando autenticações repetidas.
- **RN12:** O Invoice de receita CIOT agrega CIOT em status Gerado(1); após faturamento, o CIOT passa para Finalizado(4).
- **RN13:** Cada Invoice de receita é limitado a 400 linhas para evitar timeout.
- **RN14:** A ordem de processamento de transportadoras no Invoice de parcelas obedece o campo `custentity_pd_t4l_execution_priority` do Customer.
- **RN16:** O Vendor Bill de posto não recebe botão de securitizadora se for do vendor da securitizadora (proteção contra loop).
- **RN19:** Parcelas complementares (tipo 8) não são processadas — funcionalidade incompleta.
- **RN20:** O tipo 6 (Cancelamento de Antecipação) foi descartado e não possui processamento.
- **RN21:** Invoices de crédito (NC) usam os termos de pagamento definidos na própria NC (`custrecord_pd_t4l_cn_terms`).
- **RN22:** Customer Deposits de adiantamento usam formulário customizado 67 e conta bancária preferencial 534 (se compatível com subsidiária).
- **RN23:** *(v1.1)* Um Invoice é considerado "da integração t4l" quando o campo `custbody_pd_t4l_nature` é igual a `3` (Nota de Crédito). Apenas esses Invoices disparam o envio de settlement ao Tech4Log.
- **RN24:** *(v1.1)* Quando um pagamento quita múltiplos Invoices elegíveis, o envio ao Tech4Log é realizado individualmente por Invoice, com o valor aplicado a cada um — nunca o valor total do pagamento.
- **RN25:** *(v1.1)* O campo `external_id` enviado ao Tech4Log é o ID interno do registro de Customer Payment no NetSuite.

---

## 8. Operações sobre Dados

| Operação | Record | Descrição |
|----------|--------|-----------|
| Criação | `customrecord_pd_t4l_log_entry` | RESTlet cria ao receber webhook do Tech4Log |
| Leitura | `customrecord_pd_t4l_log_entry` | Orquestrador MR busca logs não processados |
| Escrita | `customrecord_pd_t4l_log_entry` | Marca como processado; registra erros e ID do CIOT criado |
| Criação | `customrecord_pd_t4l_ciot` | Criado no fluxo de emissão (tipo 1) |
| Escrita | `customrecord_pd_t4l_ciot` | Status atualizado: Gerado→Processado→Cancelado→Finalizado |
| Criação | `customrecord_pd_t4l_installment_ciot` | Criadas junto ao CIOT (tipo 1) |
| Escrita | `customrecord_pd_t4l_installment_ciot` | Status, valor pago, tipo pagamento, vínculos NC/ND/NFSe |
| Criação | `customrecord_pd_t4l_vehicles` | Veículos vinculados ao CIOT |
| Criação | `customrecord_pd_t4l_credit_note` | NC criada para parcelas REDE pagas |
| Escrita | `customrecord_pd_t4l_credit_note` | Marcada como `nc_created=T` após geração do Invoice |
| Criação | `customrecord_pd_t4l_debit_note` | ND criada para parcelas REDE pagas |
| Escrita | `customrecord_pd_t4l_debit_note` | Marcada como `nd_created=T` após geração do Vendor Bill |

| Criação | `customerdeposit` | Adiantamento de crédito (tipo 5), formulário 67 |
| Criação | `invoice` | Gerado por MRs de faturamento (receita CIOT, receita parcela, NC, NFSe posto) |
| Escrita | `invoice` | Linhas removidas/deletadas no estorno de parcela |
| Criação | `vendorbill` | Gerado pelo MR de ND |
| Escrita | `vendorbill` | Transformado em Credit Memo no fluxo de securitizadora; linhas removidas no estorno |
| Busca | `customer` | Busca por CPF/CNPJ para vincular transportadora |
| Busca | `vendor` | Busca por CNPJ para vincular posto de combustível |
| Busca | `customrecord_pd_t4l_ciot` | Localização por protocolo+nome para cancelamento |
| Busca | `customrecord_pd_t4l_installment_ciot` | Localização por `name=idParcela` (com fallback por número) |
| Deleção | `customrecord_pd_t4l_log_entry` | MR de limpeza deleta logs com mais de 90 dias |
| Leitura | `customerpayment` *(v1.1)* | UE lê o pagamento para obter ID interno (external_id), valor aplicado por Invoice e cliente |
| Leitura | `invoice` *(v1.1)* | UE lê cada Invoice aplicado para verificar `custbody_pd_t4l_nature` e obter número (tranid) e CPF/CNPJ do cliente |

---

## 9. Exceções e Tratamento de Erros

| Situação | Comportamento atual |
|----------|---------------------|
| Falha na criação do CIOT (tipo 1) | Erro registrado em `custrecord_pd_error` do log entry; CIOT não é criado; log não é marcado como processado (será reprocessado pelo MR orquestrador) |
| Log entry com >4 tentativas de processamento | Marcado como processado automaticamente para evitar loop infinito |
| Parcela não encontrada (tipo 3 ou 7) | Log de erro registrado; processamento interrompido |
| Parcela já paga ou cancelada | Bloqueio silencioso: operação ignorada, log de erro registrado |
| CNPJ de transportadora não encontrado no NetSuite | Erro registrado; CIOT não é criado |
| CIOT não encontrado para cancelamento | Tentativas com fallbacks (protocolo, depois nome); erro registrado se todos falharem |
| Erro na API Tech4Log (HTTP ≥ 400) | Exception lançada; `sendInvoice` captura silenciosamente; `sendPaymentReturn` e `sendEmissionReturn` propagam o erro |
| Pagamento aplicado a Invoice sem `custbody_pd_t4l_nature = 3` *(v1.1)* | Invoice ignorado silenciosamente; nenhum envio é realizado para esse Invoice |
| Invoice já pago no estorno de parcela | Operação bloqueada; erro registrado |
| Invoice com parcelas de múltiplos processos no estorno | Apenas a linha é removida (Invoice não é deletado) |
| Conflito RCRD_HAS_BEEN_CHANGED na criação de NC/ND | Retry automático com até 4 tentativas (MR pd-t4l-create-rt-nd-nc) |
| JSON malformado no payload do Tech4Log | Pipeline de sanitização tenta corrigir; se falhar, erro registrado no log entry |

---

## 10. Integrações Externas

### Tech4Log API (Produção)
- **Base URL:** `https://gatewaytms.tech4log.com`
- **Autenticação:** POST `/api/auth/login` com CNPJ e senha (armazenados em NetSuite Secrets: `custsecret_pd_t4l_api_cnpj` e `custsecret_pd_t4l_api_password`). Token cacheado por 55 min.
- **Retorno de Emissão:** POST `/api/webhooks/oracle/ciots/integration-status`
- **Retorno de Pagamento:** POST `/api/webhooks/oracle/ciot-parcels/integration-status`
- **Envio de Pagamento (Settlement) *(v1.1)*:** POST `/api/webhooks/statement/oracle` com `cpf_cnpj`, `value`, `type=settlement`, `invoice` (número), `external_id` (ID interno do pagamento)

### NetSuite → Tech4Log (entrada)
- **RESTlet receptor:** `customscript_pd_t4l_log_entrada_rl` — recebe eventos via POST HTTP

---

## 11. Estrutura Técnica Identificada

| Arquivo | Tipo | Responsabilidade |
|---------|------|-----------------|
| `Log Entrada/restlet/pd_t4l_log_entrada_rl.js` | RESTlet | Recebe webhooks do Tech4Log e cria log entries |
| `Log Entrada/userevent/pd-t4l-log-entry-handler.ue.js` | UserEvent | Processamento síncrono de emissão (tipo 1) e pagamento (tipo 3) |
| `Log Entrada/mapreduce/pd-t4l-log-entry.mr.js` | MapReduce | Orquestrador: despacha logs não processados para MRs especializados |
| `Log Entrada/mapreduce/pd-t4l-log-entry-create-ciot.mr.js` | MapReduce | Emissão de CIOT (tipo 1) — caminho assíncrono |
| `Log Entrada/mapreduce/pd-t4l-log-entry-paymt-ciot.mr.js` | MapReduce | Pagamento de parcela (tipo 3) — caminho assíncrono |
| `Log Entrada/mapreduce/pd-t4l-log-entry-cancel-ciot.mr.js` | MapReduce | Cancelamento de CIOT (tipo 2) |
| `Log Entrada/mapreduce/pd-t4l-log-entry-reversed.mr.js` | MapReduce | Estorno de parcela (tipo 4) |
| `Log Entrada/mapreduce/pd-t4l-log-entry-deposity.mr.js` | MapReduce | Adiantamento de crédito (tipo 5) |
| `Log Entrada/mapreduce/pd-t4l-log-entry-sold-out.mr.js` | MapReduce | Liquidação de parcela (tipo 7) |
| `Log Entrada/mapreduce/pd-t4l-log-entry-additional-inst.mr.js` | MapReduce | Parcela complementar (tipo 8) — **NÃO FUNCIONAL** |
| `Log Entrada/mapreduce/pd-t4l-clear-logs.mr.js` | MapReduce | Limpeza de logs com mais de 90 dias |
| `Invoice/pd-t4l-invoice-handler.us.js` | UserEvent | Gera descrição NFS-e; desvíncula NC ao remover linhas do Invoice |
| `Invoice/pd-t4l-create-revenue-ciot.mr.js` | MapReduce | Gera Invoice de receita por CIOT (status Gerado→Finalizado) |
| `Invoice/pd-t4l-create-revenue-installment.mr.js` | MapReduce | Gera Invoice de receita por parcelas pagas hoje |
| `Invoice/pd-t4l-create-credit-note.mr.js` | MapReduce | Gera Invoice de NC agendado por dia da semana |
| `Invoice/pd-t4l-create-debit-note.mr.js` | MapReduce | Gera Vendor Bill de ND agendado por dia da semana |
| `Invoice/pd-t4l-create-nfse-nd.mr.js` | MapReduce | Gera NFSe (Invoice) por posto para parcelas REDE |
| `Installment/pd-t4l-create-rt-nd-nc.mr.js` | MapReduce | Criação idempotente de NC/ND para parcelas REDE sem cobertura |
| `Installment/pd-t4l-manage-installment.ue.js` | UserEvent | Recalcula desconto/receita no beforeSubmit da parcela |
| `Vendorbill/pd-t4l-vendorbill-handler.us.js` | UserEvent | Injeta botão de securitizadora; desvíncula ND ao editar Vendor Bill |
| `Vendorbill/pd-t4l-securitization-payment.rl.js` | RESTlet | Executa transferência de Vendor Bill para securitizadora |
| `GenerateCreditNote/pd-t4l-generate-credit-note.st.js` | Suitelet | UI para geração manual de lotes de NC |
| `GenerateCreditNote/pd-t4l-generate-credit-note-handler.rl.js` | RESTlet | Backend do Suitelet de NC (GET: lista NCs; POST: dispara MR) |
| `GenerateCreditNote/pd-t4l-carrier.filter.rl.js` | RESTlet | Retorna lista de transportadoras ativas para filtro |
| `GenerateDebitNote/pd-t4l-generate-debit-note-handler.rl.js` | RESTlet | Backend do Suitelet de ND (GET: lista NDs; POST: dispara MR) |
| `GenerateDebitNote/pd-t4l-gas-station.filter.rl.js` | RESTlet | Retorna lista de postos ativos para filtro |

| `Restlet/pd-t4l-unlink-notes.rl.js` | RESTlet | Desvíncula NC/ND de transações ao editar Invoice ou Vendor Bill |
| `Payment/pd-t4l-payment-handler.ue.js` *(v1.1)* | UserEvent | afterSubmit: envia notificação de settlement ao Tech4Log para Invoices da integração t4l |
| `Api/pd-t4l-tech4log.api.js` | Módulo | Cliente HTTP para a API Tech4Log (auth + envios) |
| `Utils/pd-t4l-config.js` | Módulo | Constantes: tipos de log entry, fonte de parâmetros, conta de receita |
| `Utils/pd-t4l-helpers.js` | Módulo | Utilitários: parse de JSON, formatação de datas, CPF/CNPJ, sanitização |
| `Modulos/pd_t4l_constantes.js` | Módulo | IDs de campos do `customrecord_pd_t4l_log_entry` |
| `Modulos/pd_t4l_utils.js` | Módulo | `createLogEntryRecord(body)`: criação do log entry |
| `Services/pd-t4l-customer.js` | Módulo | Busca Customer por CPF/CNPJ |
| `Services/pd-t4l-vendor.js` | Módulo | Busca Vendor por CNPJ |
| `Services/pd-t4l-ciot-record.js` | Módulo | CRUD do registro de CIOT + mapeamento de campos JSON |
| `Services/pd-t4l-ciot-installment.js` | Módulo | CRUD da parcela + cálculo de desconto/receita |
| `Services/pd-t4l-invoice.js` | Módulo | Service de Invoice + geração de descrição NFS-e |
| `Services/pd-t4l-vendorbill.js` | Módulo | Service de Vendor Bill + transformação em Credit Memo |
| `Services/pd-t4l-log-entry.js` | Módulo | Service de log entry (ver seção 13 — possível bug) |
| `Services/pd-t4l-vehicles.js` | Módulo | Service de veículos |
| `Services/pd-t4l-credit-note-line.js` | Módulo | Service de linhas de NC |
| `Services/pd-t4l-debit-note-line.js` | Módulo | Service de linhas de ND |

---

## 12. Restrições e Premissas Identificadas

- O sistema só processa logs criados após **31/01/2026** (filtro hardcoded no MR Orquestrador).
- Logs com mais de **90 dias** são deletados pelo MR de limpeza.
- O MR Orquestrador processa logs em lotes de **1.000 registros** por disparo.
- Invoices de receita são limitados a **400 linhas** para evitar timeout do NetSuite.
- A conta de receita padrão para Invoices é **1244** (hardcoded em `pd-t4l-config.js`).
- A conta bancária preferencial para Customer Deposits é **534** (hardcoded no MR de tipo 5).
- O formulário customizado para Customer Deposits é **67** (hardcoded).
- O vendor da securitizadora é configurado via parâmetro de script (`custscript_pd_t4l_securitization_vendor`).
- O sistema utiliza a biblioteca interna `pd_c_netsuite_tools` para utilitários de record, search e scripts.
- CIOTs gerados através do processamento síncrono (UserEvent) também passam pelo MR assíncrono, mas o flag `processado=T` previne duplicação.
- O processo que define os campos de dia de mento das NCs/NDs não está implementado neste projeto.

---

## 13. Comportamento Observado vs. Comportamento Esperado

| # | Comportamento no código | Comportamento esperado | Status |
|---|------------------------|------------------------|--------|
| 1 | `pd-t4l-manage-installment.ue.js` exporta apenas `{ beforeSubmit }` — a função `afterSubmit` está implementada mas não está no objeto de retorno | afterSubmit deveria executar para criar NC/ND quando parcela for paga via REDE | ⚠️ Possível bug — afterSubmit não executa |
| 2 | `pd-t4l-log-entry.js` (service) define `const TYPE = 'customrecord_pd_t4l_installment_ciot'` em vez de `customrecord_pd_t4l_log_entry` | TYPE deveria referenciar o record de log entry | ⚠️ Possível cópia incorreta — verificar impacto |
| 3 | `pd-t4l-clear-logs.mr.js` chama o período de 90 dias, mas a variável interna se chama `getDate30DaysAgoDate` | Nome da função sugere 30 dias; comportamento real é 90 dias | ⚠️ Inconsistência de nomenclatura — sem impacto funcional |
| 4 | Tipo 8 (Parcela Complementar) está mapeado no orquestrador mas o MR de destino tem variáveis indefinidas | Fluxo deveria criar parcelas complementares em CIOTs existentes | ✅ Confirmado como incompleto — não roda em produção |
| 5 | Tipo 6 está mapeado como possível tipo de log mas não possui MR correspondente | Cancelamento de antecipação deveria ser processado | ✅ Confirmado como descartado |

---

## 14. Fora de Escopo

- Emissão de CIOTs — o NetSuite apenas **recebe** eventos; quem emite é o Tech4Log.
- Gestão de motoristas, veículos ou rotas — apenas registros de veículos vinculados ao CIOT são criados.
- Conciliação bancária ou integração com bancos — o sistema registra pagamentos mas não os executa.
- Aprovação de CIOTs — o fluxo é automatizado sem etapas de aprovação manual.
- Cancelamento de antecipação de crédito (tipo 6) — descartado.
- Parcela complementar (tipo 8) — ainda não funcional.
- Relatórios ou dashboards — nenhum Suitelet de visualização está implementado além dos de geração de NC/ND.
- Reprocessamento manual de logs com erro — não há interface para isso; depende do MR orquestrador.
- O fluxo LogSaída foi removido do escopo nesta versão — substituído pelo fluxo de settlement (seção 6.9). *(v1.2)*

---

## 15. Dúvidas em Aberto

| # | Dúvida | Origem | Responsável | Status |
|---|--------|--------|-------------|--------|