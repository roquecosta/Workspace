---
name: feedback-gitbash-suitecloud-path-conversion
description: Git Bash (MSYS) reescreve paths iniciados com "/" passados a suitecloud CLI; prefixar com MSYS_NO_PATHCONV=1
metadata:
  type: feedback
---

Ao rodar comandos do SuiteCloud CLI (`suitecloud file:upload --paths "/SuiteScripts/..."`) via
Bash tool (Git Bash/MSYS) no Windows, o MSYS reescreve automaticamente qualquer argumento que
comece com `/` como se fosse um path de filesystem local, transformando
`/SuiteScripts/Cliente/arquivo.js` em algo como `/C:/Program Files/Git/SuiteScripts/Cliente/arquivo.js`
— e o upload falha com "does not exist".

**Why:** é um comportamento padrão do MSYS/Git Bash de conversão de paths estilo Unix para Windows,
não um bug da CLI nem do runbook `deploy`. Acontece com qualquer flag de caminho NetSuite (que sempre
começa com `/SuiteScripts` ou `/SuiteApps`) passada via Bash tool.

**How to apply:** ao rodar `suitecloud file:upload --paths "..."` (ou qualquer comando suitecloud com
path começando em `/`) pelo Bash tool, prefixar com `MSYS_NO_PATHCONV=1`:

```
MSYS_NO_PATHCONV=1 suitecloud file:upload --paths "/SuiteScripts/..."
```

Alternativa: rodar via PowerShell tool em vez do Bash tool (PowerShell não faz essa conversão).
Ver [[skill-deploy-runbook]] para o restante do procedimento de deploy.
