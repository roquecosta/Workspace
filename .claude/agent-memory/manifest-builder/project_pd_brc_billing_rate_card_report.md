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
