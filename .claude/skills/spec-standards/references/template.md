# Template canônico — `SPEC.md`

Use esta estrutura para todo spec gerado na ProjectDome. Omita seções sem conteúdo. Não adicione seções fora deste padrão sem justificativa registrada no changelog.

A seção **5. Scripts e EntryPoints** é repetida por script — use quantos blocos forem necessários.

---

```markdown
# Spec: [Nome do Projeto]

**Cliente:** [Nome do cliente — inferido do código ou confirmado na entrevista]
**Data:** [Data de geração]
**Versão:** 1.0

<!-- Specs gerados por engenharia reversa: substituir a linha de Versão por:
     Versão: 1.0 (Gerado por engenharia reversa)
     E inserir o bloco de aviso abaixo: -->

> ⚠️ Este documento foi gerado a partir da leitura do código-fonte existente.
> Representa o comportamento **atual** do sistema, não necessariamente o comportamento **desejado**.
> Divergências devem ser documentadas na seção "Comportamento Observado vs. Esperado".

---

## Changelog

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | [data] | [agente gerador] | Versão inicial |

---

## 1. Contexto

[Qual problema de negócio este projeto resolve? Inferido a partir do domínio, nomes de variáveis,
records manipulados e comentários no código. Confirmar com o usuário.]

## 2. Objetivo

[O que o sistema faz hoje, em uma frase clara e objetiva.]

## 3. Atores

| Ator | Papel no processo |
|------|-------------------|
| [Ex: Analista Financeiro] | [Ex: Salva o registro que dispara o processamento] |

## 4. Visão Geral dos Scripts

> Mapa de todos os scripts e EntryPoints do projeto, com seus relacionamentos.

| Script | Tipo | EntryPoints | Aciona |
|--------|------|-------------|--------|
| [nome do arquivo] | [UE / MR / CS / SL / SS] | [lista de entrypoints] | [script acionado, se houver] |

### Dependências entre EntryPoints

- O `[EntryPoint A]` do script `[X]` aciona o script `[Y]` via `[mecanismo]` quando `[condição]`.

---

## 5. Scripts e EntryPoints

---

### Script: [Nome do arquivo — ex: PaymentHandler.US.js]

**Tipo:** [UserEvent / MapReduce / Client Script / Suitelet / Scheduled]
**Record alvo:** [Record sobre o qual o script opera, se aplicável]
**Responsabilidade geral:** [Uma frase descrevendo o propósito do script como um todo]

---

#### EntryPoint: [nome da função — ex: afterSubmit]

**Gatilho:** [O que faz o NetSuite invocar este EntryPoint]
**Condição de execução:** [Quando o EntryPoint efetivamente processa vs. quando ignora]
**Propósito:** [Uma frase descrevendo o que este EntryPoint realiza no processo]

**Regras de negócio:**

- **RN01:** [Descrição funcional da regra]
- **RN02:** [Descrição funcional da regra]

> Regras marcadas com ⚠️ foram inferidas e aguardam confirmação.

**Operações sobre dados:**

| Operação | Record | Descrição |
|----------|--------|-----------|
| Leitura | [Ex: Sales Order] | [Ex: Verifica status e valor do pedido] |
| Escrita | [Ex: Custom Record X] | [Ex: Registra o resultado do processamento] |
| Busca | [Ex: Employee] | [Ex: Localiza o aprovador pelo departamento] |

**Tratamento de erros:**

| Situação | Comportamento atual |
|----------|---------------------|
| [Ex: Record não encontrado] | [Ex: Erro registrado em log, execução interrompida] |

**Dependências:**

- [Ex: Aciona o MapReduce `ProcessInvoice.MR.js` via `task.create` ao final do processamento]
- [Ex: Depende do campo `custbody_flag_processado` preenchido pelo `beforeSubmit` anterior]

---

#### EntryPoint: [próximo EntryPoint do mesmo script]

[Mesma estrutura acima]

---

### Script: [Próximo script]

[Mesma estrutura acima]

---

## 6. Restrições e Premissas Identificadas

- [Ex: O processo se aplica apenas a records do tipo X]
- [Ex: O script ignora execuções em ambiente de sandbox via condição explícita no código]
- [Ex: O MapReduce não possui limite de registros por execução — risco de timeout em volumes altos ⚠️]

## 7. Comportamento Observado vs. Comportamento Esperado

<!-- Seção exclusiva de specs gerados por engenharia reversa. Omitir em specs criados do zero. -->

| # | EntryPoint | Comportamento no código | Comportamento esperado | Status |
|---|------------|------------------------|------------------------|--------|
| 1 | [ex: afterSubmit] | [Descrição] | [Descrição] | ⚠️ Divergência / ✅ Confirmado |

## 8. Fora de Escopo

- [O que o projeto explicitamente NÃO faz, mas poderia ser esperado]

## 9. Dúvidas em Aberto

| # | EntryPoint relacionado | Dúvida | Origem | Responsável | Status |
|---|------------------------|--------|--------|-------------|--------|
| 1 | [ex: getInputData] | [Descrição] | [Inferência / Entrevista] | [Nome] | Pendente |
```

---

## Notas sobre as seções

| Seção | Obrigatoriedade | Observação |
|---|---|---|
| Cabeçalho (nome, cliente, data, versão) | Obrigatória | Sempre presente |
| Aviso de engenharia reversa | Condicional | Apenas em specs do `spec-reverse-builder` |
| Changelog | Obrigatória | Atualizado a cada versão |
| 1. Contexto | Obrigatória | — |
| 2. Objetivo | Obrigatória | — |
| 3. Atores | Obrigatória | — |
| 4. Visão Geral dos Scripts | Obrigatória | — |
| 5. Scripts e EntryPoints | Obrigatória | Um bloco por script |
| 6. Restrições e Premissas | Condicional | Omitir se não houver |
| 7. Comportamento Observado vs. Esperado | Condicional | Apenas em specs de engenharia reversa |
| 8. Fora de Escopo | Recomendada | Omitir apenas se nada foi explicitamente excluído |
| 9. Dúvidas em Aberto | Condicional | Omitir se todas resolvidas |