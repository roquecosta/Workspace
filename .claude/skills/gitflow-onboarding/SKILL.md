---
name: "gitflow-onboarding"
description: |
  Use esta skill quando o usuário pedir para fazer o onboarding de um cliente no fluxo
  GitHub → NetSuite (deploy de produção por GitHub Actions a partir da main), ou seja, para
  "instalar o git flow", "colocar o cliente no CI/CD", "alinhar a main com produção",
  "preparar o repositório para deploy automático" ou "verificar se a main está igual à produção".
  Conduz as precauções ANTES de ligar o pipeline: diagnóstico do projeto SDF, congelamento de
  deploys, inventário da produção via SuiteCloud CLI, comparação arquivo a arquivo com a main,
  transferência de desenvolvimentos em andamento para branches, alinhamento main = produção,
  restrição de escopo do deploy.xml, proteção da main e só então a instalação do workflow.
  NÃO faz deploy em produção. NÃO substitui o doc de configuração do CI (só o referencia).
---

# gitflow-onboarding — Onboarding de cliente no fluxo GitHub → NetSuite

Você está preparando o repositório de um cliente da **Dome** para o modelo em que **a `main` é a
produção**. Sempre responda em **português brasileiro**.

## O modelo-alvo

```
branch tipo/idcard ──► PR ──► aprovação ──► merge na main ──► GitHub Actions
                                                                   │
                                     project:validate + project:deploy (SDF, M2M)
                                                                   ▼
                                                        NetSuite PRODUÇÃO
```

- **`main` == produção, sempre.** Tudo que está na `main` está em produção, e vice-versa (dentro do
  escopo do `deploy.xml`).
- **Nenhum deploy direto em produção**, salvo **hotfix emergencial** — e todo hotfix volta para a
  `main` por PR no mesmo dia (ver Fase 9).
- Branches seguem a skill **`git-branching`** (`tipo/idcard`, sempre a partir da `main`).
- A configuração do NetSuite + GitHub Actions (certificado, M2M, secrets, workflow) está documentada em
  **`CI CD GitHub → NetSuite (Produção).md`** na raiz do workspace Dome. Esta skill **não duplica** esse
  doc: ela cuida de tudo que precisa ser verdade **antes** de ligá-lo.

> **Por que tanta precaução:** o workflow roda `project:deploy` a **cada push na main** e envia
> **tudo** que o `deploy.xml` referencia. Se a `main` tiver código que não está em produção, o primeiro
> merge publica esse código. Se a produção tiver hotfix que não está na `main`, o primeiro merge o
> **sobrescreve**. E o SDF **não apaga** nada: arquivo removido do repo continua em produção.

---

## Regras invioláveis

1. **Nunca deployar em produção** durante o onboarding. Contra produção, só comandos de **leitura**:
   `file:list`, `file:import`, `object:list`, `object:import`, `project:validate --server`.
2. **Confirme a conta antes de qualquer comando contra o NetSuite.** Pergunte qual instância/authid de
   produção usar, mostre `suitecloud account:manageauth --list` e o `defaultAuthId` do `project.json`.
   Siga a skill **`deploy`** para as regras de conta.
3. **Nada é descartado sem decisão do usuário.** Todo arquivo divergente é classificado e apresentado; o
   usuário decide o destino de cada um (Fase 4). Antes de mexer na `main`, crie a tag de backup.
4. **Sem reescrita de histórico.** Nada de `push --force` ou `reset` na `main` remota. O alinhamento entra
   por **PR**, como qualquer mudança.
5. **O workflow é o último passo.** O `.github/workflows/deploy-prod.yml` só é mergeado depois que a
   re-verificação (Fase 6) der **zero diferença** e a proteção da `main` (Fase 8) estiver ativa — o merge
   desse arquivo já dispara o primeiro deploy.
6. Não edita `TECH-SPEC.md` nem `MANIFEST.md`.

Conduza fase por fase. Ao fim de cada fase, mostre o resultado e **peça o OK antes de seguir**.

---

## Fase 0 — Diagnóstico do projeto

Verifique e reporte em checklist (✅ / ❌ / ⚠️):

