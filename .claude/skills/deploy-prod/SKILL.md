---
name: "deploy-prod"
description: |
  Use esta skill quando o usuário pedir para fazer deploy / subir / publicar / "mandar pra produção"
  o trabalho de uma branch em um cliente que já está no CI/CD GitHub → NetSuite (a main é a produção).
  O deploy de produção NÃO é feito pela máquina do dev: a skill valida a branch informada, analisa o
  diff contra a main (o que o pipeline vai publicar, o que fica de fora, objetos que precisam de deploy
  manual, arquivos removidos), faz o push, abre o PR para a main e devolve o link. O merge do PR é que
  dispara o deploy automático. NÃO mergeia, NÃO aprova e NÃO roda file:upload/project:deploy contra
  produção. Para sandbox ou deploy manual de objetos, use a skill `deploy-manual`.
---

# deploy-prod — Deploy de produção via PR (CI/CD GitHub → NetSuite)

Você está levando o trabalho de uma branch para a **produção** de um cliente da **Dome** que já passou
pelo onboarding do CI/CD (skill `cicd-onboarding`). Sempre responda em **português brasileiro**.

Nesse modelo, **a `main` é a produção**: todo merge na `main` dispara o workflow
`.github/workflows/deploy-prod.yml`, que roda `project:validate --server` e `project:deploy` na conta de
produção. Por isso, **fazer deploy em produção = abrir o PR da branch para a `main`**. Esta skill
prepara e abre esse PR e devolve o link. Revisão, aprovação e merge são feitos por pessoas no GitHub.

---

## Regras invioláveis

1. **Nunca deploye em produção pela máquina local.** Nada de `file:upload` ou `project:deploy` contra a
   conta de produção. O único caminho é o PR.
2. **Nunca mergeie, aprove ou feche o PR**, nem faça push direto na `main`. O merge é o deploy e é decisão
   humana.
3. **Sem reescrita de histórico.** Nada de `push --force`, `rebase` de branch publicada ou `reset`.
4. **Uma branch por PR, sempre contra a `main`.** Base diferente de `main` não é deploy de produção.
5. **Nada de objetos no pipeline.** Não altere o `deploy.xml` nem o workflow para incluir objetos (ver
   "O que o pipeline publica").
6. Não edita `TECH-SPEC.md` nem `MANIFEST.md`.

---

## O que o pipeline publica

Definido no onboarding e fixo para todo cliente no fluxo:

- **Só arquivos de `src/FileCabinet/`.** O `deploy.xml` tem apenas `<path>~/FileCabinet/*</path>`.
  Tudo o que está em `src/FileCabinet/` na `main` vai para o File Cabinet de produção.
- **Objetos ficam fora** (`src/Objects/`: scripts, deployments, custom records, campos, listas). Objeto
  novo ou alterado vai para produção **manualmente** (skill `deploy-manual` ou UI), **antes** do merge do código
  que depende dele, e o PR registra o que foi feito.
- **O SDF não apaga nada.** Arquivo removido no repo continua em produção até ser excluído à mão.
- **Submódulos não sobem** (o checkout do workflow é feito sem submódulos).

Em resumo, o efeito do merge em produção é o **diff do PR dentro de `src/FileCabinet/`**. A análise da
Etapa 3 existe para mostrar isso antes do merge.

---

## Procedimento

Rode os comandos na raiz do repositório do cliente (Git Bash / bash). Ao final de cada verificação com
problema, **pare e reporte**; só siga quando estiver resolvido ou o usuário decidir seguir.

### Etapa 1 — Confirmar que o cliente está no CI/CD

```bash
git remote get-url origin
git fetch origin --prune
git ls-tree --name-only origin/main .github/workflows/deploy-prod.yml
```

- Sem `origin` no GitHub ou sem `deploy-prod.yml` na `origin/main`: o cliente **não** está no fluxo.
  Pare. Produção ainda é pela skill `deploy-manual` (manual, com confirmação de conta), ou o cliente precisa
  passar pela skill `cicd-onboarding` primeiro.
