# CI/CD: Deploy automático GitHub → NetSuite (Produção)

Oct 15, 2026 · @Roque

Todo commit na branch `main` do repositório é publicado automaticamente na conta de produção do NetSuite. O pipeline usa GitHub Actions + SuiteCloud CLI (framework SDF), autenticando por certificado via OAuth 2.0 Machine-to-Machine (M2M) — sem login no navegador.

## 1. Pré-requisitos no NetSuite

Estes passos são feitos uma vez por conta, por um Administrador. Em *Setup → Company → Enable Features → aba SuiteCloud*, habilite:

- **SuiteCloud Development Framework (SDF)**
- **OAuth 2.0**
- **Client Credentials (Machine to Machine) Grant**

Você também precisa de um usuário com **acesso de login** à conta e um **role** com permissão de deploy via SDF (Administrator funciona; o ideal é um role dedicado). Esse par usuário+role será vinculado ao certificado no passo 3.

## 2. Gerar o certificado

Na sua máquina, gere um par de chaves **RSA** (chaves EC não funcionam):

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -keyout private-key.pem -out certificate.pem -nodes -days 365
```

Responda as perguntas (ou aperte Enter em todas — não afeta nada). Isso gera dois arquivos:

- `certificate.pem` — chave **pública**. Vai para o **NetSuite** (passo 3).
- `private-key.pem` — chave **privada**. Vira **secret no GitHub** (passo 4). Trate como senha; nunca commite no repositório (adicione `*.pem` ao `.gitignore`).

O `-days 365` significa que o certificado expira em 1 ano. Quando expirar, gere e registre um novo.

**Windows:** o `openssl` não vem no PowerShell. Use o **Git Bash** (botão direito na pasta → "Git Bash Here") e rode o mesmo comando. Ao colar no Git Bash, use **botão direito do mouse** (ou `Shift+Insert`) em vez de `Ctrl+V`, senão caracteres de "bracketed paste" quebram o comando.

## 3. Registrar o certificado no NetSuite

Vá em *Setup → Integration → OAuth 2.0 Client Credentials (M2M) Setup → New* e preencha:

- **Entity** — o usuário com acesso de login (passo 1).
- **Role** — o role com permissão de deploy via SDF.
- **Application** — selecione **SuiteCloud Development Integration**.
- **Certificate** — faça upload do arquivo `certificate.pem` (a chave pública).

Salve. O NetSuite gera uma linha com o **Certificate ID** — copie esse valor; você vai usá-lo no secret `NS_CERTIFICATE_ID`.

**Atenção:** o *Certificate ID* é um código curto de uma linha (ex.: `iozrrinfw18oa4quy23gmlzcgkfo25ixx`), **não** é o conteúdo do arquivo `.pem`. Confundir os dois é o erro mais comum.

Se "SuiteCloud Development Integration" não aparecer no campo Application, a integração ainda não existe na conta. Para criá-la, rode uma vez na sua máquina, dentro do projeto SDF: `suitecloud account:setup` (abre o navegador, você loga, e o NetSuite a instala sozinho).

## 4. Secrets no GitHub

Em *Settings → Secrets and variables → Actions → New repository secret*, crie os quatro:

| Secret | Valor | Onde obter |
| --- | --- | --- |
| `NS_ACCOUNT_ID` | Número da conta (ex.: `9710211`; sandbox leva sufixo, ex.: `9671630_SB1`) | Setup → Company → Company Information |
| `NS_CERTIFICATE_ID` | Código curto de uma linha | Gerado no passo 3 |
| `NS_PRIVATE_KEY` | Conteúdo da chave privada em **base64** (uma linha só) | `base64 -w0 private-key.pem` no Git Bash |
| `SUITECLOUD_CI_PASSKEY` | String aleatória **só alfanumérica**, 32–100 caracteres | `openssl rand -hex 32` no Git Bash |

Dois detalhes que evitam dor de cabeça: a chave privada vai em **base64** (uma linha) para não quebrar o shell com as múltiplas linhas do PEM; e o passkey precisa ser **apenas letras e números** — `base64` gera símbolos (`+`, `/`, `=`) que a CLI rejeita, por isso use `-hex`.

## 5. O workflow

Crie o arquivo `.github/workflows/deploy-prod.yml` na raiz do repositório. Ao chegar na `main`, o GitHub Actions o detecta e roda sozinho.

```yaml
name: Deploy to NetSuite Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # permite exigir aprovação manual
    env:
      SUITECLOUD_CI: "1"
      SUITECLOUD_CI_PASSKEY: ${{ secrets.SUITECLOUD_CI_PASSKEY }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java (JDK 17)
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install SuiteCloud CLI
        run: npm install -g @oracle/suitecloud-cli
        env:
          SUITECLOUD_CLI_ACCEPT_LICENSE: "true"

      - name: Write private key
        shell: bash
        run: echo "${{ secrets.NS_PRIVATE_KEY }}" | base64 -d > private-key.pem

      - name: Authenticate (M2M)
        shell: bash
        run: |
          suitecloud account:setup:ci \
            --account "${{ secrets.NS_ACCOUNT_ID }}" \
            --authid prod \
            --certificateid "${{ secrets.NS_CERTIFICATE_ID }}" \
            --privatekeypath private-key.pem

      - name: Validate project
        run: suitecloud project:validate --server

      - name: Deploy project
        run: suitecloud project:deploy

      - name: Cleanup
        if: always()
        run: rm -f private-key.pem
```

Se o projeto SDF estiver numa subpasta (ex.: `netsuite/`), adicione `working-directory: netsuite` aos steps de autenticação, validação e deploy. O repositório precisa ser um projeto SDF válido (`src/` com `manifest.xml` e `deploy.xml`).

**Aprovação manual (recomendado):** como o job usa `environment: production`, basta ir em *Settings → Environments → production* e ativar **Required reviewers**. O deploy passa a pausar esperando um clique de aprovação antes de publicar em produção.

## 6. Erros comuns e soluções

| Erro na execução | Causa | Solução |
| --- | --- | --- |
| `Set SUITECLOUD_CLI_ACCEPT_LICENSE=true to accept the FUTC license` | Licença da Oracle não aceita no modo não-interativo | `env: SUITECLOUD_CLI_ACCEPT_LICENSE: "true"` no step de instalação |
| `Machine-to-machine authentication is not allowed for the current execution context` | Faltam as variáveis de modo CI | Definir `SUITECLOUD_CI: "1"` e `SUITECLOUD_CI_PASSKEY` no `env` do job |
| `Value is expected here instead of "-----BEGIN"` | Conteúdo do `.pem` colado no secret errado (geralmente `NS_CERTIFICATE_ID`) | Usar o **Certificate ID** curto, não o arquivo; chave privada vai em base64 |
| `The credentials passkey ... must be between 32 and 100 alphanumeric characters` | Passkey com símbolos ou fora da faixa | Gerar com `openssl rand -hex 32` (só letras e números) |
| `There was an error with the private key` | Chave EC em vez de RSA, ou base64 corrompido | Regerar com `rsa:4096`; conferir o `base64 -w0` |
| Erro no `project:validate`/`project:deploy` | Projeto não é SDF válido, ou role sem permissão | Conferir `src/`, `manifest.xml`, `deploy.xml` e as permissões do role |
