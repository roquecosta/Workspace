---
name: "deploy"
description: |
  Use esta skill quando o usuário pedir para fazer deploy / subir / publicar / "mandar pro NetSuite"
  arquivos ou objetos de um projeto SuiteCloud (SDF) via SuiteCloud CLI. Cobre o procedimento
  mecânico: identificação e confirmação da conta-alvo (authid), validação prévia, deploy de arquivos
  de código (file:upload), deploy de objetos XML (project:deploy), deploy parcial só do que mudou,
  e mapeamento dos erros mais comuns. NÃO decide O QUE nem QUANDO deployar — isso é do ator
  (suitescript-dev). Esta skill é o runbook que o ator carrega na hora de executar.
---

# deploy — Runbook de deploy via SuiteCloud CLI (SDF)

Você está executando um deploy de um projeto **SuiteCloud Development Framework (SDF)** para uma conta
NetSuite usando o **SuiteCloud CLI** (`suitecloud`). Sempre responda em **português brasileiro**.

Esta skill é o **procedimento mecânico**. A decisão de *o que* subir (ler o diff/changelog) e *quando*
subir (sob demanda, com confirmação) é do **`suitescript-dev`** — o ator que carrega esta skill. A skill
não inventa o que deployar; recebe o conjunto de arquivos/objetos e executa o procedimento com segurança.

---

## ⚠️ Segurança de conta — leia antes de qualquer comando

Deploy é **ação com efeito colateral em ambiente real e possivelmente irreversível**. O workspace
ProjectDome tem contas de **produção e de sandbox** configuradas (ex.: STOCCHE production / sandbox).
Cada conta-role é um **`authid`** (alias) no SuiteCloud CLI.

Regras invioláveis deste runbook:

1. **Sempre confirme a conta-alvo antes de deployar.** Liste e mostre ao usuário qual `authid` será
   usado e a que conta ele corresponde.
2. **Default é sandbox.** Na ausência de instrução explícita, assuma o ambiente de sandbox.
3. **Nunca deploye em produção sem confirmação explícita do usuário**, nesta mesma sessão, para aquele
   deploy específico. "Pode subir" sem dizer o ambiente **não** autoriza produção.
4. **Valide antes de deployar** (`project:validate`), sempre que houver objetos envolvidos.
5. Fluxo saudável é **sandbox → produção**: suba e teste no sandbox antes de promover para produção.

Para ver os authids configurados:

```bash
suitecloud account:manageauth --list
```

Os comandos rodam contra a conta configurada no projeto; use **`--authid <id>`** para mirar
explicitamente uma conta e não depender do default implícito.

---

## Disambiguação importante: `manifest.xml` ≠ `MANIFEST.md`

- **`MANIFEST.md`** — artefato do ProjectDome: catálogo dos objetos NetSuite (registros, campos, scripts).
  Fonte canônica do projeto. **Esta skill nunca o edita.**
- **`manifest.xml`** — arquivo de configuração do **projeto SDF** (metadados e dependências), na raiz de
  `src/`. É insumo técnico do deploy, gerado/mantido pelo fluxo SDF.

Não confunda os dois. Quando o runbook fala em "manifest", refere-se ao `manifest.xml` do SDF, salvo
menção explícita ao `MANIFEST.md`.

---

## Pré-requisitos

- **SuiteCloud CLI instalado** (`@oracle/suitecloud-cli`). Verifique com `suitecloud --version`.
- **Projeto SDF válido** (ACP): contém `src/manifest.xml` e `src/deploy.xml`. Só é deployado o que
  estiver referenciado no `deploy.xml`.
- **Conta autenticada** — um `authid` configurado (via `account:setup` interativo ou `account:savetoken`
  com token/TBA para ambientes não-interativos).

---

## Os dois caminhos de deploy

O que muda é **o tipo de artefato**:

### Caminho A — arquivos de código (File Cabinet)

Arquivos `.js`, `.html` etc. que vivem no **File Cabinet** (`src/FileCabinet/SuiteScripts/...`). É o caso
das mudanças do `suitescript-dev` no domínio SuiteScript e Tela. Sobem direto, sem precisar de
`deploy.xml`/validação de objeto:

```bash
suitecloud file:upload --paths "/SuiteScripts/Cliente/Arquivo.js" --authid <id>
```

O `--paths` recebe o **caminho NetSuite** (a partir de `/SuiteScripts/...`), não o caminho local. Para
derivar o caminho NetSuite a partir do caminho local do arquivo:

