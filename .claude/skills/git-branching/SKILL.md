---
name: "git-branching"
description: |
  Use esta skill SEMPRE que for iniciar um novo desenvolvimento (correção, feature, refatoração,
  documentação ou ajuste de configuração) em um projeto NetSuite SDF do time Dome, antes do primeiro
  commit. Define a regra de criação de branch: toda branch nasce da main e segue a nomenclatura
  tipo/idcard, onde idcard é o ID do card do ClickUp que originou o trabalho. Também se aplica
  quando o usuário pedir para "criar uma branch", "abrir uma branch pro card X" ou pedir revisão se
  um nome de branch está correto.
---

# git-branching — Convenção de branches do time Dome

Você está aplicando o padrão de versionamento do time de desenvolvimento da **Dome**. Sempre
responda em **português brasileiro**.

---

## Regra

Todo desenvolvimento — não importa o tamanho — começa com uma branch nova, criada a partir da
`main` local atualizada. **Não existem branches de ambiente** (`develop`, `sandbox` etc.): toda
branch representa um card de trabalho e nasce sempre da `main`.

```bash
git checkout main && git pull
git checkout -b tipo/idcard
```

- `tipo` — a natureza da mudança (tabela abaixo).
- `idcard` — o ID do card no ClickUp que originou o trabalho, **em minúsculas, sem hífen ou
  caractere extra**.

### Tipos permitidos

| Tipo | Uso |
| --- | --- |
| `feat` | Nova funcionalidade |
| `fix` | Correção |
| `docs` | Documentação |
| `refactor` | Reestruturação sem mudança de comportamento |
| `chore` | Workflows, estrutura de repositório, configurações |

### Formato

```
^(feat|fix|docs|refactor|chore)/[a-z0-9]+$
```

Antes de criar ou validar uma branch, confira contra essa regex: tipo permitido, barra, e **só** o
ID do card (alfanumérico minúsculo) depois dela — nada de descrição, hífen ou maiúsculas no ID.

### Exemplos

| Branch | Válida? | Motivo |
| --- | --- | --- |
| `feat/86b2xk9` | Sim | — |
| `fix/86b3aa1` | Sim | — |
| `feature/86b2xk9` | Não | Tipo não permitido (`feature` não está na lista) |
| `feat/86B2XK9` | Não | Maiúsculas no ID |
| `feat/86b2xk9-remessa-cnab` | Não | Só o ID do card deve vir após a barra |
| `86b2xk9` | Não | Falta o tipo |
| `develop`, `sandbox` | Não | Branches de ambiente não existem no padrão Dome |

---

## Pendência conhecida

O prefixo `CU-` do ClickUp (ex.: `feat/CU-86b2xk9`) para vinculação automática ClickUp × GitHub
ainda **não foi adotado**. Enquanto não for decidido, use o ID puro do card, sem prefixo — a regra
acima rejeita maiúsculas e hífen no ID.

---

## O que esta skill nunca faz

- Não decide o conteúdo do commit nem do PR — só o nome e a origem da branch.
- Não cria a branch sem o ID do card: se o usuário não informar o card do ClickUp, pergunte antes
  de criar.
- Não assume branch de ambiente (`develop`, `sandbox`) como válida.