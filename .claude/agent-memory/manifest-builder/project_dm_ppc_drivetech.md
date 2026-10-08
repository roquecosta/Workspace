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
própria), SC, DP (idêntica a SC), EP, EC (idêntica a EP). Pendentes: MF, GP, FD.
**Why:** decisão de arquitetura confirmada com o usuário logo no início do projeto.
**How to apply:** ao fechar uma nova camada (MF, GP, FD), sempre criar `customrecord_dm_ppc_<camada>`
novo com campo de vínculo próprio à Proposta — nunca sugerir consolidar em sublist.

**Camadas de "Mão de Obra Interna" (EP, EC, e futuramente MF/GP) têm estrutura mínima de 4 campos:
vínculo à Proposta, Descrição da Atividade (Text), Horas Estimadas (Decimal), Total (Currency,
calculado = Horas × Taxa Horária). Sem ICMS/IPI por linha (não é material).** Cada camada desse
grupo tem sua própria Taxa Horária — mesma fonte AUXILIAR (ainda em aberto), mas valor próprio e
diferente entre camadas (confirmado: EP ≠ EC). A Taxa Horária em si nunca vira campo do custom
record da camada — é só mencionada na descrição do campo Total como pendência.
**Why:** padrão confirmado explicitamente pelo usuário ao fechar EC como "idêntica a EP".
**How to apply:** ao fechar MF e GP (mesmo grupo), perguntar explicitamente se seguem o mesmo
padrão de 4 campos antes de assumir — não copiar automaticamente sem confirmação, já que MP/MM/SC/DP
têm estruturas diferentes entre si (material vs. despesa vs. serviço).

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
