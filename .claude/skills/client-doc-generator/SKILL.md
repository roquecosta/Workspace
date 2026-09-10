---
name: client-doc-generator
description: >
  Gera documentação de regras de negócio voltada ao CLIENTE, em .docx no papel
  timbrado da Dome (assets/DomeTimbrado.docx), projetando o TECH-SPEC (ou
  requisitos coletados) em linguagem de negócio legível por quem não é técnico.
  Use SEMPRE que o usuário pedir para "gerar o documento do cliente",
  "documentação de regras de negócio", "documento timbrado", "doc pro cliente",
  "materializar o tech-spec pro cliente", "gerar o entregável do cliente" ou
  similar — mesmo que não diga "docx" nem "Word" explicitamente. Projeção
  READ-ONLY: nunca edita o TECH-SPEC nem o MANIFEST. NÃO use para gerar objetos
  SDF/XML (isso é o sdf-generator) nem para escrever/editar o próprio TECH-SPEC
  (isso é o solution-architect).
---

# Gerador de documentação de regras de negócio (cliente)

Projeta um artefato canônico (o **TECH-SPEC**) num **entregável para o cliente**:
um `.docx` no papel timbrado da Dome, escrito em linguagem de negócio. O cliente
lê este documento para entender **o que** o projeto faz e **quais regras** o
governam — nunca **como** foi implementado.

## Posicionamento no pipeline

Esta é uma **rota sob demanda**, irmã do `sdf-generator`: só dispara por pedido
explícito, fica fora do menu inicial e é **read-only** sobre os artefatos
canônicos.

A diferença crucial em relação ao `sdf-generator`: aquele é uma projeção
**mecânica** (não interpreta comportamento). Este é uma projeção
**interpretativa** — o trabalho inteiro é *reescrever* regra técnica em linguagem
de negócio, traduzir jargão e dar tom de cliente. A única propriedade que os dois
compartilham é: **nunca editam TECH-SPEC nem MANIFEST**.

Direção da dependência: `client-doc-generator → TECH-SPEC`.

## Fontes de entrada

### Modo A — a partir do TECH-SPEC (preferido)

Fonte canônica existe. Leia o `TECH-SPEC.md`, entenda os fluxos (organizados por
entrypoint) e as regras, e projete tudo em linguagem de negócio. **Não** leia o
MANIFEST: ele cataloga objetos de implantação (internal IDs, script IDs, campos),
e nada disso entra num documento de cliente.

### Modo B — a partir de requisitos crus (fallback)

O usuário traz requisitos ainda sem TECH-SPEC e quer o documento direto. É
possível gerar, mas avise, uma vez e sem bloquear:

> "Este documento não tem TECH-SPEC como fonte canônica por trás. Se o projeto
> evoluir, ele pode divergir. Recomendo capturar estes requisitos num TECH-SPEC
> (via `solution-architect`) para que futuras regenerações permaneçam
> consistentes."

Depois gere normalmente. Não force o desvio — o usuário decide.

## Pré-condição

No Modo A, a mesma trava da implementação: o **TECH-SPEC precisa estar
atualizado**. Se houver mudanças de comportamento ainda não refletidas no
TECH-SPEC, sinalize antes de projetar um entregável que sairá defasado.

## O filtro cliente: o que traduzir, o que OMITIR

O leitor é o cliente, não um desenvolvedor. O documento descreve **comportamento
de negócio**, não implementação.

**Traduza para linguagem funcional:**
- Fluxos → jornadas de negócio. Em vez de "no `afterSubmit` do Sales Order",
  escreva "Quando um pedido de venda é salvo, o sistema...".
- Regras de negócio → frases claras e numeradas, sem pressupor conhecimento
  técnico.
- Cálculos → descritos em palavras e, quando ajudar, com um exemplo numérico
  concreto.

**OMITA sempre (não pertencem ao documento do cliente):**
- Internal IDs, script IDs, IDs de campo, nomes de registro internos.
- Tipos de entrypoint (`beforeLoad`, `afterSubmit`, `scheduled`, etc.) e nomes de
  arquivo/script.
