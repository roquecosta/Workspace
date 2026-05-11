# Spec: pd_t4l — Integração NetSuite × Tech4Log (CIOT)

**Cliente:** GrupoFF
**Data:** 2026-05-08
**Versão:** 1.0 (Gerado por engenharia reversa)

> ⚠️ Este documento foi gerado a partir da leitura do código-fonte existente.
> Representa o comportamento **atual** do sistema, não necessariamente o comportamento **desejado**.
> Divergências identificadas estão na seção 7.

---

## 1. Contexto

GrupoFF opera como contratante de serviços de transporte rodoviário de cargas e é obrigada a emitir CIOTs (Certificados Internacionais de Operações de Transporte) para cada operação. O sistema Tech4Log (TMS externo) é responsável pela gestão operacional dos CIOTs. O NetSuite é o ERP responsável pelo controle financeiro — pagamentos, faturamento e contabilidade.

A integração **pd_t4l** conecta os dois sistemas: eventos gerados no Tech4Log entram no NetSuite via webhook HTTP, são armazenados como registros de fila e processados assincronamente por MapReduce scripts. O resultado é a criação e atualização de registros financeiros no NetSuite, além do envio de notificações de retorno ao Tech4Log.

---

## 2. Objetivo

Automatizar o ciclo de vida completo dos CIOTs no NetSuite — desde a recepção de eventos do TMS (emissão, pagamento, cancelamento, estorno, liquidação, antecipação), passando pelo processamento financeiro (cálculo de desconto e receita, criação de NC/ND), até a geração de documentos fiscais (Invoices, Vendor Bills, NFSe) e notificação de retorno ao Tech4Log.

---

## 3. Atores

| Ator | Papel no processo |
|------|-------------------|
| Tech4Log (TMS externo) | Envia eventos via webhook HTTP (POST para o RESTlet receptor) |
| NetSuite — Processo Agendado | Executa os MapReduce de processamento de fila e de faturamento automaticamente |
| Analista Financeiro (GrupoFF) | Utiliza as telas manuais de geração de NC/ND quando necessário |
| Usuário NetSuite | Interage com Vendor Bills para acionar o fluxo de securitização |

---

## 4. Visão Geral dos Scripts

### 4.1 Tabela de scripts

| Script | Tipo | EntryPoints | Subsistema |
|--------|------|-------------|------------|
| `pd_t4l_log_entrada_rl.js` | RESTlet | post | Recepção |
| `pd-t4l-log-entry-handler.ue.js` | UserEvent | beforeSubmit, afterSubmit | Recepção |
| `pd-t4l-log-entry.mr.js` | MapReduce | getInputData, map, summarize | Fila |
| `pd-t4l-log-entry-create-ciot.mr.js` | MapReduce | getInputData, map, summarize | Fila — Tipo 1 |
| `pd-t4l-log-entry-cancel-ciot.mr.js` | MapReduce | getInputData, map, summarize | Fila — Tipo 2 |
| `pd-t4l-log-entry-paymt-ciot.mr.js` | MapReduce | getInputData, map, summarize | Fila — Tipo 3 |
| `pd-t4l-log-entry-reversed.mr.js` | MapReduce | getInputData, map, reduce, summarize | Fila — Tipo 4 |
| `pd-t4l-log-entry-deposity.mr.js` | MapReduce | getInputData, map, summarize | Fila — Tipo 5 |
| `pd-t4l-log-entry-sold-out.mr.js` | MapReduce | getInputData, map, summarize | Fila — Tipo 7 |
| `pd-t4l-log-entry-additional-inst.mr.js` | MapReduce | — | Fila — Tipo 8 (em construção) |
| `pd-t4l-clear-logs.mr.js` | MapReduce | getInputData, map | Fila — Limpeza |
| `pd-t4l-manage-installment.ue.js` | UserEvent | beforeSubmit | Parcelas |
| `pd-t4l-create-rt-nd-nc.mr.js` | MapReduce | getInputData, map | Parcelas — Recovery |
| `pd-t4l-create-revenue-ciot.mr.js` | MapReduce | getInputData, map, reduce, summarize | Faturamento |
| `pd-t4l-create-revenue-installment.mr.js` | MapReduce | getInputData, map, reduce | Faturamento |
| `pd-t4l-create-credit-note.mr.js` | MapReduce | getInputData, map, reduce | Faturamento — NC |
| `pd-t4l-create-debit-note.mr.js` | MapReduce | getInputData, map, reduce | Faturamento — ND |
| `pd-t4l-create-nfse-nd.mr.js` | MapReduce | getInputData, map, reduce | Faturamento — NFSe |
| `pd-t4l-invoice-handler.us.js` | UserEvent | beforeSubmit, afterSubmit | Faturamento |
| `pd-t4l-generate-credit-note.st.js` | Suitelet | onRequest | Manual NC |
| `pd-t4l-generate-credit-note-handler.rl.js` | RESTlet | get, post | Manual NC |
| `pd-t4l-carrier.filter.rl.js` | RESTlet | get | Manual NC |
| `pd-t4l-generate-debit-note.st.js` | Suitelet | onRequest | Manual ND |
| `pd-t4l-generate-debit-note-handler.rl.js` | RESTlet | get, post | Manual ND |
| `pd-t4l-gas-station.filter.rl.js` | RESTlet | get | Manual ND |
| `pd-t4l-vendorbill-handler.us.js` | UserEvent | beforeLoad, afterSubmit | Securitização |
| `pd-t4l-securitization-payment.cs.js` | Client Script | pageInit, paymentBySecuritization | Securitização |
| `pd-t4l-securitization-payment.rl.js` | RESTlet | post | Securitização |
| `pd-t4l-payment-handler.ue.js` | UserEvent | afterSubmit | Settlement |
| `pd-t4l-unlink-notes.rl.js` | RESTlet | post | Utilitários |

