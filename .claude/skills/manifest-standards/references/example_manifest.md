# Project Manifest: pd_t4l — Integração Tech4Log (TMS)

**Cliente:** GrupoFF
**Gerado em:** 11/05/2026
**Versão do Spec:** 1.2
**Gerado por:** manifest-builder

---

## Scripts

| Script ID | Arquivo | Tipo | Record Alvo | Descrição |
|-----------|---------|------|-------------|-----------|
| `customscript_pd_t4l_log_entrada_rl` | `pd_t4l_log_entrada_rl.js` | RESTlet | — | Recebe webhooks JSON do Tech4Log e persiste como log de entrada |
| `customscript_pd_t4l_log_entry_handler` | `pd-t4l-log-entry-handler.ue.js` | UserEvent | `customrecord_pd_t4l_log_entry` | Classifica o tipo do evento e processa imediatamente tipos 1, 2, 3 e 4 |
| `customscript_pd_t4l_log_entry_mr` | `pd-t4l-log-entry.mr.js` | MapReduce | — | Orquestrador: roteia logs não processados para os MRs especializados |
| `customscript_pd_t4l_log_entry_create_ciot` | `pd-t4l-log-entry-create-ciot.mr.js` | MapReduce | — | Processa tipo 1 (Emissão de CIOT): cria CIOT, parcelas e veículos |
| `customscript_pd_t4l_log_entry_cancel_ciot` | `pd-t4l-log-entry-cancel-ciot.mr.js` | MapReduce | — | Processa tipo 2 (Cancelamento de CIOT): cancela CIOT e parcelas em aberto |
| `customscript_pd_t4l_log_entry_paymt_ciot` | `pd-t4l-log-entry-paymt-ciot.mr.js` | MapReduce | — | Processa tipo 3 (Pagamento de CIOT): baixa parcela e cria NC/ND para REDE |
| `customscript_pd_t4l_log_entry_reversed` | `pd-t4l-log-entry-reversed.mr.js` | MapReduce | — | Processa tipo 4 (Estorno de Parcela): remove NC, ND, Invoice e VendorBill vinculados |
| `customscript_pd_t4l_log_entry_deposity` | `pd-t4l-log-entry-deposity.mr.js` | MapReduce | — | Processa tipo 5 (Adiantamento de Crédito): cria Customer Deposit |
| `customscript_pd_t4l_log_entry_sold_out` | `pd-t4l-log-entry-sold-out.mr.js` | MapReduce | — | Processa tipo 7 (Liquidação): atualiza parcelas para status Liquidado |
| `customscript_pd_t4l_log_entry_additional` | `pd-t4l-log-entry-additional-inst.mr.js` | MapReduce | — | Processa tipo 8 (Parcela Complementar): cria CIOT complementar com parcelas e veículos |
| `customscript_pd_t4l_manage_installment` | `pd-t4l-manage-installment.ue.js` | UserEvent | `customrecord_pd_t4l_installment_ciot` | Calcula desconto e receita antes de salvar uma parcela CIOT |
| `customscript_pd_t4l_create_rt_nd_nc` | `pd-t4l-create-rt-nd-nc.mr.js` | MapReduce | — | Cria NC e ND retroativamente para parcelas REDE elegíveis sem esses registros |
| `customscript_pd_t4l_create_revenue_inst` | `pd-t4l-create-revenue-installment.mr.js` | MapReduce | — | Cria Invoices de receita agrupadas por cliente para parcelas SCD/PIX/TRC |
| `customscript_pd_t4l_create_credit_note` | `pd-t4l-create-credit-note.mr.js` | MapReduce | — | Cria Invoices de NC agrupadas por cliente/tipo no dia da semana configurado |
| `customscript_pd_t4l_create_debit_note` | `pd-t4l-create-debit-note.mr.js` | MapReduce | — | Cria Vendor Bills de ND agrupadas por fornecedor no dia da semana configurado |
| `customscript_pd_t4l_create_nfse_nd` | `pd-t4l-create-nfse-nd.mr.js` | MapReduce | — | Cria Invoices (NFS-e) para parcelas REDE com ND vinculada, agrupadas por posto |
| `customscript_pd_t4l_create_revenue_ciot` | `pd-t4l-create-revenue-ciot.mr.js` | MapReduce | — | Cria Invoices de receita de CIOT agrupadas por cliente |
| `customscript_pd_t4l_clear_logs` | `pd-t4l-clear-logs.mr.js` | MapReduce | — | Manutenção: exclui logs de entrada com mais de 90 dias |
| `customscript_pd_t4l_invoice_handler` | `pd-t4l-invoice-handler.us.js` | UserEvent | `invoice` | Mantém integridade de vínculos NC em Invoices e gera resumo CIOT |
| `customscript_pd_t4l_vendorbill_handler` | `pd-t4l-vendorbill-handler.us.js` | UserEvent | `vendorbill` | Adiciona botão de securitizadora e mantém integridade de vínculos ND em Vendor Bills |
| `customscript_pd_t4l_payment_handler` | `pd-t4l-payment-handler.ue.js` | UserEvent | `customerpayment` | Notifica Tech4Log via sendSettlement ao criar Customer Payment para Invoice de NC |
| `customscript_pd_t4l_securitization_cs` | `pd-t4l-securitization-payment.cs.js` | ClientScript | `vendorbill` | Implementa ação do botão de pagamento por securitizadora |
| `customscript_pd_t4l_securitization_rl` | `pd-t4l-securitization-payment.rl.js` | RESTlet | — | Cria nova Vendor Bill com fornecedor Securitizadora e transforma a original em Credit Memo |
| `customscript_pd_t4l_generate_credit_note_st` | `pd-t4l-generate-credit-note.st.js` | Suitelet | — | Interface para geração manual de Notas de Crédito |
| `customscript_pd_t4l_generate_debit_note_st` | `pd-t4l-generate-debit-note.st.js` | Suitelet | — | Interface para geração manual de Notas de Débito |
| `customscript_pd_t4l_carrier_filter_rl` | `pd-t4l-carrier.filter.rl.js` | RESTlet | — | Filtro de transportadoras |
| `customscript_pd_t4l_generate_cn_handler_rl` | `pd-t4l-generate-credit-note-handler.rl.js` | RESTlet | — | Handler de geração de Nota de Crédito |
| `customscript_pd_t4l_gas_station_filter_rl` | `pd-t4l-gas-station.filter.rl.js` | RESTlet | — | Filtro de postos de combustível |
| `customscript_pd_t4l_generate_dn_handler_rl` | `pd-t4l-generate-debit-note-handler.rl.js` | RESTlet | — | Handler de geração de Nota de Débito |
| `customscript_pd_t4l_unlink_tran_not_rl` | `pd-t4l-unlink-notes.rl.js` | RESTlet | — | Desvincula transações (Invoice/VendorBill) de linhas de NC ou ND |

