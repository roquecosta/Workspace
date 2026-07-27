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

**Estado atual (desde 2026-07-27) da seção "Parâmetros de Script":**
- `custscript_pd_pi_webhook_secret` — autentica o webhook de ENTRADA vindo do Pipefy. Não é OAuth,
  é um token simples de validação do payload recebido.
- `custscript_pd_pi_pipefy_client_id` — Client ID OAuth 2.0 client credentials, para chamadas de
  SAÍDA à API GraphQL do Pipefy.
- `custscript_pd_pi_pipefy_client_secret` — Client Secret OAuth 2.0 client credentials, par do
  client_id acima.

**Histórico (não usar como estado atual):** o projeto passou por duas mudanças na credencial de
saída, ambas em 2026-07-27:
1. `custscript_pd_pi_pipefy_api_token` (Personal Access Token) migrou de `custsecret_` para
   `custscript_` (Secret → Script Parameter comum).
2. Na sequência, esse mesmo PAT foi **substituído** por OAuth 2.0 client credentials (decisão de
   arquitetura confirmada, refletida no TECH-SPEC seção "Decisões de Arquitetura", pendência P14).
   `custscript_pd_pi_pipefy_api_token` não existe mais — foi removido e trocado pelas duas linhas
   `client_id`/`client_secret` acima.

**Por quê:** o TECH-SPEC separa claramente autenticação de entrada (validar webhook) de
autenticação de saída (consultar API do Pipefy) — não reaproveitar uma pela outra. A decisão de ir
para OAuth veio do usuário; o access token OAuth obtido dinamicamente (POST a
`https://app.pipefy.com/oauth/token`) NÃO é objeto de manifest — é valor efêmero cacheado via
N/cache (escopo PUBLIC, TTL 24h), documentado só no TECH-SPEC como comportamento.

**Como aplicar:** ao atualizar este manifest no futuro, manter a tabela "Parâmetros de Script"
(seção que substituiu "Secrets" neste projeto, já que não há mais nenhum `custsecret_` cadastrado)
com uma linha por parâmetro. Lembrar que o registro `customrecord_pd_integration_log` é
genérico/compartilhado entre projetos de integração da ProjectDome e não é catalogado neste
manifest (nota já presente no rodapé do arquivo).