### 4.2 Dependências entre EntryPoints

- O `afterSubmit` de `pd-t4l-log-entry-handler.ue.js` processa diretamente **tipos 1 e 3** na criação do log. Para outros tipos, o `afterSubmit` não executa processamento.
- O `summarize` de `pd-t4l-log-entry.mr.js` aciona cada MR especializado (tipos 1, 2, 3, 4, 5, 7) via `task.create`, passando os IDs dos logs como parâmetro.
- O `map` de `pd-t4l-log-entry-paymt-ciot.mr.js` cria NC e ND para pagamentos do tipo REDE, após atualizar a parcela.
- O `reduce` de `pd-t4l-create-debit-note.mr.js` aciona o MR `pd-t4l-create-nfse-nd.mr.js` via `task.create` ao final.
- O `afterSubmit` de `pd-t4l-invoice-handler.us.js` aciona o RESTlet `pd-t4l-unlink-notes.rl.js` quando linhas de NC são removidas de uma Invoice.
- O `afterSubmit` de `pd-t4l-vendorbill-handler.us.js` aciona o RESTlet `pd-t4l-unlink-notes.rl.js` quando linhas de ND são removidas de um Vendor Bill.
- O `afterSubmit` de `pd-t4l-payment-handler.ue.js` chama `tech4LogApi.sendSettlement()` ao criar um Customer Payment sobre Invoices com natureza T4L.

---

## 5. Scripts e EntryPoints

---

### Subsistema 1 — Recepção de Eventos

---

### Script: `pd_t4l_log_entrada_rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Ponto de entrada da integração. Recebe os eventos do Tech4Log e os armazena na fila de processamento do NetSuite.

---

#### EntryPoint: post

**Gatilho:** Requisição HTTP POST enviada pelo Tech4Log ao webhook configurado no NetSuite.
**Condição de execução:** Sempre executa.

**Fluxo:**

1. Recebe o corpo JSON do evento enviado pelo Tech4Log.
2. Cria um registro `customrecord_pd_t4l_log_entry` com o JSON bruto armazenado no campo `custrecord_pd_json_entry`.
3. Retorna `{ message, id }` ao Tech4Log confirmando o recebimento.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Escrita | Log Entry (`customrecord_pd_t4l_log_entry`) | Armazena o payload JSON do evento recebido |

**Tratamento de erros:**

| Situação | Comportamento atual |
|----------|---------------------|
| Erro na criação do log | Retorna erro HTTP ao chamador |

---

### Script: `pd-t4l-log-entry-handler.ue.js`

**Tipo:** UserEvent
**Record alvo:** `customrecord_pd_t4l_log_entry`
**Responsabilidade geral:** Classifica o Log Entry pelo campo `descricao` do JSON e, para os tipos 1 (emissão) e 3 (pagamento), executa o processamento imediato de forma síncrona, atuando como camada de resposta rápida antes do MR.

---

#### EntryPoint: beforeSubmit

**Gatilho:** Antes de qualquer salvamento do registro Log Entry.
**Condição de execução:** Executa em CREATE e em EDIT.

**Fluxo:**

**No evento CREATE:**
1. Lê o campo `custrecord_pd_json_entry` e interpreta o JSON.
2. Normaliza o valor de `descricao` (remove acentos, converte para minúsculas).
3. Consulta o mapeamento interno para determinar o ID do tipo de entrada correspondente.
4. Se um tipo for encontrado e diferir do valor atual, atualiza `custrecord_pd_type_entry` no registro em memória (antes do salvamento).

**No evento EDIT:**
1. Se `custrecord_pd_t4l_processing_attempts` for maior que 4, marca `custrecord_pd_log_entry_process = true` no registro em memória, impedindo novos reprocessamentos.

**Regras de negócio:**

- **RN01:** O mapeamento de `descricao` para tipo é: `emissao de ciot` → 1, `cancelamento de ciot` → 2, `pagamento de ciot` → 3, `estorno de parcela de ciots` → 4, `antecipacao de credito` → 5, `cancelamento da antecipacao de credito` → 6, `liquidacao de pagamentos de ciots` → 7, `declaracao de parcela complementar` → 8.
- **RN02:** Logs que atingem mais de 4 tentativas de processamento são marcados como processados definitivamente, sem disparar novos reprocessamentos.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura/Escrita | Log Entry | Define o tipo de entrada a partir do JSON; atualiza flag de processamento por excesso de tentativas |

---

#### EntryPoint: afterSubmit

**Gatilho:** Após o salvamento do registro Log Entry.
**Condição de execução:** Executa em CREATE para tipos 1 e 3. Executa em EDIT/XEDIT para re-sincronização do campo de tipo. Não executa para outros tipos em CREATE.

