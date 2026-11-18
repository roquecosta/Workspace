"""
script_objects.py — Gera objetos SDF de script (usereventscript, mapreducescript,
clientscript, scheduledscript, restlet, suitelet) a partir das seções
"## Scripts" e "## Parâmetros de Script" do MANIFEST.

Chamado pelo gen_objects.py (não é entrypoint). A estrutura de cada objeto NÃO
está neste código: vem dos templates em ../assets/script-templates/<tipo>.xml,
whitelabel derivados de exports reais (object:import). Este módulo só preenche
os placeholders {{...}}.

Placeholders dos templates de tipo:
  {{scriptid}} {{name}} {{description}} {{scriptfile}} {{scriptcustomfields}}
  e, dentro do bloco <scriptdeployment> (repetido por record alvo):
  {{deployid}} {{deployment_params}} {{recordtype}} {{status}} {{loglevel}}
  {{executioncontext}} {{startdate}}
Placeholders do scriptcustomfield.xml (parâmetro):
  {{paramid}} {{label}} {{description}} {{fieldtype}} {{applyformatting}}
  {{onparentdelete}} {{selectrecordtype}}

Placeholders de bloco ({{scriptcustomfields}}, {{deployment_params}}) ocupam uma
linha sozinhos; quando não há conteúdo, a linha inteira é removida.
"""
import datetime
import os
import re
from xml.sax.saxutils import escape

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "script-templates")

# Tipo do manifest (normalizado: minúsculo, só letras) -> template
SCRIPT_TYPES = {
    "userevent": "usereventscript", "usereventscript": "usereventscript", "ue": "usereventscript",
    "mapreduce": "mapreducescript", "mapreducescript": "mapreducescript", "mr": "mapreducescript",
    "clientscript": "clientscript", "client": "clientscript", "cs": "clientscript",
    "scheduled": "scheduledscript", "scheduledscript": "scheduledscript", "ss": "scheduledscript",
    "restlet": "restlet", "rl": "restlet",
    "suitelet": "suitelet", "sl": "suitelet", "st": "suitelet",
}
NEEDS_RECORD = {"usereventscript", "clientscript"}
SCHEDULED_KINDS = {"mapreducescript", "scheduledscript"}

# Sufixos do scriptid que viram sigla maiúscula no nome humanizado
TYPE_SUFFIXES = {"ue", "us", "mr", "cs", "cl", "ss", "sch", "rl", "sl", "st"}

# Conjunto conservador (comum às versões de SDF vistas nos clientes). Override: scripts.executionContexts
DEFAULT_EXECUTION_CONTEXTS = (
    "ACTION|ADVANCEDREVREC|BANKCONNECTIVITY|BANKSTATEMENTPARSER|BUNDLEINSTALLATION|CLIENT|"
    "CONSOLRATEADJUSTOR|CSVIMPORT|CUSTOMGLLINES|CUSTOMMASSUPDATE|DATASETBUILDER|DEBUGGER|"
    "EMAILCAPTURE|FICONNECTIVITY|FIPARSER|MAPREDUCE|OTHER|PAYMENTGATEWAY|PAYMENTPOSTBACK|"
    "PLATFORMEXTENSION|PORTLET|PROMOTIONS|RECORDACTION|RESTLET|RESTWEBSERVICES|SCHEDULED|"
    "SDFINSTALLATION|SHIPPINGPARTNERS|SUITELET|TAXCALCULATION|USEREVENT|USERINTERFACE|"
    "WEBSERVICES|WORKBOOKBUILDER|WORKFLOW"
)

MAX_ID_LEN = 40
EMPTY_CELL = {"", "—", "-", "–", "n/a"}
EXISTING_MARKERS = ("existente no netsuite", "script existente", "já existe")


# ---------------------------------------------------------------------------
# PARSE
# ---------------------------------------------------------------------------

def section(text, title_regex):
    """Corpo de uma seção '## <título>' até o próximo '## ' (ou EOF)."""
    m = re.search(r"^##\s+" + title_regex + r"\s*$", text, re.MULTILINE | re.IGNORECASE)
    if not m:
        return ""
    nxt = re.search(r"^##\s+", text[m.end():], re.MULTILINE)
    return text[m.end(): m.end() + nxt.start()] if nxt else text[m.end():]


