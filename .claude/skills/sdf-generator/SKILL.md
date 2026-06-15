---
name: sdf-generator
description: Gera arquivos XML de customrecordtype (SuiteCloud/SDF) a partir de um manifest em Markdown, prontos para a primeira subida ao NetSuite via SuiteCloud CLI. Use quando o usuário pedir para gerar os objetos SDF / o XML de um registro a partir de um manifest, mencionar "manifest", "gerar objetos", "subir registro para o NetSuite", "customrecordtype", ".xml para o SDF", ou apontar para um arquivo manifest de um projeto NetSuite e pedir os XMLs correspondentes.
---

# SDF Generator

Converte um **manifest em Markdown** (que descreve custom records e seus campos) em arquivos `<scriptid>.xml` de `customrecordtype` compatíveis com o SuiteCloud SDF, prontos para `suitecloud project:deploy`. Serve para a **primeira subida** dos registros; ajustes finos de configuração são feitos depois no próprio NetSuite.

## Quando usar

O usuário aponta para um manifest de algum projeto (arquivo local) e pede os XMLs. Exemplos de gatilho:
- "gera os objetos SDF do manifest do projeto X"
- "converte esse manifest em XML pro NetSuite"
- "preciso subir esses custom records, me dá os .xml"

## O que o usuário precisa informar

**O caminho do manifest.** Pergunte qual projeto/manifest se não foi dito. O resto é automático.

## Como executar

1. Confirme o caminho do manifest com o usuário.
2. Rode o gerador:

   ```bash
   python3 scripts/gen_objects.py <caminho/do/manifest.md>
   ```

   Por padrão a saída vai para uma pasta `Objects/` ao lado do manifest. Use `--out <dir>` para mudar (ex.: a pasta `Objects/` do projeto SuiteCloud).

3. Se existir um `sdf-gen.config.json` na mesma pasta do manifest, ele é carregado **automaticamente** (resolve os `selectrecordtype`, define tags não suportadas, skip/only). Veja `examples/sdf-gen.config.json` para o formato.

4. **Leia o relatório impresso.** Ele lista os registros gerados, os pulados (e por quê) e os **avisos**. Reporte os avisos ao usuário antes de qualquer deploy.

## Convenções do manifest reconhecidas

- Cada registro é uma seção `### \`scriptid\` — Nome` seguida de uma tabela `| Campo | Internal ID | Tipo | Descrição |`.
- Tipos mapeados: `List/Record` e `List` → `SELECT`; `Currency` → `CURRENCY`; `Percent` → `PERCENT`; `Long Text` → `CLOBTEXT`; e outros (`Free-Form Text`, `Text Area`, `Checkbox`, `Date`, `Integer`).
- Registros cuja descrição contém "existente no NetSuite" / "registro existente" são **pulados** por padrão (já existem no ambiente). Use `--include-existing` para forçar.
- Registros de segmento (`customrecord_cseg_*`) também são pulados por padrão.

## Pontos de atenção (sempre comunicar ao usuário)

- **`selectrecordtype` não resolvido:** se um campo `SELECT` não tem alvo no config nem casa por label, o XML sai com a tag vazia e um aviso. O usuário define depois no NetSuite ou adiciona o alvo no `sdf-gen.config.json`.
- **Período contábil nativo:** quando referenciado, costuma ser o código nativo `-105` (Accounting Period). Confirme contra um export real do account.
- **Tags não suportadas:** o account/versão do SDF pode rejeitar tags recentes (ex.: `aidescription`, `enabletextenhance`). Elas já são removidas por padrão; se o deploy reclamar de outra, adicione em `unsupportedTags` no config e rode de novo.
- **Ordem de dependência no deploy:** custom lists e o registro pai precisam existir antes dos filhos que os referenciam; o `cseg` referenciado também.

## O que esta skill NÃO gera

Apenas `customrecordtype`. Não gera `customlist`, body fields de transação (`customtransactionbodyfield`), nem campos adicionados a records existentes — são tipos de objeto com schema próprio. Avise o usuário se o manifest contiver esses itens.

## Arquivos

- `scripts/gen_objects.py` — o gerador (project-agnostic).
- `examples/sdf-gen.config.json` — exemplo de config por projeto (copiar para a pasta do manifest e ajustar).
