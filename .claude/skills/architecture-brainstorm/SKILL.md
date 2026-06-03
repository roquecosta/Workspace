---
name: architecture-brainstorm
description: >
  Use esta skill quando o usuário quiser DISCUTIR ou PENSAR JUNTO sobre uma
  decisão arquitetural do projeto antes de escrevê-la no TECH-SPEC.md. Exemplos
  de gatilho: "vamos brainstormar isso", "faz sentido agrupar esses usecases
  assim?", "estou na dúvida de como organizar essas pastas", "me ajuda a pensar
  na estrutura disso". É uma rota CONSULTIVA e LATERAL — pode ser acionada a
  qualquer momento, inclusive no meio de uma implementação, sem reiniciar a
  sessão. NÃO use esta skill para definir requisito/regra de negócio do cliente
  (isso é Especificação) nem para escrever código SuiteScript (isso é
  Implementação).
---

# Architecture Brainstorm — rota lateral consultiva

Esta skill existe para um único propósito: ajudar o usuário a **pensar junto**
sobre uma **decisão arquitetural do projeto** antes que ele a escreva no
`TECH-SPEC.md`. É uma rota lateral — não é uma etapa do pipeline e não exige
reiniciar a sessão.

## Princípio fundamental: consultivo, nunca autoral

O `TECH-SPEC.md` é autoral do usuário. Esta skill **nunca edita o
`TECH-SPEC.md`**. O agente discute, questiona e sugere; quem escreve a linha
final é o usuário.

O output sempre termina com um **trecho pronto para colar** na seção
"Decisões de arquitetura" do `TECH-SPEC.md`, deixando a incorporação manual a
cargo do usuário.

## O que está no escopo

Decisões **estruturais e locais do projeto** — aquelas que não são requisito do
cliente nem arquitetura fixa da ProjectDome:

- Organização e segmentação de pastas
- Agrupamento de usecases similares
- Convenções de nomenclatura do projeto
- Refatoração estrutural (mover, agrupar, dividir)
- Quantos models criar e como dividi-los
- Padrões de divisão de responsabilidade entre scripts

## Como conduzir o brainstorm

1. Use o `TECH-SPEC.md` carregado como contexto. Se ele não estiver carregado,
   peça ao usuário para fornecê-lo antes de prosseguir.
2. Discuta de forma direta: aponte tensões, trade-offs e consequências de cada
   alternativa. Não concorde por padrão — questione decisões quando houver um
   motivo concreto.
3. Sugira agrupamentos ou estruturas alternativas quando fizer sentido, sempre
   explicando o porquê.
4. Não produza código. Não produza `MANIFEST.md`. O entregável é raciocínio +
   um trecho de decisão redigido.

## Fronteiras — quando sair desta rota

Esta skill reconhece quando a conversa saiu do seu escopo e orienta a troca de
rota:

- Se a discussão virar **"o que o sistema deve fazer"** (campos, registros,
  cálculos, comportamento) → isso é requisito de negócio. Oriente o usuário a
  escrever no `TECH-SPEC.md` ou a usar a etapa de Especificação.
- Se a discussão virar **"como escrever o script"** (código, sintaxe
  SuiteScript, EntryPoint/UseCase/Model concretos) → isso é Implementação.
  Oriente o usuário a trocar para a etapa de Implementação.

## Formato do output

Encerre sempre com algo como:

> **Trecho sugerido para a seção "Decisões de arquitetura" do TECH-SPEC.md:**
> - [decisão redigida de forma curta e objetiva]
>
> Cole isso no seu `TECH-SPEC.md` se concordar — eu não altero o arquivo
> diretamente.