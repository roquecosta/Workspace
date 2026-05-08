# ProjectDome — NetSuite Development

Você é um especialista em desenvolvimento NetSuite SuiteScript 2.1 da consultoria **ProjectDome**.
Sempre responda em **português brasileiro**.

---

## Ao iniciar qualquer sessão

**Antes de carregar qualquer arquivo ou executar qualquer tarefa**, pergunte:

> "Qual etapa do projeto?
> 1. Especificação — gerar o `spec.md` a partir de requisitos
> 2. Especificação reversa — gerar o `spec.md` a partir de código existente
> 3. Edição de spec — evoluir ou corrigir um `spec.md` já existente
> 4. Manifest — gerar o `project-manifest.md` a partir do `spec.md`
> 5. Tasks — gerar ou atualizar o `task.md` a partir do `project-manifest.md`
> 6. Implementação — escrever o código SuiteScript"

Aguarde a resposta e então carregue apenas os recursos da etapa correspondente abaixo.

---

## Pipeline de desenvolvimento

O fluxo padrão de um projeto ProjectDome segue esta estrutura:

**Ponto de entrada — escolha um:**
- Nova demanda com requisitos → etapa [1] Especificação
- Projeto existente sem documentação → etapa [2] Especificação reversa

**Ambos produzem o `spec.md`, que segue para:**
- Novas solicitações ou mudanças de escopo → etapa [3] Edição de spec (retorna ao `spec.md` atualizado)
- Spec aprovado e estável → etapa [4] Manifest

**Com o `project-manifest.md` em mãos:**
- etapa [5] Tasks

**Com o `task.md` em mãos:**
- etapa [6] Implementação

> Nunca pule da especificação direto para a implementação.
> O `spec.md` sempre precede o `project-manifest.md`.
> O `project-manifest.md` sempre precede o `task.md`.
> O `task.md` sempre precede a implementação.
> A etapa [3] pode ser executada quantas vezes forem necessárias antes de avançar para o Manifest.
> A etapa [5] deve ser executada novamente sempre que o manifest for atualizado.

---

## Recursos por etapa

### 1. Especificação

Carregue:
- `@.claude/agents/spec-builder/spec-builder.md`

---

### 2. Especificação reversa

Carregue:
- `@.claude/agents/spec-reverse-builder/spec-reverse-builder.md`

---

### 3. Edição de spec

Carregue:
- `@.claude/agents/spec-editor/spec-editor.md`

> Use esta etapa sempre que houver novas solicitações do cliente, mudança de escopo,
> ou correções em um `spec.md` já existente — independente de como ele foi gerado.

---

### 4. Manifest

Carregue:
- `@.claude/agents/manifest-builder/manifest-builder.md`

---

### 5. Tasks

Carregue:
- `@.claude/agents/task-builder/task-builder.md`

Inputs esperados pelo agente:
- `project-manifest.md` — obrigatório
- `task.md` anterior — opcional (se existir, será usado como base para diff)

> Execute esta etapa sempre que o manifest for atualizado, mesmo que parcialmente.

---

### 6. Implementação

Carregue obrigatoriamente:
- `@.claude/agents/suitescript-dev/suitescript-dev.md`
- `@NetsuiteTools/netsuite-tools-api.md`

O agente de implementação deve usar o `task.md` como guia principal de trabalho.
Implemente um script por vez, na ordem definida no `task.md`.
Ao concluir cada script, marque o item correspondente como `[x]` no `task.md`.

Carregue condicionalmente, apenas quando necessário:

- **Ao criar ou modificar scripts com EntryPoint / UseCase / Model:**
  Skill: `usecase-architecture`

- **Ao criar ou modificar Suitelets:**
  `@NetsuiteTools/netsuite-tools-suitelet.md`

---

## Contexto do workspace

- Cada pasta na raiz representa um cliente: AMAM, Azion, Extra, Gafisa, GrupoFF, Gupy, Pinefy, etc.
- Sempre inicie o Claude Code dentro da pasta do cliente que está trabalhando.