**Fluxo:**

**No evento CREATE — tipo 1 (Emissão de CIOT):**
1. Lê o JSON do campo `custrecord_pd_json_entry`.
2. Chama o fluxo `createCiot`: localiza o cliente pelo `cnpjCliente`, cria o registro CIOT com os campos mapeados, cria as parcelas e os veículos associados.
3. Marca o log como processado e vincula o CIOT criado.
4. Envia notificação de retorno ao Tech4Log via `sendEmissionReturn`, informando o protocolo e o status (sucesso ou falha).

**No evento CREATE — tipo 3 (Pagamento de CIOT):**
1. Lê o JSON do campo `custrecord_pd_json_entry`.
2. Chama o fluxo `payCiot`: localiza a parcela por `idParcela`, atualiza o status para Pago, registra o valor pago, tipo de pagamento, posto (como Fornecedor e como Cliente) e aciona o cálculo de desconto/receita.
3. Se bem-sucedido, marca o log como processado e vincula o CIOT.
4. Envia notificação de retorno ao Tech4Log via `sendPaymentReturn`, informando o `idParcela` e o status.

**No evento EDIT/XEDIT:**
1. Interpreta o JSON atual do campo `custrecord_pd_json_entry`.
2. Se o tipo inferido do JSON diferir do tipo gravado em `custrecord_pd_type_entry`, atualiza o campo via `record.submitFields`.

**Regras de negócio:**

- **RN03:** Os tipos 1 e 3 são processados sincronamente no afterSubmit como tentativa inicial. Em caso de falha, o log permanece não processado e será retomado pelo MR orquestrador.
- **RN04:** A parcela não é processada se já estiver com status Pago (2) ou Liquidado (3).
- **RN05:** O posto é vinculado à parcela tanto no campo de Fornecedor (`custrecord_pd_t4l_inst_gas_station_ap`) quanto no campo de Cliente (`custrecord_pd_t4l_inst_gas_station`), usando o CNPJ como chave de busca.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura | Log Entry | JSON do evento, tipo, ID |
| Escrita | CIOT (`customrecord_pd_t4l_ciot`) | Cria o CIOT com campos do JSON |
| Escrita | Parcela CIOT (`customrecord_pd_t4l_installment_ciot`) | Cria parcelas vinculadas ao CIOT |
| Escrita | Veículo CIOT (`customrecord_pd_t4l_vehicles`) | Cria veículos vinculados ao CIOT |
| Escrita | Log Entry | Marca como processado, vincula CIOT, limpa/preenche erro |
| Leitura | Customer | Busca pelo CPF/CNPJ para vincular ao CIOT |
| Leitura | Vendor | Busca pelo CNPJ para vincular como posto (AP) na parcela |
| Chamada externa | Tech4Log API | `sendEmissionReturn` ou `sendPaymentReturn` |

**Tratamento de erros:**

| Situação | Comportamento atual |
|----------|---------------------|
| Cliente não encontrado | Erro registrado no log; CIOT não é criado |
| Parcela não encontrada | Retorna `success: false`; log não é marcado como processado |
| Parcela já paga/liquidada | Retorna `success: false`; log não é marcado como processado |
| Erros em parcelas ou veículos individuais | Acumulados e registrados no campo de erro do log; CIOT é criado |

---

### Subsistema 2 — Fila de Processamento Assíncrono

---

### Script: `pd-t4l-log-entry.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Orquestrador da fila de Log Entries. Identifica todos os logs não processados, agrupa-os por tipo e dispara os MRs especializados para cada grupo.

---

#### EntryPoint: getInputData

**Gatilho:** Execução do MapReduce pelo agendador do NetSuite.
**Condição de execução:** Busca todos os Log Entries não processados (`custrecord_pd_log_entry_process = false` ou vazio), com JSON presente, ativos.

**Fluxo:**

1. Busca todos os Log Entries que atendam à condição de entrada.
2. Retorna os registros para distribuição no `map`.

---

#### EntryPoint: map

**Gatilho:** Para cada Log Entry retornado pelo `getInputData`.

**Fluxo:**

1. Lê o tipo do Log Entry (`custrecord_pd_type_entry`).
2. Agrupa o ID do log na rota correspondente ao tipo (1, 2, 3, 4, 5, 7, 8).
3. Escreve o par `{ tipo → [logId] }` para consumo no `summarize`.

**Regras de negócio:**

- **RN06:** O tipo 6 (cancelamento da antecipação de crédito) não possui rota — logs deste tipo não são processados pelo orquestrador.

---

#### EntryPoint: summarize

**Gatilho:** Após a conclusão de todos os `map`.

**Fluxo:**

1. Para cada tipo com logs coletados, divide os IDs em lotes de até 1.000.
2. Para cada lote, cria uma tarefa MapReduce (`task.create`) apontando para o MR especializado do tipo, passando os IDs como parâmetro `custscript_pd_t4l_log_entry_batch_id`.

---

### Script: `pd-t4l-log-entry-create-ciot.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Processa logs do tipo 1 (Emissão de CIOT) quando acionado pelo orquestrador ou de forma autônoma.

---

#### EntryPoint: getInputData