1. Normalize as barras (`\` → `/`).
2. Corte tudo até (e incluindo) `FileCabinet`. O que sobra é o caminho NetSuite.

Exemplo: `...\src\FileCabinet\SuiteScripts\Gafisa\foo.js` → `/SuiteScripts/Gafisa/foo.js`.

Para subir vários de uma vez, passe múltiplos `--paths` ou repita a flag.

### Caminho B — objetos XML (Objects)

Objetos SDF gerados pelo **`sdf-generator`** (custom records, script deployment records, campos como XML)
vivem em `src/Objects/*.xml`. Objetos **não** sobem por `file:upload`; vão pelo pipeline de deploy, que
respeita o `deploy.xml`:

```bash
# 1) validação prévia (recomendado: server-side)
suitecloud project:validate --server --authid <id>

# 2) deploy
suitecloud project:deploy --authid <id>
```

O `project:deploy` zipa e envia **tudo que está referenciado no `deploy.xml`**. Para subir só um
subconjunto de objetos, ajuste o `deploy.xml` para referenciar apenas o que deve ir — é assim que se faz
deploy parcial de objetos (não há upload granular de um objeto isolado equivalente ao `file:upload`).

> Se `project:validate` acusar dependência faltando no manifesto, rode `suitecloud project:adddependencies`
> e valide de novo antes de deployar.

---

## Procedimento padrão

1. **Receba do ator** o conjunto a deployar (lista de arquivos de código e/ou objetos). Não infira; se
   vier vago, pergunte.
2. **Confirme a conta-alvo.** Mostre o `authid`/ambiente. Se for produção, **exija confirmação explícita**.
3. **Classifique** cada item: código (Caminho A) ou objeto (Caminho B).
4. **Se houver objetos:** `project:validate --server` primeiro. Se falhar, pare e reporte os erros — não
   deploye sobre validação que falhou.
5. **Execute** o deploy do caminho correspondente, **só do que mudou** (o ator entrega o diff; não suba o
   projeto inteiro por padrão).
6. **Reporte** o resultado por item (sucesso/erro) e, em erro, a causa e a correção sugerida.

---

## Deploy parcial (só o que mudou)

- **Código:** trivial — `file:upload --paths` apenas dos arquivos do diff.
- **Objetos:** controle pelo `deploy.xml` (referencie só os objetos do diff) e rode `project:deploy`.

Não reenvie o projeto inteiro a cada mudança. O default é incremental, espelhando o diff que o ator leu.

---

## Erros comuns → correção

| Sintoma                                                            | Causa provável                                              | Correção                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| `You have not configured ... / no account set up`                  | authid não configurado para o projeto                       | `account:setup` (interativo) ou `account:savetoken`; depois use `--authid`. |
| Validação falha em "account settings" / feature dependency         | feature exigida pelo objeto não habilitada / não declarada  | Habilitar a feature na conta ou declará-la no `manifest.xml`.               |
| `Missing dependencies` na validação                                | dependências ausentes no `manifest.xml`                     | `suitecloud project:adddependencies`, depois validar de novo.              |
| Arquivo "subiu" mas não aparece                                    | caminho NetSuite errado no `--paths`                        | Conferir derivação do caminho (cortar até `FileCabinet`, barras `/`).      |
| Objeto não foi deployado apesar de existir em `Objects/`           | objeto não referenciado no `deploy.xml`                     | Adicionar o objeto ao `deploy.xml`.                                        |
| Erro de permissão/role ao deployar                                 | role do authid sem permissão SDF na conta                   | Usar authid com role adequada (SDF/administrator) para aquele ambiente.    |

---

## Sobre automação por hook (atenção)

Existe um script de hook que sobe automaticamente, a cada `write` de arquivo sob `FileCabinet`, via
`file:upload`. Ele é cômodo, mas **conflita com a regra de deploy sob demanda** e é **perigoso** se o
authid do projeto apontar para produção: cada salvamento viraria um deploy não confirmado em ambiente real.

Recomendação deste runbook:

- **Não** acione deploy automático contra produção. Jamais.
- Se quiser conveniência por hook, **restrinja a sandbox** e deixe **explícito que é opt-in** — e ainda
  assim, deploy de objetos (Caminho B) deve passar por validação, não por hook de upload.
- O caminho seguro padrão continua sendo: deploy **sob demanda**, com confirmação da conta, conduzido pelo
  `suitescript-dev`.

---

## O que esta skill nunca faz

- Não decide o escopo do deploy (o que/quando) — isso é do `suitescript-dev`.
- Não edita `MANIFEST.md` nem `TECH-SPEC.md`.
- Não deploya em produção sem confirmação explícita.
- Não reescreve o projeto inteiro quando o pedido é incremental.