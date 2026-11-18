---
name: sdf-generator
description: Gera objetos XML do SuiteCloud/SDF a partir do MANIFEST em Markdown — custom records (customrecordtype) e scripts com seus deployments e parâmetros (usereventscript, mapreducescript, clientscript, scheduledscript, restlet, suitelet) — prontos para a primeira subida ao NetSuite via SuiteCloud CLI. Use quando o usuário pedir para gerar os objetos SDF / o XML de um registro ou de um script a partir do manifest, mencionar "gerar objetos", "materializar os objetos", "subir registro/script para o NetSuite", "customrecordtype", "script deployment", ".xml para o SDF", ou apontar para um manifest de um projeto NetSuite e pedir os XMLs correspondentes.
---

# SDF Generator

Converte o **MANIFEST** (Markdown) em arquivos `<scriptid>.xml` compatíveis com o SuiteCloud SDF,
prontos para `suitecloud project:deploy`:

- **Custom records** (`customrecordtype`), a partir das subseções `### \`customrecord_...\``.
- **Scripts** com deployments e parâmetros, a partir das seções `## Scripts` e `## Parâmetros de Script`.

Serve para a **primeira subida**. Ajustes finos (status `RELEASED`, agendamento, audiência, log level)
são feitos depois no próprio NetSuite ou no XML.

**Projeção determinística e read-only:** o XML sai do gerador (Python) e dos templates. Nunca é
escrito à mão pelo modelo. A skill nunca edita o MANIFEST nem o TECH-SPEC. Se faltar informação no
manifest, o gerador **avisa** e o usuário corrige o manifest ou o config.

## Quando usar

O usuário aponta para um manifest e pede os XMLs. Exemplos de gatilho:
- "gera os objetos SDF do manifest do projeto X"
- "materializa os scripts novos do manifest"
- "preciso subir esses custom records / esse Map/Reduce, me dá os .xml"

## O que o usuário precisa informar

**O caminho do manifest.** Pergunte qual projeto/manifest se não foi dito. Pergunte também se quer
tudo ou só um tipo/objeto (`--kind`, `--only`). O resto é automático.

## Como executar

1. Confirme o caminho do manifest com o usuário.
2. Rode o gerador:

   ```bash
   python3 scripts/gen_objects.py <caminho/do/MANIFEST.md> [--kind records|scripts|all] [--only ids] [--out dir]
   ```

   - Saída padrão: pasta `Objects/` ao lado do manifest. Use `--out` para apontar para a pasta
     `src/Objects/...` do projeto SuiteCloud.
   - `--kind` padrão `all` (records + scripts).
   - `--overwrite` só se o usuário pedir explicitamente (ver "Scripts já existentes").

3. Se existir um `sdf-gen.config.json` na mesma pasta do manifest, ele é carregado
   **automaticamente**. Veja `examples/sdf-gen.config.json`. Para scripts, o mínimo recomendado é
   `scripts.namePrefix` (ex.: `"PD | T4L"`) e `scripts.idPrefix` (ex.: `"pd_t4l_"`).

4. **Leia o relatório impresso.** Ele lista o que foi gerado, o que foi pulado (e por quê) e os
   **avisos**. Reporte os avisos ao usuário antes de qualquer deploy.

## Convenções do manifest reconhecidas

### Custom records
- Cada registro é uma seção `### \`scriptid\` — Nome` seguida de `| Campo | Internal ID | Tipo | Descrição |`.
- Tipos mapeados: `List/Record` e `List` → `SELECT`; `Multi-Select` → `MULTISELECT`; `Currency`;
  `Percent`; `Decimal` → `FLOAT`; `Long Text` → `CLOBTEXT`; `Text`/`Free-Form Text`; `Text Area`;
  `Checkbox`; `Date`; `Datetime`; `Integer`.
- Registros com "existente no NetSuite" / "registro existente" na descrição são **pulados** (use
  `--include-existing` para forçar). Segmentos (`customrecord_cseg_*`) também.

### Scripts (`## Scripts`)
Tabela `| Script ID | Arquivo | Tipo | Record Alvo | Descrição |` (colunas lidas pelo nome do cabeçalho).

| Coluna | Uso no XML |
|---|---|
| Script ID | `scriptid`. O deployment é `customdeploy_` + o resto do ID (`_2`, `_3`… se houver mais de um). Marcadores após o ID (`*`, `‡`) são ignorados. |
| Arquivo | `scriptfile`. O gerador procura o `.js` no `src/FileCabinet` do projeto, primeiro na pasta do projeto e depois no File Cabinet todo. Se a coluna trouxer caminho (`/SuiteScripts/...`), usa direto. |
| Tipo | Escolhe o template: `UserEvent`, `MapReduce`, `ClientScript`, `Scheduled`, `RESTlet`, `Suitelet`. |
| Record Alvo | Só para UE/CS: um deployment por record (separados por vírgula). `customrecord_x` → `[scriptid=customrecord_x]`; nativo → maiúsculo (`salesorder` → `SALESORDER`). Nos demais tipos é ignorado. |
| Descrição | `<description>` (ou vazio com `--no-description`). |