**Condição de execução:** Se acionado pelo orquestrador, usa os IDs recebidos por parâmetro. Se executado de forma autônoma, busca todos os logs de tipo 1 não processados.

---

#### EntryPoint: map

**Fluxo:**

1. Lê e interpreta o JSON do Log Entry.
2. Valida a presença de `cnpjCliente` (obrigatório). Localiza o cliente no NetSuite.
3. Cria o registro CIOT com status **Gerado (1)**, vinculando o cliente e mapeando todos os campos do JSON.
4. Para cada parcela no array `parcelas`: cria a parcela com nome, número sequencial, valor, categoria de pagamento (Adiantamento/Saldo/Complementar) e data de vencimento. Status inicial: **Em Aberto (1)**.
5. Para cada veículo no array `Veiculos` (opcional): cria o veículo com placa e RNTRC vinculados ao CIOT.
6. Marca o log como processado e vincula o CIOT criado.
7. Em caso de falha (cliente não encontrado, erro na criação): registra o motivo no campo de erro do log e não cria o CIOT.

**Regras de negócio:**

- **RN07:** A data de vencimento da parcela é obtida de `DataFimViagem` ou `DataInicioViagem` do payload. Se nenhuma estiver presente, usa a data atual.
- **RN08:** A categoria de pagamento da parcela é mapeada: `Adiantamento` → 1, `Saldo` → 2, `Complementar` → 3. Se não houver mapeamento, o erro é registrado mas o CIOT é criado.
- **RN09:** O nome do CIOT é definido por `id`, senão por `protocolo` com prefixo "CIOT", senão por timestamp.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura | Log Entry | JSON do evento |
| Leitura | Customer | Localiza pelo CPF/CNPJ para vincular ao CIOT |
| Escrita | CIOT | Cria o certificado com campos mapeados do JSON |
| Escrita | Parcela CIOT | Cria parcelas vinculadas ao CIOT |
| Escrita | Veículo CIOT | Cria veículos vinculados ao CIOT (opcional) |
| Escrita | Log Entry | Marca como processado, vincula CIOT, limpa/preenche erro |

---

### Script: `pd-t4l-log-entry-cancel-ciot.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Processa logs do tipo 2 (Cancelamento de CIOT).

---

#### EntryPoint: map

**Fluxo:**

1. Lê o JSON do log. Extrai `protocolo` e `id` (identificadores do CIOT).
2. Localiza o CIOT no NetSuite usando múltiplos critérios de busca (protocolo + nome, só protocolo, só nome, nome parcial como fallback).
3. Atualiza o CIOT: status → **Cancelado (3)**, data de cancelamento → hoje.
4. Busca e atualiza **apenas as parcelas em status Em Aberto (1)**: status → **Cancelado (3)**, valor pago → 0.
5. Marca o log como processado e vincula o CIOT.

**Regras de negócio:**

- **RN10:** O cancelamento **não** afeta parcelas já pagas ou liquidadas. Apenas parcelas em aberto são canceladas.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura | Log Entry | JSON com protocolo e id do CIOT |
| Leitura/Escrita | CIOT | Atualiza status e data de cancelamento |
| Leitura/Escrita | Parcela CIOT | Cancela parcelas em aberto vinculadas ao CIOT |
| Escrita | Log Entry | Marca como processado, vincula CIOT |

---

### Script: `pd-t4l-log-entry-paymt-ciot.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Processa logs do tipo 3 (Pagamento de CIOT) quando acionado pelo orquestrador ou de forma autônoma.

---

#### EntryPoint: map

**Fluxo:**

1. Lê o JSON do log. Extrai `idParcela`, `valor`, `tipo` (REDE/SCD/PIX/TRC), `receita` e `posto` (CNPJ).
2. Localiza a parcela por `idParcela` (busca por nome, com fallback por número sequencial).
3. Valida que a parcela não está já no status Pago (2) ou Cancelado (3).
4. Atualiza a parcela via load/save: `amount_paid`, status → **Pago (2)**, `payment_date` → hoje, tipo de pagamento.
5. Se `receita` fornecida, preenche `custrecord_pd_t4l_inst_amount_income`.
6. Vincula o posto na parcela: busca o Fornecedor pelo CNPJ → campo AP (`custrecord_pd_t4l_inst_gas_station_ap`); busca o Cliente pelo CNPJ → campo AR (`custrecord_pd_t4l_inst_gas_station`).
7. Aciona `calculateDiscountAndRevenue` para calcular desconto e receita.
8. **Para tipo REDE:** cria a NC e a ND vinculadas à parcela (ver RN11).
9. Marca o log como processado e vincula o CIOT.

**Regras de negócio:**

- **RN11:** Para pagamentos do tipo **REDE**, o sistema cria automaticamente uma NC (`customrecord_pd_t4l_credit_note`) e uma ND (`customrecord_pd_t4l_debit_note`) vinculadas à parcela. Para tipos SCD, PIX e TRC, a receita é calculada pela taxa percentual configurada.
- **RN12:** O desconto é calculado como `max(valor_faturado − valor_pago, 0)`, aplicado para parcelas Pagas ou Liquidadas.
- **RN13:** A receita (para SCD, PIX, TRC) é calculada como `valor_pago × taxa_percentual`, onde a taxa vem do campo de porcentagem correspondente ao tipo na parcela.

