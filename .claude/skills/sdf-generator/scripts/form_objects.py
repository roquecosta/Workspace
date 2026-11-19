"""
form_objects.py — Gera/atualiza formulários de custom record (entryForm, custform_) a partir da
seção "## Formulários" do MANIFEST, e aplica a coluna "Lista" (showinlist) ao XML do record.

Formato do manifest (ver skill manifest-standards, "Seção: Formulários"):

    ### `custform_x` — Nome do formulário

    **Record:** `customrecord_x` · **Preferido:** Sim

    | Grupo | Campo | Internal ID | Exibição | Lista |

Dois modos, decididos pela existência do XML:
- ATUALIZAÇÃO (o XML do formulário já existe em --out ou no src/Objects do projeto, normalmente vindo de
  object:import): só o bloco <mainFields>, o <preferred> e o <name> são reescritos. Abas, sublistas,
  action bar e a configuração dos campos padrão (Nome, Inativo...) ficam como estão. Grupos existentes
  com o mesmo rótulo mantêm o scriptid.
- CRIAÇÃO (não existe): preenche ../assets/form-templates/entryform_customrecord.xml.
"""
import os
import re
import unicodedata
from xml.sax.saxutils import escape

from script_objects import section, parse_table, clean, find_filecabinet_root, existing_xml

TEMPLATE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets",
                        "form-templates", "entryform_customrecord.xml")

# Exibição do manifest -> (visible, displayType)
DISPLAY = {
    "normal": ("T", "NORMAL"),
    "somenteleitura": ("T", "INLINETEXT"),
    "inline": ("T", "INLINETEXT"),
    "desabilitado": ("T", "DISABLED"),
    "oculto": ("F", None),          # None = mantém o displayType atual (ou NORMAL)
}

NO_GROUP = {"", "—", "-", "–"}


def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", s.lower())


def _slug(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s)).strip("_")


def _yes(cell):
    v = _norm(cell)
    if v in ("sim", "s", "yes", "y", "t", "true"):
        return True
    if v in ("nao", "n", "no", "f", "false"):
        return False
    return None


# ---------------------------------------------------------------------------
# PARSE
# ---------------------------------------------------------------------------

def parse_forms(text):
    """Lista de formulários da seção '## Formulários'."""
    body = section(text, r"Formul[áa]rios")
    if not body:
        return []
    forms = []
    heads = list(re.finditer(r"^###\s+`([^`]+)`\*?\s*[—-]+\s*(.+?)\s*$", body, re.MULTILINE))
    for i, m in enumerate(heads):
        block = body[m.end(): heads[i + 1].start() if i + 1 < len(heads) else len(body)]
        rec = re.search(r"\*\*Record:\*\*\s*`?([a-z0-9_]+)", block, re.IGNORECASE)
        pref = re.search(r"\*\*Preferido:\*\*\s*([^\s·|]+)", block, re.IGNORECASE)
        rows = []
        for r in parse_table(block):
            fid = re.search(r"custrecord[a-z0-9_]*", r.get("internalid", ""), re.IGNORECASE)
            if not fid:
                continue
            rows.append({
                "group": clean(r.get("grupo", "")),
                "label": clean(r.get("campo", "")),
                "id": fid.group(0).lower(),
                "display": _norm(r.get("exibicao", "")) or "normal",
                "list": _yes(r.get("lista", "")),
            })
        forms.append({
            "scriptid": m.group(1).strip(),
            "name": m.group(2).strip(),
            "record": rec.group(1).lower() if rec else "",
            "preferred": _yes(pref.group(1)) if pref else None,
            "rows": rows,
        })
    return forms


def show_in_list_map(text):
    """{record: {field: True/False}} a partir da coluna Lista — usado também pelo gerador de records."""
    out = {}
    for f in parse_forms(text):
        for r in f["rows"]:
            if r["list"] is not None:
                out.setdefault(f["record"], {})[r["id"]] = r["list"]
    return out


# ---------------------------------------------------------------------------
# BUILD
# ---------------------------------------------------------------------------