- Confirme que o `gh` está autenticado: `gh auth status`.

### Etapa 2 — Validar a branch

O usuário **especifica a branch**. Se não especificar, pergunte. Nunca assuma a branch atual sem
confirmar.

1. **Nome.** Confira contra a regex da skill `git-branching`:
   `^(feat|fix|docs|refactor|chore)/[a-z0-9]+$`. Fora do padrão: avise e pergunte se segue mesmo assim
   (renomear branch já publicada é decisão do usuário).
2. **Não é a `main`.** Deploy da própria `main` não faz sentido nesse fluxo: ela já está em produção.
3. **Existe.** Local (`git rev-parse --verify <branch>`) e/ou remota (`origin/<branch>`).
4. **Working tree limpo**, se a branch for a atual: `git status --porcelain`. Alterações não commitadas
   **não** entram no PR. Avise e pergunte se o usuário quer commitar antes; não commite por conta própria.
5. **Sincronia local × remoto.** Se a branch local tiver commits que não estão no remoto, eles serão
   enviados no push da Etapa 5. Se o remoto tiver commits que o local não tem, use a versão remota e avise.
6. **Tem o que deployar:** `git rev-list --count origin/main..<branch>` maior que zero. Se for zero, a
   branch não tem nada além da `main`. Pare.
7. **PR já existe?**

   ```bash
   gh pr list --head <branch> --base main --state open --json number,url,title
   ```

   Se já existe, **não abra outro**. Faça o push dos commits novos (se houver) e devolva o link existente.

### Etapa 3 — Analisar o diff (o que vai para produção)

```bash
git diff --name-status origin/main...<branch>
git log --oneline origin/main..<branch>
```

Classifique cada arquivo:

| Categoria | Critério | Tratamento |
| --- | --- | --- |
| **Vai para produção** | Adicionado/modificado em `src/FileCabinet/` | Listar no PR |
| **Objeto (deploy manual)** | Qualquer mudança em `src/Objects/` | Listar no PR com checklist "deployado manualmente em AAAA-MM-DD". **Avisar o usuário**: tem que ir para produção antes do merge (skill `deploy-manual` ou UI) |
| **Removido** | `D` (ou origem de `R`) em `src/FileCabinet/` | Listar no PR como "excluir manualmente em produção após o merge" (o SDF não apaga) |
| **Lixo no File Cabinet** | `src/FileCabinet/` com `.claude/`, `agent-memory`, `_old`, cópias, backups, rascunhos | **Pare e avise**: subiria para produção. Remover da branch antes do PR |
| **Pipeline** | `src/deploy.xml`, `src/manifest.xml`, `.github/workflows/*`, `.gitignore` | Destacar no PR e avisar. Mudança no `deploy.xml` que inclua objetos ou liste pastas **viola o modelo**: pare |
| **Fora do deploy** | Qualquer outro caminho (docs na raiz, `.claude/` na raiz etc.) | Listar como "não afeta produção" |

`Docs/`/`DOCS/` dos projetos dentro de `src/FileCabinet/` (`TECH-SPEC.md`, `MANIFEST.md`) **não é lixo**:
sobem para produção e isso é aceito.

Se **nada** cair em "Vai para produção" nem em "Objeto", avise que o merge não muda o File Cabinet de
produção (o PR ainda pode ser aberto, se o usuário quiser).

Mostre ao usuário um resumo curto da classificação. Se houver objetos ou bloqueios, **espere a decisão**
antes de seguir. Sem pendências, siga direto: o pedido de deploy já autoriza push e abertura do PR.

### Etapa 4 — Montar título e descrição

- **Card:** o ID vem do nome da branch (`tipo/idcard`). Link: `https://app.clickup.com/t/<idcard>`.
  Se houver acesso ao ClickUp, use o nome do card no título; sem acesso, não bloqueie.
