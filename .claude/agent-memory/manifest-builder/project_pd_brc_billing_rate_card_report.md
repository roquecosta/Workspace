---
name: project-pd-brc-billing-rate-card-report
description: Projeto pd_brc (StoccheForbes) — Relatório de Cartões de Taxa de Cobrança; caminho do MANIFEST, seção nova para lib compartilhada externa e padrão para record nativo referenciado com field IDs pendentes
metadata:
  type: project
---

Projeto **pd_brc — Relatório de Cartões de Taxa de Cobrança**, cliente **StoccheForbes**.

MANIFEST em:
`C:\Users\Roque\Documents\ProjectDome\StoccheForbes\src\FileCabinet\SuiteScripts\project_dome\pd_brc_billing_rate_card_report\Docs\MANIFEST.md`

TECH-SPEC na mesma pasta `Docs\`. Primeiro MANIFEST criado para este projeto (StoccheForbes não
tinha nenhum `MANIFEST.md` ainda em 2026-08-13 — projeto novo, criado direto a partir do TECH-SPEC
já co-escrito e confirmado, modo "derivado de TECH-SPEC existente").

## Seção nova: Bibliotecas Compartilhadas (Referência Externa)

O projeto usa `pd-cnts-suitelet.util.js` (linhagem `pd_c_netsuite_tools/pd_cnt_standard`) via
`build()`. Essa lib existe em pelo menos 5 pastas de cliente no workspace (StoccheForbes, GrupoFF,
Gupy, TresM, LogCOMEX) mas **não tem MANIFEST próprio/compartilhado** em nenhuma delas — busquei e
não encontrei. Por isso criei uma seção não-literal-da-skill chamada "Bibliotecas Compartilhadas
(Referência Externa)", posicionada logo após "Scripts", com tabela Biblioteca | Caminho | Linhagem
| Usada por, e nota explícita de que o comportamento interno da lib não é redefinido aqui.

**Why:** [[project_pipefy_accountclassvalidation]] já estabeleceu o precedente de criar subseções
fora do template literal da skill quando necessário para não inventar comportamento nem omitir um
objeto referenciado — aqui estendi esse precedente para bibliotecas compartilhadas (não apenas
campos nativos).

**How to apply:** se outro projeto referenciar essa mesma lib (ou outra lib de
`pd_c_netsuite_tools`) e ainda não houver MANIFEST compartilhado dela, repetir esse padrão de
seção. Se um dia existir um MANIFEST compartilhado dedicado a `pd_c_netsuite_tools`, mudar para
apenas linkar/referenciar em vez de recadastrar.

## Record nativo referenciado com field IDs pendentes de confirmação (Billing Rate Card)

Registro nativo **Billing Rate Card**, consultado via SuiteQL, não custom. Usei a subseção
"Campos nativos referenciados (pré-existentes, não customizados)" dentro de "Campos Customizados
em Records Nativos" (mesmo padrão de [[project_pipefy_accountclassvalidation]]), com tabela
Record | Campo | Internal ID | Tipo | Descrição. Os internal IDs de Nome, Classe de Faturamento,
Moeda e Preço estavam **desconhecidos** (usuário optou por não acessar a conta NetSuite na sessão
de design) — marquei como `*a confirmar*` em vez de inventar ou usar `*` de "inferido" (esse `*`
é reservado pela skill para IDs inferidos a partir de nome de arquivo/padrão, não para "eu não
sei"). `createddate` e `createdby` já eram conhecidos (colunas de sistema do SuiteQL, confirmadas
no TECH-SPEC) e não levam marcação de pendência.

**Why:** a skill diz "não inventar" — quando nem um palpite razoável de internal ID existe (não é
nem uma convenção de nome inferível), o correto é marcar como pendente de confirmação, não usar o
mesmo marcador `*` de "inferido" (que implica um palpite concreto registrado).

**How to apply:** ao atualizar este manifest após o usuário confirmar os field IDs reais no
NetSuite, substituir `*a confirmar*` pelos internal IDs reais e remover a nota de pendência
correspondente (P1/P2) — tanto aqui quanto no TECH-SPEC.

## Scripts ainda não deployados (sem Internal ID numérico)

Os dois scripts (`customscript_pd_brc_report_sl`, `customscript_pd_brc_report_rl`) têm Script ID
definido pelo projeto (não inferido, vem direto da instrução do usuário) mas nenhum Internal ID
numérico ainda, pois nunca foram deployados. Usei o marcador `†` (não `*`) com nota de rodapé
distinta, para não confundir com a convenção de `*` = "Script ID inferido a partir do nome do
arquivo" da skill — aqui o Script ID é real/definido, só falta o deploy.

**Why:** `*` na skill tem significado específico (ID inferido); reutilizar para "não deployado
ainda" misturaria dois conceitos diferentes no mesmo manifest.

**How to apply:** repetir o marcador `†` em outros projetos novos onde o Script ID já está
definido pelo TECH-SPEC/usuário mas o script ainda não foi deployado no ambiente.

## Correção de modelo de dados (2026-08-19): header vs. sublist `ratecardpricingmulti`

O TECH-SPEC foi corrigido: Classe de Faturamento, Moeda e Preço do Billing Rate Card **não são
campos de header** — vivem na sublist `ratecardpricingmulti` (uma linha por Classe de Faturamento,
um campo `price_N_` por moeda ativa, onde `N` = `currency.id`). O header só contribui com `name`,
`createddate`, `createdby`. Ao refletir isso no MANIFEST:

- Dividi "Campos nativos referenciados" em duas subseções por nível de dado:
  `#### Billing Rate Card — Header` e `#### Billing Rate Card — Linha da sublist
  ratecardpricingmulti`. Cada `price_N_` (1 a 9, hoje) virou uma linha própria na tabela — não
  agrupei num único "price" genérico, porque cada sufixo é um internal ID real e distinto.
- Adicionei uma terceira subseção, `#### Currency — Referenciado via join (currency.id = N)`,
  para o registro nativo Currency (não customizado, não criado pelo projeto, apenas usado em
  join). Incluí uma tabela de instâncias reais (id → nome/código) confirmada pelo usuário via
  SuiteQL na conta — tratei isso como dado de catálogo (quais valores de moeda existem nesta
  conta), não como comportamento, seguindo o precedente da skill de "documentar valores de listas
  inline quando o spec os menciona".