FIELD_TPL = """        <field>
          <id>{id}</id>
          <label>{label}</label>
          <visible>{visible}</visible>
          <mandatory>F</mandatory>
          <displayType>{display}</displayType>
          <columnBreak>F</columnBreak>
          <sameRowAsPrevious>F</sameRowAsPrevious>
          <quickAdd>F</quickAdd>
        </field>
"""


def _set_tag(block, tag, value):
    return re.sub(rf"<{tag}>[^<]*</{tag}>", f"<{tag}>{value}</{tag}>", block, count=1)


def _field_block(row, record, existing, warnings, sid):
    ref = f"[scriptid={record}.{row['id']}]"
    visible, display = DISPLAY.get(row["display"], (None, None))
    if visible is None:
        warnings.append(f"[{sid}] Exibição desconhecida '{row['display']}' em {row['id']} -> Normal")
        visible, display = "T", "NORMAL"
    if ref in existing:
        block = _set_tag(existing[ref], "visible", visible)
        if row["label"]:
            block = _set_tag(block, "label", escape(row["label"]))
        if display:
            block = _set_tag(block, "displayType", display)
        return block
    return FIELD_TPL.format(id=escape(ref), label=escape(row["label"]), visible=visible,
                            display=display or "NORMAL")


def _group_xml(scriptid, label, fields):
    return (f'    <fieldGroup scriptid="{scriptid}">\n'
            f"      <label>{escape(label)}</label>\n"
            "      <visible>T</visible>\n"
            "      <showTitle>T</showTitle>\n"
            "      <singleColumn>F</singleColumn>\n"
            '      <fields position="MIDDLE">\n'
            f"{''.join(fields)}"
            "      </fields>\n"
            "    </fieldGroup>\n")


def build_main_fields(form, old_main, fcfg, warnings, record_fields):
    """Novo bloco <mainFields> (string). old_main = bloco atual ou '' (criação)."""
    sid, record = form["scriptid"], form["record"]
    existing = {}
    order = []
    for fb in re.findall(r"[ \t]*<field>.*?</field>\n?", old_main, re.S):
        fid = re.search(r"<id>([^<]+)</id>", fb).group(1)
        existing[fid] = fb if fb.endswith("\n") else fb + "\n"
        order.append(fid)
    old_groups = {_norm(lbl): gid for gid, lbl in
                  re.findall(r'<fieldGroup scriptid="([^"]+)">\s*<label>([^<]*)</label>', old_main)}

    listed = set()
    groups, default_fields = [], []
    for row in form["rows"]:
        if record_fields is not None and row["id"] not in record_fields:
            warnings.append(f"[{sid}] {row['id']} não está na subseção de {record} no manifest")
        ref = f"[scriptid={record}.{row['id']}]"
        if ref in listed:
            warnings.append(f"[{sid}] {row['id']} aparece mais de uma vez — mantida a primeira")
            continue
        listed.add(ref)
        block = _field_block(row, record, existing, warnings, sid)
        if row["group"] in NO_GROUP:
            default_fields.append(block)
            continue
        g = next((g for g in groups if g["label"] == row["group"]), None)
        if g is None:
            gid = old_groups.get(_norm(row["group"])) or \
                ("fieldgroup_" + fcfg.get("groupIdPrefix", "") + _slug(row["group"]))[:40]
            g = {"label": row["group"], "id": gid, "fields": []}
            groups.append(g)
        g["fields"].append(block)

    # campos já existentes que o manifest não lista: padrão do NS ficam no topo; custom geram aviso
    keep = []
    for fid in order:
        if fid in listed:
            continue
        if fid.startswith("[scriptid="):
            warnings.append(f"[{sid}] {fid} está no formulário mas não na tabela do manifest — mantido sem grupo")
        keep.append(existing[fid])
    default_fields = keep + default_fields

    out = ["  <mainFields>\n"]
    out += [_group_xml(g["id"], g["label"], g["fields"]) for g in groups]
    if default_fields:
        out.append("    <defaultFieldGroup>\n      <fields position=\"MIDDLE\">\n")
        out += default_fields
        out.append("      </fields>\n    </defaultFieldGroup>\n")
    out.append("  </mainFields>")
    return "".join(out), len(groups), len(listed)