def norm_key(s):
    return re.sub(r"[^a-z]", "", s.lower().replace("ç", "c").replace("ã", "a").replace("â", "a")
                  .replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u"))


def parse_table(block):
    """Tabela markdown -> lista de dicts indexados pelo cabeçalho normalizado."""
    rows, header = [], None
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if header is None:
            header = [norm_key(c) for c in cells]
            continue
        if all(set(c) <= set("-: ") for c in cells):
            continue
        rows.append({header[i]: cells[i] if i < len(cells) else "" for i in range(len(header))})
    return rows


def clean(cell):
    return re.sub(r"[`*]", "", cell or "").strip()


def extract_id(cell, prefix):
    """Pega só o ID (ignora crases, '*' de inferido, marcadores de nota como '‡')."""
    m = re.search(prefix + r"[a-z0-9_]*", cell or "", re.IGNORECASE)
    return m.group(0).lower() if m else ""


def split_list(cell):
    return [clean(x) for x in re.split(r"[,;]|<br\s*/?>", cell or "") if clean(x)]


# ---------------------------------------------------------------------------
# RESOLUÇÕES
# ---------------------------------------------------------------------------

def find_filecabinet_root(manifest_path, scfg):
    if scfg.get("fileCabinetRoot"):
        return os.path.abspath(scfg["fileCabinetRoot"])
    cur = os.path.dirname(os.path.abspath(manifest_path))
    while True:
        if os.path.basename(cur) == "FileCabinet":
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return None
        cur = parent


def find_file(root, name):
    hits = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".git")]
        if name in filenames:
            hits.append(os.path.join(dirpath, name))
    return hits


def resolve_scriptfile(arquivo, manifest_path, fc_root, scfg, warnings, sid):
    """Devolve o caminho '/SuiteScripts/...' do .js no File Cabinet."""
    arquivo = clean(arquivo)
    if "/" in arquivo:  # o manifest já trouxe o caminho
        rel = arquivo.lstrip("/")
        if fc_root and not os.path.exists(os.path.join(fc_root, rel)):
            warnings.append(f"[{sid}] arquivo não encontrado no projeto: /{rel} (o project:validate vai falhar até o .js existir)")
        return "/" + rel
    if fc_root:
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(manifest_path)))  # pai de Docs/
        hits = find_file(project_dir, arquivo) if project_dir.startswith(fc_root) else []
        if not hits:
            hits = find_file(fc_root, arquivo)
        if len(hits) == 1:
            return "/" + os.path.relpath(hits[0], fc_root).replace(os.sep, "/")
        if len(hits) > 1:
            rels = ", ".join("/" + os.path.relpath(h, fc_root).replace(os.sep, "/") for h in hits)
            warnings.append(f"[{sid}] '{arquivo}' existe em mais de um lugar ({rels}); usando o primeiro. Ajuste a coluna Arquivo com o caminho.")
            return "/" + os.path.relpath(hits[0], fc_root).replace(os.sep, "/")
    base = scfg.get("fileBasePath")
    if not base and fc_root:
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(manifest_path)))
        if project_dir.startswith(fc_root):
            base = "/" + os.path.relpath(project_dir, fc_root).replace(os.sep, "/")
    path = (base.rstrip("/") if base else "/SuiteScripts") + "/" + arquivo
    warnings.append(f"[{sid}] '{arquivo}' não existe no projeto; caminho assumido {path} (o project:validate vai falhar até o .js existir)")
    return path


def resolve_recordtype(target):
    t = clean(target)
    if t.lower().startswith("customrecord"):
        return f"[scriptid={t}]"
    return t.upper()


def humanize(scriptid, prefix_strip, kind_prefix):
    rest = scriptid[len(kind_prefix):] if scriptid.startswith(kind_prefix) else scriptid
    if prefix_strip and rest.startswith(prefix_strip):
        rest = rest[len(prefix_strip):]
    toks = [t for t in rest.split("_") if t]
    out = [t.upper() if (i == len(toks) - 1 and t in TYPE_SUFFIXES) else t.capitalize() for i, t in enumerate(toks)]
    return " ".join(out)


def deploy_id(scriptid, n):
    base = "customdeploy_" + scriptid[len("customscript_"):] if scriptid.startswith("customscript_") else "customdeploy_" + scriptid
    return base if n == 1 else f"{base}_{n}"


# ---------------------------------------------------------------------------
# TEMPLATES
# ---------------------------------------------------------------------------

def load_template(name):
    with open(os.path.join(TEMPLATES_DIR, name + ".xml"), encoding="utf-8") as f:
        return f.read()


def fill(tpl, values):
    """Substitui {{x}}. Placeholders de bloco em linha própria: valor vazio remove a linha."""
    lines = []
    for line in tpl.splitlines():
        m = re.fullmatch(r"\s*\{\{(\w+)\}\}\s*", line)
        if m and m.group(1) in values:
            block = values[m.group(1)]
            if block:
                lines.append(block.rstrip("\n"))
            continue
        lines.append(re.sub(r"\{\{(\w+)\}\}", lambda mm: values.get(mm.group(1), mm.group(0)), line))
    return "\n".join(lines) + "\n"


