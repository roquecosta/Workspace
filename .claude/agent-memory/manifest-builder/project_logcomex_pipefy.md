---
name: project-logcomex-pipefy
description: Estrutura e padrões do MANIFEST.md do projeto PipefyIntegration (LogCOMEX)
metadata:
  type: project
---

Projeto LogCOMEX/PipefyIntegration usa prefixo `pd_pi_` em todos os objetos. Caminhos:
- MANIFEST: `LogCOMEX/src/FileCabinet/SuiteScripts/ProjectDome/PipefyIntegration/Docs/MANIFEST.md`
- TECH-SPEC: mesma pasta, `TECH-SPEC.md`

Scripts cadastrados: `customscript_pd_pi_pipefy_webhook_pur_st` (Suitelet, Pipe de Compras →
Purchase Order) e `customscript_pd_pi_pipefy_webhook_exp_st` (Suitelet, Pipe de Reembolso →
Expense Report).

Este projeto tem dois segredos distintos, não confundir:
- `custsecret_pd_pi_webhook_secret` — autentica o webhook de ENTRADA vindo do Pipefy.
- `custsecret_pd_pi_pipefy_api_token` — Personal Access Token para chamadas de SAÍDA à API
  GraphQL do Pipefy (buscar campos completos do card via Model compartilhado, ainda não
  nomeado/cadastrado — Model/UseCase não entram no manifest, só o segredo).

**Por quê:** o TECH-SPEC (seção "Decisões de Arquitetura", pendência P14) separou claramente
autenticação de entrada (validar webhook) de autenticação de saída (consultar API do Pipefy),
e isso se refletiu em dois secrets distintos no manifest — não reaproveitar um pelo outro.

**Como aplicar:** ao atualizar este manifest no futuro, manter a tabela "Segredos de API"
(nome de seção usado neste projeto, equivalente a "Secrets" da skill) com uma linha por
segredo, e lembrar que o registro `customrecord_pd_integration_log` é genérico/compartilhado
entre projetos de integração da ProjectDome e não é catalogado neste manifest (nota já
presente no rodapé do arquivo).
