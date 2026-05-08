# Requisitos Funcionais — Integração NetSuite x WMS LMX

---

## 1. Envio de Pedidos de Venda ao WMS

- O sistema deve identificar pedidos de venda aprovados no NetSuite e marcá-los como "disponíveis para integração".
- O NetSuite deve enviar automaticamente os pedidos ao WMS da LMX via script/API, incluindo: ID interno do pedido (SO), linhas do pedido, itens, quantidades e status atual.
- Ao enviar o pedido, um campo customizado no pedido de venda deve alterar seu status para **"Aguardando Separação"**.
- O payload enviado deve incluir obrigatoriamente: número do pedido cliente, CNPJ/CPF, nome, endereço completo (logradouro, número, bairro, cidade, UF, CEP), data de separação e lista de itens com código e quantidade.

---

## 2. Autenticação com a API da LMX

- O sistema deve autenticar com a API da LMX via OAuth (username, password, client_id, client_secret, grant_type e scope) antes de qualquer operação.
- O token de acesso (Bearer Token) obtido deve ser utilizado em todas as requisições subsequentes.

---

## 3. Consulta de Estoque

- O sistema deve permitir consultar o saldo atual de itens no WMS da LMX por meio da API de Consulta de Estoque, passando os SKUs desejados.

---

## 4. Retorno e Atualização de Status dos Pedidos

- O WMS da LMX deve enviar atualizações de status ao NetSuite via webhook (endpoint do cliente).
- O NetSuite deve realizar verificações programadas para identificar se o pedido foi separado.
- Se o pedido ainda não foi separado, o sistema deve aguardar nova atualização.
- Se o pedido foi separado, o campo customizado do pedido de venda deve ser atualizado para **"Produto Separado"**.
- O retorno de status deve conter: número do pedido, ID do pedido cliente, status, dados do destinatário, transportador, histórico de eventos com data/hora/usuário, itens com quantidades conferidas e seriais, e dados de volumes (dimensões e peso).

---

## 5. Geração de Transfer Order Automática

- Quando um pedido de venda com separação WMS for confirmado como separado, o sistema deve gerar automaticamente um **Transfer Order** entre a RGM Filial e a RGM Matriz.
- O campo **"Origem da Separação"** deve ser preenchido como "WMS" na Transfer Order gerada.
- Esse campo é determinante para o acionamento das automações subsequentes.

---

## 6. Geração Automática de Remessa de Saída

- Quando identificada uma Transfer Order com "Origem de Separação = WMS", o sistema deve gerar automaticamente uma **Remessa de Saída** da Filial para a Matriz.
- A Remessa de Saída deve ser vinculada à Transfer Order correspondente (campo customizado).

---

## 7. Geração Automática de Remessa de Entrada

- Quando a NF-e da Remessa de Saída correspondente estiver com status **"Autorizada"**, o sistema deve gerar automaticamente uma **Remessa de Entrada** da Matriz para a Filial.

---

## 8. Envio da Nota Fiscal (NF Venda) ao WMS

- Após geração da invoice no NetSuite, o sistema deve enviar o XML da NF-e para a API da LMX.
- O envio deve incluir: conteúdo XML da NF, tipo (ex.: ATACADO), número da NF e ID do pedido cliente.
- A LMX deve confirmar o recebimento e retornar uma mensagem de status.

---

## 9. Recebimento de NF de Retorno de Armazenagem

- O sistema do NetSuite deve ser capaz de receber o XML de NF enviado pela LMX (em formato Base64) referente ao retorno de armazenagem e integrá-lo ao registro correspondente.

---

## 10. Retorno de Volumetria

- A API da LMX deve enviar ao NetSuite as informações de volumetria dos pedidos expedidos (altura, peso, comprimento, largura por volume).
- O NetSuite deve atualizar o pedido com os dados de volumetria recebidos.

---

## 11. Campos Customizados Necessários

- Campo customizado de **status WMS** no pedido de venda (ex.: "Aguardando Separação", "Produto Separado").
- Campo customizado **"Origem da Separação"** na Transfer Order.
- Campo customizado para **vincular a Remessa de Saída à Transfer Order** correspondente.
- Registros personalizados para armazenar informações retornadas pelo WMS.

---

## 12. Tratamento de Erros e Respostas da API

- O sistema deve tratar respostas de erro da API da LMX, incluindo: pedido duplicado (409 Conflict), código de item não encontrado (500 Internal Server Error) e campos obrigatórios ausentes (400 Bad Request).
- Falhas de conectividade e respostas malformadas devem ser tratadas e registradas.

---

## 13. Etapas que NÃO são automatizadas (intervenção manual obrigatória)

- Certificação da NF-e nas Remessas de Entrada e Saída (processo nativo do NetSuite, por ação do usuário).
- Faturamento do pedido de venda em Documento Fiscal (Contas a Receber).
- Atendimento e recebimento físico dos itens.
- Envio físico entre Filial e Matriz.

---

## Bloqueio Atual

O principal impedimento para finalização dos testes é o **chamado Oracle nº 6893292** (aberto em 17/04/2026), que impede a geração dos XMLs das NF-e das transações SO14, SO15 e SO16 devido a um erro de FCI sendo exigido indevidamente. Nenhum avanço nos testes finais é possível até a resolução desse chamado.