---

## Custom Records

### `customrecord_pd_t4l_log_entry` — Log de Entrada

Armazena os payloads JSON recebidos do Tech4Log. Funciona como fila de processamento.

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| JSON de Entrada | `custrecord_pd_json_entry` | Long Text | Payload JSON bruto recebido do webhook |
| Tipo do Evento | `custrecord_pd_type_entry` | List/Record | Tipo numérico do evento (1–8) classificado pelo UE |
| Processado | `custrecord_pd_log_entry_process` | Checkbox | Flag que indica se o log foi processado |
| Tentativas | `custrecord_pd_t4l_processing_attempts` | Integer | Contador de tentativas de processamento |
| Erro | `custrecord_pd_error` | Long Text | Detalhes do erro caso o processamento falhe |
| Registro Vinculado | `custrecord_pd_linked_record` | Text | ID do registro NS criado/atualizado pelo processamento |
| Transação Vinculada | `custrecord_pd_linked_transaction` | Text | ID de transação NS vinculada (ex: Customer Deposit) |

---

### `customrecord_pd_t4l_ciot` — CIOT

Registro principal do CIOT. Status: Gerado(1), Processado(2), Cancelado(3), Finalizado(4).

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| Protocolo | `custrecord_pd_t4l_ciot_protocol` | Text | Protocolo de emissão do CIOT |
| CT-e | `custrecord_pd_t4l_ciot_cte` | Text | Número do CT-e vinculado |
| CNPJ Cliente | `custrecord_pd_t4l_ciot_cnpj` | Text | CNPJ mascarado do contratante |
| Cliente | `custrecord_pd_t4l_ciot_customer` | List/Record | Vínculo com Customer NS |
| Valor | `custrecord_pd_t4l_ciot_amount` | Currency | Valor total do CIOT |
| IRRF | `custrecord_pd_t4l_ciot_irrf` | Currency | Valor de IRRF |
| INSS | `custrecord_pd_t4l_ciot_inss` | Currency | Valor de INSS |
| SEST/SENAT | `custrecord_pd_t4l_ciot_sest_senat` | Currency | Valor de SEST/SENAT |
| Outros | `custrecord_pd_t4l_ciot_others` | Currency | Outros descontos |
| Data Início Viagem | `custrecord_pd_t4l_ciot_travel_start` | Date | Data de início da viagem |
| Data Fim Viagem | `custrecord_pd_t4l_ciot_travel_end` | Date | Data de fim da viagem |
| Peso | `custrecord_pd_t4l_ciot_weight` | Decimal | Peso da carga |
| Tipo de Viagem | `custrecord_pd_t4l_ciot_travel_type` | Text | Tipo de viagem |
| Municípios | `custrecord_pd_t4l_ciot_municipalities` | Long Text | Municípios de origem/destino |
| Receita | `custrecord_pd_t4l_ciot_revenue` | Currency | Valor de receita do CIOT |
| Status | `custrecord_pd_t4l_ciot_status` | List/Record | Status do CIOT (1–4) |
| Data Cancelamento | `custrecord_pd_t4l_ciot_cancel_date` | Date | Data de cancelamento (quando aplicável) |
| Invoice Vinculada | `custrecord_pd_t4l_ciot_invoice` | List/Record | Invoice de receita gerada para este CIOT |