def apply_show_in_list(record_xml_path, settings):
    """Aplica showinlist no XML do record. Devolve (alterados, não encontrados)."""
    with open(record_xml_path, encoding="utf-8", newline="") as f:
        xml = f.read()
    changed, missing = [], []
    for fid, flag in settings.items():
        m = re.search(rf'(<customrecordcustomfield scriptid="{re.escape(fid)}">.*?</customrecordcustomfield>)',
                      xml, re.S)
        if not m:
            missing.append(fid)
            continue
        new = _set_tag(m.group(1), "showinlist", "T" if flag else "F")
        if new != m.group(1):
            xml = xml[:m.start()] + new + xml[m.end():]
            changed.append(fid)
    if changed:
        with open(record_xml_path, "w", encoding="utf-8", newline="") as f:
            f.write(xml)
    return changed, missing


# ---------------------------------------------------------------------------
# ENTRYPOINT
# ---------------------------------------------------------------------------

def generate_forms(text, manifest_path, out_dir, cfg, records):
    """Gera/atualiza os formulários. Devolve (gerados, pulados, avisos)."""
    fcfg = cfg.get("forms", {})
    warnings, generated, skipped = [], [], []
    forms = parse_forms(text)
    if not forms:
        return generated, skipped, warnings

    fc_root = find_filecabinet_root(manifest_path, cfg.get("scripts", {}))
    objects_dir = os.path.join(os.path.dirname(fc_root), "Objects") if fc_root else None
    rec_fields = {r["scriptid"]: {f["id"] for f in r["fields"]} for r in records}

    for form in forms:
        sid = form["scriptid"]
        if cfg["only"] and sid not in cfg["only"] and form["record"] not in cfg["only"]:
            continue
        if sid in cfg["skip"]:
            skipped.append((sid, "skip explícito")); continue
        if not form["record"].startswith("customrecord"):
            skipped.append((sid, "sem **Record:** de custom record")); continue

        path = existing_xml(sid, [out_dir, objects_dir])
        if path:
            with open(path, encoding="utf-8", newline="") as f:
                xml = f.read()
            crlf = "\r\n" in xml
            xml = xml.replace("\r\n", "\n")
            m = re.search(r"  <mainFields>.*?</mainFields>", xml, re.S)
            old_main = m.group(0) if m else ""
            mode = "atualizado"
        else:
            with open(TEMPLATE, encoding="utf-8") as f:
                xml = f.read()
            xml = (xml.replace("{{scriptid}}", sid)
                      .replace("{{standard}}", "STANDARD" + form["record"].upper() + "FORM")
                      .replace("{{name}}", escape(form["name"]))
                      .replace("{{recordtype}}", form["record"])
                      .replace("{{preferred}}", "F"))
            m = re.search(r"  <mainFields>.*?</mainFields>", xml, re.S)
            old_main, crlf, mode = m.group(0), False, "criado"
            path = os.path.join(out_dir, sid + ".xml")

        main, ngroups, nfields = build_main_fields(
            form, old_main, fcfg, warnings, rec_fields.get(form["record"]))
        xml = xml.replace(old_main, main, 1) if old_main else xml
        xml = _set_tag(xml, "name", escape(form["name"]))
        if form["preferred"] is not None:
            xml = _set_tag(xml, "preferred", "T" if form["preferred"] else "F")
        if crlf:
            xml = xml.replace("\n", "\r\n")
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(xml)
        generated.append((sid, mode, ngroups, nfields, path))

        # coluna Lista -> showinlist no XML do record (se o XML existir)
        settings = {r["id"]: r["list"] for r in form["rows"] if r["list"] is not None}
        if settings:
            rpath = existing_xml(form["record"], [out_dir, objects_dir])
            if not rpath:
                warnings.append(f"[{sid}] XML de {form['record']} não encontrado — coluna Lista não aplicada "
                                f"(gere o record com --kind records ou faça object:import)")
            else:
                changed, missing = apply_show_in_list(rpath, settings)
                for fid in missing:
                    warnings.append(f"[{sid}] {fid} não está no XML de {form['record']} — Lista não aplicada")
                generated.append((form["record"], "lista", len(changed), len(settings), rpath))
    return generated, skipped, warnings
