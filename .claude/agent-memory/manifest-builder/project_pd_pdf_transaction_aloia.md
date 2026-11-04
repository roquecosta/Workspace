---
name: project-pd-pdf-transaction-aloia
description: Projeto Aloia/pd_pdf_transaction (módulo legado de PDF de transações) — primeiro MANIFEST do módulo cobre só a feature nova Credit Memo, não retroage sobre Invoice/Packing List; footnotes "a confirmar" dedicadas por campo e pendência de SDF para campo sem lastro
metadata:
  type: project
---

Cliente **Aloia**, módulo `pd_pdf_transaction` (`src/FileCabinet/SuiteScripts/project_dome/pd_pdf_transaction/`)
é um módulo **legado**: já tinha código funcionando para Invoice e Packing List, mas nunca teve
TECH-SPEC.md nem MANIFEST.md. O primeiro MANIFEST desse módulo foi criado no card **DEV-845**
(feature nova: botão "Print Credit Memo" na transação Credit Memo, espelhando o "Print Invoice" da
Invoice, com script/layout/utils próprios — arquivos irmãos, não edição dos arquivos de Invoice).

Caminho do MANIFEST: `Aloia/src/FileCabinet/SuiteScripts/project_dome/pd_pdf_transaction/Docs/MANIFEST.md`

**Why:** o usuário pediu explicitamente para não documentar retroativamente o módulo inteiro
(Invoice, Packing List já existentes) — só os objetos NOVOS da feature de Credit Memo, mais a única
edição aditiva num arquivo existente (`modules/pd_pdf_const_module.js`, nova entrada
`CUSTOM_SCRIPT.SUITELET.PRINT_CREDIT_MEMO`). Isso evita inflar o primeiro MANIFEST com reverse
engineering de código legado não solicitado.

**How to apply:** em rodadas futuras sobre este módulo, continuar cadastrando apenas o que for
objeto de trabalho ativo (feature por feature). Se o usuário pedir para cobrir Invoice/Packing List
retroativamente, isso é modo 2 (inferido de código) — tratar como pedido explícito separado, não
assumir.

**Decisões estruturais tomadas neste MANIFEST** (para manter consistência em updates):
- Módulos JS puros sem `@NScriptType` (ex.: layout module, utils module) **não** entram na tabela
  de Scripts (que é só para tipos de entrypoint: UserEvent/ClientScript/Suitelet/MapReduce/RESTlet).
  Foram colocados numa seção própria **"Módulos Auxiliares (sem Script Record)"**, com colunas
  Arquivo | Expõe | Usado por | Descrição.
- Client Script sem script record/deployment próprio (carregado via `form.clientScriptModulePath`
  pelo UE) **entra** na tabela de Scripts normalmente, com Script ID `—` e nota de rodapé explicando.
- Deploy IDs reais (quando fornecidos) são capturados numa subtabela **"Deploy IDs"** logo após a
  tabela de Scripts (Script ID | Deploy ID) — extensão ao padrão da skill `manifest-standards`
  (que só define a coluna Script ID), útil porque este MANIFEST alimenta o `sdf-generator`.
  Precedente: nenhum outro MANIFEST do workspace documentava Deploy ID antes deste.
- Edição aditiva em arquivo de constantes compartilhado (sem criar objeto NetSuite novo) ganhou
  seção própria **"Edição Aditiva em Arquivo Existente"**, fora da tabela de Scripts.
- Pendências (campos ainda não confirmados pelo usuário — ex.: campos de "Special Instructions" do
  Credit Memo, campo análogo a `custbody_pd_pdf_invoice_pdf_dc`) foram registradas numa seção final
  **"Notas / Pendências"**, fora da estrutura formal, para não inventar campos sem evidência.

Padrão de nomenclatura confirmado no código real (Objects/custom_script): `customscript_pd_pdf_<entidade>_ue`,
`customscript_pd_pdf_print_<entidade>_sl`, `customdeploy_` espelha o scriptid. Record Alvo em
maiúsculo (`INVOICE`, `CREDITMEMO`) conforme o enum usado nos XMLs deste projeto.

**Atualização (rodada DEV-845, fechamento de pendências):** quando as pendências de Special
Instructions e layout foram fechadas no TECH-SPEC.md, surgiu o campo nativo `custbody_pd_motivo_rma_scrap`
(Custom Body Field, record `returnauthorization`, Return Reason da RMA). Entrou numa seção nova
**"Campos Customizados em Records Nativos"** (inexistente até então neste MANIFEST), posicionada
logo após "Custom Records". Padrão usado: internal ID **real** (confirmado no TECH-SPEC) mas
**Tipo de campo** ainda não confirmado pelo usuário → coluna Tipo recebe "A confirmar¹" com nota de
rodapé, em vez de marcar o próprio ID com `*` (o `*` da skill é para ID inferido; aqui o ID é real,
só o atributo Tipo é que falta). Precedente útil se outro campo deste módulo aparecer com ID
confirmado mas metadado incompleto.

A seção "Notas / Pendências" é podada conforme os itens são fechados no TECH-SPEC — não vira um
registro histórico, só reflete o que está genuinamente em aberto no momento. Neste caso restou só a
pendência do campo análogo a `custbody_pd_pdf_invoice_pdf_dc` (PDF salvo do Credit Memo), que
ninguém decidiu fechar ainda.