---

### Script: `pd-t4l-log-entry-reversed.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Processa logs do tipo 4 (Estorno de Parcela). Para parcelas do tipo REDE, desfaz toda a cadeia de documentos gerada: exclui NC, ND e as transações associadas.

---

#### EntryPoint: map

**Fluxo:**

1. Extrai `idParcela` do JSON.
2. Escreve para o `reduce` agrupado por `idParcela`.

---

#### EntryPoint: reduce

**Fluxo:**

1. Localiza a parcela pelo `idParcela`.
2. **Para tipo REDE:**
   - Busca todas as NCs vinculadas à parcela.
   - Para cada NC: se a Invoice vinculada estiver "Pago integralmente" ou com parcelas em status de bloqueio, registra a impossibilidade. Caso contrário, remove a linha da Invoice (se tiver mais de uma linha) ou exclui a Invoice inteira. Depois, limpa o vínculo na parcela e exclui a NC.
   - Busca todas as NDs vinculadas à parcela.
   - Para cada ND: segue o mesmo fluxo para o Vendor Bill. Adicionalmente, se a parcela possuir uma NFSe vinculada (`custrecord_pd_t4l_inst_nfse_linked`), remove o vínculo da ND na Invoice da NFSe e preenche `custbody_pd_t4l_instruction_cancel_inv = "Nota fiscal deve ser cancelada"`. Limpa o vínculo da NFSe na parcela. Exclui a ND.
3. Ao final, se não houve bloqueios: marca a parcela como `reversed = true`.
4. Marca o log como processado (independentemente de bloqueios).

**Regras de negócio:**

- **RN14:** A exclusão de NC/ND é bloqueada quando a Invoice/Vendor Bill vinculada está "Pago integralmente" ou possui parcelas com status que impedem edição.
- **RN15:** A NFSe não é excluída — recebe apenas a instrução de cancelamento, que deve ser executada manualmente.

---

### Script: `pd-t4l-log-entry-deposity.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Processa logs do tipo 5 (Antecipação de Crédito), criando um Customer Deposit no NetSuite para o cliente informado.

---

#### EntryPoint: map

**Fluxo:**

1. Lê o JSON. Extrai `cnpjCliente` e `valor`.
2. Localiza o cliente no NetSuite pelo CNPJ.
3. Obtém a subsidiária e moeda do cliente.
4. Cria um Customer Deposit com o valor do adiantamento. Usa a conta bancária preferencial (`PREFERRED_ACCOUNT_ID = 534`) se compatível com a subsidiária do cliente; caso contrário, usa Undeposited Funds.
5. Marca o log como processado e vincula o Customer Deposit em `custrecord_pd_linked_transaction`.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura | Log Entry | JSON com CNPJ e valor |
| Leitura | Customer | Localiza pelo CNPJ; obtém subsidiária e moeda |
| Escrita | Customer Deposit | Cria o depósito com valor e data |
| Escrita | Log Entry | Marca como processado, vincula o depósito |

---

### Script: `pd-t4l-log-entry-sold-out.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Processa logs do tipo 7 (Liquidação de Pagamentos). Um único log pode conter múltiplas parcelas para liquidar em lote.

---

#### EntryPoint: map

**Fluxo:**

1. Lê o JSON. Extrai o array `pagamentos`, onde cada item tem `idParcela`, `valor` e `tipo`.
2. Para cada pagamento:
   - Localiza a parcela por `idParcela`.
   - Bloqueia se status for Pago (2) ou Cancelado (3).
   - Caso contrário, atualiza via `submitFields`: `amount_paid`, status → **Liquidado (4)**, tipo de pagamento.
3. Marca o log como processado, vincula o primeiro CIOT bem-sucedido e agrega eventuais avisos no campo de erro.

**Regras de negócio:**

- **RN16:** A liquidação não recalcula desconto/receita via `calculateDiscountAndRevenue` — usa `submitFields` direto. O cálculo ocorrerá se a parcela for editada posteriormente e disparar o `beforeSubmit` do `pd-t4l-manage-installment.ue.js`.

---

### Script: `pd-t4l-log-entry-additional-inst.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Tipo 8 (Declaração de Parcela Complementar). **Script em construção — não operacional.**

**Dependências:** Script faz referência a variáveis indefinidas no `map` (`CONFIG`, `record`, `ciotId`). Qualquer execução resultará em erro.

---

### Script: `pd-t4l-clear-logs.mr.js`

**Tipo:** MapReduce (Scheduled)
**Responsabilidade geral:** Limpeza periódica da fila, excluindo Log Entries antigos.

---

#### EntryPoint: getInputData

**Fluxo:**

Busca todos os Log Entries com data de criação anterior a **90 dias** atrás.

---

#### EntryPoint: map

**Fluxo:**

Exclui cada Log Entry retornado.

---

### Subsistema 3 — Gestão de Parcelas CIOT

---

### Script: `pd-t4l-manage-installment.ue.js`

**Tipo:** UserEvent
**Record alvo:** `customrecord_pd_t4l_installment_ciot`
**Responsabilidade geral:** Mantém o cálculo de desconto e receita da parcela atualizado sempre que ela for salva.

---

#### EntryPoint: beforeSubmit