- Referências ao MANIFEST, caminhos de arquivo, detalhes de deploy/SDF.
- Arquitetura interna (EntryPoint/UseCase/Model, Suitelets como artefato técnico).

Regra prática: se o dado só faz sentido para quem vai *implantar* ou *manter* o
código, ele fica fora. Se descreve *o que o negócio observa*, ele entra.

## Estrutura recomendada do documento

Use esta estrutura como base e adapte ao projeto. Escreva em **português
brasileiro**, tom profissional e claro.

```
# [Nome do projeto] — Documento de Regras de Negócio

## Controle de versão
(versão, data, autor — uma linha por revisão)

## 1. Contexto e objetivo
Por que o projeto existe e qual problema de negócio resolve.

## 2. Visão geral da solução
O que foi construído, em linguagem funcional. Panorama antes do detalhe.

## 3. Fluxos
Cada fluxo como uma jornada de negócio ("Quando X acontece, o sistema...").
Derive-os dos entrypoints do TECH-SPEC, mas descreva o gatilho em termos de
negócio — nunca nomeie o entrypoint.

## 4. Regras de negócio
Lista numerada, cada regra em uma frase clara.

## 5. Cálculos
Descrição funcional de cada cálculo, com exemplo numérico quando ajudar.

## 6. Premissas e limitações
O que o projeto assume como verdadeiro e o que está fora de escopo.

## 7. Glossário (opcional)
Termos do domínio que o cliente possa não conhecer.
```

## Renderização — preservando o timbrado

O papel timbrado (`assets/DomeTimbrado.docx`) traz o cabeçalho e o rodapé da Dome
nos headers/footers do arquivo Word, com imagens e relacionamentos próprios.

**Não gere um `.docx` do zero.** A skill `docx` avisa que docx-js **não abre
arquivos existentes**; criar um documento novo perderia o timbrado. Em vez disso,
**edite o `DomeTimbrado.docx`**, injetando apenas o corpo e mantendo
header/footer/mídia intactos.

Carregue a skill **`docx`** e siga o caminho de **edição de documento existente**:

1. Copie o timbrado para a área de trabalho (o diretório da skill é read-only):
   `cp assets/DomeTimbrado.docx /home/claude/doc-cliente.docx`
2. `unzip` do `.docx`; remova entradas de symlink por segurança.
3. Edite **apenas o corpo** de `word/document.xml`: substitua os parágrafos do
   corpo, mas **preserve o `<w:sectPr>` final** — é ele que vincula o documento
   aos headers/footers do timbrado. Nunca remova o `sectPr`, nem os
   `word/header*.xml`, `word/footer*.xml`, seus rels e a mídia associada.
4. Rezip e valide (`scripts/office/validate.py`).

Consulte o `SKILL.md` da skill `docx` para os comandos exatos, os footguns de
tabela/lista e o `merge_runs.py`.

## Verifique a saída

Antes de entregar, **renderize e olhe** — confirme que o timbrado apareceu em
todas as páginas e que nenhum conteúdo interno vazou:

```bash
python scripts/office/soffice.py --headless --convert-to pdf doc-cliente.docx
pdftoppm -jpeg -r 100 doc-cliente.pdf page
ls page-*.jpg   # então leia as imagens
```

Checklist de leitura: (a) cabeçalho/rodapé Dome presentes; (b) nenhum internal
ID, nome de script ou tipo de entrypoint no texto; (c) fluxos legíveis por quem
não é técnico.

## Regeneração no fluxo de atualização

Quando o TECH-SPEC for atualizado, o documento do cliente pode ser regenerado sob
demanda. Espelhe o comportamento do `sdf-generator`: leia **o que mudou**
(changelog do TECH-SPEC) e regenere **apenas as seções afetadas**, sem reescrever
o que não mudou. Atualize a linha de versão no "Controle de versão".