---

### `customrecord_pd_t4l_installment_ciot` — Parcela CIOT

Parcelas de pagamento vinculadas ao CIOT. Status: Em Aberto(1), Pago(2), Cancelado(3), Liquidado(4). Tipo de pagamento: REDE(1), SCD(2), PIX(3), TRC(4).

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| CIOT | `custrecord_pd_t4l_inst_ciot` | List/Record | Vínculo com o CIOT pai |
| Número | `custrecord_pd_t4l_inst_number` | Integer | Número sequencial da parcela |
| Valor | `custrecord_pd_t4l_inst_amount` | Currency | Valor da parcela |
| Valor Pago | `custrecord_pd_t4l_inst_amount_paid` | Currency | Valor efetivamente pago |
| Desconto | `custrecord_pd_t4l_inst_discount_payment` | Currency | Desconto calculado no pagamento |
| Receita | `custrecord_pd_t4l_inst_income` | Currency | Receita calculada da parcela |
| Status | `custrecord_pd_t4l_inst_status` | List/Record | Status da parcela (1–4) |
| Tipo de Pagamento | `custrecord_pd_t4l_inst_payment_type` | List/Record | Tipo de pagamento (1–4) |
| Categoria | `custrecord_pd_t4l_inst_category` | List/Record | Adiantamento(1), Saldo(2), Complementar(3) |
| Vencimento | `custrecord_pd_t4l_inst_due_date` | Date | Data de vencimento da parcela |
| Data Pagamento | `custrecord_pd_t4l_inst_payment_date` | Date | Data em que o pagamento foi realizado |
| Posto AP | `custrecord_pd_t4l_inst_vendor` | List/Record | Vínculo com Vendor (posto AP) |
| Posto AR | `custrecord_pd_t4l_inst_customer` | List/Record | Vínculo com Customer (posto AR) |
| NC Vinculada | `custrecord_pd_t4l_inst_credit_note` | List/Record | Nota de Crédito vinculada |
| ND Vinculada | `custrecord_pd_t4l_inst_debit_note` | List/Record | Nota de Débito vinculada |
| NFSe Vinculada | `custrecord_pd_t4l_inst_nfse_linked` | List/Record | Invoice de NFS-e vinculada |
| Transação Invoice | `custrecord_pd_t4l_inst_transaction_ciot` | List/Record | Invoice de receita vinculada à parcela |
| Estornada | `custrecord_pd_t4l_inst_reversed` | Checkbox | Flag de estorno concluído |

---

### `customrecord_pd_t4l_vehicles` — Veículos

Veículos vinculados ao CIOT.

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| CIOT | `custrecord_pd_t4l_veh_ciot` | List/Record | Vínculo com o CIOT pai |
| Placa | `custrecord_pd_t4l_veh_plate` | Text | Placa do veículo |
| RNTRC | `custrecord_pd_t4l_veh_rntrc` | Text | RNTRC do transportador |

