---
name: project-pd-mvd-mirror-vendor
description: Projeto pd_mvd_mirror_vendor (GrupoFF) — MANIFEST criado do zero a partir do TECH-SPEC v1.0; achado importante de duplicação com pd_t4l
metadata:
  type: project
---

Projeto **pd_mvd_mirror_vendor — Espelhamento Vendor → Customer**, cliente **GrupoFF**, desenhado
como projeto **independente** (não depende de `pd_t4l`).

MANIFEST em:
`GrupoFF/src/FileCabinet/SuiteScripts/ProjectDome/pd_mvd_mirror_vendor/Docs/MANIFEST.md`
TECH-SPEC na mesma pasta `Docs/` (v1.0, 28/08/2026). Primeiro MANIFEST deste projeto — criado em
modo "derivado de TECH-SPEC existente", nenhum código ainda (só o TECH-SPEC.md existia na pasta).

## Achado importante: possível duplicação com `pd_t4l` — sinalizado, não corrigido

Ao verificar os campos pré-existentes no workspace, encontrei que o projeto `pd_t4l` **já tem essa
mesma funcionalidade implementada e em código real**, não só especificada:
- `pd_t4l/Vendor/pd-t4l-vendor-handler.ue.js` (UserEvent, afterSubmit CREATE)
- `pd_t4l/Vendor/pd-t4l-mirror-vendor-customer.mr.js` (MapReduce retroativo, parâmetro
  `custscript_pd_t4l_mirror_dry_run`)
- `pd_t4l/UseCases/MirrorVendorToCustomer.js` (mesmo nome de classe/arquivo, mesma lista de campos
  copiados, mesma regra de busca por CNPJ ativo)

Isso bate com a mesma feature descrita no `[[project_pd_t4l_grupoff]]` (registrada lá em
2026-08-28 como "v2.10", na época ainda `†` não implementada) — ou seja, entre aquela sessão e esta,
alguém implementou a feature dentro do `pd_t4l`, com nomes de arquivo quase idênticos aos deste novo
projeto "independente" `pd_mvd_mirror_vendor` (só o prefixo muda: `pd-t4l-` vs `pd-mvd-`). Também
notei que o `pd_t4l/Docs/MANIFEST.md` **não** tem nenhuma linha para essas scripts/UseCase apesar do
código já existir — outra lacuna não corrigida por mim (fora do escopo desta tarefa).

**Why:** o TECH-SPEC do `pd_mvd_mirror_vendor` afirma explicitamente independência do `pd_t4l`, mas
o catálogo de objetos (regra do manifest-builder: não inventar, IDs reais têm prioridade) revelou uma
sobreposição funcional quase total com código já existente em outro projeto. Isso é uma decisão de
arquitetura/produto (manter as duas, migrar, ou aposentar uma), fora do escopo de "catalogar objetos"
— por isso não editei nada, só registrei para reportar ao coordenador.

**How to apply:** se o usuário pedir para atualizar este MANIFEST ou o do `pd_t4l` novamente,
mencionar essa sobreposição antes de prosseguir — pode ser que a intenção real seja aposentar o
código do `pd_t4l` em favor deste projeto novo, ou que seja de fato uma duplicação acidental a ser
resolvida pelo solution-architect.

## Convenções aplicadas (reaproveitadas de outros projetos)

- Marcador `†` (não `*`) para os 2 Scripts e para o UseCase/módulo interno — objetos reais e
  nomeados no TECH-SPEC, mas ainda não implementados no código (nenhum arquivo existe na pasta do
  projeto além do `TECH-SPEC.md`). Mesmo conceito de [[project_pd_t4l_grupoff]] e
  [[project_pd_brc_billing_rate_card_report]].
- Seção não-literal "Módulos Internos Compartilhados" (após Scripts, antes de Custom Records) para
  o UseCase `MirrorVendorToCustomer.js`, seguindo o precedente de [[project_pd_t4l_grupoff]] — só
  usada porque o usuário pediu explicitamente o cadastro do módulo e ele é reusado por 2 scripts.
- Seção "Custom Records" mantida vazia com nota "Nenhum custom record novo neste projeto" — mesmo
  padrão de [[project_pipefy_accountclassvalidation]] quando o projeto não cria nenhum custom record.
- Os 10 campos de entidade compartilhados (`custentity_brl_entity_t_fed_tax_reg`,
  `custentity_pd_petr_country_ls`, `custentity_pd_t4l_billing_monday/tuesday/wednesday/thursday/
  friday/saturday/sunday`, `custentity_pd_t4l_terms`) foram duplicados em subseções `### customer` e
  `### vendor` separadas dentro de "Campos Customizados em Records Nativos" — mesmo padrão de
  [[project_pd_t4l_grupoff]] para campo usado em mais de um record nativo (nunca combinar numa única
  linha "customer/vendor").
- Antes de aceitar a instrução ao pé da letra, verifiquei o XML real em
  `GrupoFF/src/Objects/pd_t4l/Fields/`: os 8 campos `pd_t4l_billing_*`/`pd_t4l_terms` têm XML
  confirmado ali (reais, geridos via SDF pelo `pd_t4l`); `custentity_brl_entity_t_fed_tax_reg` e
  `custentity_pd_petr_country_ls` não têm XML em nenhuma pasta do workspace — tratados como campos de
  bundle instalado, sem gestão SDF por nenhum projeto ProjectDome conhecido. Documentei essa distinção
  no corpo do MANIFEST em vez de tratar os 10 campos como um bloco homogêneo.
