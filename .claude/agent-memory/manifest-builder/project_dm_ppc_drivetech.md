---
name: project-dm-ppc-drivetech
description: Projeto dm_ppc (ProjectPriceComposition/CPV) da Drivetech — camadas filhas por record, limite de 40 chars em internal ID, referência cruzada com PIS
metadata:
  type: project
---

MANIFEST em `Drivetech/src/FileCabinet/SuiteScripts/Dome/ProjectPriceComposition/Docs/MANIFEST.md`,
TECH-SPEC na mesma pasta. **Correção em 2026-10-23: o prefixo real usado em todos os objetos do
projeto é `pd_ppc_`, não `dm_ppc_`** — a entrada original desta memória estava errada (provável
confusão com a regra geral de "projetos novos nascem com `dm_`"; não refletia o estado real do
arquivo). Todos os Script IDs, Custom Record IDs, campos e customlists do MANIFEST usam
`pd_ppc_`. Ao editar este manifest, usar sempre `pd_ppc_`, nunca `dm_ppc_`.
**Why:** verificado lendo o MANIFEST.md diretamente — toda linha de toda tabela usa `pd_ppc_`.
**How to apply:** não confiar cegamente nesta memória quanto a prefixo; antes de cadastrar objeto
novo neste projeto, conferir o prefixo direto no cabeçalho de qualquer Script ID/Internal ID já
existente no arquivo.

**Arquitetura: cada camada da Proposta (CPV) é um custom record filho separado, vinculado por
`custrecord_<prefixo>_<camada>_proposta`, nunca uma sublist única dentro de um único record.**
Camadas fechadas até 2026-10-08: Proposta (header, 9 campos), MP, MM (idêntica a MP mas tabela
própria), SC, DP (idêntica a SC), EP, EC (idêntica a EP), MF (idêntica a EP/EC). Pendentes: GP, FD.
**Why:** decisão de arquitetura confirmada com o usuário logo no início do projeto.
**How to apply:** ao fechar uma nova camada (GP, FD), sempre criar `customrecord_dm_ppc_<camada>`
novo com campo de vínculo próprio à Proposta — nunca sugerir consolidar em sublist.

**Camadas de "Mão de Obra Interna" (EP, EC, MF — grupo fechado — e futuramente GP) têm estrutura
mínima de 4 campos: vínculo à Proposta, Descrição da Atividade (Text), Horas Estimadas (Decimal),
Total (Currency, calculado = Horas × Taxa Horária). Sem ICMS/IPI por linha (não é material).** Cada
camada desse grupo tem sua própria Taxa Horária — mesma fonte AUXILIAR (ainda em aberto), mas valor
próprio e diferente entre camadas (confirmado: EP ≠ EC ≠ MF). A Taxa Horária em si nunca vira campo
do custom record da camada — é só mencionada na descrição do campo Total como pendência.
**Why:** padrão confirmado explicitamente pelo usuário ao fechar EC e depois MF como "idêntica a
EP/EC".
**How to apply:** ao fechar GP (mesmo grupo), perguntar explicitamente se segue o mesmo padrão de 4
campos antes de assumir — não copiar automaticamente sem confirmação, já que MP/MM/SC/DP têm
estruturas diferentes entre si (material vs. despesa vs. serviço). Com MF fechado, só falta GP para
confirmar se o padrão de 4 campos se mantém em todo o grupo "Mão de Obra Interna".

**Limite de 40 caracteres do internal ID é apertado neste projeto: o prefixo
`custrecord_dm_ppc_<camada>_` já consome ~20-21 caracteres, sobrando pouco para o nome do campo.**
Em EP, "Descrição da Atividade" ficou em `custrecord_dm_ppc_ep_descricao_atividade` — exatamente 40
caracteres (o limite, não folga). Como `dm_ppc_ec_` tem o mesmo tamanho que `dm_ppc_ep_`, reusei o
mesmo nome de campo `descricao_atividade` para EC sem abreviar.
**Why:** evitar overflow silencioso do limite do NetSuite ao copiar padrão de campo entre camadas
com prefixos de tamanhos variados.
**How to apply:** antes de registrar qualquer internal ID novo neste projeto, contar os caracteres
manualmente (prefixo completo + nome do campo) — camadas com nome mais longo (ex.: "fd_" vs "ep_")
podem estourar o limite mesmo copiando um nome de campo que coube em outra camada.

**Referência cruzada obrigatória com o projeto irmão ProjectIncomeStatement (PIS), mesmo cliente
Drivetech.** `customrecord_cseg_pd_cont_proj` (Controle de Projeto) é definido no MANIFEST do PIS
(`Drivetech/.../ProjectIncomeStatement/DOCS/MANIFEST.md`) e apenas referenciado aqui, nunca
recadastrado. PIS usa prefixo `dm_pis_` (mesmo padrão `dm_`, projeto irmão mais antigo).
**Why:** evitar duplicidade de definição de um record compartilhado entre dois projetos do mesmo
cliente.
**How to apply:** ao tocar `customrecord_cseg_pd_cont_proj` neste manifest, só referenciar — qualquer
mudança de campo desse record deve ser feita no MANIFEST do PIS, não aqui.