---

### `customrecord_pd_t4l_credit_note` — Nota de Crédito (NC)

NC customizada. Gerada para parcelas REDE após pagamento. Faturada via Invoice agrupada por cliente/tipo.

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| CIOT | `custrecord_pd_t4l_nc_ciot` | List/Record | CIOT vinculado |
| Contratada | `custrecord_pd_t4l_nc_carrier` | List/Record | Transportadora (Customer) |
| Parcela | `custrecord_pd_t4l_nc_installment` | List/Record | Parcela vinculada |
| Receita | `custrecord_pd_t4l_nc_income` | Currency | Receita da parcela |
| Valor de Reembolso | `custrecord_pd_t4l_nc_amount_refund` | Currency | Valor a reembolsar à transportadora |
| Desconto | `custrecord_pd_t4l_nc_discount` | Currency | Desconto aplicado |
| Invoice Vinculada | `custrecord_pd_t4l_nc_invoice` | List/Record | Invoice de faturamento gerada |
| Faturada | `custrecord_pd_t4l_nc_created` | Checkbox | Flag de NC já faturada em Invoice |
| Faturar Segunda | `custrecord_pd_t4l_nc_billing_monday` | Checkbox | Habilita faturamento às segundas |
| Faturar Terça | `custrecord_pd_t4l_nc_billing_tuesday` | Checkbox | Habilita faturamento às terças |
| Faturar Quarta | `custrecord_pd_t4l_nc_billing_wednesday` | Checkbox | Habilita faturamento às quartas |
| Faturar Quinta | `custrecord_pd_t4l_nc_billing_thursday` | Checkbox | Habilita faturamento às quintas |
| Faturar Sexta | `custrecord_pd_t4l_nc_billing_friday` | Checkbox | Habilita faturamento às sextas |
| Faturar Sábado | `custrecord_pd_t4l_nc_billing_saturday` | Checkbox | Habilita faturamento aos sábados |
| Faturar Domingo | `custrecord_pd_t4l_nc_billing_sunday` | Checkbox | Habilita faturamento aos domingos |

---

### `customrecord_pd_t4l_debit_note` — Nota de Débito (ND)

ND customizada. Gerada para parcelas REDE após pagamento. Faturada via Vendor Bill agrupada por fornecedor.

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| CIOT | `custrecord_pd_t4l_nd_ciot` | List/Record | CIOT vinculado |
| Parcela | `custrecord_pd_t4l_nd_installment` | List/Record | Parcela vinculada |
| Posto AP | `custrecord_pd_t4l_nd_vendor` | List/Record | Posto de combustível (Vendor) |
| Valor de Reembolso | `custrecord_pd_t4l_nd_amount_refund` | Currency | Valor a pagar ao posto |
| Receita | `custrecord_pd_t4l_nd_income` | Currency | Receita da parcela |
| Desconto | `custrecord_pd_t4l_nd_discount` | Currency | Desconto aplicado |
| Vendor Bill Vinculada | `custrecord_pd_t4l_nd_bill` | List/Record | Vendor Bill de faturamento gerada |
| Faturada | `custrecord_pd_t4l_nd_created` | Checkbox | Flag de ND já faturada em Vendor Bill |

---

## Parâmetros de Script

| Internal ID | Usado em | Descrição |
|-------------|----------|-----------|
| `custscript_pd_orch_test_log_id` | `pd-t4l-log-entry.mr.js` | ID de log para modo de teste do Orquestrador (processa apenas 1 registro) |
| `custscript_pd_t4l_log_entry_batch_id` | MRs especializados | Array JSON de IDs de log enviados em lote pelo Orquestrador |
| `custscript_pd_t4l_securitization_vendor` | `pd-t4l-vendorbill-handler.us.js`, `pd-t4l-securitization-payment.rl.js` | ID do Vendor configurado como Securitizadora |

---

## Secrets

| Internal ID | Usado em | Descrição |
|-------------|----------|-----------|
| `custsecret_pd_t4l_api_cnpj` | Tech4Log API client | CNPJ de autenticação na API Tech4Log |
| `custsecret_pd_t4l_api_password` | Tech4Log API client | Senha de autenticação na API Tech4Log |