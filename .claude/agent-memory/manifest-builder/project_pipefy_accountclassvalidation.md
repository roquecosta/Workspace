---
name: project-pipefy-accountclassvalidation
description: Estrutura e padrões do MANIFEST.md do projeto AccountClassValidation (cliente Pipefy)
metadata:
  type: project
---

Projeto **AccountClassValidation**, cliente **Pipefy** (pasta raiz `Pipefy/`, distinta do projeto
`PipefyIntegration` do cliente LogCOMEX — não confundir, mesmo nome de app).

Caminhos:
- TECH-SPEC: `Pipefy/src/FileCabinet/SuiteScripts/ProjectDome/AccountClassValidation/Docs/TECH-SPEC.md`
- MANIFEST: mesma pasta, `MANIFEST.md`

Prefixo de objetos escolhido: `pd_acv` (ProjectDome + AccountClassValidation), seguindo o mesmo
padrão de abreviação de projeto usado em `pd_t4l` (Tech4Log/GrupoFF) e `pd_pi` (PipefyIntegration/
LogCOMEX) — nenhum script ID real foi confirmado ainda no ambiente, então os dois Script IDs
cadastrados (`customscript_pd_acv_validate_class_cs` e `_ue`) estão marcados com `*` como inferidos.

**Estado atual (criado em 2026-08-10):**
- Dois entrypoints que compartilham lógica de validação via um Model de suporte
  (`AccountClassValidation.model.js`) — Client Script (`saveRecord`) e User Event (`beforeSubmit`),
  ambos deployados em `journalentry` e `vendorbill`. O Model não é um objeto de script no NetSuite
  (sem Script ID) — citado no manifest apenas pela relação estrutural, nunca como linha própria na
  tabela de Scripts.
- Campo `custcol1` (sublist `item` de `vendorbill`) é **pré-existente no ambiente do cliente**, não
  criado por este projeto — apenas referenciado. Catalogado na seção "Campos Customizados em
  Records Nativos" com nota explícita de que não foi criado por este projeto.
- Sem custom records novos neste projeto — a seção "Custom Records" foi mantida (é obrigatória pela
  skill manifest-standards) com nota "Nenhum custom record novo neste projeto."

**Decisão de estrutura tomada aqui (aplicar em projetos futuros parecidos):** quando o TECH-SPEC
referencia campos **nativos puros** (não customizados) que valem a pena documentar por referência
cruzada (ex.: `account`/`acctnumber`, `class` nativo em várias sublists), criei uma subseção extra
dentro de "Campos Customizados em Records Nativos" chamada "Campos nativos referenciados
(pré-existentes, não customizados)" com tabela Record | Sublist | Campo | Internal ID | Descrição.
Isso não está no template da skill ao pé da letra, mas foi a forma escolhida de atender ao pedido do
solution-architect sem inventar seções fora da estrutura obrigatória nem descrever comportamento —
manter esse padrão para consistência caso o manifest seja atualizado.

**Por quê:** projeto pequeno e focado (uma única regra de validação), TECH-SPEC já linka explicitamente
os campos nativos ao MANIFEST via `[MANIFEST.md](./MANIFEST.md)`, então o manifest precisa ter uma
âncora para esses campos mesmo não sendo customizações.
