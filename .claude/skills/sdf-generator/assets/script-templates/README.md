# Templates de objetos de script (SDF)

Templates **whitelabel** usados pelo `scripts/script_objects.py`. Cada arquivo é um objeto SDF
completo e válido, com placeholders `{{...}}` no lugar dos dados do projeto. Nenhum dado de cliente
vive aqui.

| Arquivo | Objeto | Origem |
|---|---|---|
| `usereventscript.xml` | User Event | export real (`object:import`) |
| `clientscript.xml` | Client Script com deployment em record | export real |
| `mapreducescript.xml` | Map/Reduce | export real |
| `restlet.xml` | RESTlet | export real |
| `suitelet.xml` | Suitelet | export real |
| `scheduledscript.xml` | Scheduled | **montado à mão**, validar no primeiro uso |
| `scriptcustomfield.xml` | Parâmetro de script (`custscript_`) | export real |

## Placeholders

**Objeto:** `{{scriptid}}`, `{{name}}`, `{{description}}`, `{{scriptfile}}` (já com colchetes),
`{{scriptcustomfields}}` (bloco).

**Deployment** (o bloco `<scriptdeployment>` é repetido, um por record alvo): `{{deployid}}`,
`{{deployment_params}}` (bloco), `{{recordtype}}`, `{{status}}`, `{{loglevel}}`,
`{{executioncontext}}`, `{{startdate}}`, `{{name}}`.

**Parâmetro:** `{{paramid}}`, `{{label}}`, `{{description}}`, `{{fieldtype}}`, `{{applyformatting}}`,
`{{onparentdelete}}`, `{{selectrecordtype}}`.

## Regras para editar

- **Placeholder de bloco** (`{{scriptcustomfields}}`, `{{deployment_params}}`) fica **sozinho na linha**.
  Sem conteúdo, a linha é removida.
- Cada template de tipo tem **exatamente um** `<scriptdeployment>`. O gerador o usa como modelo e o repete.
- Mantenha a **ordem das tags igual à do export** do NetSuite. As tags `custscript_*` do deployment
  entram na posição alfabética (por isso `{{deployment_params}}` fica antes de `eventtype`/`isdeployed`).
- Valores fixos (audiência, `runasrole`, `buffersize`, `notifyowner`…) ficam **no template**. Mude
  aqui, não no código.
- Para atualizar um template: exporte um objeto real (`suitecloud object:import`), substitua os dados
  do cliente pelos placeholders e rode o gerador num manifest de teste comparando com o export.
