---
name: "spec-standards"
description: "Consulte esta skill SEMPRE que for criar, editar ou versionar um SPEC.md — independente do agente que está executando a tarefa. Isso inclui: spec-manager (modo criação e modo edição), spec-reverse-builder, e qualquer outro agente que produza ou altere documentos de requisitos funcionais na ProjectDome. A skill define as regras canônicas de estrutura, versionamento, marcação de alterações e changelog que todos os specs devem seguir."
---

# Spec Standards

Esta skill define os **padrões canônicos** para criação, edição e versionamento de specs na ProjectDome.

Todo agente que produz ou altera um `SPEC.md` deve consultar esta skill antes de gerar qualquer conteúdo.

---

## Regras gerais

- O documento é **sempre em português brasileiro**
- A linguagem é **funcional** — sem mencionar scripts, campos técnicos com prefixo `cust*`, IDs internos NetSuite ou decisões de implementação, a menos que já estejam no spec existente e sejam diretamente relevantes
- Seções vazias são **omitidas** — não gere seções sem conteúdo
- O documento deve ser compreensível por qualquer pessoa da equipe, técnica ou não

---

## Estrutura e template

O template canônico do `SPEC.md` está em:

```
references/template.md
```

Leia-o antes de gerar qualquer spec. Ele define as seções obrigatórias, opcionais e seus formatos.

---

## Versionamento

| Tipo de mudança | Regra |
|---|---|
| Criação inicial | `1.0` |
| Adição, modificação ou remoção de conteúdo | Incrementa minor: `1.0 → 1.1` |
| Reformulação significativa de escopo | Incrementa major: `1.0 → 2.0` |

---

## Changelog

Todo spec deve ter um bloco de changelog logo abaixo do cabeçalho. Na criação, registre a versão inicial. Em cada edição, adicione uma linha:

```markdown
## Changelog

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.1 | [data] | spec-manager | [Resumo das alterações] |
| 1.0 | [data] | spec-manager | Versão inicial |
```

O campo **Autor** deve refletir o agente que gerou a versão (ex: `spec-manager`, `spec-reverse-builder`).

---

## Marcação de alterações (modo edição)

Quando um agente editar um spec existente:

- Seções com conteúdo novo ou modificado recebem a marcação `*(atualizado na vX.X)*` ao lado do título
- Seções não afetadas **não são tocadas** — nunca reescreva o que não mudou
- Dúvidas resolvidas pelas novas solicitações mudam o status para `✅ Resolvido` com a resposta registrada
- Novas dúvidas geradas pelas alterações são adicionadas com status `Pendente`

---

## Dúvidas em aberto

Use a tabela padrão da seção 11 do template. Status possíveis:

| Status | Uso |
|---|---|
| `Pendente` | Ainda sem resposta |
| `✅ Resolvido` | Respondida — registre a resposta na coluna Dúvida |

---

## Identificação de origem

- Specs gerados pelo `spec-reverse-builder` (engenharia reversa) devem conter o aviso:
  ```
  > ⚠️ Este documento foi gerado por engenharia reversa a partir do código existente. Valide com o cliente antes de usar como referência oficial.
  ```
- Esse aviso **nunca deve ser removido** por outros agentes sem instrução explícita do usuário.

---

## Referências

- `references/template.md` — template canônico do `SPEC.md`