| Item | Como checar | Se falhar |
| --- | --- | --- |
| Repo git com remote no GitHub (org Project-Dome) | `git remote -v` | Criar repo antes de seguir |
| Projeto SDF válido | existem `suitecloud.config.js`, `src/manifest.xml`, `src/deploy.xml` | Scaffold SDF (não assuma que toda pasta de cliente já é SDF) |
| `project.json` com authid de **produção** do cliente | `project.json` + `account:manageauth --list` | `suitecloud account:setup` (interativo, local) |
| `main` local = `origin/main`, sem mudanças pendentes | `git fetch && git status` | Resolver antes (commit em branch, stash, etc.) |
| Branches abertas | `git branch -a --no-merged main` | Listar — entram no relatório (Fase 4) |
| Submódulos (ex.: `pd_c_netsuite_tools`, `Framework`) | `.gitmodules`, `git submodule status` | Ver Fase 7 — o CI precisa fazer checkout deles |
| Código compilado (TypeScript etc.) | `tsconfig.json`, `outDir` apontando para `src/FileCabinet` | Ver Fase 7 — decidir se o build roda no CI ou o output é versionado |
| Segredos versionados | `git ls-files | grep -Ei '\.pem$|\.key$|project\.json|\.env'` | Remover do índice + `.gitignore`; se vazou, rotacionar |
| Hook de upload automático (`file:upload` a cada save) | `.claude/settings*.json`, `.vscode/` | Desligar ou restringir a sandbox — no modelo novo, prod só via CI |
| Java compatível com o SuiteCloud CLI | `java -version` | Nesta máquina, JDK 25 quebra o CLI: setar `JAVA_HOME` para JDK 21 por comando |

---

## Fase 1 — Congelamento e backup

1. **Code freeze combinado com o time e com o cliente:** a partir de agora, ninguém sobe nada em produção
   (nem Dome, nem time interno do cliente, nem outro fornecedor) até o pipeline estar ligado. Registre data
   e hora do início do freeze — qualquer deploy depois disso invalida o inventário.
2. **Tag de backup da main atual** (preserva todo o desenvolvimento em andamento):
   ```bash
   git tag onboarding/main-antes-AAAAMMDD
   git push origin onboarding/main-antes-AAAAMMDD
   ```
3. O snapshot da produção (Fase 2) também serve como backup de rollback — guarde-o até o fim.

---

## Fase 2 — Inventário da produção

### 2.1 Definir o escopo

Pergunte e registre **quais pastas do File Cabinet são da Dome** (ex.: `/SuiteScripts/project_dome`). O
CI só deve gerenciar esse escopo — pastas de outros fornecedores, bundles e arquivos do cliente ficam fora.
O mesmo vale para objetos: quais prefixos de scriptid são da Dome (ex.: `customscript_pd_`,
`customrecord_pd_`).

> Atenção ao caso IRON: o layout no NetSuite pode não bater com a estrutura do repo (scripts legados soltos
> na raiz de `/SuiteScripts`, etc.). **O repo tem que espelhar o caminho do NetSuite**, senão o deploy cria
> cópias em pastas novas. Levante o layout real antes de definir o escopo.

### 2.2 Snapshot em worktree isolado

Use um **worktree** a partir da `main` para importar a produção sem sujar o repo de trabalho. Assim o próprio
git faz a comparação:

```bash
git worktree add ../<cliente>-prod-snapshot main
cp project.json ../<cliente>-prod-snapshot/          # project.json é ignorado pelo git
cd ../<cliente>-prod-snapshot
# limpar o escopo no worktree para que o import reflita SÓ o que existe em produção
rm -rf "src/FileCabinet/SuiteScripts/<escopo>"
```

Liste e importe os arquivos de produção do escopo (comandos de leitura):

```powershell
suitecloud file:list --folder "/SuiteScripts/<escopo>"
# importar em lotes de ~12 caminhos (linha de comando longa quebra no Windows)
suitecloud file:import --paths "/SuiteScripts/<escopo>/a.js" "/SuiteScripts/<escopo>/b.js" ... --excludeproperties
```

Confira se o `file:list` trouxe as subpastas; se não, itere por subpasta. Confirme ao final que a contagem
de arquivos importados = contagem listada.

### 2.3 Objetos

Arquivos não são tudo: o `deploy.xml` também envia `~/Objects/*`, e o deploy **sobrescreve** a definição
do objeto em produção. Admins costumam alterar script deployments pela UI (status, log level, audience,
parâmetros) — essas alterações seriam perdidas no primeiro deploy.

```powershell
suitecloud object:list --type customscript                 # e customrecordtype, customlist, etc.
suitecloud object:import --type ALL --scriptid <ids do escopo> --destinationfolder "/Objects" --excludefiles
```

Importe para o mesmo worktree os objetos do escopo que existem em produção.

---

## Fase 3 — Comparação e classificação

No worktree, o `git status` já é o diff produção × main:

```bash
git -c core.autocrlf=false status --porcelain -- src/
git diff --ignore-cr-at-eol --stat -- src/
```

- **CRLF/BOM geram falso positivo.** Compare sempre ignorando fim de linha; um arquivo que só difere em
  `\r` conta como **igual** (e anote para resolver com `.gitattributes` na Fase 7).