- Removi as linhas antigas "Moeda | *a confirmar*" e "Preço | price" do header — elas nunca
  existiram como campos de header, era erro de modelagem anterior. Como havia evidência explícita
  da correção no TECH-SPEC (não uma remoção sem lastro), a remoção foi direta, sem manter rastro
  de "removido".
- Pendências: P1 foi marcada como **resolvida** (nota acima da tabela, mesmo padrão que o
  TECH-SPEC usou), não apagada da seção — mantém histórico de que existiu e foi fechada. P2
  (createdby → nome do usuário) permanece aberta. Nova P4 (sintaxe SuiteQL exata para acessar a
  sublist `ratecardpricingmulti`) foi adicionada, copiando o texto do TECH-SPEC quase literalmente
  (é uma pendência de implementação, não de modelagem — mas ainda assim cataloga um objeto em
  aberto, por isso pertence ao MANIFEST tanto quanto ao TECH-SPEC).

**Why:** o usuário corrigiu um erro real de modelagem (assumiu campos de header que na verdade
eram de uma matriz de preço multi-moeda, padrão "Multiple Prices" do NetSuite). O manifest não
deve carregar a lógica de resolução do join (isso é comportamento, fica só no TECH-SPEC) mas deve
catalogar com precisão cada `price_N_` como um internal ID de campo real, distinto — é isso que
"cataloga objetos" significa quando o objeto é uma matriz de campos por moeda.

**How to apply:** se outro projeto Dome referenciar um record nativo com sublist de matriz
de preço multi-moeda (`*multi` fields tipo `price_N_`), repetir o padrão: uma subseção separada
para a sublist, uma linha por `price_N_`, e uma subseção própria para o record Currency
referenciado via join — nunca colapsar os `price_N_` numa única linha genérica "Preço".

## Segunda lib compartilhada adicionada (2026-08-25): `pd-cntst-export.util.js`

TECH-SPEC recebeu um botão "Download Excel" na tela (Suitelet `customscript_pd_brc_report_st`),
reaproveitando a lib já existente `pd-cntst-export.util.js` (linhagem `pd_c_netsuite_tools/pd_cnt_static`,
função `generateExcelDownload()`), mesmo padrão já usado em outros relatórios do cliente
(pd_aging_report, pd_ar_accounts_receivable, pd_receivement_report, pd_c_customer_expense_report).
Adicionei como segunda linha na tabela já existente da seção "Bibliotecas Compartilhadas (Referência
Externa)" (mesmo formato de [[project_pd_brc_billing_rate_card_report]] acima) e ajustei a nota em
blockquote de singular para plural ("Lib compartilhada" → "Libs compartilhadas"), já que agora há
duas. Atualizei também o cabeçalho do manifest (`Gerado em` → 25/08/2026, `Versão do Spec` → 1.2).

**Why:** a seção "Bibliotecas Compartilhadas" foi desenhada para crescer por linha conforme o
projeto passa a depender de mais libs do `pd_c_netsuite_tools` — não é uma seção de tamanho fixo.
Ajustar a nota de singular/plural evita a inconsistência de dizer "lib" (singular) com duas linhas
na tabela.

**How to apply:** ao adicionar uma terceira lib (ou mais) nesta seção, repetir o padrão de linha e
verificar se a nota em blockquote ainda faz sentido no plural (já ajustada agora, não precisa mudar
de novo só por isso).