**Gatilho:** Antes de qualquer salvamento de uma parcela CIOT.
**Condição de execução:** Sempre que o registro for do tipo `customrecord_pd_t4l_installment_ciot`.

**Fluxo:**

1. Chama `calculateDiscountAndRevenue` para calcular e atualizar em memória os campos de desconto e receita.
   - **Desconto:** calculado como `max(valor_faturado − valor_pago, 0)` quando status for Pago ou Liquidado.
   - **Receita (SCD/PIX/TRC):** calculada como `valor_pago × taxa_percentual_do_tipo` quando status for Pago ou Liquidado e tipo ≠ REDE.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura/Escrita | Parcela CIOT (em memória) | Atualiza desconto e receita antes do salvamento |

---

### Script: `pd-t4l-create-rt-nd-nc.mr.js`

**Tipo:** MapReduce (Scheduled)
**Responsabilidade geral:** Script de recovery para criar NC e ND para parcelas REDE que foram pagas mas não tiveram seus documentos criados. Executa de forma idempotente e agendada.

---

#### EntryPoint: getInputData

**Fluxo:**

Busca parcelas com tipo REDE (1) e status Pago (2) que não possuam NC ou ND vinculados.

---

#### EntryPoint: map

**Regras de negócio:**

- **RN17:** O script é idempotente — se NC e ND já existirem, a parcela não é selecionada no `getInputData`.

---

### Subsistema 4 — Faturamento Automático

---

### Script: `pd-t4l-create-revenue-ciot.mr.js`

**Tipo:** MapReduce (Scheduled)
**Responsabilidade geral:** Gera Invoices de receita para CIOTs que ainda não foram faturados.

---

#### EntryPoints: getInputData / map / reduce / summarize

---

### Script: `pd-t4l-create-revenue-installment.mr.js`

**Tipo:** MapReduce (Scheduled)
**Responsabilidade geral:** Gera Invoices de receita para parcelas criadas no dia de execução.

---

#### EntryPoints: getInputData / map / reduce

**Regras de negócio:**

- **RN18:** O MR processa exclusivamente parcelas criadas **no dia de execução**. Parcelas de dias anteriores não são recuperadas por este script.

---

### Script: `pd-t4l-create-credit-note.mr.js`

**Tipo:** MapReduce (Scheduled ou Manual)
**Responsabilidade geral:** Gera Invoices do tipo Nota de Crédito (NC) a partir dos registros de NC que estejam pendentes de faturamento para o dia corrente.

---

#### EntryPoints: getInputData / map / reduce

**Regras de negócio:**

- **RN19:** A NC somente entra no faturamento se o **flag do dia da semana** configurado no registro NC (`custrecord_pd_t4l_nc_billing_*`) estiver ativo para o dia de execução.
- **RN20:** O agrupamento por `customerId|tipoParcelamento` garante uma Invoice por transportadora por tipo de parcelamento.

---

### Script: `pd-t4l-create-debit-note.mr.js`

**Tipo:** MapReduce (Scheduled ou Manual)
**Responsabilidade geral:** Gera Vendor Bills a partir dos registros de ND pendentes de faturamento para o dia corrente.

---

#### EntryPoints: getInputData / map / reduce

**Regras de negócio:**

- **RN21:** A ND somente entra no faturamento se o **flag do dia da semana** configurado no registro ND (`custrecord_pd_t4l_nd_billing_*`) estiver ativo para o dia de execução.

---

### Script: `pd-t4l-create-nfse-nd.mr.js`

**Tipo:** MapReduce
**Responsabilidade geral:** Gera NFSe (Invoice de serviço) por posto, para parcelas REDE pagas que possuam ND mas ainda não tenham NFSe vinculada.

---

#### EntryPoints: getInputData / map / reduce

---

### Script: `pd-t4l-invoice-handler.us.js`

**Tipo:** UserEvent
**Record alvo:** Invoice
**Responsabilidade geral:** Mantém o texto descritivo da NFSe atualizado com o resumo dos CIOTs faturados, e desvíncula registros NC quando linhas são removidas da Invoice.

---

#### EntryPoint: beforeSubmit

**Gatilho:** Antes de salvar uma Invoice.
**Condição de execução:** Executa em CREATE e EDIT.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura/Escrita | Invoice (em memória) | Preenche o campo de descrição da NFSe |
| Leitura | Customer / Job | Obtém a taxa percentual de receita CIOT |

---

#### EntryPoint: afterSubmit

**Gatilho:** Após salvar uma Invoice.
**Condição de execução:** Executa em EDIT e DELETE.

---

### Subsistema 5 — Geração Manual de NC/ND

---

### Script: `pd-t4l-generate-credit-note.st.js`

**Tipo:** Suitelet
**Responsabilidade geral:** Tela operacional para geração manual de Notas de Crédito. Canal secundário — utilizado somente quando necessário, pois o processo principal é agendado.

---

### Script: `pd-t4l-generate-credit-note-handler.rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Fornece dados para a tela de NC e dispara o MR de criação.

---

#### EntryPoint: get

Retorna as linhas de NC não processadas (`isCreditNoteCreated = false`), com flag do dia atual ativo, sem transação vinculada, com parcela e CIOT preenchidos. Suporta filtros por data e transportadora.