def split_deployment(tpl):
    m = re.search(r"^([ \t]*<scriptdeployment .*?</scriptdeployment>)[ \t]*\n", tpl, re.MULTILINE | re.DOTALL)
    if not m:
        raise ValueError("template sem bloco <scriptdeployment>")
    return tpl[:m.start()] + "{{__deployments__}}\n" + tpl[m.end():], m.group(1)


# ---------------------------------------------------------------------------
# GERAÇÃO
# ---------------------------------------------------------------------------

def build_params(params, type_map, cfg, scfg, warnings, sid):
    tpl = load_template("scriptcustomfield")
    blocks = []
    for p in params:
        fieldtype = type_map.get(p["tipo"]) if p["tipo"] else None
        if fieldtype is None:
            if p["tipo"]:
                warnings.append(f"[{sid}] parâmetro {p['id']}: tipo desconhecido '{p['tipo']}' -> TEXT")
            else:
                warnings.append(f"[{sid}] parâmetro {p['id']}: sem coluna Tipo no manifest -> TEXT")
            fieldtype = "TEXT"
        selectrecordtype, onparentdelete, applyformatting = "", "", "F"
        if fieldtype in ("SELECT", "MULTISELECT"):
            onparentdelete = "SET_NULL" if fieldtype == "SELECT" else ""
            target = cfg["select_by_id"].get(p["id"])
            if target is None:
                warnings.append(f"[{sid}] parâmetro SELECT sem alvo: {p['id']} -> <selectrecordtype> vazio (defina em selectTargetById)")
            else:
                selectrecordtype = target
        elif fieldtype in ("CURRENCY", "PERCENT"):
            applyformatting = "T"
        label = scfg.get("paramLabels", {}).get(p["id"])
        if not label:
            label = humanize(p["id"], scfg.get("idPrefix", ""), "custscript_")
            if scfg.get("namePrefix"):
                label = f"{scfg['namePrefix']} | {label}"
        if len(p["id"]) > MAX_ID_LEN:
            warnings.append(f"[{sid}] parâmetro {p['id']} tem {len(p['id'])} caracteres (máx. {MAX_ID_LEN})")
        description = "" if cfg["no_description"] else p["desc"]
        blocks.append(fill(tpl, {
            "paramid": p["id"], "label": escape(label), "description": escape(description),
            "fieldtype": fieldtype, "applyformatting": applyformatting,
            "onparentdelete": onparentdelete, "selectrecordtype": escape(selectrecordtype),
        }).rstrip("\n"))
    if not blocks:
        return "", ""
    custom = "  <scriptcustomfields>\n" + "\n".join(blocks) + "\n  </scriptcustomfields>"
    dep = "\n".join(f"      <{p['id']}></{p['id']}>" for p in params)
    return custom, dep


def existing_xml(sid, search_dirs):
    for d in search_dirs:
        if d and os.path.isdir(d):
            for dirpath, dirnames, filenames in os.walk(d):
                dirnames[:] = [x for x in dirnames if x not in ("node_modules", ".git")]
                if sid + ".xml" in filenames:
                    return os.path.join(dirpath, sid + ".xml")
    return None