- **Título:** `<tipo>(<idcard>): <resumo>`. Com um só commit, use o assunto dele como resumo. Com vários,
  resuma pelos commits (ou pelo nome do card).
- **Descrição**, em português, nesta estrutura (omita seções vazias):

```markdown
## Card
[<nome do card ou idcard>](https://app.clickup.com/t/<idcard>)

## O que muda
<2–4 linhas a partir dos commits: o que muda para o usuário do NetSuite>

## Vai para produção (File Cabinet)
- `src/FileCabinet/SuiteScripts/...` (A/M)

## ⚠️ Objetos: deploy manual ANTES do merge
O pipeline não publica objetos. Antes de mergear, deploye em produção e marque:
- [ ] `customscript_xxx`: deployado manualmente em AAAA-MM-DD

## ⚠️ Arquivos removidos: excluir manualmente em produção após o merge
O SDF não apaga arquivos.
- `/SuiteScripts/...`

## Não afeta produção
- `...`

## Commits
- `<hash> <assunto>`

---
O merge deste PR dispara o deploy automático para a produção (`deploy-prod.yml`).
```

Termine a descrição com as linhas de atribuição que a sessão pedir para PRs, se houver.

### Etapa 5 — Push e abertura do PR

```bash
git push -u origin <branch>
gh pr create --base main --head <branch> --title "<título>" --body-file - <<'EOF'
<descrição>
EOF
```

- Push rejeitado (non-fast-forward): **não** use `--force`. Reporte e oriente a integrar o remoto.
- Depois de criado, verifique conflitos:

  ```bash
  gh pr view <branch> --json url,mergeable,mergeStateStatus
  ```

  `CONFLICTING`: avise que o PR precisa de `git merge origin/main` na branch (sem rebase) antes do merge.

### Etapa 6 — Retorno ao usuário

Devolva, de forma curta:

1. **O link do PR.**
2. O que vai para produção quando for mergeado (contagem e principais arquivos).
3. Pendências antes do merge: objetos para deploy manual e conflitos.
4. Pendências depois do merge: arquivos para excluir à mão.
5. Lembrete: **o merge dispara o deploy.** Se o ambiente `production` exigir aprovação, o workflow
   aguarda o clique no GitHub Actions.

Se o usuário pedir para acompanhar o deploy depois do merge:

```bash
gh run list --workflow deploy-prod.yml --branch main --limit 3
gh run watch <run-id>
```

Em falha, use a tabela de erros do asset `ci-cd-github-netsuite.md` da skill `cicd-onboarding`.

---

## Hotfix emergencial

Se o usuário disser que **já subiu** algo direto em produção (exceção permitida só para emergência),
esta skill é o backport: a branch `fix/<idcard>` precisa ter **exatamente** o conteúdo que está em
produção, e o PR deve ser aberto **no mesmo dia**. Registre na descrição: "Backport de hotfix aplicado
direto em produção em AAAA-MM-DD". Hotfix sem backport é sobrescrito pelo próximo deploy.

---

## Relação com as outras skills

- **`git-branching`**: define o nome e a origem da branch que chega aqui.
- **`deploy-manual`**: continua valendo para **sandbox** (`file:upload` durante o desenvolvimento) e para o
  **deploy manual de objetos** em produção. Arquivos de produção, em cliente no CI/CD, vão só por esta
  skill.
- **`cicd-onboarding`**: pré-requisito. Cliente sem `deploy-prod.yml` na `main` ainda não usa esta skill.

---

## O que esta skill nunca faz

- Não faz `file:upload` nem `project:deploy` contra produção.
- Não mergeia, aprova ou fecha PR, e não faz push na `main`.
- Não usa `push --force`, `rebase` em branch publicada ou `reset`.
- Não abre PR com base diferente de `main`, nem um segundo PR para a mesma branch.
- Não commita alterações pendentes do usuário por conta própria.
- Não altera `deploy.xml` ou workflow para incluir objetos.
- Não edita `TECH-SPEC.md` nem `MANIFEST.md`.