---

#### EntryPoint: post

Recebe os IDs das linhas selecionadas e dispara o MR `customscript_pd_t4l_create_credit_not_mr` com esses IDs como parâmetro.

---

### Script: `pd-t4l-carrier.filter.rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Fornece a lista de transportadoras ativas para o filtro da tela de NC.

---

#### EntryPoint: get

Retorna todos os Customers ativos (`isinactive = false`), com nome e ID interno.

---

### Script: `pd-t4l-generate-debit-note.st.js`

**Tipo:** Suitelet
**Responsabilidade geral:** Tela operacional para geração manual de Notas de Débito. Canal secundário — utilizado somente quando necessário.

---

#### EntryPoint: onRequest

Estrutura análoga à tela de NC, com título "Geração de Nota de Débito" e filtro por posto (Vendor) ao invés de transportadora.

---

### Script: `pd-t4l-generate-debit-note-handler.rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Fornece dados para a tela de ND e dispara o MR de criação.

---

#### EntryPoint: get

Retorna as linhas de ND não processadas para o dia atual, com filtros por data e posto.

---

#### EntryPoint: post

Recebe os IDs das linhas selecionadas e dispara o MR `customscript_pd_t4l_create_debit_note_mr`.

---

### Script: `pd-t4l-gas-station.filter.rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Fornece a lista de postos (Vendors) ativos para o filtro da tela de ND.

---

#### EntryPoint: get

Retorna todos os Vendors ativos (`isinactive = false`), com nome e ID interno.

---

### Subsistema 6 — Securitização de Vendor Bill

---

### Script: `pd-t4l-vendorbill-handler.us.js`

**Tipo:** UserEvent
**Record alvo:** Vendor Bill
**Responsabilidade geral:** Habilita o fluxo de securitização em Vendor Bills elegíveis e gerencia o desvinculamento de NDs quando linhas são removidas.

---

#### EntryPoint: beforeLoad

**Gatilho:** Antes de carregar a página do Vendor Bill (modo View ou Edit).
**Condição de execução:** Somente se o Vendor Bill não estiver pago e o fornecedor não for o fornecedor de securitização.
---

#### EntryPoint: afterSubmit

**Gatilho:** Após salvar o Vendor Bill.
**Condição de execução:** Executa em EDIT (linhas removidas) e DELETE.

---

### Script: `pd-t4l-securitization-payment.cs.js`

**Tipo:** Client Script (injetado pelo UE do Vendor Bill)
**Responsabilidade geral:** Gerencia o fluxo de securitização no lado do cliente (browser).

---

#### EntryPoint: pageInit

Sem ação (vazio — reservado para inicialização futura).

---

#### EntryPoint: paymentBySecuritization *(Botão customizado)*

---

### Script: `pd-t4l-securitization-payment.rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Executa a securitização: copia o Vendor Bill para o fornecedor de securitização e transforma o original em Credit Memo.

---

#### EntryPoint: post

**Fluxo:**

1. Recebe o ID do Vendor Bill original.
2. Copia o Vendor Bill para o fornecedor de securitização (parâmetro de script `custscript_pd_t4l_securitization_vendor`). Marca `custbody_transactionOrigin` como originado por securitização.
3. Transforma o Vendor Bill original em Credit Memo.
4. Retorna o ID do novo Vendor Bill criado para o fornecedor de securitização.

---

### Subsistema 7 — Settlement

---

### Script: `pd-t4l-payment-handler.ue.js`

**Tipo:** UserEvent
**Record alvo:** Customer Payment
**Responsabilidade geral:** Notifica o Tech4Log quando uma Invoice de natureza T4L é quitada por um Customer Payment.

---

#### EntryPoint: afterSubmit

**Gatilho:** Após a criação de um Customer Payment.
**Condição de execução:** Somente em evento CREATE.

**Fluxo:**

1. Percorre todas as linhas da sublista `apply` do Customer Payment.
2. Para cada linha marcada como aplicada (`apply = true`): lê o ID da Invoice aplicada e o valor aplicado.
3. Verifica o campo `custbody_pd_t4l_nature` da Invoice. Se o valor for **3** (natureza T4L — Nota de Crédito), prossegue.
4. Busca o CPF/CNPJ do cliente vinculado à Invoice (`custentity_brl_entity_t_fed_tax_reg`).
5. Envia notificação ao Tech4Log via `sendSettlement`: `{ cpf_cnpj, value: valorAplicado, invoice: numeroDaInvoice, external_id: idDoPayment }`.

**Regras de negócio:**

- **RN22:** Apenas Invoices com `custbody_pd_t4l_nature = 3` disparam o settlement. Invoices comuns (receita CIOT, NFSe) não geram notificação de settlement.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura | Customer Payment | Sublista apply, linhas aplicadas |
| Leitura | Invoice | Natureza T4L, número, cliente vinculado |
| Leitura | Customer | CPF/CNPJ para envio ao Tech4Log |
| Chamada externa | Tech4Log API | `sendSettlement` com os dados do pagamento |

**Tratamento de erros:**

| Situação | Comportamento atual |
|----------|---------------------|
| Erro ao processar uma linha | Erro registrado em log; outras linhas continuam sendo processadas |
| Erro geral no afterSubmit | Capturado no bloco externo; registrado em log |

