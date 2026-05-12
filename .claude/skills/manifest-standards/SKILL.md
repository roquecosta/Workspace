---
name: manifest-standards
description: >
  Define como criar e atualizar o project_manifest.md — artefato descritivo que cataloga todos
  os objetos NetSuite utilizados em um projeto: scripts, custom records, campos, parâmetros e secrets.
  Use esta skill SEMPRE que for necessário criar ou atualizar um project_manifest.md, seja a partir
  de um spec.md (fluxo spec-manager) ou a partir de código-fonte (fluxo spec-reverse-builder).
  Também deve ser acionada quando o usuário mencionar "manifest", "project_manifest", "catálogo de objetos NS",
  "listar scripts do projeto", "quais custom records existem" ou qualquer solicitação de inventário
  de objetos NetSuite de um projeto.
---

# Manifest Standard

O `project_manifest.md` é o artefato descritivo que responde à pergunta:
**"Quais objetos NetSuite existem para que este projeto funcione?"**

Ele é complementar ao `spec.md` — enquanto o spec descreve *comportamento*, o manifest cataloga *implantação*.

---

## Quando gerar vs. atualizar

| Situação | Ação |
|----------|------|
| Projeto novo, spec recém-criada | Gerar manifest do zero a partir do spec |
| Spec atualizada (nova versão) | Atualizar apenas as seções afetadas pela mudança |
| Código lido pelo reverse-builder | Gerar manifest e spec simultaneamente a partir do código |
| Manifest existe mas spec diverge | Reconciliar: o spec é a fonte de verdade |

---

## Estrutura obrigatória do manifest

Todo `project_manifest.md` deve seguir esta ordem de seções:

```
# Project Manifest: <id_projeto> — <nome_projeto>

**Cliente:** ...
**Gerado em:** <data>
**Versão do Spec:** <versão>
**Gerado por:** <agente>

---

## Scripts
## Custom Records
## Parâmetros de Script        ← incluir somente se houver custscript_
## Secrets                     ← incluir somente se houver custsecret_
```

Seções opcionais (incluir apenas se existirem no projeto):
- `## Campos Customizados em Records Nativos` — para `custbody_`, `custcol_`, `custentity_` em records padrão do NS
- `## Listas Customizadas` — para `customlist_`
- `## Workflows`

---

## Seção: Scripts

Tabela com uma linha por script. Colunas obrigatórias:

| Script ID | Arquivo | Tipo | Record Alvo | Descrição |
|-----------|---------|------|-------------|-----------|

**Regras:**
- **Script ID**: padrão `customscript_<prefixo_projeto>_<nome_descritivo>`. Se o ID real não estiver disponível no spec ou no código, inferir seguindo o padrão `customscript_` + nome do arquivo sem extensão, substituindo hífens por underscores. Marcar com `*` se inferido.
- **Arquivo**: nome exato do arquivo `.js`
- **Tipo**: `RESTlet`, `UserEvent`, `MapReduce`, `ClientScript`, `Suitelet`
- **Record Alvo**: internal ID do record monitorado (apenas para UE e CS); `—` para os demais
- **Descrição**: uma frase, no infinitivo, descrevendo a responsabilidade principal do script

**Nota sobre IDs inferidos:** Ao final da seção, incluir:
> `* Script ID inferido a partir do nome do arquivo. Confirmar o ID real no ambiente NetSuite.`

---

## Seção: Custom Records

Uma subseção por record, no formato:

```markdown
### `<internal_id>` — <Nome Legível>

<Descrição de uma linha do record e seus valores de status/lista, se aplicável.>

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
```

**Tipos de campo aceitos:** `Text`, `Long Text`, `Integer`, `Decimal`, `Currency`, `Date`, `Datetime`, `Checkbox`, `List/Record`, `Multi-Select`

**Regras:**
- Incluir apenas campos que aparecem explicitamente no spec ou no código
- Campos cujo internal ID não está disponível: usar nome descritivo e marcar com `*`
- Não inventar campos — se não há evidência, não listar
- Documentar valores de listas inline na descrição quando o spec os menciona (ex: `Status: Em Aberto(1), Pago(2)`)

---

## Seção: Campos Customizados em Records Nativos

Usar quando o projeto adiciona campos em records padrão do NetSuite (`invoice`, `vendorbill`, `customerpayment`, `customer`, `vendor`, etc.).

```markdown
### `<record_nativo>` — <Nome Legível>

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
```

---

## Seção: Parâmetros de Script

Tabela com todos os `custscript_` usados como parâmetros (não IDs de script, mas parâmetros de configuração):

| Internal ID | Usado em | Descrição |
|-------------|----------|-----------|

---

## Seção: Secrets

Tabela com todos os `custsecret_`:

| Internal ID | Usado em | Descrição |
|-------------|----------|-----------|

---

## Processo de geração a partir do spec.md

Leia o spec completo antes de começar. Percorra nesta ordem:

1. **Seção de Scripts do spec** → popular tabela de Scripts
2. **Seção de Registros Customizados do spec** → popular subseções de Custom Records
3. **Corpo de cada script** (operações sobre dados, regras de negócio) → extrair campos não listados explicitamente
4. **Seção de integração / parâmetros** → popular Parâmetros e Secrets
5. **Records nativos referenciados** → criar seção de Campos Customizados em Records Nativos se houver `custbody_`, `custcol_`, `custentity_`

---

## Processo de geração a partir de código (reverse-builder)

Ao ler o código-fonte, extrair na seguinte ordem:

1. **`define([...])`** de cada arquivo → identificar tipo do script e dependências
2. **`record.create / record.load`** → identificar record types utilizados
3. **`getValue / setValue / getSublistValue`** com field IDs → mapear campos
4. **`search.create`** com filters/columns → confirmar campos e record types
5. **`script.getParameter`** → mapear parâmetros (`custscript_`)
6. **`crypto.createSecretKey`** ou referências a `custsecret_`** → mapear secrets

---

## Processo de atualização

Quando o spec muda de versão:

1. Identificar o changelog da nova versão
2. Para cada item do changelog, verificar se afeta: scripts existentes, novos scripts, campos de records, parâmetros
3. Atualizar apenas as linhas/subseções afetadas
4. Atualizar o cabeçalho: `Gerado em` e `Versão do Spec`
5. **Não remover** entradas existentes sem evidência explícita de remoção no spec

---

## Regras gerais

- **Não inventar**: se o spec não menciona um campo ou script, não incluir
- **Não omitir**: se o spec menciona um objeto, ele deve aparecer no manifest
- **IDs reais têm prioridade**: se o código ou spec fornecer o ID real, usá-lo; nunca sobrescrever um ID real com um inferido
- **Uma linha por objeto**: sem agrupamentos implícitos ou subentradas aninhadas nas tabelas
- **Descrições no infinitivo**: "Armazena o payload JSON" ✓ — "Armazena payloads JSON" ✓ — "Este campo armazena..." ✗
- **Manter ordenação consistente**: scripts na ordem em que aparecem no spec; campos na ordem de relevância (chaves primeiro, depois vínculos, depois flags)

---

## Exemplo de saída

Ver `references/example_manifest.md` para um manifest completo gerado a partir de um spec real.