**Aba AUXILIAR (parametrização de taxas) fechada em 2026-10-08 — 2 custom records de configuração
global, NÃO vinculados à Proposta** (diferente das 10 camadas filhas, que têm vínculo obrigatório):
`customrecord_dm_ppc_auxiliar_un` (um registro por Unidade de Negócio — ICMS/IPI de MP e de MM,
fontes independentes entre si, + taxas de suprimentos/administração/vendas/garantia) e
`customrecord_dm_ppc_auxiliar_taxahora` (um registro por função EP/EC/MF/GP — Taxa Horária própria
de cada camada). Prefixo de campo usa abreviação curta — `dm_ppc_aux_un_` e `dm_ppc_aux_th_` (14
chars) — porque o nome do record (`auxiliar_un`/`auxiliar_taxahora`) é mais longo que o das camadas,
então o prefixo de campo precisou ser mais compacto (`aux_un`/`aux_th`, não `auxiliar_un` completo)
para sobrar orçamento de 40 chars para o nome do campo (ex.: `tx_suprimentos` abrevia "taxa_" para
"tx_" só nesses 4 campos de taxa comercial — ICMS/IPI mantêm nome completo por já serem curtos).
**Why:** o limite de 40 chars (ver regra acima) ficaria sem folga nenhuma se o prefixo de campo
repetisse o nome completo do record.
**How to apply:** ao adicionar novo campo num desses dois records AUXILIAR, contar
`custrecord_dm_ppc_aux_un_` ou `custrecord_dm_ppc_aux_th_` (25 chars fixos) + nome do campo (máx. 15
chars) — não usar `auxiliar_un_`/`auxiliar_taxahora_` como prefixo de campo, estouraria o limite.
A unicidade de 1 registro por UN em `auxiliar_un` é validada no Restlet (Entrypoint 2), não por
constraint nativa — registrar isso como nota de implementação, não como pendência em aberto, se
qualquer skill futura tratar esse tema.

**Correção confirmada pelo usuário em 2026-10-09, após revisão da rodada anterior: campo "Função"
de `auxiliar_taxahora` mudou de Text para List/Record, com novo customlist cadastrado.**
O campo `custrecord_dm_ppc_aux_th_funcao` guardava livremente EP/EC/MF/GP como chave de lookup do
Restlet — mesmo risco de erro de digitação/case-sensitivity que já tinha levado "Unidade de
Negócio" em `auxiliar_un` a ser List/Record. Diferença importante: "Unidade de Negócio" reaproveita
a lista já existente do header da Proposta, mas não havia lista nativa/customlist prévio para
EP/EC/MF/GP — foi necessário **cadastrar um customlist novo**, `customlist_dm_ppc_aux_th_funcao`
(31 caracteres, dentro do limite), com as 4 opções (nomes completos: Engenharia de Projetos,
Engenharia de Comissionamento/Campo, Montagem de Fabricação, Gerenciamento do Projeto). Também foi
adicionada, por paridade, uma "Nota de implementação (unicidade)" em `auxiliar_taxahora` espelhando
a de `auxiliar_un` (1 registro por Função, validado no Restlet, não por constraint nativa).
**Why:** usuário confirmou explicitamente ambas as correções ao revisar o manifest da rodada
anterior.
**How to apply:** ao modelar um campo List/Record cujos valores não têm lista nativa/customlist
reaproveitável no projeto, sempre cadastrar um `customlist_dm_ppc_<nome>` novo como objeto próprio
no MANIFEST (seção "Listas Customizadas") em vez de deixar o campo como Text — não assumir que
"parece lista fechada de valores" baste; perguntar/confirmar antes se já existe lista a reaproveitar
(caso `auxiliar_un`) ou se precisa nascer novo (caso `auxiliar_taxahora`). Campos de "chave de
lookup" usados por Restlet/script para buscar configuração são candidatos naturais a essa revisão
Text→List/Record. Qualquer record AUXILIAR com garantia de unicidade lógica (1 registro por X) deve
ter a mesma nota de implementação, não deixar implícito.

**Gap recorrente confirmado em 2026-10-09, descoberto ao gerar o SDF pela primeira vez a partir do
manifest: campo List/Record com opções fechadas no TECH-SPEC pode ficar sem customlist cadastrado
no MANIFEST, mesmo depois de "fechado".** Os 3 campos do header da Proposta — Tipo de Operação,
Tipo de Cliente, Unidade de Negócio — tinham suas opções descritas inline na descrição do campo
("opções: X(1), Y(2)...") desde a rodada inicial, mas nenhum customlist tinha sido cadastrado como
objeto próprio — o gerador SDF não conseguiu resolver o `<selectrecordtype>`. Cadastrados nesta
rodada: `customlist_dm_ppc_tipo_operacao` (3 opções), `customlist_dm_ppc_tipo_cliente` (3 opções),
`customlist_dm_ppc_unid_negocio` (4 opções, reaproveitado por `auxiliar_un` — mesmo objeto da nota
acima sobre "Unidade de Negócio", agora com object real e não mais vago).
**Why:** mesma regra já vigente para "Função" de `auxiliar_taxahora" (ver nota acima), mas aqui o
gap passou despercebido por mais tempo porque as opções já apareciam como texto na descrição do
campo, dando falsa sensação de "já documentado" — documentar as opções em prosa não é o mesmo que
cadastrar o objeto customlist.
**How to apply:** toda vez que um campo List/Record no MANIFEST tiver opções enumeradas só na
descrição (texto "opções: X(1), Y(2)..."), tratar isso como sinal de pendência — verificar se existe
subseção correspondente em "Listas Customizadas" linkada explicitamente (texto "a partir do
customlist X"); se não existir, é o mesmo gap e deve ser fechado do mesmo jeito (novo customlist,
ou apontar para lista já existente se for caso de reaproveitamento como `unid_negocio`). Rodar essa
checagem proativamente ao gerar/revisar o manifest, não só reativamente quando o sdf-generator
tropeçar nisso.