- **XML de objeto exportado** pode diferir só em ordem/formatação. Leia o diff e julgue se a diferença é
  semântica antes de classificar.

### Classificação

| Categoria | Sinal no worktree |
| --- | --- |
| **Igual** | sem alteração (ou só fim de linha) |
| **Divergente** | `M` — conteúdo de prod ≠ main |
| **Só em produção** | `??` — existe em prod, não no repo |
| **Só na main** | `D` — existe no repo, não em prod |

### Quem está à frente? (para cada divergente)

Procure o conteúdo de produção no histórico do arquivo. Se bater com algum commit antigo, a produção está
nesse commit e a `main` **está à frente** (desenvolvimento em andamento). Se não bater com nenhum, alguém
**editou direto em produção**.

```bash
f="src/FileCabinet/SuiteScripts/<caminho>"
ph=$(tr -d '\r' < "../<cliente>-prod-snapshot/$f" | git hash-object --stdin)
for c in $(git log --format=%h -- "$f"); do
  h=$(git show "$c:$f" 2>/dev/null | tr -d '\r' | git hash-object --stdin)
  [ "$h" = "$ph" ] && { echo "prod = $c ($(git log -1 --format='%ad %s' --date=short $c))"; break; }
done
```

Para os casos ambíguos (prod não bate com nenhum commit, mas está próxima de um), **leia os dois arquivos**
e descreva a diferença em uma linha (ex.: "prod tem fix de null em `getAmount`, main tem refactor do card
X por cima"). Use `git log` dos commits que a `main` tem a mais para associar cada mudança a um **card do
ClickUp** — é por card que os desenvolvimentos vão virar branches.

---

## Fase 4 — Relatório de reconciliação (gate)

Apresente uma tabela única e **peça a decisão do usuário por linha**. Defaults sugeridos:

| Situação | Diagnóstico | Ação sugerida |
| --- | --- | --- |
| Divergente, prod = commit antigo | Dev em andamento na main | **Mover para branch** do card; main recebe versão de prod |
| Divergente, prod ≠ qualquer commit | Edição direta em prod (hotfix) | **Main recebe versão de prod** (prod é a verdade) |
| Divergente, prod ≠ commit **e** main com dev novo | Hotfix + dev misturados | Main recebe prod; branch do card **reaplica o dev sobre a versão de prod** (merge manual) |
| Só em produção, dentro do escopo | Nunca versionado | **Importar para a main** |
| Só em produção, fora do padrão (lixo, `_old`, cópias) | Arquivo morto | Decidir: importar ou excluir de prod (exclusão é manual, depois do onboarding) |
| Só na main, ligado a card ativo | Dev não deployado | **Mover para branch** do card; sai da main |
| Só na main, sem card / abandonado | Código morto | Remover da main (fica na tag de backup) |
| Objeto divergente (deployment/record) | Mudança via UI ou dev pendente | Mesmo critério: prod é a verdade na main; dev vai para branch |
| Branch aberta já existente | — | Listar; o dono faz rebase/merge da main alinhada depois |

Inclua no relatório: escopo definido, data do snapshot, contagens por categoria, e a lista de
branches que serão criadas (`tipo/idcard` + arquivos). Arquivos que não puderem ser associados a um card
→ pergunte o card ao usuário (a skill `git-branching` não cria branch sem card).

---

## Fase 5 — Execução do alinhamento

A ordem importa. **Não** crie as branches de dev a partir da main antiga e depois "reverta" a main: ao
mergear essas branches de volta, o git consideraria os commits já integrados e o dev **sumiria** em
silêncio (armadilha do revert). Em vez disso:

1. **Branch de alinhamento** a partir da `main`, seguindo `git-branching` (ex.: `chore/<idcard do card de
   onboarding>`). Aplique nela as decisões da Fase 4: copie do worktree as versões de produção, adicione os
   arquivos "só em prod", remova os "só na main". Commit:
   `chore: alinha main com a produção NetSuite (snapshot AAAA-MM-DD)`.
2. **PR → revisão → merge** na `main`. (Ainda não há workflow, então nada é deployado.)
3. **Uma branch por card** em andamento, a partir da `main` **já alinhada**, restaurando os arquivos do
   card a partir da tag de backup:
   ```bash
   git checkout main && git pull
   git checkout -b feat/<idcard>
   git checkout onboarding/main-antes-AAAAMMDD -- <arquivos do card>
   git commit -m "feat: reaplica <idcard> sobre a main alinhada"
   git push -u origin feat/<idcard>
   ```
   Para o caso "hotfix + dev misturados", faça o merge manual do dev sobre a versão de produção e peça
   revisão do usuário no diff.
4. Branches que já existiam: avise os donos para atualizar a partir da `main` alinhada.

---

## Fase 6 — Re-verificação (gate)

Repita a Fase 2/3 contra a `main` atualizada (novo worktree ou `git pull` no existente + novo import).
Critério de aceite: **zero diferença** no escopo (ignorando fim de linha). Também rode, contra produção:

```powershell
suitecloud project:validate --server
```

Se alguém deployou em produção durante o freeze, o inventário está inválido — volte à Fase 2.

Depois do aceite: tag de baseline e remoção do worktree.

```bash
git tag prod-baseline-AAAAMMDD && git push origin prod-baseline-AAAAMMDD
git worktree remove ../<cliente>-prod-snapshot
```

---

## Fase 7 — Higiene do repositório para o CI

- **`deploy.xml` restrito ao escopo.** Troque `~/FileCabinet/*` pelas pastas da Dome
  (ex.: `~/FileCabinet/SuiteScripts/project_dome/*`) e `~/Objects/*` pelos objetos do escopo. **Remova
  `<configuration>` (`~/AccountConfiguration/*`)** — o CI não deve alterar features da conta — e
  `<translationimports>` se não houver uso.
- **Exclusões não propagam.** O SDF não apaga em produção o que sai do repo. Combine que remoção de
  arquivo/objeto é feita manualmente em prod, registrada no PR que remove do repo.
- **Submódulos:** se houver, o `actions/checkout` do workflow precisa de `submodules: recursive` e, se o
  submódulo for privado, um token com acesso (o `GITHUB_TOKEN` padrão não lê outros repos privados).
- **Build:** se há TypeScript compilado para `src/FileCabinet`, decida: build no CI (adicionar step) ou
  output versionado (e conferido no PR). Não deixe ambíguo.
- **`.gitattributes`** fixando fim de linha (ex.: `* text=auto eol=lf`) para acabar com falso diff.
- **`.gitignore`** com `*.pem`, `project.json`, `node_modules`, `build`.

---

## Fase 8 — Proteção da main e instalação do workflow

Antes de mergear o workflow:

1. **Branch protection na `main`** (Settings → Branches / Rulesets): exigir PR, ≥ 1 aprovação, bloquear
   push direto e force push, exigir branch atualizada. Incluir admins.
2. **Environment `production`** com **Required reviewers** (o workflow do doc já usa
   `environment: production`).
3. **Recomendado:** workflow de PR (`validate-pr.yml`, `on: pull_request`) que só roda
   `project:validate --server` — falha de validação aparece no PR, não no deploy.
4. Configuração NetSuite + secrets + `deploy-prod.yml`: seguir **`CI CD GitHub → NetSuite (Produção).md`**
   (passos 1 a 5). Ajustar `working-directory`, `submodules` e build conforme a Fase 7.
5. **Lembrete da expiração do certificado** (o doc gera com `-days 365`): criar card/lembrete ~30 dias
   antes, senão o deploy para de funcionar sem aviso.
6. O PR que adiciona o workflow é o **primeiro deploy**. Como a `main` == produção, ele deve ser
   funcionalmente neutro — é o smoke test do pipeline. Acompanhe o run e confirme sucesso.

---

## Fase 9 — Acordos e handoff

Registre e comunique ao time e ao cliente:

- **Fluxo normal:** card → `tipo/idcard` → PR → aprovação → merge → deploy automático.
- **Sandbox:** desenvolvimento e teste continuam via `file:upload` em sandbox (skill `deploy`). Produção,
  só pelo pipeline.
- **Hotfix emergencial:** permitido direto em produção, mas no **mesmo dia** abre-se `fix/<idcard>` com
  exatamente o mesmo conteúdo e PR para a `main`. Hotfix sem backport é **apagado pelo próximo deploy**.
- **Ninguém mais edita o escopo em produção** — inclusive time interno do cliente e outros fornecedores.
  Se possível, restringir permissão de File Cabinet nas pastas do escopo.
- **Mudanças de objeto pela UI** (deployments, campos) também precisam voltar para o repo, pelo mesmo
  motivo do hotfix.

Entregue ao final um resumo com: escopo, baseline (tag), branches criadas, decisões tomadas por arquivo,
pendências (exclusões manuais em prod, donos de branches antigas a avisar, data de expiração do
certificado).

---

## O que esta skill nunca faz

- Não deploya em produção (nem `file:upload`, nem `project:deploy`) — leitura apenas.
- Não descarta código sem decisão do usuário; tudo fica na tag de backup.
- Não reescreve histórico da `main` nem faz force push.
- Não mergeia o workflow antes da re-verificação com zero diferença e da proteção da `main`.
- Não cria branch sem card do ClickUp.
- Não edita `TECH-SPEC.md` nem `MANIFEST.md`.