def generate_scripts(text, manifest_path, out_dir, cfg, type_map, args):
    """Gera os XML de script. Devolve (gerados, pulados, avisos)."""
    scfg = cfg.get("scripts", {})
    warnings, generated, skipped = [], [], []

    scripts = parse_table(section(text, r"Scripts"))
    params_rows = parse_table(section(text, r"Par[âa]metros de Script"))
    if not scripts:
        return generated, skipped, warnings

    fc_root = find_filecabinet_root(manifest_path, scfg)
    objects_dir = os.path.join(os.path.dirname(fc_root), "Objects") if fc_root else None

    # índice: arquivo/scriptid -> scriptid, para resolver "Usado em"
    by_key = {}
    for row in scripts:
        sid = extract_id(row.get("scriptid", ""), "customscript")
        if not sid:
            continue
        by_key[sid] = sid
        arq = clean(row.get("arquivo", ""))
        if arq:
            by_key[os.path.basename(arq)] = sid

    # dono de cada parâmetro = primeiro script de "Usado em" que casa (ou override)
    owners = scfg.get("paramOwners", {})
    params_by_script = {}
    for row in params_rows:
        pid = extract_id(row.get("internalid", ""), "custscript")
        if not pid:
            continue
        usado = split_list(row.get("usadoem", ""))
        owner = owners.get(pid)
        matched = [by_key[k] for u in usado
                   for k in (extract_id(u, "customscript") or os.path.basename(u),) if k in by_key]
        if not owner:
            if not matched:
                warnings.append(f"[parâmetros] {pid}: 'Usado em' ({row.get('usadoem', '')}) não casa com nenhum script; não gerado (use scripts.paramOwners)")
                continue
            owner = matched[0]
            if len(set(matched)) > 1:
                warnings.append(f"[parâmetros] {pid} é usado por {len(set(matched))} scripts; parâmetro é único na conta e foi criado só em {owner}")
        params_by_script.setdefault(owner, []).append({
            "id": pid, "tipo": clean(row.get("tipo", "")), "desc": clean(row.get("descricao", "")),
        })

    status_default = scfg.get("deployStatus", "TESTING")
    status_sched = scfg.get("scheduledDeployStatus", "NOTSCHEDULED")
    loglevel = scfg.get("logLevel", "DEBUG")
    exec_ctx = scfg.get("executionContexts", DEFAULT_EXECUTION_CONTEXTS)
    today = datetime.date.today().isoformat()
    names = scfg.get("names", {})
    if not scfg.get("namePrefix") and not names:
        warnings.append("[scripts] scripts.namePrefix não definido no config; nomes saem só do scriptid humanizado")

    for row in scripts:
        sid = extract_id(row.get("scriptid", ""), "customscript")
        if not sid:
            continue
        if cfg["only"] and sid not in cfg["only"]:
            continue
        if sid in cfg["skip"]:
            skipped.append((sid, "skip explícito")); continue
        if any(m in row.get("descricao", "").lower() for m in EXISTING_MARKERS) and not args.include_existing and sid not in cfg["only"]:
            skipped.append((sid, "marcado como existente")); continue

        kind = SCRIPT_TYPES.get(norm_key(row.get("tipo", "")))
        if not kind:
            skipped.append((sid, f"tipo '{row.get('tipo', '')}' sem template")); continue

        targets = [t for t in split_list(row.get("recordalvo", "")) if t.lower() not in EMPTY_CELL]
        if kind in NEEDS_RECORD and not targets:
            if kind == "clientscript":
                skipped.append((sid, "client script sem record alvo (anexado via form/clientScriptModulePath, não precisa de objeto)"))
            else:
                skipped.append((sid, "UserEvent sem record alvo"))
                warnings.append(f"[{sid}] UserEvent sem Record Alvo no manifest; não gerado")
            continue

        found = existing_xml(sid, [out_dir, objects_dir])
        if found and not args.overwrite:
            skipped.append((sid, f"XML já existe em {found} (use --overwrite)")); continue

        if len(sid) > MAX_ID_LEN:
            warnings.append(f"[{sid}] scriptid tem {len(sid)} caracteres (máx. {MAX_ID_LEN})")

        name = names.get(sid) or humanize(sid, scfg.get("idPrefix", ""), "customscript_")
        if not names.get(sid) and scfg.get("namePrefix"):
            name = f"{scfg['namePrefix']} | {name}"

        scriptfile = resolve_scriptfile(row.get("arquivo", ""), manifest_path, fc_root, scfg, warnings, sid)
        custom, dep_params = build_params(params_by_script.get(sid, []), type_map, cfg, scfg, warnings, sid)

        body, dep_tpl = split_deployment(load_template(kind))
        status = status_sched if kind in SCHEDULED_KINDS else status_default
        deployments = []
        # Record Alvo só vira deployment em UE/CS; nos demais tipos é apenas informativo
        for n, target in enumerate(targets if kind in NEEDS_RECORD else [None], start=1):
            did = deploy_id(sid, n)
            if len(did) > MAX_ID_LEN:
                warnings.append(f"[{sid}] deployment {did} tem {len(did)} caracteres (máx. {MAX_ID_LEN})")
            deployments.append(fill(dep_tpl, {
                "deployid": did, "deployment_params": dep_params,
                "recordtype": escape(resolve_recordtype(target)) if target else "",
                "status": status, "loglevel": loglevel, "executioncontext": exec_ctx,
                "startdate": today, "name": escape(name),
            }).rstrip("\n"))

        description = "" if cfg["no_description"] else clean(row.get("descricao", ""))
        xml = fill(body, {
            "scriptid": sid, "name": escape(name), "description": escape(description),
            "scriptfile": f"[{escape(scriptfile)}]", "scriptcustomfields": custom,
            "__deployments__": "\n".join(deployments),
        })
        path = os.path.join(out_dir, sid + ".xml")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(xml)
        generated.append((sid, kind, len(params_by_script.get(sid, [])), len(deployments)))

    return generated, skipped, warnings
