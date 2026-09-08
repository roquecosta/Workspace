---
name: project-pd-t4l-grupoff
description: Projeto pd_t4l (Tech4Log/TMS) da GrupoFF — convenções de scriptid, customlists inline, prefixos de campo por record
metadata:
  type: project
---

MANIFEST em `GrupoFF/src/FileCabinet/SuiteScripts/ProjectDome/pd_t4l/Docs/MANIFEST.md`, SPEC.md na mesma pasta (v2.6 em 20/08/2026).

**Convenção real de scriptid para MapReduce difere do texto do MANIFEST:** a tabela de Scripts do MANIFEST lista IDs sem sufixo (ex.: `customscript_pd_t4l_clear_logs`), mas o XML real em `GrupoFF/src/Objects/pd_t4l/Scripts/customscript_pd_t4l_clear_logs_mr.xml` tem `scriptid="customscript_pd_t4l_clear_logs_mr"` (com sufixo `_mr`). Todos os demais MRs do projeto (`create_rev_inst_mr`, `create_nfse_nd_mr`, `create_debit_note_mr`, `log_entry_mr` etc.) também terminam em `_mr` no XML real.
**Why:** o MANIFEST aparentemente foi escrito sem o sufixo por simplificação/erro histórico; ao cunhar um scriptid novo para um MR deste projeto, o XML (fonte real) é o critério, não o texto atual do MANIFEST.
**How to apply:** ao adicionar novo script MapReduce a este projeto, sempre confirmar o padrão real no XML em `src/Objects/pd_t4l/Scripts/`, não apenas no MANIFEST.md. Ex.: para o log de saída (v2.6), usei `customscript_pd_t4l_clear_logs_saida_mr` (com `_mr`) em vez do `customscript_pd_t4l_clear_logs_saida` que havia sido sugerido sem confirmar o XML. Vale a pena sinalizar essa divergência ao coordenador quando notada, mas não corrigir a linha antiga sem pedido explícito.

**Customlists não têm seção própria neste MANIFEST — valores documentados inline.** O projeto tem pelo menos duas customlists reais (`customlist_pd_t4l_type_entry`, usada no campo `custrecord_pd_type_entry`; e `customlist_pd_t4l_type_saida`, criada na v2.6 para `custrecord_pd_t4l_saida_operation`), mas nenhuma aparece numa seção "## Listas Customizadas" — os valores são descritos apenas no parágrafo intro do record (padrão "Status: Valor(1), Valor(2)...") e no campo "(1–N)" da tabela, igual ao já usado para status de CIOT/Parcela.
**Why:** convenção já estabelecida desde a v1.0 deste manifest específico (confirmado também no `references/example_manifest.md` da skill manifest-standards, que reflete este mesmo projeto).
**How to apply:** ao cadastrar um campo List/Record apoiado em customlist neste projeto, não criar seção "Listas Customizadas" — documentar os valores no texto do record e do campo, como já é feito.

**Prefixo de campo por record:** cada custom record do projeto usa um prefixo específico nos internal IDs dos seus campos, exceto `customrecord_pd_t4l_log_entry` (usa `custrecord_pd_` genérico, sem `t4l`, provavelmente herdado de um padrão anterior). Records mais recentes seguem `custrecord_pd_t4l_<abrev_record>_<campo>` (ex.: `_ciot_`, `_inst_`, `_veh_`, `_nc_`, `_nd_`). Para o novo `customrecord_pd_t4l_log_saida` (v2.6) usei o prefixo `custrecord_pd_t4l_saida_`, seguindo o padrão mais recente (não o genérico do log_entry).
**How to apply:** ao adicionar campos a records novos deste projeto, seguir o prefixo `custrecord_pd_t4l_<abrev>_`, não replicar o padrão genérico legado do log_entry.

**Marcador `†` para objeto real ainda não implementado (distinto de `*` = ID inferido) — 2026-08-27.**
Ao cadastrar em modo colaborativo/paralelo o service `pd-t4l-cnab.js` (ainda não existe no código,
só projetado) e os campos externos que ele vai manipular, usei `†` — não `*` — porque o nome do
arquivo/módulo é real e definido pelo usuário, só falta ser criado. `*` continua reservado para IDs
inferidos a partir de convenção de nome. Mesmo marcador `†` já usado no projeto pd_brc (StoccheForbes)
para Script IDs reais sem Internal ID por falta de deploy — reaproveitei o símbolo para o mesmo
conceito geral ("objeto real, ainda não materializado"), mesmo em contexto diferente (arquivo de
código vs. deploy de script).
**Why:** evitar reutilizar `*` para dois significados diferentes no mesmo manifest.
**How to apply:** se outro objeto real mas ainda-não-criado for cadastrado neste ou outro manifest
ProjectDome, usar `†` com nota de rodapé própria, nunca `*`.