**Atualização (cadastro de `custbody_pd_pdf_credit_memo_pdf_dc`, Credit Memo):** a pendência acima
foi fechada — usuário forneceu o Internal ID (seguindo o padrão já confirmado
`custbody_pd_pdf_<entidade>_pdf_dc`) e pediu o cadastro do campo, análogo a
`custbody_pd_pdf_invoice_pdf_dc` (Invoice, campo pré-existente não-SDF, só referenciado em código,
nunca gravado — só lido em `manipulateInvoicePdf`/`pd_pdf_utils_module.js` para early-return).
Decisões tomadas:
- Nova subseção `### \`creditmemo\` — Credit Memo` dentro de "Campos Customizados em Records
  Nativos", mesmo padrão da subseção `returnauthorization` já existente (uma subseção por record
  nativo, não uma tabela única misturando records).
- ID **não** marcado com `*`: embora não venha de um TECH-SPEC nem de XML, o usuário o forneceu
  explicitamente seguindo um padrão de nomenclatura já confirmado no projeto — tratado como real.
  `*` fica reservado para IDs que o próprio manifest-builder precisou inferir sem confirmação.
- Tipo de campo usa o mesmo recurso "A confirmar¹" do campo RMA, mas com footnote **própria** (²) —
  não reaproveitar o texto da footnote ¹ quando o motivo de "a confirmar" é diferente (aqui: campo
  de referência também não tem XML, não por falta de resposta do usuário/ambiente).
- O campo de referência do Invoice (`custbody_pd_pdf_invoice_pdf_dc`) **não** ganhou entrada própria
  no manifest — é só contexto para replicar o novo campo. Consistente com a regra de escopo do
  módulo (não retroagir sobre objetos pré-existentes de Invoice/Packing List sem pedido explícito).
- "Notas / Pendências" ficou vazia após o fechamento — texto trocado para "Nenhuma pendência em
  aberto no momento" em vez de remover a seção inteira (seção permanece como esqueleto para o
  próximo item que surgir).
- Comportamento (se o campo vai guardar o PDF gerado, servir de guarda contra regeneração etc.)
  ficou **de fora** por pedido explícito do usuário — decisão ainda em aberto, a ser tratada no
  TECH-SPEC (ou não) depois de uma resposta pendente do usuário.

**Atualização (rodada de validação em Sandbox do DEV-845, cadastro de `custbody_related_so` e
`custbody_pd_authorized_signature`):** TECH-SPEC revisado após testes reais em Sandbox mudou duas
decisões (Sales Order/Terms resolvidos via SO relacionada, e "Authorized Signature: SA" estático
virou lookup dinâmico ao Employee). Dois campos novos entraram na mesma subseção `creditmemo` já
existente (uma subseção por record, tabela única cresce por linha — não criar subseção nova por
campo). Decisões/precedentes desta rodada:
- `custbody_related_so`: ID real confirmado **diretamente pelo usuário na conversa** (não veio de
  XML nem de TECH-SPEC) — mesmo critério já usado para `custbody_pd_pdf_credit_memo_pdf_dc`: ID
  fornecido explicitamente por quem conhece o ambiente conta como real, não leva `*`. Campo
  **pré-existente no ambiente, não gerenciado por este projeto SDF** — evidência indireta via
  `sourcelist` em outro custom field do projeto (`custbody_pd_so_customer.xml`), sem XML próprio.
  Usei footnote **³** nova (não reaproveitei a ¹ do RMA nem a ² do PDF DC) porque o motivo de "a
  confirmar" aqui é um terceiro caso: não é falta de resposta do usuário (o papel funcional foi
  confirmado), é falta de XML formal para extrair atributos como `sourcefilter`. **Padrão
  reforçado: cada footnote "A confirmar" ganha texto próprio explicando POR QUE falta confirmar —
  nunca reusar o número/texto de uma footnote anterior só porque o "shape" (ID real, tipo pendente)
  se parece.**
- `custbody_pd_authorized_signature`: caso novo neste manifest — campo criado só na UI do Sandbox,
  **sem XML em lugar nenhum e sem nenhuma referência em código ainda** (diferente de
  `custbody_pd_pdf_invoice_pdf_dc`/`custbody_related_so`, que ao menos têm referência em código ou
  em outro XML). Por isso o Tipo pôde ser cadastrado como real (`List/Record (Employee)`, confirmado
  pelo usuário) sem footnote "a confirmar" — footnote é só para atributo pendente, não para "campo
  não tem lastro em XML/código". A fragilidade (campo já sumiu uma vez num refresh de sandbox) virou
  item na seção "Notas / Pendências" como **candidato a objeto SDF**, não como ação já decidida —
  sinalizar, não assumir, mesmo quando a motivação (sobreviver a refresh) é óbvia.
- "Notas / Pendências" saiu do estado "Nenhuma pendência em aberto" e voltou a ter conteúdo — reforça
  que essa seção é podada/repovoada dinamicamente a cada rodada, não é terra arrasada depois de
  zerada uma vez.
- Cabeçalho (`Gerado em` e `Versão do Spec`) atualizado a cada rodada para refletir a razão da
  atualização mais recente (não só a data) — padrão mantido desde a primeira versão deste manifest.
