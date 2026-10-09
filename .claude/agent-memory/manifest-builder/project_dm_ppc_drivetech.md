---
name: project-dm-ppc-drivetech
description: Projeto dm_ppc (ProjectPriceComposition/CPV) da Drivetech — camadas filhas por record, limite de 40 chars em internal ID, referência cruzada com PIS
metadata:
  type: project
---

MANIFEST em `Drivetech/src/FileCabinet/SuiteScripts/Dome/ProjectPriceComposition/Docs/MANIFEST.md`,
TECH-SPEC na mesma pasta. Prefixo `dm_ppc_` (projeto novo, nasce com `dm_` — não `pd_`).

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