**Nova seção "Módulos Internos Compartilhados" (não-literal-do-template da skill) — 2026-08-27.**
Adicionada logo após "## Scripts" e antes de "## Custom Records", para catalogar `pd-t4l-cnab.js`
(pasta `Services/`), um módulo interno deste projeto usado por múltiplos MRs mas que não é, em si,
um Script NetSuite deployado (sem Script ID). Tabela: Arquivo | Caminho | Descrição | Usado por.
Segue o mesmo precedente de [[project_pd_brc_billing_rate_card_report]] ("Bibliotecas Compartilhadas
(Referência Externa)"), mas para um módulo *interno* ao projeto, não uma lib externa compartilhada
entre clientes — por isso o nome da seção é diferente ("Módulos Internos", sem "Referência Externa").
**Why:** o projeto nunca catalogou UseCases/Models/Services internos antes (não apareciam no
MANIFEST); mas o usuário pediu explicitamente para registrar este service como objeto, e ele é
referenciado por 4 scripts diferentes — omiti-lo criaria um objeto "invisível" no catálogo.
**How to apply:** só criar entrada nesta seção quando um arquivo de Service/lib interna for
referenciado por múltiplos scripts e o usuário pedir explicitamente o cadastro; não promover
UseCases/Models internos comuns (1:1 com um script) para esta seção — isso seria implementação, não
objeto compartilhado.

**Cabeçalho "Versão do Spec" pode ficar desatualizado em relação ao conteúdo real do MANIFEST — 2026-08-28.**
Ao atualizar para a v2.10, encontrei o cabeçalho ainda em "2.6", mas o corpo do arquivo já refletia
objetos da v2.8 (CNAB, `pd-t4l-cnab.js`†) — ou seja, uma atualização anterior esqueceu de bumpar o
cabeçalho. As v2.7 e v2.9 do SPEC não exigiam mudança de objetos (puro comportamento: retorno à API e
V3 do idIntegracao/externalid nativo), então não há lacuna de conteúdo, só de cabeçalho. Corrigi o
cabeçalho para 2.10/28-08-2026 nesta sessão.
**Why:** o cabeçalho é fácil de esquecer quando a atualização é feita rápido; sem ele, fica impossível
saber se o manifest está de fato sincronizado com o SPEC só de bater a versão.
**How to apply:** ao atualizar este MANIFEST, sempre conferir se o conteúdo (não só o número) já
incorpora versões intermediárias do changelog antes de assumir que o cabeçalho está correto.

**Verificar objetos "de origem incerta" no XML real antes de aceitar a instrução do orquestrador ao
pé da letra — 2026-08-28.** Ao cadastrar 9 campos de entidade da v2.10 (cópia Vendor→Customer), a
instrução recebida dizia que a origem de todos os 9 era incerta. Busquei `Objects/pd_t4l/Fields/` e
encontrei XML real para 8 deles (`custentity_pd_t4l_billing_monday/tuesday/wednesday/thursday/
friday/saturday/sunday` e `custentity_pd_t4l_terms`, todos com `appliestocustomer=T` e
`appliestovendor=T`) — ou seja, são objetos reais e já gerenciados via SDF por este projeto, só nunca
tinham sido cadastrados no MANIFEST. Só `custentity_pd_petr_country_ls` de fato não tem XML neste
projeto (prefixo `pd_petr`, não `pd_t4l` — provavelmente de outro módulo/bundle); é o único que
cataloguei com a nota de origem pendente de confirmação.
**Why:** a instrução do orquestrador é uma hipótese de quem não tem acesso direto ao filesystem no
momento de escrever a instrução; "IDs reais têm prioridade" e "não inventar" exigem checar o
Objects/ antes de aceitar a hipótese.
**How to apply:** antes de marcar qualquer campo como "origem não confirmada", grep no `Objects/
pd_t4l/Fields` (ou pasta equivalente do projeto) pelo scriptid; só manter a nota de incerteza para os
que genuinamente não aparecem lá.

**Dois marcadores no mesmo objeto (`*†` combinados) quando ambos se aplicam — 2026-08-28.** Ao
cadastrar `customscript_pd_t4l_vendor_handler` e `customscript_pd_t4l_mirror_vnd_cust_mr` (v2.10),
usei `*` (Script ID inferido por convenção, já que o SPEC só cita o nome do arquivo) **e** `†`
(arquivo ainda não existe no código) juntos no mesmo Script ID — diferente do precedente do
`pd-t4l-cnab.js`, que só usa `†` porque não é, em si, um Script ID (é um módulo sem script próprio).
**Why:** são fatos ortogonais — um é sobre a string do ID (inferida vs. confirmada), o outro é sobre a
existência do objeto no código/ambiente. Só usar `†` sozinho quando o objeto cadastrado não tem
conceito de "Script ID inferido" (ex.: um módulo/service).
**How to apply:** ao cadastrar um Script ID novo cujo arquivo ainda não existe E cujo ID foi inferido
por convenção (não veio literal do SPEC/código), marcar com `*†` e footnote para os dois símbolos.

**Lacunas pré-existentes fora do escopo da tarefa, sinalizadas mas não corrigidas — 2026-08-28.**
Notei duas inconsistências não relacionadas ao meu escopo da v2.10, que não corrigi (sem pedido
explícito): (1) `custentity_brl_entity_t_fed_tax_reg` (campo de CNPJ usado desde a v1.0 em
`createCiot`/`payCiot`) nunca foi cadastrado neste MANIFEST; (2) as duas linhas de CNAB
"Informações Bancárias da Subsidiária (CNAB)" e "Método de Pagamento (CNAB)" em `customer`/`vendor`
usam o mesmo Internal ID `custentity_pd_mtodo_de_pagamento` para os dois campos (provável erro de
digitação/cópia — dois campos com propósitos diferentes não deveriam compartilhar ID).
**Why:** manifest-builder não deve expandir escopo além do que foi pedido sem confirmação do usuário.
**How to apply:** reportar essas duas pendências ao orquestrador/usuário na próxima interação com este
MANIFEST; não corrigir silenciosamente.

**Campo de entidade usado em Customer E Vendor: duplicar linha em subseções `### customer` e
`### vendor` separadas** (não uma tabela única "customer/vendor") — mesmo padrão já usado neste
manifest para colunas de sublista repetidas em `invoice`/`vendorbill` (`custcol_pd_t4l_inst_ciot_linked`
etc., duplicado nas duas subseções `#### ... — Colunas de Linha (item)`). Apliquei o mesmo aos campos
CNAB `custentitypd_informaes_ban_da_subsidi` e `custentitypd_mtodo_de_pagamento` (Customer e Vendor) e
aos campos `custbody_brl_tran_l_banking_info`/`custbody_brl_tran_l_payment_method` na sublista nativa
`installment` (duplicados em `#### invoice — Colunas de Linha (installment)` e
`#### vendorbill — Colunas de Linha (installment)`, novas subseções criadas em 2026-08-27).
**Why:** manter "uma linha por objeto por record nativo" (regra geral da skill) em vez de inventar
uma notação combinada tipo "customer/vendor" que não existe no template.
**How to apply:** ao cadastrar um campo nativo/externo usado em mais de um record nativo deste
projeto, sempre duplicar a linha em subseções `###`/`####` separadas — nunca combinar.

**Subtabela "Funções Expostas" dentro de "Módulos Internos Compartilhados" quando o módulo tem
múltiplas funções com "usado por" distintos — 2026-09-08.** Ao formalizar `pd-t4l-tech4log.api.js`
(pasta real `pd_t4l/Api/`, confirmada via grep — não `Services/` como o `pd-t4l-cnab.js`) com 4
funções expostas (`sendEmissionReturn`, `sendPaymentReturn`, `sendSettlement`, `resendRequest`), cada
uma chamada por um conjunto diferente de scripts, a tabela padrão de uma linha por arquivo não
comportava o mapeamento. Criei uma subtabela `#### Funções Expostas — <arquivo>` logo abaixo da linha
do módulo na tabela principal (que passa a ter "Usado por" = "Ver tabela de funções expostas abaixo"),
com colunas Função | Usado por — uma linha por função, mantendo a regra "uma linha por objeto" no
nível de função em vez de arquivo. Atualizei também o parágrafo intro da seção (antes dizia "pasta
`Services/`", agora "pastas `Services/`, `Api/`") para não ficar desatualizado.
**Why:** evitar espremer 4 mapeamentos função→scripts em uma única célula de tabela (ilegível) sem
inventar uma coluna nova fora do padrão da skill.
**How to apply:** se outro módulo interno compartilhado deste projeto tiver múltiplas funções com
usuários diferentes, replicar essa subtabela; se tiver função única ou "usado por" idêntico entre
funções, manter só a linha simples na tabela principal (como `pd-t4l-cnab.js`).

**Marcador `*†` combinado reaplicado a Script ID de Suitelet/RESTlet de tela nova em fase de Design —
2026-09-08.** Ao cadastrar `pd-t4l-resend-log-saida.st.js` e `pd-t4l-resend-log-saida-handler.rl.js`
(nova tela de reenvio manual de Log de Saída, v3.1), usei `*†` combinado (não só `*`) mesmo a
instrução do orquestrador (solution-architect) tendo pedido explicitamente apenas "o marcador para
Script ID inferido por convenção" — apliquei o precedente já registrado neste arquivo (dual marcador
quando ID é inferido E arquivo não existe ainda no código) por ser mais preciso, já que o projeto está
em fase de Design e nenhum dos dois arquivos foi escrito ainda.
**Why:** a instrução do orquestrador focou só na motivação de um dos dois fatos (ID não confirmado
porque é fase de Design), mas o outro fato (arquivo inexistente) também é verdadeiro e já tem
convenção própria (`†`) neste projeto; usar só `*` omitiria essa segunda informação do leitor do
manifest.
**How to apply:** ao receber instrução do solution-architect pedindo apenas o marcador de ID inferido,
verificar se o fato "arquivo ainda não implementado" também se aplica (comum em fase de Design) e, se
sim, combinar `*†` mesmo assim — reportar a decisão no resumo devolvido ao chamador para não surpreender
quem pediu só um marcador.
