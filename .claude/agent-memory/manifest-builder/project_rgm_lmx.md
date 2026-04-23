---
name: Projeto RGM — LMX Integration
description: Contexto do projeto de integracao NetSuite x WMS LMX Logistica para o cliente RGM, incluindo status, bloqueios e decisoes de arquitetura
type: project
---

Projeto de integracao entre NetSuite e WMS da LMX Logistica para o cliente RGM. Repositorio em `C:\Users\Roque\Documents\ProjectDome\RGM`.

**Status em 2026-04-22:** Desenvolvimento pausado aguardando resolucao do chamado Oracle n. 6893292 (aberto em 17/04/2026), que impede a geracao dos XMLs das NF-e das transacoes SO14, SO15 e SO16. O fluxo de pedidos (Fluxo 1 a 3) ja foi implementado. O fluxo de NF (Fluxo 4) esta bloqueado.

**Decisoes de arquitetura:**
- Client Script como orquestrador + Suitelets como camada de servico (client script nao chama API externa diretamente)
- `customrecord_pd_lmx_integrat_credentials` e a unica fonte de URLs e credenciais
- `customrecord_pd_lmx_lauched_orders` armazena o estado de cada pedido enviado ao WMS

**Requisito 2 (especificado em 2026-04-22):** Reenvio automatico de pedidos com falha de confirmacao. Novos objetos:
- `customscript_pd_lmx_retry_orders_sc` (scheduled) — processa reenvios periodicamente
- `customrecord_pd_lmx_retry_config` — parametros configuráveis (max tentativas, prazo em dias, intervalo)
- 3 novos campos em `customrecord_pd_lmx_lauched_orders`: `custrecord_pd_lmx_wms_intr_retry_count`, `custrecord_pd_lmx_wms_intr_retry_log`, `custrecord_pd_lmx_wms_intr_retry_status`
- `saveLMXOrderReturn.js` precisa ser modificado para inicializar `custrecord_pd_lmx_wms_intr_retry_status` = PENDENTE quando envio original nao for HTTP 200

**Pendencias tecnicas conhecidas:**
- Campo `dataSeparacao` em `orderPayload.js` esta hard-coded como "2026-12-09"
- Scripts legados `lmx-integration_userevent.js` e `lmx-integration-xml-invoice.userevent.js` podem ser removidos
- Validar idempotencia do WMS LMX para pedidos reenviados (risco de duplicata) antes de ativar Requisito 2 em producao

**Dependencia critica:** Bundle de localizacao brasileira (BRL) da Oracle deve estar instalado — varios campos custbody_brl_* e custentity_brl_* sao deste bundle.

**Why:** Informacoes necessarias para contextualizar qualquer continuacao deste projeto sem precisar re-ler todo o codigo.

**How to apply:** Ao retomar trabalho no projeto RGM/LMX, verificar se o chamado Oracle foi resolvido antes de prosseguir com testes do Fluxo 4 (envio de NF).