- **Client script sem Record Alvo** (`—`) é **pulado**: é carregado por `clientScriptModulePath`
  (Suitelet/UE) e não tem objeto de script.
- **UserEvent sem Record Alvo** é pulado com aviso.
- **Nome** do script: `<scripts.namePrefix> | <scriptid humanizado>`, com o sufixo de tipo em
  maiúsculas (`..._manage_inst_ue` → `PD | T4L | Manage Inst UE`). Override por script em `scripts.names`.

### Parâmetros (`## Parâmetros de Script`)
Tabela `| Internal ID | Tipo | Usado em | Descrição |`.
- **Tipo** usa os mesmos tipos dos campos de record. Manifest antigo sem a coluna gera `TEXT` com aviso.
- **Usado em** define o **script dono**: o primeiro item que casa com um Script ID ou nome de arquivo
  da seção Scripts. O ID de parâmetro é único na conta, então ele é criado em **um único** script.
  Se for usado por vários, o gerador avisa. Override em `scripts.paramOwners`.
- Parâmetro `SELECT` usa `selectTargetById` do config para o `<selectrecordtype>`. Sem alvo, sai vazio
  com aviso.
- Cada deployment do script dono recebe a tag `<custscript_x></custscript_x>` (valor vazio, igual ao export).

## Padrões de deployment (primeira subida)

| Tipo | Status padrão | Observação |
|---|---|---|
| UE, CS, RESTlet, Suitelet | `TESTING` (`scripts.deployStatus`) | roda só para o dono do script até virar `RELEASED` |
| Map/Reduce, Scheduled | `NOTSCHEDULED` (`scripts.scheduledDeployStatus`) | recorrência `single` com a data de hoje; agendar depois |

Log level padrão `DEBUG` (`scripts.logLevel`). Audiência: todos os papéis/funcionários. Map/Reduce
roda como `ADMINISTRATOR`. Esses valores fixos vivem nos **templates**, não no código.

## Templates (`assets/script-templates/`)

Um XML whitelabel por tipo de script, derivado de exports reais (`object:import`), mais o
`scriptcustomfield.xml` (parâmetro). Para mudar a estrutura de um tipo (tag nova exigida pelo SDF,
valor padrão diferente), **edite o template**, não o código. Placeholders e regras em
`assets/script-templates/README.md`.

## Pontos de atenção (sempre comunicar ao usuário)

- **Scripts já existentes:** se já existe `<scriptid>.xml` em `--out` ou no `src/Objects` do projeto,
  o script é **pulado**. O XML real tem a configuração de produção (status, agendamento, valores de
  parâmetro). Só use `--overwrite` com pedido explícito, sabendo que essa configuração será perdida.
- **`.js` inexistente:** o objeto aponta para um arquivo que precisa existir no File Cabinet do
  projeto, senão o `project:validate` falha. O gerador avisa e assume um caminho. Gere o objeto
  depois que o arquivo existir, ou corrija o caminho.
- **`selectrecordtype` não resolvido** (campos e parâmetros SELECT): define no config e roda de novo.
- **Período contábil nativo:** quando referenciado, costuma ser `-105`. Confirme contra um export real.
- **Tags não suportadas:** o account/versão do SDF pode rejeitar tags recentes. Para records, use
  `unsupportedTags`. Para scripts, edite o template.
- **`executioncontext`** (UE/CS) usa um conjunto conservador comum às versões vistas nos clientes.
  Se a conta rejeitar ou exigir outro, use `scripts.executionContexts`.
- **Template de Scheduled** foi montado à mão (nenhum cliente tinha export). Na primeira vez que for
  usado, rode `project:validate` e, se precisar, corrija o template a partir de um export real.
- **Limite de 40 caracteres** em `customscript_`, `customdeploy_` e `custscript_`: o gerador avisa.
- **Ordem de dependência no deploy:** custom lists, registro pai e `cseg` antes dos filhos. Custom
  records antes dos scripts cujo deployment aponta para eles (`[scriptid=customrecord_x]`).

## O que esta skill NÃO gera

`customlist`, campos em records nativos (`custbody_`, `custcol_`, `custentity_`…), workflows, e tipos
de script sem template (Portlet, Mass Update, Workflow Action, Bundle Installation). Esses aparecem
como pulados. Avise o usuário se o manifest contiver esses itens.

## Arquivos

- `scripts/gen_objects.py` — entrypoint e gerador de custom records.
- `scripts/script_objects.py` — gerador de scripts (preenche os templates).
- `assets/script-templates/` — templates whitelabel por tipo de script + `README.md`.
- `examples/sdf-gen.config.json` — exemplo de config por projeto (copiar para a pasta do manifest e ajustar).