---

### Subsistema 8 — Utilitários

---

### Script: `pd-t4l-unlink-notes.rl.js`

**Tipo:** RESTlet
**Responsabilidade geral:** Desvincula registros de NC e/ou ND de suas transações financeiras, revertendo os flags de faturamento para permitir reprocessamento.

---

#### EntryPoint: post

**Fluxo:**

Recebe `{ debitNoteIdList, creditNoteIdList }`. Para cada ID recebido:
- NC: define `custrecord_pd_t4l_nc_transaction_linked = null` e `custrecord_pd_t4l_nc_created = false`.
- ND: define `custrecord_pd_t4l_nd_transaction_linked = null` e `custrecord_pd_t4l_nd_created = false`.

---

## 6. Restrições e Premissas Identificadas

- O tipo 6 de Log Entry (cancelamento da antecipação de crédito) não possui MR especializado — logs deste tipo não são processados.
- O MR `pd-t4l-log-entry-additional-inst.mr.js` (tipo 8) está em construção e não é operacional.
- Parcelas do tipo **REDE** geram NC e ND; parcelas dos tipos SCD, PIX e TRC geram receita calculada por taxa percentual.
- O faturamento de NC e ND é controlado por flags de dia da semana configurados em cada registro NC/ND — o processo só fatura no(s) dia(s) habilitado(s).
- O MR de receita por parcela (`pd-t4l-create-revenue-installment.mr.js`) processa exclusivamente parcelas criadas **no dia de execução**. Não há recuperação de dias anteriores.
- As telas manuais de NC/ND são canal secundário — o processo principal é agendado automaticamente.
- O limite de seleção nas telas manuais é de **600 linhas** por operação.
- Logs de entrada são retidos por **90 dias** e excluídos automaticamente após esse prazo.
- A securitização de Vendor Bill utiliza um único fornecedor de securitização configurado como parâmetro de script (`custscript_pd_t4l_securitization_vendor`).
- O settlement é enviado ao Tech4Log apenas para Invoices com `custbody_pd_t4l_nature = 3`.
- A autenticação com o Tech4Log usa JWT obtido em `/api/auth/login` com credenciais armazenadas como NetSuite Secrets (`custsecret_pd_t4l_api_cnpj` e `custsecret_pd_t4l_api_password`). O token é cacheado por 3.300 segundos (55 minutos).
- A liquidação de parcelas via tipo 7 usa `submitFields` e não passa pelo `beforeSubmit` do UE de parcela — o recálculo de desconto e receita só ocorre em edição posterior.

---

## 7. Comportamento Observado vs. Comportamento Esperado

| # | Entidade | Comportamento no código | Comportamento esperado | Status |
|---|----------|------------------------|------------------------|--------|
| 1 | `pd-t4l-manage-installment.ue.js` | O `afterSubmit` está implementado no arquivo mas não está no `return`, portanto nunca executa. Ele dispararia a criação de NC/ND e acionaria o MR de recovery. | O `afterSubmit` será removido do arquivo, pois foi reescrito e o comportamento passou a ser coberto pelo MR de pagamento (tipo 3) e pelo MR de recovery agendado. | Ação pendente: remover o afterSubmit do arquivo |
| 2 | `pd-t4l-log-entry-additional-inst.mr.js` | Referências a variáveis indefinidas no `map` impedem qualquer execução. | Script em construção. | Em desenvolvimento |

---

## 8. Fora de Escopo

- **Tipo 6 de Log Entry** (cancelamento da antecipação de crédito): reconhecido pelo campo `descricao`, mapeado para tipo 6, mas sem fluxo de processamento implementado.
- **LogSaída**: fluxo de envio e reversão de saída de logs foi removido do projeto (sem arquivos no repositório).
- **Geração automática de CIOT via NetSuite**: o NetSuite apenas espelha CIOTs criados no Tech4Log.

---

## 9. Dúvidas em Aberto

Todas as dúvidas foram resolvidas durante a entrevista de validação (Etapa 4). Nenhuma pendência em aberto.

| # | Ponto | Resolução |
|---|-------|-----------|
| 1 | Processamento duplo UE + MR para tipos 1 e 3 | Intencional: UE tenta primeiro; MR é fallback em caso de falha |
| 2 | `afterSubmit` não exportado em `pd-t4l-manage-installment.ue.js` | Será removido; fluxo coberto pelo MR de pagamento e MR de recovery |
| 3 | Acionamento do MR de recovery `pd-t4l-create-rt-nd-nc.mr.js` | Script agendado — execução periódica automática |
| 4 | `pd-t4l-log-entry-additional-inst.mr.js` inoperante | Script em construção |
| 5 | Datas de corte hardcoded no orquestrador e MR de receita CIOT | Removidas; MR de receita por parcela mantém filtro por data = hoje |
| 6 | Agrupamento de NC por `customerId\|tipoParcelamento` | Agrupamento correto |
| 7 | Retenção de logs: 30 ou 90 dias | 90 dias — nome da função estava incorreto e foi corrigido |
| 8 | Telas manuais vs. processo agendado | Processo agendado é o canal principal; telas manuais são canal secundário |
| 9 | Tipo 6 sem rota no orquestrador | Fora de escopo do processo atual |
